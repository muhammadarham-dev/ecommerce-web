from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.notifications.services import (
    notify_payment_status_change,
)
from apps.orders.models import Order

from .models import Payment


def ensure_payment_record(*, order):
    payment_status = order.payment_status

    valid_statuses = {
        Payment.Status.PENDING,
        Payment.Status.PAID,
        Payment.Status.FAILED,
        Payment.Status.REFUNDED,
    }

    if payment_status not in valid_statuses:
        payment_status = Payment.Status.PENDING

    payment, created = Payment.objects.get_or_create(
        order=order,
        defaults={
            "customer": order.customer,
            "method": order.payment_method,
            "status": payment_status,
            "amount": order.total_amount,
        },
    )

    return payment


@transaction.atomic
def submit_bank_transfer(
    *,
    payment,
    customer,
    transaction_reference,
    proof,
):
    locked_payment = (
        Payment.objects
        .select_for_update()
        .select_related(
            "order",
            "customer",
        )
        .get(pk=payment.pk)
    )

    if locked_payment.customer_id != customer.id:
        raise serializers.ValidationError(
            {
                "payment": (
                    "This payment does not belong to you."
                )
            }
        )

    if (
        locked_payment.method
        != Order.PaymentMethod.BANK_TRANSFER
    ):
        raise serializers.ValidationError(
            {
                "payment": (
                    "Payment proof can only be submitted "
                    "for bank transfer orders."
                )
            }
        )

    if locked_payment.order.status == Order.Status.CANCELLED:
        raise serializers.ValidationError(
            {
                "payment": (
                    "Payment cannot be submitted "
                    "for a cancelled order."
                )
            }
        )

    allowed_statuses = {
        Payment.Status.PENDING,
        Payment.Status.FAILED,
    }

    if locked_payment.status not in allowed_statuses:
        raise serializers.ValidationError(
            {
                "payment": (
                    "This payment proof cannot be submitted "
                    "in the current payment status."
                )
            }
        )

    previous_payment_status = (
        locked_payment.order.payment_status
    )

    locked_payment.status = Payment.Status.SUBMITTED
    locked_payment.transaction_reference = (
        transaction_reference
    )
    locked_payment.proof = proof
    locked_payment.rejection_reason = ""
    locked_payment.submitted_at = timezone.now()
    locked_payment.rejected_at = None

    locked_payment.save(
        update_fields=[
            "status",
            "transaction_reference",
            "proof",
            "rejection_reason",
            "submitted_at",
            "rejected_at",
            "updated_at",
        ]
    )

    if (
        locked_payment.order.payment_status
        == Order.PaymentStatus.FAILED
    ):
        locked_payment.order.payment_status = (
            Order.PaymentStatus.PENDING
        )

        locked_payment.order.save(
            update_fields=[
                "payment_status",
                "updated_at",
            ]
        )

        notify_payment_status_change(
            order=locked_payment.order,
            previous_payment_status=(
                previous_payment_status
            ),
        )

    return locked_payment


@transaction.atomic
def verify_payment(
    *,
    payment,
    verified_by,
):
    locked_payment = (
        Payment.objects
        .select_for_update()
        .select_related("order")
        .get(pk=payment.pk)
    )

    if locked_payment.status != Payment.Status.SUBMITTED:
        raise serializers.ValidationError(
            {
                "payment": (
                    "Only a submitted payment can be verified."
                )
            }
        )

    previous_payment_status = (
        locked_payment.order.payment_status
    )

    current_time = timezone.now()

    locked_payment.status = Payment.Status.PAID
    locked_payment.verified_by = verified_by
    locked_payment.verified_at = current_time
    locked_payment.rejection_reason = ""
    locked_payment.rejected_at = None

    locked_payment.save(
        update_fields=[
            "status",
            "verified_by",
            "verified_at",
            "rejection_reason",
            "rejected_at",
            "updated_at",
        ]
    )

    locked_payment.order.payment_status = (
        Order.PaymentStatus.PAID
    )

    locked_payment.order.save(
        update_fields=[
            "payment_status",
            "updated_at",
        ]
    )

    notify_payment_status_change(
        order=locked_payment.order,
        previous_payment_status=previous_payment_status,
    )

    return locked_payment


