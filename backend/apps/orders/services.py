from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.carts.models import Cart, CartItem
from apps.coupons.services import (
    create_coupon_usage,
    get_coupon_discount,
    reverse_coupon_usage,
)
from apps.inventory.models import StockMovement
from apps.inventory.services import change_stock
from apps.notifications.services import (
    notify_order_status_change,
    notify_payment_status_change,
)
from apps.payments.services import (
    ensure_payment_record,
    sync_payment_status_from_order,
)
from apps.products.models import Product
from apps.shipping_rates.services import (
    get_shipping_rate,
)
from apps.variants.models import ProductVariant

from .models import Address, Order, OrderItem


ALLOWED_STATUS_TRANSITIONS = {
    Order.Status.PENDING: {
        Order.Status.CONFIRMED,
        Order.Status.CANCELLED,
    },
    Order.Status.CONFIRMED: {
        Order.Status.PROCESSING,
        Order.Status.CANCELLED,
    },
    Order.Status.PROCESSING: {
        Order.Status.SHIPPED,
    },
    Order.Status.SHIPPED: {
        Order.Status.DELIVERED,
    },
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
}


ALLOWED_PAYMENT_TRANSITIONS = {
    Order.PaymentStatus.PENDING: {
        Order.PaymentStatus.PAID,
        Order.PaymentStatus.FAILED,
    },
    Order.PaymentStatus.FAILED: {
        Order.PaymentStatus.PENDING,
        Order.PaymentStatus.PAID,
    },
    Order.PaymentStatus.PAID: {
        Order.PaymentStatus.REFUNDED,
    },
    Order.PaymentStatus.REFUNDED: set(),
}


def build_variant_snapshot(*, variant):
    variant_options = []

    options = (
        variant.options
        .select_related(
            "attribute",
            "value",
        )
        .all()
    )

    for option in options:
        variant_options.append(
            {
                "attribute": option.attribute.name,
                "attribute_slug": option.attribute.slug,
                "value": option.value.display_value,
                "value_slug": option.value.slug,
                "color_code": option.value.color_code,
            }
        )

    option_names = [
        option["value"]
        for option in variant_options
    ]

    if option_names:
        variant_name = (
            f"{variant.product.name} - "
            f"{' / '.join(option_names)}"
        )
    else:
        variant_name = variant.product.name

    return variant_name, variant_options


def restore_order_items_stock(
    *,
    order,
    performed_by=None,
):
    order_items = list(
        OrderItem.objects
        .filter(order=order)
        .select_related(
            "product",
            "variant",
        )
        .order_by("id")
    )

    for order_item in order_items:
        item_name = (
            order_item.variant_name
            or order_item.product_name
        )

        stock_arguments = {
            "quantity_change": order_item.quantity,
            "movement_type": (
                StockMovement.Type.ORDER_CANCELLED
            ),
            "performed_by": performed_by,
            "order": order,
            "note": (
                f"Stock restored because order "
                f"{order.order_number} was cancelled. "
                f"Item: {item_name}."
            ),
        }

        if order_item.variant_id is not None:
            change_stock(
                variant=order_item.variant,
                **stock_arguments,
            )
        else:
            change_stock(
                product=order_item.product,
                **stock_arguments,
            )


