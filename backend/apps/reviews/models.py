from django.conf import settings
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models
from django.db.models import Q

from apps.orders.models import Order
from apps.products.models import Product


class Review(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="reviews",
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="reviews",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    title = models.CharField(
        max_length=255,
        blank=True,
    )

    comment = models.TextField()

    is_approved = models.BooleanField(
        default=True,
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
            models.UniqueConstraint(
                fields=[
                    "customer",
                    "product",
                ],
                name="unique_customer_review_per_product",
            ),
            models.CheckConstraint(
                condition=Q(
                    rating__gte=1,
                    rating__lte=5,
                ),
                name="review_rating_between_one_and_five",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "product",
                    "is_approved",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "customer",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "rating",
                    "is_approved",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.customer.username} reviewed "
            f"{self.product.name}"
        )