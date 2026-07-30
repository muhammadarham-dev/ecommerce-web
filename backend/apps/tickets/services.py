from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.notifications.services import (
    notify_ticket_assignment,
    notify_ticket_reply,
    notify_ticket_status_change,
)

from .models import (
    Ticket,
    TicketAttachment,
    TicketMessage,
)


ALLOWED_STATUS_TRANSITIONS = {
    Ticket.Status.OPEN: {
        Ticket.Status.ASSIGNED,
        Ticket.Status.IN_PROGRESS,
        Ticket.Status.CLOSED,
    },
    Ticket.Status.ASSIGNED: {
        Ticket.Status.IN_PROGRESS,
        Ticket.Status.WAITING_FOR_CUSTOMER,
        Ticket.Status.RESOLVED,
        Ticket.Status.CLOSED,
    },
    Ticket.Status.IN_PROGRESS: {
        Ticket.Status.WAITING_FOR_CUSTOMER,
        Ticket.Status.RESOLVED,
        Ticket.Status.CLOSED,
    },
    Ticket.Status.WAITING_FOR_CUSTOMER: {
        Ticket.Status.IN_PROGRESS,
        Ticket.Status.RESOLVED,
        Ticket.Status.CLOSED,
    },
    Ticket.Status.RESOLVED: {
        Ticket.Status.IN_PROGRESS,
        Ticket.Status.CLOSED,
    },
    Ticket.Status.CLOSED: set(),
}


def create_message_attachments(
    *,
    message,
    attachments,
):
    for attachment in attachments:
        TicketAttachment.objects.create(
            message=message,
            file=attachment,
            original_name=attachment.name,
        )


@transaction.atomic
def add_ticket_message(
    *,
    ticket,
    sender,
    body,
    attachments=None,
    is_internal_note=False,
):
    attachments = attachments or []

    locked_ticket = (
        Ticket.objects
        .select_for_update()
        .get(pk=ticket.pk)
    )

    if locked_ticket.status == Ticket.Status.CLOSED:
        raise serializers.ValidationError(
            {
                "ticket": (
                    "Messages cannot be added to a closed ticket."
                )
            }
        )

    is_staff_user = (
        sender.is_superuser
        or sender.role
        in {
            sender.Role.ADMIN,
            sender.Role.SUPPORT_AGENT,
        }
    )

    if is_internal_note and not is_staff_user:
        raise serializers.ValidationError(
            {
                "is_internal_note": (
                    "Only support staff can create internal notes."
                )
            }
        )

    if (
        sender.role == sender.Role.CUSTOMER
        and locked_ticket.customer_id != sender.id
    ):
        raise serializers.ValidationError(
            {
                "ticket": (
                    "You cannot reply to another customer's ticket."
                )
            }
        )

    message = TicketMessage.objects.create(
        ticket=locked_ticket,
        sender=sender,
        body=body,
        is_internal_note=is_internal_note,
    )

    create_message_attachments(
        message=message,
        attachments=attachments,
    )

    update_fields = [
        "updated_at",
    ]

    if not is_internal_note:
        if (
            sender.role == sender.Role.CUSTOMER
            and locked_ticket.status
            in {
                Ticket.Status.WAITING_FOR_CUSTOMER,
                Ticket.Status.RESOLVED,
            }
        ):
            locked_ticket.status = Ticket.Status.IN_PROGRESS
            locked_ticket.resolved_at = None

            update_fields.extend(
                [
                    "status",
                    "resolved_at",
                ]
            )

        elif (
            is_staff_user
            and locked_ticket.status
            in {
                Ticket.Status.OPEN,
                Ticket.Status.ASSIGNED,
            }
        ):
            locked_ticket.status = Ticket.Status.IN_PROGRESS
            update_fields.append("status")

    locked_ticket.save(
        update_fields=list(set(update_fields)),
    )

    if not is_internal_note:
        if is_staff_user:
            notify_ticket_reply(
                ticket=locked_ticket,
                recipient=locked_ticket.customer,
                sender=sender,
            )

        elif locked_ticket.assigned_agent is not None:
            notify_ticket_reply(
                ticket=locked_ticket,
                recipient=locked_ticket.assigned_agent,
                sender=sender,
            )

    return locked_ticket