@transaction.atomic
def create_order_from_cart(
    *,
    customer,
    address,
    payment_method,
    shipping_method_code="",
    notes="",
    coupon_code="",
):
    if not isinstance(address, Address):
        raise serializers.ValidationError(
            {
                "address_id": (
                    "A valid delivery address is required."
                )
            }
        )

    if address.user_id != customer.id:
        raise serializers.ValidationError(
            {
                "address_id": (
                    "This delivery address does not belong to you."
                )
            }
        )

    try:
        cart = (
            Cart.objects
            .select_for_update()
            .get(user=customer)
        )
    except Cart.DoesNotExist as error:
        raise serializers.ValidationError(
            {
                "cart": "Your shopping cart is empty."
            }
        ) from error

    cart_items = list(
        CartItem.objects
        .select_for_update()
        .select_related(
            "product",
            "product__category",
        )
        .filter(cart=cart)
        .order_by("id")
    )

    if not cart_items:
        raise serializers.ValidationError(
            {
                "cart": "Your shopping cart is empty."
            }
        )

    product_ids = sorted(
        {
            cart_item.product_id
            for cart_item in cart_items
        }
    )

    variant_ids = sorted(
        {
            cart_item.variant_id
            for cart_item in cart_items
            if cart_item.variant_id is not None
        }
    )

    locked_products = {
        product.pk: product
        for product in (
            Product.objects
            .select_for_update()
            .select_related("category")
            .filter(pk__in=product_ids)
            .order_by("pk")
        )
    }

    locked_variants = {
        variant.pk: variant
        for variant in (
            ProductVariant.objects
            .select_for_update()
            .select_related(
                "product",
                "product__category",
            )
            .prefetch_related(
                "options",
                "options__attribute",
                "options__value",
            )
            .filter(pk__in=variant_ids)
            .order_by("pk")
        )
    }

    products_with_active_variants = set(
        ProductVariant.objects
        .filter(
            product_id__in=product_ids,
            is_active=True,
        )
        .values_list(
            "product_id",
            flat=True,
        )
    )

    prepared_items = []
    subtotal = Decimal("0.00")

    for cart_item in cart_items:
        product = locked_products.get(
            cart_item.product_id
        )

        if product is None:
            raise serializers.ValidationError(
                {
                    "cart": (
                        "One of the products in your cart "
                        "is no longer available."
                    )
                }
            )

        if not product.is_active:
            raise serializers.ValidationError(
                {
                    "cart": (
                        f"{product.name} is no longer available."
                    )
                }
            )

        if not product.category.is_active:
            raise serializers.ValidationError(
                {
                    "cart": (
                        f"The category for {product.name} "
                        "is currently unavailable."
                    )
                }
            )

        variant = None
        variant_name = ""
        variant_sku = ""
        variant_options = []

        if cart_item.variant_id is not None:
            variant = locked_variants.get(
                cart_item.variant_id
            )

            if variant is None:
                raise serializers.ValidationError(
                    {
                        "cart": (
                            f"The selected variant for "
                            f"{product.name} is unavailable."
                        )
                    }
                )

            if variant.product_id != product.id:
                raise serializers.ValidationError(
                    {
                        "cart": (
                            "A selected variant does not belong "
                            "to its cart product."
                        )
                    }
                )

            if not variant.is_active:
                raise serializers.ValidationError(
                    {
                        "cart": (
                            f"The selected variant for "
                            f"{product.name} is unavailable."
                        )
                    }
                )

            available_stock = variant.stock
            unit_price = variant.final_price

            (
                variant_name,
                variant_options,
            ) = build_variant_snapshot(
                variant=variant,
            )

            variant_sku = variant.sku

        else:
            if (
                product.id
                in products_with_active_variants
            ):
                raise serializers.ValidationError(
                    {
                        "cart": (
                            f"Please select a variant for "
                            f"{product.name}."
                        )
                    }
                )

            available_stock = product.stock
            unit_price = product.final_price

        display_name = (
            variant_name
            or product.name
        )

        if available_stock <= 0:
            raise serializers.ValidationError(
                {
                    "cart": (
                        f"{display_name} is currently "
                        "out of stock."
                    )
                }
            )

        if cart_item.quantity > available_stock:
            raise serializers.ValidationError(
                {
                    "cart": (
                        f"Only {available_stock} units of "
                        f"{display_name} are available."
                    )
                }
            )

        line_total = (
            unit_price
            * cart_item.quantity
        )

        subtotal += line_total

        prepared_items.append(
            {
                "product": product,
                "variant": variant,
                "quantity": cart_item.quantity,
                "unit_price": unit_price,
                "line_total": line_total,
                "variant_name": variant_name,
                "variant_sku": variant_sku,
                "variant_options": variant_options,
            }
        )

    shipping_rate = get_shipping_rate(
        address=address,
        method_code=shipping_method_code,
    )

    if (
        payment_method
        == Order.PaymentMethod.CASH_ON_DELIVERY
        and not shipping_rate.cod_available
    ):
        raise serializers.ValidationError(
            {
                "payment_method": (
                    "Cash on Delivery is unavailable "
                    "for this shipping method and location."
                )
            }
        )

    shipping_fee = shipping_rate.charge
    free_shipping_applied = False

    if (
        shipping_rate.free_shipping_threshold
        is not None
        and subtotal
        >= shipping_rate.free_shipping_threshold
    ):
        shipping_fee = Decimal("0.00")
        free_shipping_applied = True

    coupon = None
    discount_amount = Decimal("0.00")

    normalized_coupon_code = (
        coupon_code.strip().upper()
    )

    if normalized_coupon_code:
        coupon, discount_amount = (
            get_coupon_discount(
                code=normalized_coupon_code,
                customer=customer,
                subtotal=subtotal,
                lock=True,
            )
        )

    total_amount = (
        subtotal
        + shipping_fee
        - discount_amount
    )

    if total_amount < Decimal("0.00"):
        total_amount = Decimal("0.00")

    estimated_delivery_start = (
        timezone.localdate()
        + timedelta(
            days=shipping_rate.estimated_min_days,
        )
    )

    estimated_delivery_end = (
        timezone.localdate()
        + timedelta(
            days=shipping_rate.estimated_max_days,
        )
    )

    order = Order.objects.create(
        customer=customer,
        address=address,
        payment_method=payment_method,

        shipping_zone=shipping_rate.zone,
        shipping_method=shipping_rate.method,

        shipping_zone_name=(
            shipping_rate.zone.name
        ),
        shipping_zone_code=(
            shipping_rate.zone.code
        ),

        shipping_method_name=(
            shipping_rate.method.name
        ),
        shipping_method_code=(
            shipping_rate.method.code
        ),

        free_shipping_applied=(
            free_shipping_applied
        ),

        estimated_delivery_min_days=(
            shipping_rate.estimated_min_days
        ),
        estimated_delivery_max_days=(
            shipping_rate.estimated_max_days
        ),

        estimated_delivery_start=(
            estimated_delivery_start
        ),
        estimated_delivery_end=(
            estimated_delivery_end
        ),

        recipient_name=address.recipient_name,
        recipient_phone=address.phone_number,
        address_line_1=address.address_line_1,
        address_line_2=address.address_line_2,
        city=address.city,
        province=address.province,
        postal_code=address.postal_code,
        country=address.country,

        subtotal=subtotal,
        shipping_fee=shipping_fee,
        coupon_code=normalized_coupon_code,
        discount_amount=discount_amount,
        total_amount=total_amount,
        notes=notes,
    )

    order_items = []

    for prepared_item in prepared_items:
        product = prepared_item["product"]
        variant = prepared_item["variant"]
        quantity = prepared_item["quantity"]

        order_items.append(
            OrderItem(
                order=order,
                product=product,
                variant=variant,
                product_name=product.name,
                product_sku=product.sku,
                variant_name=prepared_item[
                    "variant_name"
                ],
                variant_sku=prepared_item[
                    "variant_sku"
                ],
                variant_options=prepared_item[
                    "variant_options"
                ],
                unit_price=prepared_item[
                    "unit_price"
                ],
                quantity=quantity,
                line_total=prepared_item[
                    "line_total"
                ],
            )
        )

    OrderItem.objects.bulk_create(
        order_items
    )

    for prepared_item in prepared_items:
        product = prepared_item["product"]
        variant = prepared_item["variant"]
        quantity = prepared_item["quantity"]

        item_name = (
            prepared_item["variant_name"]
            or product.name
        )

        stock_arguments = {
            "quantity_change": -quantity,
            "movement_type": (
                StockMovement.Type.SALE
            ),
            "performed_by": customer,
            "order": order,
            "note": (
                f"Stock deducted during checkout for "
                f"order {order.order_number}. "
                f"Item: {item_name}."
            ),
        }

        if variant is not None:
            change_stock(
                variant=variant,
                **stock_arguments,
            )
        else:
            change_stock(
                product=product,
                **stock_arguments,
            )

    if coupon is not None:
        create_coupon_usage(
            coupon=coupon,
            customer=customer,
            order=order,
            discount_amount=discount_amount,
        )

    ensure_payment_record(
        order=order,
    )

    CartItem.objects.filter(
        cart=cart,
    ).delete()

    return order


