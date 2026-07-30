from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
    serializers.ModelSerializer
):
    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
        allow_null=True,
    )

    ticket_number = serializers.CharField(
        source="ticket.ticket_number",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "order_number",
            "ticket_number",
            "is_read",
            "read_at",
            "created_at",
        ]

        read_only_fields = fields