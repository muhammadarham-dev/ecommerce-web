from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from apps.inventory.models import StockMovement
from apps.inventory.services import change_stock
from apps.notifications.services import (
    notify_return_status_change,
)
from apps.orders.models import Order, OrderItem

from .models import ReturnItem, ReturnRequest


ACTIVE_RETURN_STATUSES = {
    ReturnRequest.Status.REQUESTED,
    ReturnRequest.Status.APPROVED,
    ReturnRequest.Status.PRODUCT_RECEIVED,
    ReturnRequest.Status.REFUNDED,
}


ALLOWED_STATUS_TRANSITIONS = {
    ReturnRequest.Status.REQUESTED: {
        ReturnRequest.Status.APPROVED,
        ReturnRequest.Status.REJECTED,
    },
    ReturnRequest.Status.APPROVED: {
        ReturnRequest.Status.PRODUCT_RECEIVED,
    },
    ReturnRequest.Status.PRODUCT_RECEIVED: {
        ReturnRequest.Status.REFUNDED,
    },
    ReturnRequest.Status.REJECTED: set(),
    ReturnRequest.Status.REFUNDED: set(),
    ReturnRequest.Status.CANCELLED: set(),
}


@transaction.atomic
def create_return_request(
    *,
    customer,
    order,
    reason,
    details,
    items,
):
    locked_order = (
        Order.objects
        .select_for_update()
        .get(pk=order.pk)
    )

    if locked_order.customer_id != customer.id:
        raise serializers.ValidationError(
            {
                "order_id": (
                    "This order does not belong to you."
                )
            }
        )

    if locked_order.status != Order.Status.DELIVERED:
        raise serializers.ValidationError(
            {
                "order_id": (
                    "Only delivered orders can be returned."
                )
            }
        )

    order_item_ids = sorted(
        {
            item["order_item_id"]
            for item in items
        }
    )

    locked_order_items = {
        order_item.pk: order_item
        for order_item in (
            OrderItem.objects
            .select_for_update()
            .select_related(
                "product",
                "variant",
            )
            .filter(
                order=locked_order,
                pk__in=order_item_ids,
            )
            .order_by("pk")
        )
    }

    if len(locked_order_items) != len(
        order_item_ids
    ):
        raise serializers.ValidationError(
            {
                "items": (
                    "One or more selected items "
                    "do not belong to this order."
                )
            }
        )

    prepared_items = []
    refund_amount = Decimal("0.00")

    for requested_item in items:
        order_item = locked_order_items[
            requested_item["order_item_id"]
        ]

        requested_quantity = (
            requested_item["quantity"]
        )

        already_requested_quantity = (
            ReturnItem.objects
            .filter(
                order_item=order_item,
                return_request__status__in=(
                    ACTIVE_RETURN_STATUSES
                ),
            )
            .aggregate(
                total=Sum("quantity"),
            )
            .get("total")
            or 0
        )

        available_quantity = (
            order_item.quantity
            - already_requested_quantity
        )

        if requested_quantity > available_quantity:
            item_name = (
                order_item.variant_name
                or order_item.product_name
            )

            raise serializers.ValidationError(
                {
                    "items": (
                        f"Only {available_quantity} units of "
                        f"{item_name} are available for return."
                    )
                }
            )

        line_total = (
            order_item.unit_price
            * requested_quantity
        )

        refund_amount += line_total

        prepared_items.append(
            {
                "order_item": order_item,
                "quantity": requested_quantity,
                "unit_price": order_item.unit_price,
                "line_total": line_total,
            }
        )

    return_request = ReturnRequest.objects.create(
        customer=customer,
        order=locked_order,
        reason=reason,
        details=details,
        refund_amount=refund_amount,
    )

    ReturnItem.objects.bulk_create(
        [
            ReturnItem(
                return_request=return_request,
                order_item=item["order_item"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
            )
            for item in prepared_items
        ]
    )

    return return_request


@transaction.atomic
def cancel_return_request(
    *,
    return_request,
):
    locked_return = (
        ReturnRequest.objects
        .select_for_update()
        .get(pk=return_request.pk)
    )

    if not locked_return.can_customer_cancel:
        raise serializers.ValidationError(
            {
                "return_request": (
                    "This return request can no longer "
                    "be cancelled."
                )
            }
        )

    previous_status = locked_return.status

    locked_return.status = (
        ReturnRequest.Status.CANCELLED
    )

    locked_return.cancelled_at = timezone.now()

    locked_return.save(
        update_fields=[
            "status",
            "cancelled_at",
            "updated_at",
        ]
    )

    notify_return_status_change(
        return_request=locked_return,
        previous_status=previous_status,
    )

    return locked_return


@transaction.atomic
def update_return_status(
    *,
    return_request,
    status_value,
    reviewed_by,
    admin_note="",
):
    locked_return = (
        ReturnRequest.objects
        .select_for_update()
        .select_related(
            "order",
            "customer",
        )
        .get(pk=return_request.pk)
    )

    current_status = locked_return.status

    if status_value == current_status:
        return locked_return

    allowed_statuses = (
        ALLOWED_STATUS_TRANSITIONS.get(
            current_status,
            set(),
        )
    )

    if status_value not in allowed_statuses:
        raise serializers.ValidationError(
            {
                "status": (
                    "Return status cannot be changed "
                    f"from {current_status} "
                    f"to {status_value}."
                )
            }
        )

    current_time = timezone.now()

    update_fields = [
        "status",
        "admin_note",
        "updated_at",
    ]

    locked_return.status = status_value
    locked_return.admin_note = admin_note

    if status_value in {
        ReturnRequest.Status.APPROVED,
        ReturnRequest.Status.REJECTED,
    }:
        locked_return.reviewed_by = reviewed_by
        locked_return.reviewed_at = current_time

        update_fields.extend(
            [
                "reviewed_by",
                "reviewed_at",
            ]
        )

    if (
        status_value
        == ReturnRequest.Status.PRODUCT_RECEIVED
    ):
        return_items = list(
            ReturnItem.objects
            .filter(return_request=locked_return)
            .select_related(
                "order_item",
                "order_item__product",
                "order_item__variant",
            )
            .order_by("order_item_id")
        )

        if locked_return.stock_restored_at is None:
            for return_item in return_items:
                order_item = return_item.order_item

                item_name = (
                    order_item.variant_name
                    or order_item.product_name
                )

                stock_arguments = {
                    "quantity_change": (
                        return_item.quantity
                    ),
                    "movement_type": (
                        StockMovement.Type.RETURN_RECEIVED
                    ),
                    "performed_by": reviewed_by,
                    "order": locked_return.order,
                    "return_request": locked_return,
                    "note": (
                        f"Returned stock received for "
                        f"{locked_return.return_number}. "
                        f"Item: {item_name}."
                    ),
                }

                if order_item.variant_id is not None:
                    change_stock(
                        variant=order_item.variant,
                        **stock_arguments,
                    )
                else:
                    change_stock(
                        product=order_item.product,
                        **stock_arguments,
                    )

            locked_return.stock_restored_at = (
                current_time
            )

            update_fields.append(
                "stock_restored_at"
            )

        locked_return.received_at = current_time

        update_fields.append(
            "received_at"
        )

    if status_value == ReturnRequest.Status.REFUNDED:
        locked_return.refunded_at = current_time

        update_fields.append(
            "refunded_at"
        )

    locked_return.save(
        update_fields=list(
            dict.fromkeys(update_fields)
        ),
    )

    if status_value == ReturnRequest.Status.REFUNDED:
        total_refunded = (
            ReturnRequest.objects
            .filter(
                order=locked_return.order,
                status=ReturnRequest.Status.REFUNDED,
            )
            .aggregate(
                total=Sum("refund_amount"),
            )
            .get("total")
            or Decimal("0.00")
        )

        if (
            total_refunded
            >= locked_return.order.total_amount
            and locked_return.order.payment_status
            == Order.PaymentStatus.PAID
        ):
            Order.objects.filter(
                pk=locked_return.order_id,
            ).update(
                payment_status=(
                    Order.PaymentStatus.REFUNDED
                )
            )

    notify_return_status_change(
        return_request=locked_return,
        previous_status=current_status,
    )

    return locked_return