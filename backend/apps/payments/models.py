import os
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from apps.orders.models import Order


def generate_payment_number():
    unique_part = uuid.uuid4().hex[:12].upper()
    return f"PAY-{unique_part}"


def validate_payment_proof_size(uploaded_file):
    maximum_size = 5 * 1024 * 1024

    if uploaded_file.size > maximum_size:
        raise ValidationError(
            "Payment proof size cannot exceed 5 MB."
        )


def payment_proof_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{extension}"

    return (
        f"payments/"
        f"{instance.payment_number}/"
        f"{unique_filename}"
    )


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUBMITTED = "SUBMITTED", "Submitted"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    payment_number = models.CharField(
        max_length=25,
        unique=True,
        default=generate_payment_number,
        editable=False,
    )

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="payment",
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments",
    )

    method = models.CharField(
        max_length=30,
        choices=Order.PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    proof = models.FileField(
        upload_to=payment_proof_upload_path,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "jpg",
                    "jpeg",
                    "png",
                    "webp",
                    "pdf",
                ]
            ),
            validate_payment_proof_size,
        ],
    )

    rejection_reason = models.TextField(
        blank=True,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="verified_payments",
        null=True,
        blank=True,
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    rejected_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    refunded_at = models.DateTimeField(
        null=True,
        blank=True,
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
                    "transaction_reference",
                ],
                condition=~Q(
                    transaction_reference="",
                ),
                name="unique_non_empty_payment_reference",
            ),
        ]

        indexes = [
            models.Index(
                fields=["payment_number"],
            ),
            models.Index(
                fields=["customer", "status"],
            ),
            models.Index(
                fields=["method", "status"],
            ),
            models.Index(
                fields=["created_at"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.payment_number} - "
            f"{self.order.order_number}"
        )