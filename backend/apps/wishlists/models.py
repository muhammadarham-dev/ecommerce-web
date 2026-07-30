from django.conf import settings
from django.db import models

from apps.products.models import Product


class WishlistItem(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "customer",
                    "product",
                ],
                name="unique_product_per_customer_wishlist",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "customer",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "product",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer.username} saved "
            f"{self.product.name}"
        )