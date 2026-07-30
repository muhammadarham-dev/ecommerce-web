from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from django.db.models import Model

from .context import (
    get_business_audit_context,
)
from .models import BusinessAuditEvent


SENSITIVE_FIELD_NAMES = {
    "password",
    "token",
    "access",
    "refresh",
    "secret",
    "api_key",
    "otp",
    "pin",
    "cvv",
    "card_number",
}


IGNORED_SNAPSHOT_FIELDS = {
    "created_at",
    "updated_at",
}


def convert_to_json_safe(value):
    if value is None:
        return None

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(
        value,
        (
            datetime,
            date,
            time,
        ),
    ):
        return value.isoformat()

    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, Path):
        return str(value)

    if isinstance(value, Model):
        return value.pk

    if isinstance(value, dict):
        return {
            str(key): convert_to_json_safe(
                item_value
            )
            for key, item_value in value.items()
        }

    if isinstance(
        value,
        (
            list,
            tuple,
            set,
        ),
    ):
        return [
            convert_to_json_safe(item)
            for item in value
        ]

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    return str(value)


def is_sensitive_field(field_name):
    normalized_name = field_name.lower()

    return any(
        sensitive_name in normalized_name
        for sensitive_name
        in SENSITIVE_FIELD_NAMES
    )


def get_model_snapshot(instance):
    snapshot = {}

    for field in instance._meta.concrete_fields:
        field_name = field.name

        if field_name in IGNORED_SNAPSHOT_FIELDS:
            continue

        if is_sensitive_field(field_name):
            snapshot[field_name] = "[REDACTED]"
            continue

        try:
            value = getattr(
                instance,
                field.attname,
            )
        except Exception:
            value = None

        snapshot[field_name] = (
            convert_to_json_safe(value)
        )

    return snapshot


def get_changed_fields(
    before_data,
    after_data,
):
    field_names = set(
        before_data.keys()
    ) | set(
        after_data.keys()
    )

    return sorted(
        field_name
        for field_name in field_names
        if before_data.get(field_name)
        != after_data.get(field_name)
    )


def get_object_reference(instance):
    reference_fields = [
        "order_number",
        "return_number",
        "code",
        "sku",
        "name",
        "title",
        "username",
        "email",
    ]

    for field_name in reference_fields:
        value = getattr(
            instance,
            field_name,
            None,
        )

        if value:
            return str(value)[:255]

    try:
        return str(instance)[:255]
    except Exception:
        return str(instance.pk or "")[:255]


def create_business_audit_event(
    *,
    instance,
    event_type,
    before_data=None,
    after_data=None,
    metadata=None,
    actor=None,
):
    before_snapshot = before_data or {}
    after_snapshot = after_data or {}

    changed_fields = get_changed_fields(
        before_snapshot,
        after_snapshot,
    )

    context = get_business_audit_context()

    context_user = context.get("user")

    event_actor = actor or context_user

    if (
        event_actor
        and not event_actor.is_authenticated
    ):
        event_actor = None

    return BusinessAuditEvent.objects.create(
        request_id=context.get(
            "request_id"
        ),
        actor=event_actor,
        event_type=event_type,
        app_label=(
            instance._meta.app_label
        ),
        model_name=(
            instance._meta.model_name
        ),
        object_id=str(
            instance.pk or ""
        ),
        object_reference=(
            get_object_reference(instance)
        ),
        before_data=before_snapshot,
        after_data=after_snapshot,
        changed_fields=changed_fields,
        metadata=metadata or {},
        method=context.get(
            "method",
            "",
        ),
        path=context.get(
            "path",
            "",
        )[:1000],
        ip_address=context.get(
            "ip_address"
        ),
    )


def capture_previous_snapshot(
    *,
    sender,
    instance,
):
    instance._business_audit_before = {}

    if not instance.pk:
        return

    previous_instance = (
        sender.objects
        .filter(pk=instance.pk)
        .first()
    )

    if previous_instance is None:
        return

    instance._business_audit_before = (
        get_model_snapshot(
            previous_instance
        )
    )