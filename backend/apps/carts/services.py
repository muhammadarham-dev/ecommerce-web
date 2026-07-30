from django.db import transaction
from rest_framework import serializers

from apps.products.models import Product
from apps.variants.models import ProductVariant

from .models import Cart, CartItem


def validate_product_and_variant(
    *,
    product,
    variant,
    quantity,
):
    if not product.is_active:
        raise serializers.ValidationError(
            {
                "product_id": (
                    "This product is currently unavailable."
                )
            }
        )

    if not product.category.is_active:
        raise serializers.ValidationError(
            {
                "product_id": (
                    "This product category is currently unavailable."
                )
            }
        )

    product_has_variants = (
        ProductVariant.objects.filter(
            product=product,
            is_active=True,
        ).exists()
    )

    if product_has_variants and variant is None:
        raise serializers.ValidationError(
            {
                "variant_id": (
                    "Please select a product variant."
                )
            }
        )

    if variant is not None:
        if variant.product_id != product.id:
            raise serializers.ValidationError(
                {
                    "variant_id": (
                        "The selected variant does not belong "
                        "to this product."
                    )
                }
            )

        if not variant.is_active:
            raise serializers.ValidationError(
                {
                    "variant_id": (
                        "The selected variant is unavailable."
                    )
                }
            )

        available_stock = variant.stock

    else:
        available_stock = product.stock

    if available_stock <= 0:
        raise serializers.ValidationError(
            {
                "quantity": (
                    "This product is currently out of stock."
                )
            }
        )

    if quantity > available_stock:
        raise serializers.ValidationError(
            {
                "quantity": (
                    f"Only {available_stock} units are available."
                )
            }
        )


@transaction.atomic
def add_item_to_cart(
    *,
    customer,
    product,
    quantity,
    variant=None,
):
    cart, _ = Cart.objects.get_or_create(
        user=customer,
    )

    cart = (
        Cart.objects
        .select_for_update(of=("self",))
        .get(pk=cart.pk)
    )

    locked_product = (
        Product.objects
        .select_for_update(of=("self",))
        .select_related("category")
        .get(pk=product.pk)
    )

    locked_variant = None

    if variant is not None:
        locked_variant = (
            ProductVariant.objects
            .select_for_update(of=("self",))
            .select_related(
                "product",
                "product__category",
            )
            .get(pk=variant.pk)
        )

    existing_item = (
        CartItem.objects
        .select_for_update(of=("self",))
        .filter(
            cart=cart,
            product=locked_product,
            variant=locked_variant,
        )
        .first()
    )

    final_quantity = quantity

    if existing_item is not None:
        final_quantity = (
            existing_item.quantity + quantity
        )

    validate_product_and_variant(
        product=locked_product,
        variant=locked_variant,
        quantity=final_quantity,
    )

    if existing_item is not None:
        existing_item.quantity = final_quantity

        existing_item.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

        return existing_item, False

    cart_item = CartItem.objects.create(
        cart=cart,
        product=locked_product,
        variant=locked_variant,
        quantity=quantity,
    )

    return cart_item, True


@transaction.atomic
def update_cart_item_quantity(
    *,
    cart_item,
    customer,
    quantity,
):
    # Lock only the cart-item row. Joining the nullable ``variant``
    # relation in a SELECT ... FOR UPDATE query raises PostgreSQL's
    # "FOR UPDATE cannot be applied to the nullable side of an outer
    # join" error for simple products that do not have a variant.
    locked_item = (
        CartItem.objects
        .select_for_update(of=("self",))
        .get(
            pk=cart_item.pk,
            cart__user=customer,
        )
    )

    locked_product = (
        Product.objects
        .select_for_update(of=("self",))
        .select_related("category")
        .get(pk=locked_item.product_id)
    )

    locked_variant = None

    if locked_item.variant_id:
        locked_variant = (
            ProductVariant.objects
            .select_for_update(of=("self",))
            .select_related("product")
            .get(pk=locked_item.variant_id)
        )

    validate_product_and_variant(
        product=locked_product,
        variant=locked_variant,
        quantity=quantity,
    )

    locked_item.quantity = quantity

    locked_item.save(
        update_fields=[
            "quantity",
            "updated_at",
        ]
    )

    return locked_item