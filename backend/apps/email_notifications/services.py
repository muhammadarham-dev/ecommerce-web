from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.utils import (
    OperationalError,
    ProgrammingError,
)
from django.utils import timezone

from apps.orders.models import Order
from apps.returns.models import ReturnRequest

from .models import EmailLog


def get_store_identity():
    store_name = "Ecommerce Store"
    support_email = settings.DEFAULT_FROM_EMAIL

    try:
        from apps.store_settings.services import (
            get_store_settings,
        )

        store_settings = get_store_settings()

        if store_settings.store_name:
            store_name = store_settings.store_name

        if store_settings.support_email:
            support_email = (
                store_settings.support_email
            )

    except (
        OperationalError,
        ProgrammingError,
    ):
        pass

    return store_name, support_email


def get_customer_name(user):
    return (
        user.get_full_name()
        or user.username
    )


def send_transactional_email(
    *,
    email_type,
    recipient,
    subject,
    message,
    html_message="",
    user=None,
    order=None,
    return_request=None,
    metadata=None,
):
    normalized_recipient = (
        recipient or ""
    ).strip().lower()

    if not normalized_recipient:
        return None

    email_log = EmailLog.objects.create(
        user=user,
        order=order,
        return_request=return_request,
        email_type=email_type,
        status=EmailLog.Status.PENDING,
        recipient=normalized_recipient,
        subject=subject,
        message=message,
        html_message=html_message,
        metadata=metadata or {},
    )

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[
                normalized_recipient,
            ],
        )

        if html_message:
            email.attach_alternative(
                html_message,
                "text/html",
            )

        email.send(
            fail_silently=False,
        )

        email_log.status = EmailLog.Status.SENT
        email_log.sent_at = timezone.now()
        email_log.error_message = ""

        email_log.save(
            update_fields=[
                "status",
                "sent_at",
                "error_message",
                "updated_at",
            ]
        )

    except Exception as error:
        email_log.status = EmailLog.Status.FAILED

        email_log.error_message = str(
            error
        )[:5000]

        email_log.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

    return email_log


def send_order_placed_email(*, order):
    customer = order.customer
    recipient = customer.email

    if not recipient:
        return None

    store_name, support_email = (
        get_store_identity()
    )

    customer_name = get_customer_name(
        customer
    )

    subject = (
        f"Order received - "
        f"{order.order_number}"
    )

    message = (
        f"Hello {customer_name},\n\n"
        f"Thank you for shopping with {store_name}.\n\n"
        f"Your order has been received successfully.\n\n"
        f"Order number: {order.order_number}\n"
        f"Order status: {order.get_status_display()}\n"
        f"Payment method: "
        f"{order.get_payment_method_display()}\n"
        f"Payment status: "
        f"{order.get_payment_status_display()}\n"
        f"Subtotal: {order.subtotal}\n"
        f"Shipping fee: {order.shipping_fee}\n"
        f"Discount: {order.discount_amount}\n"
        f"Total amount: {order.total_amount}\n\n"
        f"Delivery address:\n"
        f"{order.address_line_1}\n"
        f"{order.city}, {order.province}\n"
        f"{order.country}\n\n"
        f"Support: {support_email}"
    )

    html_message = f"""
    <h2>Order Received</h2>
    <p>Hello {customer_name},</p>

    <p>
        Thank you for shopping with
        <strong>{store_name}</strong>.
    </p>

    <p>
        Your order has been received successfully.
    </p>

    <table cellpadding="6">
        <tr>
            <td><strong>Order number</strong></td>
            <td>{order.order_number}</td>
        </tr>
        <tr>
            <td><strong>Status</strong></td>
            <td>{order.get_status_display()}</td>
        </tr>
        <tr>
            <td><strong>Payment method</strong></td>
            <td>{order.get_payment_method_display()}</td>
        </tr>
        <tr>
            <td><strong>Total</strong></td>
            <td>{order.total_amount}</td>
        </tr>
    </table>

    <p>
        Support:
        {support_email}
    </p>
    """

    return send_transactional_email(
        email_type=(
            EmailLog.Type.ORDER_PLACED
        ),
        recipient=recipient,
        subject=subject,
        message=message,
        html_message=html_message,
        user=customer,
        order=order,
        metadata={
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": (
                order.payment_status
            ),
            "total_amount": str(
                order.total_amount
            ),
        },
    )


