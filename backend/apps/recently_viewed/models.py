from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.products.models import Product


class RecentlyViewedProduct(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recently_viewed_products",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="recent_views",
    )

    view_count = models.PositiveIntegerField(
        default=1,
    )

    viewed_at = models.DateTimeField(
        auto_now=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-viewed_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "customer",
                    "product",
                ],
                name="unique_recent_product_per_customer",
            ),
            models.CheckConstraint(
                condition=Q(view_count__gt=0),
                name="recent_product_view_count_positive",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "customer",
                    "viewed_at",
                ],
            ),
            models.Index(
                fields=[
                    "product",
                    "viewed_at",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer.username} viewed "
            f"{self.product.name}"
        )