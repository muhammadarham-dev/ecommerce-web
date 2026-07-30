from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.notifications.services import (
    notify_shipment_status_change,
)
from apps.orders.models import Order
from apps.orders.services import (
    update_order_by_manager,
)

from .models import Shipment, ShipmentEvent


ALLOWED_SHIPMENT_TRANSITIONS = {
    Shipment.Status.READY: {
        Shipment.Status.PICKED_UP,
        Shipment.Status.CANCELLED,
    },
    Shipment.Status.PICKED_UP: {
        Shipment.Status.IN_TRANSIT,
        Shipment.Status.DELIVERY_FAILED,
    },
    Shipment.Status.IN_TRANSIT: {
        Shipment.Status.OUT_FOR_DELIVERY,
        Shipment.Status.DELIVERY_FAILED,
        Shipment.Status.RETURNED,
    },
    Shipment.Status.OUT_FOR_DELIVERY: {
        Shipment.Status.DELIVERED,
        Shipment.Status.DELIVERY_FAILED,
        Shipment.Status.RETURNED,
    },
    Shipment.Status.DELIVERY_FAILED: {
        Shipment.Status.OUT_FOR_DELIVERY,
        Shipment.Status.RETURNED,
    },
    Shipment.Status.DELIVERED: set(),
    Shipment.Status.RETURNED: set(),
    Shipment.Status.CANCELLED: set(),
}


@transaction.atomic
def create_shipment(
    *,
    order,
    created_by,
    courier_name="",
    tracking_number="",
    estimated_delivery_date=None,
    message="",
    location="",
):
    locked_order = (
        Order.objects
        .select_for_update()
        .select_related("customer")
        .get(pk=order.pk)
    )

    if locked_order.status in {
        Order.Status.DELIVERED,
        Order.Status.CANCELLED,
    }:
        raise serializers.ValidationError(
            {
                "order_id": (
                    "A shipment cannot be created "
                    "for this order."
                )
            }
        )

    if locked_order.status not in {
        Order.Status.CONFIRMED,
        Order.Status.PROCESSING,
        Order.Status.SHIPPED,
    }:
        raise serializers.ValidationError(
            {
                "order_id": (
                    "The order must be confirmed or processing "
                    "before a shipment can be created."
                )
            }
        )

    if Shipment.objects.filter(
        order=locked_order,
    ).exists():
        raise serializers.ValidationError(
            {
                "order_id": (
                    "A shipment already exists for this order."
                )
            }
        )

    shipment = Shipment.objects.create(
        order=locked_order,
        courier_name=courier_name,
        tracking_number=tracking_number,
        estimated_delivery_date=(
            estimated_delivery_date
        ),
        created_by=created_by,
        updated_by=created_by,
    )

    ShipmentEvent.objects.create(
        shipment=shipment,
        status=Shipment.Status.READY,
        message=(
            message
            or "Shipment has been created."
        ),
        location=location,
        created_by=created_by,
    )

    return shipment


@transaction.atomic
def update_shipment(
    *,
    shipment,
    updated_by,
    status_value=None,
    courier_name=None,
    tracking_number=None,
    estimated_delivery_date=None,
    message="",
    location="",
):
    locked_shipment = (
        Shipment.objects
        .select_for_update()
        .select_related(
            "order",
            "order__customer",
        )
        .get(pk=shipment.pk)
    )

    previous_status = locked_shipment.status

    target_status = (
        status_value
        if status_value is not None
        else previous_status
    )

    if target_status != previous_status:
        allowed_statuses = (
            ALLOWED_SHIPMENT_TRANSITIONS.get(
                previous_status,
                set(),
            )
        )

        if target_status not in allowed_statuses:
            raise serializers.ValidationError(
                {
                    "status": (
                        "Shipment status cannot be changed "
                        f"from {previous_status} "
                        f"to {target_status}."
                    )
                }
            )

    if (
        target_status == Shipment.Status.PICKED_UP
        and not (
            tracking_number
            if tracking_number is not None
            else locked_shipment.tracking_number
        )
    ):
        raise serializers.ValidationError(
            {
                "tracking_number": (
                    "A tracking number is required "
                    "before the shipment is picked up."
                )
            }
        )

    update_fields = [
        "updated_by",
        "updated_at",
    ]

    locked_shipment.updated_by = updated_by

    if status_value is not None:
        locked_shipment.status = status_value
        update_fields.append("status")

    if courier_name is not None:
        locked_shipment.courier_name = courier_name
        update_fields.append("courier_name")

    if tracking_number is not None:
        locked_shipment.tracking_number = (
            tracking_number
        )
        update_fields.append("tracking_number")

    if estimated_delivery_date is not None:
        locked_shipment.estimated_delivery_date = (
            estimated_delivery_date
        )
        update_fields.append(
            "estimated_delivery_date"
        )

    current_time = timezone.now()

    if (
        target_status
        in {
            Shipment.Status.PICKED_UP,
            Shipment.Status.IN_TRANSIT,
            Shipment.Status.OUT_FOR_DELIVERY,
        }
        and locked_shipment.shipped_at is None
    ):
        locked_shipment.shipped_at = current_time
        update_fields.append("shipped_at")

    if (
        target_status == Shipment.Status.DELIVERED
        and locked_shipment.delivered_at is None
    ):
        locked_shipment.delivered_at = current_time
        update_fields.append("delivered_at")

    locked_shipment.save(
        update_fields=list(
            dict.fromkeys(update_fields)
        ),
    )

    if target_status != previous_status:
        ShipmentEvent.objects.create(
            shipment=locked_shipment,
            status=target_status,
            message=(
                message
                or (
                    "Shipment status changed from "
                    f"{previous_status} to {target_status}."
                )
            ),
            location=location,
            created_by=updated_by,
        )

    elif message or location:
        ShipmentEvent.objects.create(
            shipment=locked_shipment,
            status=locked_shipment.status,
            message=message,
            location=location,
            created_by=updated_by,
        )

    order = locked_shipment.order

    shipping_statuses = {
        Shipment.Status.PICKED_UP,
        Shipment.Status.IN_TRANSIT,
        Shipment.Status.OUT_FOR_DELIVERY,
    }

    if (
        target_status in shipping_statuses
        and order.status == Order.Status.PROCESSING
    ):
        order = update_order_by_manager(
            order=order,
            status_value=Order.Status.SHIPPED,
        )

    if target_status == Shipment.Status.DELIVERED:
        if order.status != Order.Status.SHIPPED:
            raise serializers.ValidationError(
                {
                    "status": (
                        "The order must be shipped before "
                        "the shipment can be delivered."
                    )
                }
            )

        order = update_order_by_manager(
            order=order,
            status_value=Order.Status.DELIVERED,
        )

    notify_shipment_status_change(
        shipment=locked_shipment,
        previous_status=previous_status,
    )

    return locked_shipment