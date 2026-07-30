from django.db import transaction
from rest_framework import serializers

from apps.carts.models import Cart, CartItem
from apps.products.models import Product

from .models import WishlistItem


@transaction.atomic
def add_product_to_wishlist(
    *,
    customer,
    product,
):
    wishlist_item, created = (
        WishlistItem.objects.get_or_create(
            customer=customer,
            product=product,
        )
    )

    return wishlist_item, created


@transaction.atomic
def move_wishlist_item_to_cart(
    *,
    wishlist_item,
    customer,
    quantity=1,
):
    locked_wishlist_item = (
        WishlistItem.objects
        .select_for_update()
        .get(
            pk=wishlist_item.pk,
            customer=customer,
        )
    )

    product = (
        Product.objects
        .select_for_update()
        .select_related("category")
        .get(pk=locked_wishlist_item.product_id)
    )

    if not product.is_active:
        raise serializers.ValidationError(
            {
                "product": (
                    "This product is no longer available."
                )
            }
        )

    if not product.category.is_active:
        raise serializers.ValidationError(
            {
                "product": (
                    "This product category is not available."
                )
            }
        )

    if product.stock <= 0:
        raise serializers.ValidationError(
            {
                "product": (
                    "This product is currently out of stock."
                )
            }
        )

    if quantity > product.stock:
        raise serializers.ValidationError(
            {
                "quantity": (
                    f"Only {product.stock} units are available."
                )
            }
        )

    cart, _ = Cart.objects.get_or_create(
        user=customer,
    )

    cart = (
        Cart.objects
        .select_for_update()
        .get(pk=cart.pk)
    )

    cart_item = (
        CartItem.objects
        .select_for_update()
        .filter(
            cart=cart,
            product=product,
        )
        .first()
    )

    if cart_item is not None:
        updated_quantity = (
            cart_item.quantity + quantity
        )

        if updated_quantity > product.stock:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"Only {product.stock} units are available. "
                        f"Your cart already contains "
                        f"{cart_item.quantity} units."
                    )
                }
            )

        cart_item.quantity = updated_quantity

        cart_item.save(
            update_fields=[
                "quantity",
                "updated_at",
            ]
        )

    else:
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
        )

    locked_wishlist_item.delete()

    return cart_item