@transaction.atomic
def assign_ticket(
    *,
    ticket,
    assigned_agent,
    assigned_by=None,
):
    locked_ticket = (
        Ticket.objects
        .select_for_update()
        .get(pk=ticket.pk)
    )

    if locked_ticket.status == Ticket.Status.CLOSED:
        raise serializers.ValidationError(
            {
                "ticket": (
                    "A closed ticket cannot be assigned."
                )
            }
        )

    allowed_roles = {
        assigned_agent.Role.ADMIN,
        assigned_agent.Role.SUPPORT_AGENT,
    }

    if (
        not assigned_agent.is_superuser
        and assigned_agent.role not in allowed_roles
    ):
        raise serializers.ValidationError(
            {
                "assigned_agent_id": (
                    "The selected user is not a support agent."
                )
            }
        )

    previous_agent_id = locked_ticket.assigned_agent_id

    locked_ticket.assigned_agent = assigned_agent

    update_fields = [
        "assigned_agent",
        "updated_at",
    ]

    if locked_ticket.status == Ticket.Status.OPEN:
        locked_ticket.status = Ticket.Status.ASSIGNED
        update_fields.append("status")

    locked_ticket.save(
        update_fields=update_fields,
    )

    assignment_changed = (
        previous_agent_id != assigned_agent.id
    )

    assigned_to_another_user = (
        assigned_by is None
        or assigned_by.id != assigned_agent.id
    )

    if assignment_changed and assigned_to_another_user:
        notify_ticket_assignment(
            ticket=locked_ticket,
            assigned_agent=assigned_agent,
        )

    return locked_ticket


@transaction.atomic
def update_ticket_status(
    *,
    ticket,
    status_value,
):
    locked_ticket = (
        Ticket.objects
        .select_for_update()
        .get(pk=ticket.pk)
    )

    current_status = locked_ticket.status

    if status_value == current_status:
        return locked_ticket

    allowed_statuses = ALLOWED_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if status_value not in allowed_statuses:
        raise serializers.ValidationError(
            {
                "status": (
                    f"Ticket status cannot be changed "
                    f"from {current_status} to {status_value}."
                )
            }
        )

    active_statuses = {
        Ticket.Status.ASSIGNED,
        Ticket.Status.IN_PROGRESS,
        Ticket.Status.WAITING_FOR_CUSTOMER,
        Ticket.Status.RESOLVED,
    }

    if (
        status_value in active_statuses
        and locked_ticket.assigned_agent is None
    ):
        raise serializers.ValidationError(
            {
                "assigned_agent": (
                    "Assign this ticket to an agent first."
                )
            }
        )

    current_time = timezone.now()

    update_fields = [
        "status",
        "updated_at",
    ]

    locked_ticket.status = status_value

    if status_value == Ticket.Status.RESOLVED:
        locked_ticket.resolved_at = current_time
        update_fields.append("resolved_at")

    elif current_status == Ticket.Status.RESOLVED:
        locked_ticket.resolved_at = None
        update_fields.append("resolved_at")

    if status_value == Ticket.Status.CLOSED:
        locked_ticket.closed_at = current_time
        update_fields.append("closed_at")

    elif current_status == Ticket.Status.CLOSED:
        locked_ticket.closed_at = None
        update_fields.append("closed_at")

    locked_ticket.save(
        update_fields=list(set(update_fields)),
    )

    notify_ticket_status_change(
        ticket=locked_ticket,
        previous_status=current_status,
    )

    return locked_ticket


@transaction.atomic
def close_ticket_by_customer(*, ticket):
    locked_ticket = (
        Ticket.objects
        .select_for_update()
        .get(pk=ticket.pk)
    )

    if locked_ticket.status != Ticket.Status.RESOLVED:
        raise serializers.ValidationError(
            {
                "ticket": (
                    "Only a resolved ticket can be closed "
                    "by the customer."
                )
            }
        )

    locked_ticket.status = Ticket.Status.CLOSED
    locked_ticket.closed_at = timezone.now()

    locked_ticket.save(
        update_fields=[
            "status",
            "closed_at",
            "updated_at",
        ]
    )

    return locked_ticket