def send_order_status_email(
    *,
    order,
    previous_status,
):
    customer = order.customer
    recipient = customer.email

    if not recipient:
        return None

    store_name, support_email = (
        get_store_identity()
    )

    customer_name = get_customer_name(
        customer
    )

    previous_status_label = dict(
        Order.Status.choices
    ).get(
        previous_status,
        previous_status or "Not Available",
    )

    current_status_label = (
        order.get_status_display()
    )

    subject = (
        f"Order status updated - "
        f"{order.order_number}"
    )

    message = (
        f"Hello {customer_name},\n\n"
        f"Your {store_name} order status "
        f"has been updated.\n\n"
        f"Order number: {order.order_number}\n"
        f"Previous status: "
        f"{previous_status_label}\n"
        f"Current status: "
        f"{current_status_label}\n\n"
        f"Support: {support_email}"
    )

    if order.status == Order.Status.SHIPPED:
        message += (
            "\n\nYour order has been shipped "
            "and is on its way."
        )

    if order.status == Order.Status.DELIVERED:
        message += (
            "\n\nYour order has been marked "
            "as delivered."
        )

    if order.status == Order.Status.CANCELLED:
        message += (
            "\n\nYour order has been cancelled."
        )

    html_message = f"""
    <h2>Order Status Updated</h2>

    <p>Hello {customer_name},</p>

    <p>
        Your order
        <strong>{order.order_number}</strong>
        has been updated.
    </p>

    <p>
        Previous status:
        <strong>{previous_status_label}</strong>
    </p>

    <p>
        Current status:
        <strong>{current_status_label}</strong>
    </p>

    <p>
        Support:
        {support_email}
    </p>
    """

    return send_transactional_email(
        email_type=(
            EmailLog.Type.ORDER_STATUS_CHANGED
        ),
        recipient=recipient,
        subject=subject,
        message=message,
        html_message=html_message,
        user=customer,
        order=order,
        metadata={
            "order_number": order.order_number,
            "previous_status": previous_status,
            "current_status": order.status,
        },
    )


def send_payment_status_email(
    *,
    order,
    previous_payment_status,
):
    customer = order.customer
    recipient = customer.email

    if not recipient:
        return None

    store_name, support_email = (
        get_store_identity()
    )

    customer_name = get_customer_name(
        customer
    )

    previous_status_label = dict(
        Order.PaymentStatus.choices
    ).get(
        previous_payment_status,
        previous_payment_status
        or "Not Available",
    )

    current_status_label = (
        order.get_payment_status_display()
    )

    subject = (
        f"Payment status updated - "
        f"{order.order_number}"
    )

    message = (
        f"Hello {customer_name},\n\n"
        f"The payment status for your "
        f"{store_name} order has changed.\n\n"
        f"Order number: {order.order_number}\n"
        f"Previous payment status: "
        f"{previous_status_label}\n"
        f"Current payment status: "
        f"{current_status_label}\n"
        f"Order total: {order.total_amount}\n\n"
        f"Support: {support_email}"
    )

    html_message = f"""
    <h2>Payment Status Updated</h2>

    <p>Hello {customer_name},</p>

    <p>
        Order:
        <strong>{order.order_number}</strong>
    </p>

    <p>
        Previous payment status:
        <strong>{previous_status_label}</strong>
    </p>

    <p>
        Current payment status:
        <strong>{current_status_label}</strong>
    </p>

    <p>
        Total:
        <strong>{order.total_amount}</strong>
    </p>

    <p>
        Support:
        {support_email}
    </p>
    """

    return send_transactional_email(
        email_type=(
            EmailLog.Type.PAYMENT_STATUS_CHANGED
        ),
        recipient=recipient,
        subject=subject,
        message=message,
        html_message=html_message,
        user=customer,
        order=order,
        metadata={
            "order_number": order.order_number,
            "previous_payment_status": (
                previous_payment_status
            ),
            "current_payment_status": (
                order.payment_status
            ),
        },
    )