@transaction.atomic
def cancel_customer_order(*, order):
    locked_order = (
        Order.objects
        .select_for_update()
        .select_related("customer")
        .get(pk=order.pk)
    )

    if not locked_order.can_cancel:
        raise serializers.ValidationError(
            {
                "order": (
                    "This order can no longer be cancelled."
                )
            }
        )

    previous_status = locked_order.status

    restore_order_items_stock(
        order=locked_order,
        performed_by=locked_order.customer,
    )

    locked_order.status = (
        Order.Status.CANCELLED
    )

    locked_order.cancelled_at = (
        timezone.now()
    )

    locked_order.save(
        update_fields=[
            "status",
            "cancelled_at",
            "updated_at",
        ]
    )

    reverse_coupon_usage(
        order=locked_order,
    )

    sync_payment_status_from_order(
        order=locked_order,
    )

    notify_order_status_change(
        order=locked_order,
        previous_status=previous_status,
    )

    return locked_order


@transaction.atomic
def update_order_by_manager(
    *,
    order,
    status_value=None,
    payment_status_value=None,
    updated_by=None,
):
    locked_order = (
        Order.objects
        .select_for_update()
        .get(pk=order.pk)
    )

    current_status = locked_order.status
    current_payment_status = (
        locked_order.payment_status
    )

    target_status = (
        status_value
        if status_value is not None
        else current_status
    )

    target_payment_status = (
        payment_status_value
        if payment_status_value is not None
        else current_payment_status
    )

    if (
        target_status == Order.Status.DELIVERED
        and locked_order.payment_method
        == Order.PaymentMethod.CASH_ON_DELIVERY
        and payment_status_value is None
        and current_payment_status
        == Order.PaymentStatus.PENDING
    ):
        target_payment_status = (
            Order.PaymentStatus.PAID
        )

    if target_status != current_status:
        allowed_statuses = (
            ALLOWED_STATUS_TRANSITIONS.get(
                current_status,
                set(),
            )
        )

        if target_status not in allowed_statuses:
            raise serializers.ValidationError(
                {
                    "status": (
                        "Order status cannot be changed "
                        f"from {current_status} "
                        f"to {target_status}."
                    )
                }
            )

    if (
        target_payment_status
        != current_payment_status
    ):
        allowed_payment_statuses = (
            ALLOWED_PAYMENT_TRANSITIONS.get(
                current_payment_status,
                set(),
            )
        )

        if (
            target_payment_status
            not in allowed_payment_statuses
        ):
            raise serializers.ValidationError(
                {
                    "payment_status": (
                        "Payment status cannot be changed "
                        f"from {current_payment_status} "
                        f"to {target_payment_status}."
                    )
                }
            )

    if (
        target_status == Order.Status.CANCELLED
        and current_payment_status
        == Order.PaymentStatus.PAID
        and target_payment_status
        != Order.PaymentStatus.REFUNDED
    ):
        raise serializers.ValidationError(
            {
                "payment_status": (
                    "A paid order must be marked as "
                    "refunded before it can be cancelled."
                )
            }
        )

    current_time = timezone.now()

    update_fields = [
        "status",
        "payment_status",
        "updated_at",
    ]

    if (
        target_status == Order.Status.CONFIRMED
        and locked_order.confirmed_at is None
    ):
        locked_order.confirmed_at = current_time
        update_fields.append(
            "confirmed_at"
        )

    if (
        target_status == Order.Status.SHIPPED
        and locked_order.shipped_at is None
    ):
        locked_order.shipped_at = current_time
        update_fields.append(
            "shipped_at"
        )

    if (
        target_status == Order.Status.DELIVERED
        and locked_order.delivered_at is None
    ):
        locked_order.delivered_at = current_time
        update_fields.append(
            "delivered_at"
        )

    order_is_being_cancelled = (
        target_status == Order.Status.CANCELLED
        and current_status
        != Order.Status.CANCELLED
    )

    if order_is_being_cancelled:
        restore_order_items_stock(
            order=locked_order,
            performed_by=updated_by,
        )

        locked_order.cancelled_at = (
            current_time
        )

        update_fields.append(
            "cancelled_at"
        )

    locked_order.status = target_status

    locked_order.payment_status = (
        target_payment_status
    )

    locked_order.save(
        update_fields=list(
            dict.fromkeys(update_fields)
        ),
    )

    if order_is_being_cancelled:
        reverse_coupon_usage(
            order=locked_order,
        )

    sync_payment_status_from_order(
        order=locked_order,
    )

    notify_order_status_change(
        order=locked_order,
        previous_status=current_status,
    )

    notify_payment_status_change(
        order=locked_order,
        previous_payment_status=(
            current_payment_status
        ),
    )

    return locked_order