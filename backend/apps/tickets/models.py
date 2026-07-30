import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q


def generate_ticket_number():
    unique_part = uuid.uuid4().hex[:10].upper()
    return f"TKT-{unique_part}"


def validate_attachment_size(uploaded_file):
    maximum_size = 5 * 1024 * 1024

    if uploaded_file.size > maximum_size:
        raise ValidationError(
            "Attachment size cannot exceed 5 MB."
        )


def ticket_attachment_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{extension}"

    return (
        f"tickets/"
        f"{instance.message.ticket.ticket_number}/"
        f"{unique_filename}"
    )


class Ticket(models.Model):
    class Category(models.TextChoices):
        ORDER_ISSUE = "ORDER_ISSUE", "Order Issue"
        PAYMENT_ISSUE = "PAYMENT_ISSUE", "Payment Issue"
        DELIVERY_ISSUE = "DELIVERY_ISSUE", "Delivery Issue"
        RETURN_REFUND = "RETURN_REFUND", "Return or Refund"
        DAMAGED_PRODUCT = "DAMAGED_PRODUCT", "Damaged Product"
        PRODUCT_INFORMATION = (
            "PRODUCT_INFORMATION",
            "Product Information",
        )
        ACCOUNT_ISSUE = "ACCOUNT_ISSUE", "Account Issue"
        GENERAL_COMPLAINT = (
            "GENERAL_COMPLAINT",
            "General Complaint",
        )

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        WAITING_FOR_CUSTOMER = (
            "WAITING_FOR_CUSTOMER",
            "Waiting for Customer",
        )
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    ticket_number = models.CharField(
        max_length=20,
        unique=True,
        default=generate_ticket_number,
        editable=False,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="support_tickets",
    )

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="support_tickets",
        null=True,
        blank=True,
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="support_tickets",
        null=True,
        blank=True,
    )

    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_tickets",
        null=True,
        blank=True,
        limit_choices_to=Q(
            role__in=[
                "ADMIN",
                "SUPPORT_AGENT",
            ]
        ),
    )

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.OPEN,
    )

    subject = models.CharField(
        max_length=255,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    closed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = [
            "-updated_at",
        ]

        indexes = [
            models.Index(
                fields=["ticket_number"],
            ),
            models.Index(
                fields=["customer", "status"],
            ),
            models.Index(
                fields=["assigned_agent", "status"],
            ),
            models.Index(
                fields=["priority", "status"],
            ),
            models.Index(
                fields=["created_at"],
            ),
        ]

    @property
    def can_customer_reply(self):
        return self.status != self.Status.CLOSED

    @property
    def can_customer_close(self):
        return self.status == self.Status.RESOLVED

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ticket_messages",
    )

    body = models.TextField()

    is_internal_note = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "created_at",
        ]

        indexes = [
            models.Index(
                fields=["ticket", "created_at"],
            ),
        ]

    def __str__(self):
        return (
            f"Message by {self.sender.username} "
            f"on {self.ticket.ticket_number}"
        )


class TicketAttachment(models.Model):
    message = models.ForeignKey(
        TicketMessage,
        on_delete=models.CASCADE,
        related_name="attachments",
    )

    file = models.FileField(
        upload_to=ticket_attachment_upload_path,
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
            validate_attachment_size,
        ],
    )

    original_name = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def save(self, *args, **kwargs):
        if self.file and not self.original_name:
            self.original_name = os.path.basename(
                self.file.name
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.original_name or self.file.name