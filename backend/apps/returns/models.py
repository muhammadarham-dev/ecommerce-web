import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from apps.orders.models import Order, OrderItem


def generate_return_number():
    unique_part = uuid.uuid4().hex[:12].upper()
    return f"RET-{unique_part}"


class ReturnRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        PRODUCT_RECEIVED = (
            "PRODUCT_RECEIVED",
            "Product Received",
        )
        REFUNDED = "REFUNDED", "Refunded"
        CANCELLED = "CANCELLED", "Cancelled"

    class Reason(models.TextChoices):
        DAMAGED = "DAMAGED", "Damaged Product"
        WRONG_PRODUCT = "WRONG_PRODUCT", "Wrong Product"
        DEFECTIVE = "DEFECTIVE", "Defective Product"
        NOT_AS_DESCRIBED = (
            "NOT_AS_DESCRIBED",
            "Product Not as Described",
        )
        SIZE_OR_FIT = "SIZE_OR_FIT", "Size or Fit Issue"
        CHANGED_MIND = "CHANGED_MIND", "Changed Mind"
        OTHER = "OTHER", "Other"

    return_number = models.CharField(
        max_length=25,
        unique=True,
        default=generate_return_number,
        editable=False,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="return_requests",
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="return_requests",
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.REQUESTED,
    )

    reason = models.CharField(
        max_length=30,
        choices=Reason.choices,
    )

    details = models.TextField(
        blank=True,
    )

    refund_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    admin_note = models.TextField(
        blank=True,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_return_requests",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    received_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    refunded_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    stock_restored_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=["return_number"],
            ),
            models.Index(
                fields=["customer", "status"],
            ),
            models.Index(
                fields=["order", "status"],
            ),
            models.Index(
                fields=["status", "created_at"],
            ),
        ]

    @property
    def can_customer_cancel(self):
        return self.status == self.Status.REQUESTED

    def __str__(self):
        return (
            f"{self.return_number} - "
            f"{self.order.order_number}"
        )


class ReturnItem(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest,
        on_delete=models.CASCADE,
        related_name="items",
    )

    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.PROTECT,
        related_name="return_items",
    )

    quantity = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
        ],
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    line_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "return_request",
                    "order_item",
                ],
                name="unique_order_item_per_return_request",
            ),
            models.CheckConstraint(
                condition=Q(quantity__gt=0),
                name="return_item_quantity_greater_than_zero",
            ),
        ]

    def save(self, *args, **kwargs):
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.order_item.product_name} "
            f"× {self.quantity}"
        )