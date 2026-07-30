from decimal import Decimal

from django.db.models import Q
from rest_framework import serializers

from apps.carts.models import CartItem
from apps.orders.models import Address, Order
from apps.store_settings.services import (
    validate_payment_method_enabled,
)

from .models import (
    ShippingMethod,
    ShippingRate,
    ShippingZone,
)


def calculate_cart_subtotal(*, customer):
    cart_items = list(
        CartItem.objects
        .filter(cart__user=customer)
        .select_related(
            "product",
            "product__category",
            "variant",
            "variant__product",
        )
    )

    if not cart_items:
        raise serializers.ValidationError(
            {
                "cart": "Your shopping cart is empty."
            }
        )

    subtotal = sum(
        (
            item.unit_price * item.quantity
            for item in cart_items
        ),
        Decimal("0.00"),
    )

    return subtotal


def get_matching_shipping_zone(*, address):
    country = address.country.strip()
    province = address.province.strip()
    city = address.city.strip()

    city_zone = (
        ShippingZone.objects
        .filter(
            is_active=True,
            country__iexact=country,
            city__iexact=city,
        )
        .filter(
            Q(province="")
            | Q(province__iexact=province)
        )
        .order_by(
            "-priority",
            "id",
        )
        .first()
    )

    if city_zone:
        return city_zone

    province_zone = (
        ShippingZone.objects
        .filter(
            is_active=True,
            country__iexact=country,
            province__iexact=province,
            city="",
        )
        .order_by(
            "-priority",
            "id",
        )
        .first()
    )

    if province_zone:
        return province_zone

    country_zone = (
        ShippingZone.objects
        .filter(
            is_active=True,
            country__iexact=country,
            province="",
            city="",
        )
        .order_by(
            "-priority",
            "id",
        )
        .first()
    )

    if country_zone:
        return country_zone

    raise serializers.ValidationError(
        {
            "address_id": (
                "Delivery is not currently available "
                "for this location."
            )
        }
    )


def get_shipping_method(*, method_code=""):
    normalized_code = method_code.strip().upper()

    if normalized_code:
        method = (
            ShippingMethod.objects
            .filter(
                code__iexact=normalized_code,
                is_active=True,
            )
            .first()
        )

        if method is None:
            raise serializers.ValidationError(
                {
                    "shipping_method_code": (
                        "The selected shipping method "
                        "is unavailable."
                    )
                }
            )

        return method

    method = (
        ShippingMethod.objects
        .filter(
            is_default=True,
            is_active=True,
        )
        .order_by(
            "display_order",
            "id",
        )
        .first()
    )

    if method is None:
        method = (
            ShippingMethod.objects
            .filter(is_active=True)
            .order_by(
                "display_order",
                "id",
            )
            .first()
        )

    if method is None:
        raise serializers.ValidationError(
            {
                "shipping_method_code": (
                    "No shipping method is currently available."
                )
            }
        )

    return method


def get_shipping_rate(
    *,
    address,
    method_code="",
):
    zone = get_matching_shipping_zone(
        address=address,
    )

    method = get_shipping_method(
        method_code=method_code,
    )

    rate = (
        ShippingRate.objects
        .select_related(
            "zone",
            "method",
        )
        .filter(
            zone=zone,
            method=method,
            is_active=True,
            zone__is_active=True,
            method__is_active=True,
        )
        .first()
    )

    if rate is None:
        raise serializers.ValidationError(
            {
                "shipping_method_code": (
                    f"{method.name} delivery is not "
                    "available for this location."
                )
            }
        )

    return rate


def calculate_shipping_quote(
    *,
    customer,
    address,
    method_code="",
    payment_method="",
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

    if payment_method:
        validate_payment_method_enabled(
            payment_method
        )

    subtotal = calculate_cart_subtotal(
        customer=customer,
    )

    rate = get_shipping_rate(
        address=address,
        method_code=method_code,
    )

    if (
        payment_method
        == Order.PaymentMethod.CASH_ON_DELIVERY
        and not rate.cod_available
    ):
        raise serializers.ValidationError(
            {
                "payment_method": (
                    "Cash on Delivery is unavailable "
                    "for this delivery method and location."
                )
            }
        )

    shipping_fee = rate.charge
    free_shipping_applied = False

    if (
        rate.free_shipping_threshold is not None
        and subtotal
        >= rate.free_shipping_threshold
    ):
        shipping_fee = Decimal("0.00")
        free_shipping_applied = True

    total_amount = subtotal + shipping_fee

    return {
        "zone": rate.zone,
        "method": rate.method,
        "rate": rate,
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "total_amount": total_amount,
        "free_shipping_applied": (
            free_shipping_applied
        ),
    }