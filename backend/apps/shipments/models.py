import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.orders.models import Order


def generate_shipment_number():
    unique_part = uuid.uuid4().hex[:12].upper()
    return f"SHP-{unique_part}"


class Shipment(models.Model):
    class Status(models.TextChoices):
        READY = "READY", "Ready for Shipment"
        PICKED_UP = "PICKED_UP", "Picked Up"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        OUT_FOR_DELIVERY = (
            "OUT_FOR_DELIVERY",
            "Out for Delivery",
        )
        DELIVERED = "DELIVERED", "Delivered"
        DELIVERY_FAILED = (
            "DELIVERY_FAILED",
            "Delivery Failed",
        )
        RETURNED = "RETURNED", "Returned"
        CANCELLED = "CANCELLED", "Cancelled"

    shipment_number = models.CharField(
        max_length=25,
        unique=True,
        default=generate_shipment_number,
        editable=False,
    )

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="shipment",
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.READY,
    )

    courier_name = models.CharField(
        max_length=100,
        blank=True,
    )

    tracking_number = models.CharField(
        max_length=150,
        blank=True,
    )

    estimated_delivery_date = models.DateField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_shipments",
        null=True,
        blank=True,
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="updated_shipments",
        null=True,
        blank=True,
    )

    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    delivered_at = models.DateTimeField(
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
                    "tracking_number",
                ],
                condition=~Q(
                    tracking_number="",
                ),
                name="unique_non_empty_tracking_number",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "shipment_number",
                ],
            ),
            models.Index(
                fields=[
                    "status",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "courier_name",
                    "status",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.shipment_number} - "
            f"{self.order.order_number}"
        )


class ShipmentEvent(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name="events",
    )

    status = models.CharField(
        max_length=30,
        choices=Shipment.Status.choices,
    )

    message = models.CharField(
        max_length=500,
        blank=True,
    )

    location = models.CharField(
        max_length=255,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="shipment_events",
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
                    "shipment",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "status",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.shipment.shipment_number} - "
            f"{self.status}"
        )