def send_return_status_email(
    *,
    return_request,
    previous_status=None,
):
    customer = return_request.customer
    recipient = customer.email

    if not recipient:
        return None

    store_name, support_email = (
        get_store_identity()
    )

    customer_name = get_customer_name(
        customer
    )

    previous_status_label = dict(
        ReturnRequest.Status.choices
    ).get(
        previous_status,
        previous_status or "New Request",
    )

    current_status_label = (
        return_request.get_status_display()
    )

    subject = (
        f"Return request updated - "
        f"{return_request.return_number}"
    )

    message = (
        f"Hello {customer_name},\n\n"
        f"Your return request with "
        f"{store_name} has been updated.\n\n"
        f"Return number: "
        f"{return_request.return_number}\n"
        f"Order number: "
        f"{return_request.order.order_number}\n"
        f"Previous status: "
        f"{previous_status_label}\n"
        f"Current status: "
        f"{current_status_label}\n"
        f"Refund amount: "
        f"{return_request.refund_amount}\n\n"
        f"Support: {support_email}"
    )

    html_message = f"""
    <h2>Return Request Updated</h2>

    <p>Hello {customer_name},</p>

    <p>
        Return number:
        <strong>
            {return_request.return_number}
        </strong>
    </p>

    <p>
        Order number:
        <strong>
            {return_request.order.order_number}
        </strong>
    </p>

    <p>
        Previous status:
        <strong>{previous_status_label}</strong>
    </p>

    <p>
        Current status:
        <strong>{current_status_label}</strong>
    </p>

    <p>
        Refund amount:
        <strong>
            {return_request.refund_amount}
        </strong>
    </p>

    <p>
        Support:
        {support_email}
    </p>
    """

    return send_transactional_email(
        email_type=(
            EmailLog.Type.RETURN_STATUS_CHANGED
        ),
        recipient=recipient,
        subject=subject,
        message=message,
        html_message=html_message,
        user=customer,
        order=return_request.order,
        return_request=return_request,
        metadata={
            "return_number": (
                return_request.return_number
            ),
            "order_number": (
                return_request.order.order_number
            ),
            "previous_status": previous_status,
            "current_status": (
                return_request.status
            ),
            "refund_amount": str(
                return_request.refund_amount
            ),
        },
    )


def send_order_placed_email_by_id(order_id):
    order = (
        Order.objects
        .select_related("customer")
        .filter(pk=order_id)
        .first()
    )

    if order is None:
        return None

    return send_order_placed_email(
        order=order,
    )


def send_order_status_email_by_id(
    order_id,
    previous_status,
):
    order = (
        Order.objects
        .select_related("customer")
        .filter(pk=order_id)
        .first()
    )

    if order is None:
        return None

    return send_order_status_email(
        order=order,
        previous_status=previous_status,
    )


def send_payment_status_email_by_id(
    order_id,
    previous_payment_status,
):
    order = (
        Order.objects
        .select_related("customer")
        .filter(pk=order_id)
        .first()
    )

    if order is None:
        return None

    return send_payment_status_email(
        order=order,
        previous_payment_status=(
            previous_payment_status
        ),
    )


def send_return_status_email_by_id(
    return_request_id,
    previous_status=None,
):
    return_request = (
        ReturnRequest.objects
        .select_related(
            "customer",
            "order",
        )
        .filter(pk=return_request_id)
        .first()
    )

    if return_request is None:
        return None

    return send_return_status_email(
        return_request=return_request,
        previous_status=previous_status,
    )


def schedule_after_commit(callback):
    transaction.on_commit(callback)