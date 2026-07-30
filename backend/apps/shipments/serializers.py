from rest_framework import serializers

from apps.orders.models import Order

from .models import Shipment, ShipmentEvent


class ShipmentEventSerializer(
    serializers.ModelSerializer
):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = ShipmentEvent

        fields = [
            "id",
            "status",
            "message",
            "location",
            "created_by_username",
            "created_at",
        ]

        read_only_fields = fields


class ShipmentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    customer_username = serializers.CharField(
        source="order.customer.username",
        read_only=True,
    )

    customer_email = serializers.EmailField(
        source="order.customer.email",
        read_only=True,
    )

    events = ShipmentEventSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Shipment

        fields = [
            "id",
            "shipment_number",
            "order_number",
            "customer_username",
            "customer_email",
            "status",
            "courier_name",
            "tracking_number",
            "estimated_delivery_date",
            "shipped_at",
            "delivered_at",
            "events",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class ShipmentCreateSerializer(
    serializers.Serializer
):
    order_id = serializers.PrimaryKeyRelatedField(
        source="order",
        queryset=Order.objects.exclude(
            status__in=[
                Order.Status.DELIVERED,
                Order.Status.CANCELLED,
            ],
        ),
    )

    courier_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )

    tracking_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )

    estimated_delivery_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
    )

    location = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    def validate_order(self, order):
        if hasattr(order, "shipment"):
            raise serializers.ValidationError(
                "A shipment already exists for this order."
            )

        if order.status not in {
            Order.Status.CONFIRMED,
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
        }:
            raise serializers.ValidationError(
                "The order must be confirmed or processing "
                "before a shipment can be created."
            )

        return order

    def validate_tracking_number(self, value):
        normalized_value = value.strip()

        if (
            normalized_value
            and Shipment.objects.filter(
                tracking_number__iexact=normalized_value,
            ).exists()
        ):
            raise serializers.ValidationError(
                "This tracking number is already in use."
            )

        return normalized_value

    def validate_courier_name(self, value):
        return value.strip()


class ShipmentUpdateSerializer(
    serializers.Serializer
):
    status = serializers.ChoiceField(
        choices=Shipment.Status.choices,
        required=False,
    )

    courier_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )

    tracking_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )

    estimated_delivery_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
    )

    location = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    def validate_tracking_number(self, value):
        normalized_value = value.strip()
        shipment = self.context["shipment"]

        queryset = Shipment.objects.filter(
            tracking_number__iexact=normalized_value,
        )

        queryset = queryset.exclude(
            pk=shipment.pk,
        )

        if normalized_value and queryset.exists():
            raise serializers.ValidationError(
                "This tracking number is already in use."
            )

        return normalized_value

    def validate_courier_name(self, value):
        return value.strip()