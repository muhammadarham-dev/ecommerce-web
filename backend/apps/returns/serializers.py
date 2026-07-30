from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.orders.models import Order
from apps.store_settings.services import (
    get_return_window_days,
)

from .models import ReturnItem, ReturnRequest
from .services import create_return_request


class ReturnItemSerializer(
    serializers.ModelSerializer
):
    order_item_id = serializers.IntegerField(
        source="order_item.id",
        read_only=True,
    )

    product_id = serializers.IntegerField(
        source="order_item.product_id",
        read_only=True,
    )

    product_name = serializers.CharField(
        source="order_item.product_name",
        read_only=True,
    )

    product_sku = serializers.CharField(
        source="order_item.product_sku",
        read_only=True,
    )

    variant_id = serializers.IntegerField(
        source="order_item.variant_id",
        read_only=True,
        allow_null=True,
    )

    variant_name = serializers.CharField(
        source="order_item.variant_name",
        read_only=True,
    )

    variant_sku = serializers.CharField(
        source="order_item.variant_sku",
        read_only=True,
    )

    variant_options = serializers.JSONField(
        source="order_item.variant_options",
        read_only=True,
    )

    class Meta:
        model = ReturnItem

        fields = [
            "id",
            "order_item_id",
            "product_id",
            "product_name",
            "product_sku",
            "variant_id",
            "variant_name",
            "variant_sku",
            "variant_options",
            "quantity",
            "unit_price",
            "line_total",
            "created_at",
        ]

        read_only_fields = fields


class ReturnRequestSerializer(
    serializers.ModelSerializer
):
    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True,
    )

    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        allow_null=True,
    )

    items = ReturnItemSerializer(
        many=True,
        read_only=True,
    )

    can_customer_cancel = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = ReturnRequest

        fields = [
            "id",
            "return_number",
            "order_number",
            "customer_username",
            "status",
            "reason",
            "details",
            "refund_amount",
            "admin_note",
            "reviewed_by_username",
            "can_customer_cancel",
            "items",
            "created_at",
            "updated_at",
            "reviewed_at",
            "received_at",
            "refunded_at",
            "cancelled_at",
        ]

        read_only_fields = fields


class ReturnItemInputSerializer(
    serializers.Serializer
):
    order_item_id = serializers.IntegerField(
        min_value=1,
    )

    quantity = serializers.IntegerField(
        min_value=1,
    )


class ReturnCreateSerializer(
    serializers.Serializer
):
    order_id = serializers.PrimaryKeyRelatedField(
        source="order",
        queryset=Order.objects.none(),
    )

    reason = serializers.ChoiceField(
        choices=ReturnRequest.Reason.choices,
    )

    details = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )

    items = ReturnItemInputSerializer(
        many=True,
        allow_empty=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
        ):
            self.fields[
                "order_id"
            ].queryset = Order.objects.filter(
                customer=request.user,
                status=Order.Status.DELIVERED,
            )

    def validate(self, attributes):
        order = attributes["order"]
        items = attributes["items"]

        item_ids = [
            item["order_item_id"]
            for item in items
        ]

        if len(item_ids) != len(set(item_ids)):
            raise serializers.ValidationError(
                {
                    "items": (
                        "The same order item cannot "
                        "be included more than once."
                    )
                }
            )

        if order.delivered_at is None:
            raise serializers.ValidationError(
                {
                    "order_id": (
                        "The delivery date for this "
                        "order is unavailable."
                    )
                }
            )

        return_window_days = (
            get_return_window_days()
        )

        return_deadline = (
            order.delivered_at
            + timedelta(
                days=return_window_days
            )
        )

        if timezone.now() > return_deadline:
            raise serializers.ValidationError(
                {
                    "order_id": (
                        f"The {return_window_days}-day "
                        "return period has expired."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        request = self.context["request"]
        items = validated_data.pop("items")

        return create_return_request(
            customer=request.user,
            items=items,
            **validated_data,
        )


class ReturnStatusUpdateSerializer(
    serializers.Serializer
):
    status = serializers.ChoiceField(
        choices=ReturnRequest.Status.choices,
    )

    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )