from typing import Optional

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema_field,
)
from rest_framework import serializers

from .models import LoginAttempt


class LoginAttemptSerializer(
    serializers.ModelSerializer
):
    username = serializers.SerializerMethodField()

    user_email = (
        serializers.SerializerMethodField()
    )

    failure_reason_display = serializers.CharField(
        source="get_failure_reason_display",
        read_only=True,
    )

    class Meta:
        model = LoginAttempt

        fields = [
            "id",
            "user",
            "username",
            "user_email",
            "identifier_hint",
            "ip_address",
            "successful",
            "failure_reason",
            "failure_reason_display",
            "user_agent",
            "created_at",
        ]

        read_only_fields = fields

    @extend_schema_field(OpenApiTypes.STR)
    def get_username(
        self,
        login_attempt,
    ) -> Optional[str]:
        if login_attempt.user is None:
            return None

        return login_attempt.user.username

    @extend_schema_field(OpenApiTypes.EMAIL)
    def get_user_email(
        self,
        login_attempt,
    ) -> Optional[str]:
        if login_attempt.user is None:
            return None

        return login_attempt.user.email