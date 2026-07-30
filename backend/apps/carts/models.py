from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from apps.products.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-updated_at",
        ]

    @property
    def total_items(self):
        return sum(
            item.quantity
            for item in self.items.all()
        )

    @property
    def subtotal(self):
        return sum(
            (
                item.line_total
                for item in self.items.all()
            ),
            Decimal("0.00"),
        )

    def __str__(self):
        return f"Cart of {self.user.username}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )

    variant = models.ForeignKey(
        "variants.ProductVariant",
        on_delete=models.PROTECT,
        related_name="cart_items",
        null=True,
        blank=True,
    )

    quantity = models.PositiveIntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
        ],
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0),
                name="cart_item_quantity_positive",
            ),
            models.UniqueConstraint(
                fields=[
                    "cart",
                    "product",
                ],
                condition=Q(variant__isnull=True),
                name="unique_simple_product_per_cart",
            ),
            models.UniqueConstraint(
                fields=[
                    "cart",
                    "variant",
                ],
                condition=Q(variant__isnull=False),
                name="unique_variant_per_cart",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "cart",
                    "product",
                ],
            ),
            models.Index(
                fields=[
                    "cart",
                    "variant",
                ],
            ),
        ]

    @property
    def unit_price(self):
        if self.variant_id:
            return self.variant.final_price

        return self.product.final_price

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    @property
    def display_name(self):
        if self.variant_id:
            return self.variant.variant_name

        return self.product.name

    def __str__(self):
        return (
            f"{self.display_name} "
            f"× {self.quantity}"
        )