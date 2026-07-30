from typing import Optional

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema_field,
)
from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(
    serializers.ModelSerializer
):
    action_display = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )

    username = serializers.SerializerMethodField()

    user_email = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = AuditLog

        fields = [
            "id",
            "request_id",
            "user",
            "username",
            "user_email",
            "action",
            "action_display",
            "method",
            "path",
            "route_name",
            "status_code",
            "success",
            "ip_address",
            "user_agent",
            "query_params",
            "request_data",
            "error_message",
            "duration_ms",
            "created_at",
        ]

        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.STR)
    def get_username(
        self,
        audit_log,
    ) -> Optional[str]:
        if audit_log.user is None:
            return None

        return audit_log.user.username

    @extend_schema_field(OpenApiTypes.EMAIL)
    def get_user_email(
        self,
        audit_log,
    ) -> Optional[str]:
        if audit_log.user is None:
            return None

        return audit_log.user.email