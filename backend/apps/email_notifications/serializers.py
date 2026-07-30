from rest_framework import serializers

from .models import (
    EmailLog,
    EmailNotificationPreference,
)


class EmailLogSerializer(
    serializers.ModelSerializer
):
    email_type_display = serializers.CharField(
        source="get_email_type_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
        allow_null=True,
    )

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
        allow_null=True,
    )

    return_number = serializers.CharField(
        source="return_request.return_number",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = EmailLog

        fields = [
            "id",
            "email_type",
            "email_type_display",
            "status",
            "status_display",
            "recipient",
            "subject",
            "message",
            "html_message",
            "metadata",
            "error_message",
            "username",
            "order_number",
            "return_number",
            "sent_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class EmailNotificationPreferenceSerializer(
    serializers.ModelSerializer
):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    all_enabled = serializers.BooleanField(
        read_only=True,
    )

    enabled_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:
        model = EmailNotificationPreference

        fields = [
            "id",
            "username",
            "email",
            "order_updates",
            "payment_updates",
            "shipment_updates",
            "ticket_updates",
            "return_updates",
            "promotional_emails",
            "all_enabled",
            "enabled_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "all_enabled",
            "enabled_count",
            "created_at",
            "updated_at",
        ]