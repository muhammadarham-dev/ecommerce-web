from typing import Optional

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema_field,
)
from rest_framework import serializers

from .models import BusinessAuditEvent


class BusinessAuditEventSerializer(
    serializers.ModelSerializer
):
    event_type_display = serializers.CharField(
        source="get_event_type_display",
        read_only=True,
    )

    actor_username = (
        serializers.SerializerMethodField()
    )

    actor_email = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = BusinessAuditEvent

        fields = [
            "id",
            "request_id",
            "actor",
            "actor_username",
            "actor_email",
            "event_type",
            "event_type_display",
            "app_label",
            "model_name",
            "object_id",
            "object_reference",
            "before_data",
            "after_data",
            "changed_fields",
            "metadata",
            "method",
            "path",
            "ip_address",
            "created_at",
        ]

        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.STR)
    def get_actor_username(
        self,
        business_event,
    ) -> Optional[str]:
        if business_event.actor is None:
            return None

        return business_event.actor.username

    @extend_schema_field(OpenApiTypes.EMAIL)
    def get_actor_email(
        self,
        business_event,
    ) -> Optional[str]:
        if business_event.actor is None:
            return None

        return business_event.actor.email