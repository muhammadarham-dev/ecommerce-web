from django.db.models.signals import (
    post_save,
    pre_save,
)
from django.dispatch import receiver

from apps.orders.models import Order
from apps.returns.models import ReturnRequest

from .services import (
    schedule_after_commit,
    send_order_placed_email_by_id,
    send_order_status_email_by_id,
    send_payment_status_email_by_id,
    send_return_status_email_by_id,
)


@receiver(pre_save, sender=Order)
def capture_previous_order_values(
    sender,
    instance,
    **kwargs,
):
    instance._previous_status = None
    instance._previous_payment_status = None

    if not instance.pk:
        return

    previous_order = (
        Order.objects
        .filter(pk=instance.pk)
        .values(
            "status",
            "payment_status",
        )
        .first()
    )

    if previous_order is None:
        return

    instance._previous_status = (
        previous_order["status"]
    )

    instance._previous_payment_status = (
        previous_order["payment_status"]
    )


@receiver(post_save, sender=Order)
def send_order_email_notifications(
    sender,
    instance,
    created,
    **kwargs,
):
    order_id = instance.pk

    if created:
        schedule_after_commit(
            lambda: send_order_placed_email_by_id(
                order_id
            )
        )

        return

    previous_status = getattr(
        instance,
        "_previous_status",
        None,
    )

    previous_payment_status = getattr(
        instance,
        "_previous_payment_status",
        None,
    )

    if (
        previous_status is not None
        and previous_status != instance.status
    ):
        schedule_after_commit(
            lambda: send_order_status_email_by_id(
                order_id,
                previous_status,
            )
        )

    if (
        previous_payment_status is not None
        and previous_payment_status
        != instance.payment_status
    ):
        schedule_after_commit(
            lambda: send_payment_status_email_by_id(
                order_id,
                previous_payment_status,
            )
        )


@receiver(pre_save, sender=ReturnRequest)
def capture_previous_return_status(
    sender,
    instance,
    **kwargs,
):
    instance._previous_status = None

    if not instance.pk:
        return

    previous_return = (
        ReturnRequest.objects
        .filter(pk=instance.pk)
        .values("status")
        .first()
    )

    if previous_return is None:
        return

    instance._previous_status = (
        previous_return["status"]
    )


@receiver(post_save, sender=ReturnRequest)
def send_return_email_notifications(
    sender,
    instance,
    created,
    **kwargs,
):
    return_request_id = instance.pk

    previous_status = getattr(
        instance,
        "_previous_status",
        None,
    )

    if created:
        schedule_after_commit(
            lambda: send_return_status_email_by_id(
                return_request_id,
                None,
            )
        )

        return

    if (
        previous_status is not None
        and previous_status != instance.status
    ):
        schedule_after_commit(
            lambda: send_return_status_email_by_id(
                return_request_id,
                previous_status,
            )
        )