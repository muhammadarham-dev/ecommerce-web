from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.products.models import Product


class StockMovement(models.Model):
    class Type(models.TextChoices):
        RESTOCK = "RESTOCK", "Restock"
        SALE = "SALE", "Sale"
        ORDER_CANCELLED = (
            "ORDER_CANCELLED",
            "Order Cancelled",
        )
        RETURN_RECEIVED = (
            "RETURN_RECEIVED",
            "Return Received",
        )
        MANUAL_INCREASE = (
            "MANUAL_INCREASE",
            "Manual Increase",
        )
        MANUAL_DECREASE = (
            "MANUAL_DECREASE",
            "Manual Decrease",
        )
        CORRECTION = (
            "CORRECTION",
            "Stock Correction",
        )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_movements",
        null=True,
        blank=True,
    )

    variant = models.ForeignKey(
        "variants.ProductVariant",
        on_delete=models.PROTECT,
        related_name="stock_movements",
        null=True,
        blank=True,
    )

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        related_name="stock_movements",
        null=True,
        blank=True,
    )

    return_request = models.ForeignKey(
        "returns.ReturnRequest",
        on_delete=models.SET_NULL,
        related_name="stock_movements",
        null=True,
        blank=True,
    )

    movement_type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )

    quantity_change = models.IntegerField()

    previous_stock = models.PositiveIntegerField()

    new_stock = models.PositiveIntegerField()

    note = models.TextField(
        blank=True,
    )

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="performed_stock_movements",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=~Q(quantity_change=0),
                name="stock_movement_quantity_not_zero",
            ),
            models.CheckConstraint(
                condition=(
                    Q(
                        product__isnull=False,
                        variant__isnull=True,
                    )
                    | Q(
                        product__isnull=True,
                        variant__isnull=False,
                    )
                ),
                name="stock_movement_has_one_target",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "product",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "variant",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "movement_type",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "performed_by",
                    "created_at",
                ],
            ),
        ]

    @property
    def target_type(self):
        if self.variant_id:
            return "VARIANT"

        return "PRODUCT"

    @property
    def target_name(self):
        if self.variant_id:
            return self.variant.variant_name

        return self.product.name

    @property
    def target_sku(self):
        if self.variant_id:
            return self.variant.sku

        return self.product.sku

    def __str__(self):
        change_prefix = (
            "+"
            if self.quantity_change > 0
            else ""
        )

        return (
            f"{self.target_name}: "
            f"{change_prefix}{self.quantity_change}"
        )