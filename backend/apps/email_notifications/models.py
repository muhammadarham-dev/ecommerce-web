from django.conf import settings
from django.db import models


class EmailLog(models.Model):
    class Type(models.TextChoices):
        ORDER_PLACED = (
            "ORDER_PLACED",
            "Order Placed",
        )

        ORDER_STATUS_CHANGED = (
            "ORDER_STATUS_CHANGED",
            "Order Status Changed",
        )

        PAYMENT_STATUS_CHANGED = (
            "PAYMENT_STATUS_CHANGED",
            "Payment Status Changed",
        )

        SHIPMENT_STATUS_CHANGED = (
            "SHIPMENT_STATUS_CHANGED",
            "Shipment Status Changed",
        )

        TICKET_REPLY = (
            "TICKET_REPLY",
            "Ticket Reply",
        )

        TICKET_STATUS_CHANGED = (
            "TICKET_STATUS_CHANGED",
            "Ticket Status Changed",
        )

        RETURN_STATUS_CHANGED = (
            "RETURN_STATUS_CHANGED",
            "Return Status Changed",
        )

        PROMOTIONAL = (
            "PROMOTIONAL",
            "Promotional Email",
        )

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="email_logs",
        null=True,
        blank=True,
    )

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        related_name="email_logs",
        null=True,
        blank=True,
    )

    return_request = models.ForeignKey(
        "returns.ReturnRequest",
        on_delete=models.SET_NULL,
        related_name="email_logs",
        null=True,
        blank=True,
    )

    email_type = models.CharField(
        max_length=40,
        choices=Type.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    recipient = models.EmailField()

    subject = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    html_message = models.TextField(
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
    )

    sent_at = models.DateTimeField(
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

        indexes = [
            models.Index(
                fields=[
                    "email_type",
                    "status",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "recipient",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "user",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "order",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "return_request",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.get_email_type_display()} "
            f"to {self.recipient}"
        )


class EmailNotificationPreference(models.Model):
    PREFERENCE_FIELDS = (
        "order_updates",
        "payment_updates",
        "shipment_updates",
        "ticket_updates",
        "return_updates",
        "promotional_emails",
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_notification_preference",
    )

    order_updates = models.BooleanField(
        default=True,
    )

    payment_updates = models.BooleanField(
        default=True,
    )

    shipment_updates = models.BooleanField(
        default=True,
    )

    ticket_updates = models.BooleanField(
        default=True,
    )

    return_updates = models.BooleanField(
        default=True,
    )

    promotional_emails = models.BooleanField(
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
            "id",
        ]

    @property
    def all_enabled(self):
        return all(
            getattr(self, field_name)
            for field_name
            in self.PREFERENCE_FIELDS
        )

    @property
    def enabled_count(self):
        return sum(
            1
            for field_name
            in self.PREFERENCE_FIELDS
            if getattr(self, field_name)
        )

    def set_all_preferences(self, enabled):
        for field_name in self.PREFERENCE_FIELDS:
            setattr(
                self,
                field_name,
                enabled,
            )

        self.save(
            update_fields=[
                *self.PREFERENCE_FIELDS,
                "updated_at",
            ],
        )

    def __str__(self):
        return (
            f"Email preferences for "
            f"{self.user.username}"
        )