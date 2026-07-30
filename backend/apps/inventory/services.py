from django.db import transaction
from rest_framework import serializers

from apps.products.models import Product
from apps.variants.models import ProductVariant

from .models import StockMovement


POSITIVE_MOVEMENT_TYPES = {
    StockMovement.Type.RESTOCK,
    StockMovement.Type.ORDER_CANCELLED,
    StockMovement.Type.RETURN_RECEIVED,
    StockMovement.Type.MANUAL_INCREASE,
}


NEGATIVE_MOVEMENT_TYPES = {
    StockMovement.Type.SALE,
    StockMovement.Type.MANUAL_DECREASE,
}


def validate_stock_change(
    *,
    quantity_change,
    movement_type,
):
    if quantity_change == 0:
        raise serializers.ValidationError(
            {
                "quantity": (
                    "Stock change cannot be zero."
                )
            }
        )

    if (
        movement_type in POSITIVE_MOVEMENT_TYPES
        and quantity_change < 0
    ):
        raise serializers.ValidationError(
            {
                "quantity": (
                    "This stock movement requires "
                    "a positive quantity."
                )
            }
        )

    if (
        movement_type in NEGATIVE_MOVEMENT_TYPES
        and quantity_change > 0
    ):
        raise serializers.ValidationError(
            {
                "quantity": (
                    "This stock movement requires "
                    "a negative quantity."
                )
            }
        )


def save_locked_stock_change(
    *,
    product=None,
    variant=None,
    quantity_change,
    movement_type,
    performed_by=None,
    order=None,
    return_request=None,
    note="",
):
    validate_stock_change(
        quantity_change=quantity_change,
        movement_type=movement_type,
    )

    target = variant or product
    previous_stock = target.stock
    new_stock = previous_stock + quantity_change

    if new_stock < 0:
        raise serializers.ValidationError(
            {
                "quantity": (
                    f"Only {previous_stock} units "
                    "are currently available."
                )
            }
        )

    target.stock = new_stock

    target.save(
        update_fields=[
            "stock",
            "updated_at",
        ]
    )

    stock_movement = StockMovement.objects.create(
        product=product,
        variant=variant,
        order=order,
        return_request=return_request,
        movement_type=movement_type,
        quantity_change=quantity_change,
        previous_stock=previous_stock,
        new_stock=new_stock,
        performed_by=performed_by,
        note=note.strip(),
    )

    return target, stock_movement


@transaction.atomic
def change_stock(
    *,
    product=None,
    variant=None,
    quantity_change,
    movement_type,
    performed_by=None,
    order=None,
    return_request=None,
    note="",
):
    if (
        product is None and variant is None
    ) or (
        product is not None and variant is not None
    ):
        raise serializers.ValidationError(
            {
                "target": (
                    "Provide either a product "
                    "or a variant."
                )
            }
        )

    if variant is not None:
        locked_variant = (
            ProductVariant.objects
            .select_for_update()
            .select_related(
                "product",
                "product__category",
            )
            .get(pk=variant.pk)
        )

        return save_locked_stock_change(
            variant=locked_variant,
            quantity_change=quantity_change,
            movement_type=movement_type,
            performed_by=performed_by,
            order=order,
            return_request=return_request,
            note=note,
        )

    locked_product = (
        Product.objects
        .select_for_update()
        .select_related("category")
        .get(pk=product.pk)
    )

    return save_locked_stock_change(
        product=locked_product,
        quantity_change=quantity_change,
        movement_type=movement_type,
        performed_by=performed_by,
        order=order,
        return_request=return_request,
        note=note,
    )


@transaction.atomic
def adjust_stock_manually(
    *,
    operation,
    quantity,
    performed_by,
    product=None,
    variant=None,
    note="",
):
    if (
        product is None and variant is None
    ) or (
        product is not None and variant is not None
    ):
        raise serializers.ValidationError(
            {
                "target": (
                    "Provide either a product "
                    "or a variant."
                )
            }
        )

    if variant is not None:
        locked_target = (
            ProductVariant.objects
            .select_for_update()
            .select_related(
                "product",
                "product__category",
            )
            .get(pk=variant.pk)
        )

        target_kwargs = {
            "variant": locked_target,
        }

    else:
        locked_target = (
            Product.objects
            .select_for_update()
            .select_related("category")
            .get(pk=product.pk)
        )

        product_has_variants = (
            ProductVariant.objects
            .filter(product=locked_target)
            .exists()
        )

        if product_has_variants:
            raise serializers.ValidationError(
                {
                    "product_id": (
                        "This product uses variants. "
                        "Adjust the selected variant stock instead."
                    )
                }
            )

        target_kwargs = {
            "product": locked_target,
        }

    if operation == "INCREASE":
        if quantity <= 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Increase quantity must be "
                        "greater than zero."
                    )
                }
            )

        quantity_change = quantity
        movement_type = (
            StockMovement.Type.MANUAL_INCREASE
        )

    elif operation == "DECREASE":
        if quantity <= 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Decrease quantity must be "
                        "greater than zero."
                    )
                }
            )

        quantity_change = -quantity
        movement_type = (
            StockMovement.Type.MANUAL_DECREASE
        )

    elif operation == "SET":
        if quantity < 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Stock quantity cannot be negative."
                    )
                }
            )

        quantity_change = (
            quantity - locked_target.stock
        )

        movement_type = (
            StockMovement.Type.CORRECTION
        )

        if quantity_change == 0:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "The stock is already set "
                        "to this quantity."
                    )
                }
            )

    else:
        raise serializers.ValidationError(
            {
                "operation": (
                    "Invalid inventory operation."
                )
            }
        )

    return save_locked_stock_change(
        quantity_change=quantity_change,
        movement_type=movement_type,
        performed_by=performed_by,
        note=note,
        **target_kwargs,
    )