@transaction.atomic
def reject_payment(
    *,
    payment,
    verified_by,
    rejection_reason,
):
    locked_payment = (
        Payment.objects
        .select_for_update()
        .select_related("order")
        .get(pk=payment.pk)
    )

    if locked_payment.status != Payment.Status.SUBMITTED:
        raise serializers.ValidationError(
            {
                "payment": (
                    "Only a submitted payment can be rejected."
                )
            }
        )

    previous_payment_status = (
        locked_payment.order.payment_status
    )

    current_time = timezone.now()

    locked_payment.status = Payment.Status.FAILED
    locked_payment.verified_by = verified_by
    locked_payment.rejection_reason = rejection_reason
    locked_payment.rejected_at = current_time
    locked_payment.verified_at = None

    locked_payment.save(
        update_fields=[
            "status",
            "verified_by",
            "rejection_reason",
            "rejected_at",
            "verified_at",
            "updated_at",
        ]
    )

    locked_payment.order.payment_status = (
        Order.PaymentStatus.FAILED
    )

    locked_payment.order.save(
        update_fields=[
            "payment_status",
            "updated_at",
        ]
    )

    notify_payment_status_change(
        order=locked_payment.order,
        previous_payment_status=previous_payment_status,
    )

    return locked_payment


@transaction.atomic
def refund_payment(
    *,
    payment,
    verified_by,
):
    locked_payment = (
        Payment.objects
        .select_for_update()
        .select_related("order")
        .get(pk=payment.pk)
    )

    if locked_payment.status != Payment.Status.PAID:
        raise serializers.ValidationError(
            {
                "payment": (
                    "Only a paid payment can be refunded."
                )
            }
        )

    previous_payment_status = (
        locked_payment.order.payment_status
    )

    locked_payment.status = Payment.Status.REFUNDED
    locked_payment.verified_by = verified_by
    locked_payment.refunded_at = timezone.now()

    locked_payment.save(
        update_fields=[
            "status",
            "verified_by",
            "refunded_at",
            "updated_at",
        ]
    )

    locked_payment.order.payment_status = (
        Order.PaymentStatus.REFUNDED
    )

    locked_payment.order.save(
        update_fields=[
            "payment_status",
            "updated_at",
        ]
    )

    notify_payment_status_change(
        order=locked_payment.order,
        previous_payment_status=previous_payment_status,
    )

    return locked_payment


@transaction.atomic
def sync_payment_status_from_order(*, order):
    payment = (
        Payment.objects
        .select_for_update()
        .filter(order=order)
        .first()
    )

    if payment is None:
        return None

    valid_statuses = {
        Order.PaymentStatus.PENDING,
        Order.PaymentStatus.PAID,
        Order.PaymentStatus.FAILED,
        Order.PaymentStatus.REFUNDED,
    }

    if order.payment_status not in valid_statuses:
        return payment

    payment.status = order.payment_status

    update_fields = [
        "status",
        "updated_at",
    ]

    current_time = timezone.now()

    if (
        payment.status == Payment.Status.PAID
        and payment.verified_at is None
    ):
        payment.verified_at = current_time
        update_fields.append("verified_at")

    if (
        payment.status == Payment.Status.FAILED
        and payment.rejected_at is None
    ):
        payment.rejected_at = current_time
        update_fields.append("rejected_at")

    if (
        payment.status == Payment.Status.REFUNDED
        and payment.refunded_at is None
    ):
        payment.refunded_at = current_time
        update_fields.append("refunded_at")

    payment.save(
        update_fields=list(
            dict.fromkeys(update_fields)
        ),
    )

    return payment