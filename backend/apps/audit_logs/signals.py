from django.db.models.signals import (
    post_delete,
    post_save,
    pre_save,
)
from django.dispatch import receiver

from apps.coupons.models import Coupon
from apps.inventory.models import StockMovement
from apps.orders.models import Order
from apps.products.models import Product
from apps.returns.models import ReturnRequest

from .models import BusinessAuditEvent
from .services import (
    capture_previous_snapshot,
    create_business_audit_event,
    get_model_snapshot,
)


@receiver(pre_save, sender=Product)
def capture_product_before_save(
    sender,
    instance,
    **kwargs,
):
    capture_previous_snapshot(
        sender=sender,
        instance=instance,
    )


@receiver(post_save, sender=Product)
def create_product_audit_event(
    sender,
    instance,
    created,
    **kwargs,
):
    after_data = get_model_snapshot(
        instance
    )

    if created:
        event_type = (
            BusinessAuditEvent.Type.PRODUCT_CREATED
        )

        before_data = {}

    else:
        event_type = (
            BusinessAuditEvent.Type.PRODUCT_UPDATED
        )

        before_data = getattr(
            instance,
            "_business_audit_before",
            {},
        )

        if before_data == after_data:
            return

    create_business_audit_event(
        instance=instance,
        event_type=event_type,
        before_data=before_data,
        after_data=after_data,
    )


@receiver(post_delete, sender=Product)
def create_product_delete_event(
    sender,
    instance,
    **kwargs,
):
    create_business_audit_event(
        instance=instance,
        event_type=(
            BusinessAuditEvent.Type.PRODUCT_DELETED
        ),
        before_data=get_model_snapshot(
            instance
        ),
        after_data={},
    )


@receiver(pre_save, sender=Coupon)
def capture_coupon_before_save(
    sender,
    instance,
    **kwargs,
):
    capture_previous_snapshot(
        sender=sender,
        instance=instance,
    )


@receiver(post_save, sender=Coupon)
def create_coupon_audit_event(
    sender,
    instance,
    created,
    **kwargs,
):
    after_data = get_model_snapshot(
        instance
    )

    if created:
        event_type = (
            BusinessAuditEvent.Type.COUPON_CREATED
        )

        before_data = {}

    else:
        event_type = (
            BusinessAuditEvent.Type.COUPON_UPDATED
        )

        before_data = getattr(
            instance,
            "_business_audit_before",
            {},
        )

        if before_data == after_data:
            return

    create_business_audit_event(
        instance=instance,
        event_type=event_type,
        before_data=before_data,
        after_data=after_data,
    )


@receiver(post_delete, sender=Coupon)
def create_coupon_delete_event(
    sender,
    instance,
    **kwargs,
):
    create_business_audit_event(
        instance=instance,
        event_type=(
            BusinessAuditEvent.Type.COUPON_DELETED
        ),
        before_data=get_model_snapshot(
            instance
        ),
        after_data={},
    )


@receiver(post_save, sender=StockMovement)
def create_stock_movement_audit_event(
    sender,
    instance,
    created,
    **kwargs,
):
    if not created:
        return

    metadata = {
        "target_type": (
            instance.target_type
        ),
        "target_name": (
            instance.target_name
        ),
        "target_sku": (
            instance.target_sku
        ),
        "movement_type": (
            instance.movement_type
        ),
        "quantity_change": (
            instance.quantity_change
        ),
        "previous_stock": (
            instance.previous_stock
        ),
        "new_stock": (
            instance.new_stock
        ),
        "order_id": (
            instance.order_id
        ),
        "return_request_id": (
            instance.return_request_id
        ),
    }

    create_business_audit_event(
        instance=instance,
        event_type=(
            BusinessAuditEvent.Type.STOCK_MOVEMENT
        ),
        before_data={
            "stock": instance.previous_stock,
        },
        after_data={
            "stock": instance.new_stock,
        },
        metadata=metadata,
        actor=instance.performed_by,
    )


@receiver(pre_save, sender=ReturnRequest)
def capture_return_before_save(
    sender,
    instance,
    **kwargs,
):
    capture_previous_snapshot(
        sender=sender,
        instance=instance,
    )


@receiver(post_save, sender=ReturnRequest)
def create_return_audit_event(
    sender,
    instance,
    created,
    **kwargs,
):
    after_data = get_model_snapshot(
        instance
    )

    if created:
        create_business_audit_event(
            instance=instance,
            event_type=(
                BusinessAuditEvent.Type.RETURN_CREATED
            ),
            before_data={},
            after_data=after_data,
            metadata={
                "order_number": (
                    instance.order.order_number
                ),
                "refund_amount": str(
                    instance.refund_amount
                ),
            },
        )

        return

    before_data = getattr(
        instance,
        "_business_audit_before",
        {},
    )

    previous_status = before_data.get(
        "status"
    )

    if previous_status == instance.status:
        return

    if (
        instance.status
        == ReturnRequest.Status.REFUNDED
    ):
        event_type = (
            BusinessAuditEvent.Type.REFUND_PROCESSED
        )
    else:
        event_type = (
            BusinessAuditEvent.Type.RETURN_STATUS_CHANGED
        )

    create_business_audit_event(
        instance=instance,
        event_type=event_type,
        before_data=before_data,
        after_data=after_data,
        metadata={
            "order_number": (
                instance.order.order_number
            ),
            "previous_status": (
                previous_status
            ),
            "current_status": (
                instance.status
            ),
            "refund_amount": str(
                instance.refund_amount
            ),
        },
        actor=instance.reviewed_by,
    )


@receiver(pre_save, sender=Order)
def capture_order_before_save(
    sender,
    instance,
    **kwargs,
):
    capture_previous_snapshot(
        sender=sender,
        instance=instance,
    )


@receiver(post_save, sender=Order)
def create_order_payment_audit_event(
    sender,
    instance,
    created,
    **kwargs,
):
    if created:
        return

    before_data = getattr(
        instance,
        "_business_audit_before",
        {},
    )

    previous_payment_status = (
        before_data.get(
            "payment_status"
        )
    )

    if (
        previous_payment_status
        == instance.payment_status
    ):
        return

    after_data = get_model_snapshot(
        instance
    )

    if (
        instance.payment_status
        == Order.PaymentStatus.REFUNDED
    ):
        event_type = (
            BusinessAuditEvent.Type.REFUND_PROCESSED
        )
    else:
        event_type = (
            BusinessAuditEvent.Type.PAYMENT_STATUS_CHANGED
        )

    create_business_audit_event(
        instance=instance,
        event_type=event_type,
        before_data=before_data,
        after_data=after_data,
        metadata={
            "order_number": (
                instance.order_number
            ),
            "previous_payment_status": (
                previous_payment_status
            ),
            "current_payment_status": (
                instance.payment_status
            ),
            "total_amount": str(
                instance.total_amount
            ),
        },
    )