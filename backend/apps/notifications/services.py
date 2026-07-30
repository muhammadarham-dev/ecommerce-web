from .models import Notification


def create_notification(
    *,
    recipient,
    notification_type,
    title,
    message,
    order=None,
    ticket=None,
):
    if recipient is None:
        return None

    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        order=order,
        ticket=ticket,
    )


def notify_order_status_change(
    *,
    order,
    previous_status,
):
    if previous_status == order.status:
        return None

    return create_notification(
        recipient=order.customer,
        notification_type=(
            Notification.Type.ORDER_STATUS
        ),
        title="Order Status Updated",
        message=(
            f"Your order {order.order_number} "
            f"status changed from "
            f"{previous_status} to {order.status}."
        ),
        order=order,
    )


def notify_payment_status_change(
    *,
    order,
    previous_payment_status,
):
    if previous_payment_status == order.payment_status:
        return None

    return create_notification(
        recipient=order.customer,
        notification_type=(
            Notification.Type.PAYMENT_STATUS
        ),
        title="Payment Status Updated",
        message=(
            f"Payment status for order "
            f"{order.order_number} changed from "
            f"{previous_payment_status} to "
            f"{order.payment_status}."
        ),
        order=order,
    )


def notify_ticket_reply(
    *,
    ticket,
    recipient,
    sender,
):
    return create_notification(
        recipient=recipient,
        notification_type=(
            Notification.Type.TICKET_REPLY
        ),
        title="New Ticket Reply",
        message=(
            f"{sender.get_full_name() or sender.username} "
            f"replied to ticket "
            f"{ticket.ticket_number}."
        ),
        ticket=ticket,
    )


def notify_ticket_status_change(
    *,
    ticket,
    previous_status,
):
    if previous_status == ticket.status:
        return None

    return create_notification(
        recipient=ticket.customer,
        notification_type=(
            Notification.Type.TICKET_STATUS
        ),
        title="Ticket Status Updated",
        message=(
            f"Your ticket {ticket.ticket_number} "
            f"status changed from "
            f"{previous_status} to {ticket.status}."
        ),
        ticket=ticket,
    )


def notify_ticket_assignment(
    *,
    ticket,
    assigned_agent,
):
    return create_notification(
        recipient=assigned_agent,
        notification_type=(
            Notification.Type.TICKET_ASSIGNED
        ),
        title="Ticket Assigned",
        message=(
            f"Ticket {ticket.ticket_number} "
            f"has been assigned to you."
        ),
        ticket=ticket,
    )

def notify_return_status_change(
    *,
    return_request,
    previous_status,
):
    if previous_status == return_request.status:
        return None

    return create_notification(
        recipient=return_request.customer,
        notification_type=(
            Notification.Type.RETURN_STATUS
        ),
        title="Return Request Updated",
        message=(
            f"Your return request "
            f"{return_request.return_number} "
            f"status changed from "
            f"{previous_status} to "
            f"{return_request.status}."
        ),
        order=return_request.order,
    )

def notify_shipment_status_change(
    *,
    shipment,
    previous_status,
):
    if previous_status == shipment.status:
        return None

    return create_notification(
        recipient=shipment.order.customer,
        notification_type=(
            Notification.Type.SHIPMENT_STATUS
        ),
        title="Shipment Status Updated",
        message=(
            f"Your shipment {shipment.shipment_number} "
            f"for order {shipment.order.order_number} "
            f"has changed from {previous_status} "
            f"to {shipment.status}."
        ),
        order=shipment.order,
    )