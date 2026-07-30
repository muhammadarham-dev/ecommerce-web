from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER_STATUS = (
            "ORDER_STATUS",
            "Order Status",
        )

        PAYMENT_STATUS = (
            "PAYMENT_STATUS",
            "Payment Status",
        )

        TICKET_REPLY = (
            "TICKET_REPLY",
            "Ticket Reply",
        )

        TICKET_STATUS = (
            "TICKET_STATUS",
            "Ticket Status",
        )

        TICKET_ASSIGNED = (
            "TICKET_ASSIGNED",
            "Ticket Assigned",
        )

        RETURN_STATUS = (
            "RETURN_STATUS",
            "Return Status",
        )

        SHIPMENT_STATUS = (
            "SHIPMENT_STATUS",
            "Shipment Status",
        )

        SYSTEM = (
            "SYSTEM",
            "System",
        )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.SYSTEM,
    )

    title = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
    )

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
    )

    is_read = models.BooleanField(
        default=False,
    )

    read_at = models.DateTimeField(
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

        indexes = [
            models.Index(
                fields=[
                    "recipient",
                    "is_read",
                ],
            ),
            models.Index(
                fields=[
                    "notification_type",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.recipient.username} - "
            f"{self.title}"
        )