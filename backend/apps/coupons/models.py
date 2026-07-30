from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage"
        FIXED = "FIXED", "Fixed Amount"

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    name = models.CharField(
        max_length=150,
    )

    description = models.TextField(
        blank=True,
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )

    value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01")),
        ],
    )

    minimum_order_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    maximum_discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.01")),
        ],
    )

    total_usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    per_customer_limit = models.PositiveIntegerField(
        default=1,
    )

    starts_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
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
            models.CheckConstraint(
                condition=Q(value__gt=0),
                name="coupon_value_greater_than_zero",
            ),
            models.CheckConstraint(
                condition=Q(per_customer_limit__gt=0),
                name="coupon_per_customer_limit_greater_than_zero",
            ),
        ]

        indexes = [
            models.Index(
                fields=["code"],
            ),
            models.Index(
                fields=["is_active", "expires_at"],
            ),
        ]

    def clean(self):
        errors = {}

        if (
            self.discount_type
            == self.DiscountType.PERCENTAGE
            and self.value > Decimal("100.00")
        ):
            errors["value"] = (
                "Percentage discount cannot exceed 100."
            )

        if (
            self.starts_at
            and self.expires_at
            and self.expires_at <= self.starts_at
        ):
            errors["expires_at"] = (
                "Expiry time must be later than the start time."
            )

        if (
            self.total_usage_limit is not None
            and self.total_usage_limit <= 0
        ):
            errors["total_usage_limit"] = (
                "Total usage limit must be greater than zero."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        self.full_clean()

        super().save(*args, **kwargs)

    @property
    def is_currently_valid(self):
        current_time = timezone.now()

        if not self.is_active:
            return False

        if self.starts_at and current_time < self.starts_at:
            return False

        if self.expires_at and current_time > self.expires_at:
            return False

        return True

    def __str__(self):
        return self.code


class CouponUsage(models.Model):
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.PROTECT,
        related_name="usages",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="coupon_usages",
    )

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="coupon_usage",
    )

    discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    is_reversed = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    reversed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=["coupon", "is_reversed"],
            ),
            models.Index(
                fields=["customer", "is_reversed"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.coupon.code} used on "
            f"{self.order.order_number}"
        )