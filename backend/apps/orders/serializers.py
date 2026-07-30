from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.store_settings.services import (
    validate_payment_method_enabled,
)

from .models import Address, Order, OrderItem


User = get_user_model()


class AddressSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Address

        fields = [
            "id",
            "recipient_name",
            "phone_number",
            "address_line_1",
            "address_line_2",
            "city",
            "province",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        request = self.context["request"]

        if validated_data.get("is_default"):
            Address.objects.filter(
                user=request.user,
                is_default=True,
            ).update(
                is_default=False,
            )

        return Address.objects.create(
            user=request.user,
            **validated_data,
        )

    def update(
        self,
        instance,
        validated_data,
    ):
        request = self.context["request"]

        if validated_data.get("is_default"):
            Address.objects.filter(
                user=request.user,
                is_default=True,
            ).exclude(
                pk=instance.pk,
            ).update(
                is_default=False,
            )

        return super().update(
            instance,
            validated_data,
        )


class OrderCustomerSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "full_name",
        ]

        read_only_fields = fields

    def get_full_name(self, user):
        return (
            user.get_full_name()
            or user.username
        )


class OrderItemSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = OrderItem

        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "variant",
            "variant_name",
            "variant_sku",
            "variant_options",
            "unit_price",
            "quantity",
            "line_total",
            "created_at",
        ]

        read_only_fields = fields


class OrderSerializer(
    serializers.ModelSerializer
):
    customer = OrderCustomerSerializer(
        read_only=True,
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    can_cancel = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Order

        fields = [
            "id",
            "order_number",
            "customer",
            "status",
            "payment_method",
            "payment_status",
            "shipping_zone_name",
            "shipping_zone_code",
            "shipping_method_name",
            "shipping_method_code",
            "free_shipping_applied",
            "estimated_delivery_min_days",
            "estimated_delivery_max_days",
            "estimated_delivery_start",
            "estimated_delivery_end",
            "recipient_name",
            "recipient_phone",
            "address_line_1",
            "address_line_2",
            "city",
            "province",
            "postal_code",
            "country",
            "subtotal",
            "shipping_fee",
            "coupon_code",
            "discount_amount",
            "total_amount",
            "notes",
            "can_cancel",
            "items",
            "confirmed_at",
            "shipped_at",
            "delivered_at",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class OrderManagementSerializer(
    serializers.ModelSerializer
):
    customer = OrderCustomerSerializer(
        read_only=True,
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order

        fields = [
            "id",
            "order_number",
            "customer",
            "status",
            "payment_method",
            "payment_status",
            "shipping_zone",
            "shipping_method",
            "shipping_zone_name",
            "shipping_zone_code",
            "shipping_method_name",
            "shipping_method_code",
            "free_shipping_applied",
            "estimated_delivery_min_days",
            "estimated_delivery_max_days",
            "estimated_delivery_start",
            "estimated_delivery_end",
            "recipient_name",
            "recipient_phone",
            "address_line_1",
            "address_line_2",
            "city",
            "province",
            "postal_code",
            "country",
            "subtotal",
            "shipping_fee",
            "coupon_code",
            "discount_amount",
            "total_amount",
            "notes",
            "items",
            "confirmed_at",
            "shipped_at",
            "delivered_at",
            "cancelled_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class CheckoutSerializer(
    serializers.Serializer
):
    address_id = serializers.PrimaryKeyRelatedField(
        source="address",
        queryset=Address.objects.none(),
    )

    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        default=(
            Order.PaymentMethod.CASH_ON_DELIVERY
        ),
    )

    shipping_method_code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    coupon_code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if (
            request
            and request.user.is_authenticated
        ):
            self.fields[
                "address_id"
            ].queryset = Address.objects.filter(
                user=request.user,
            )

    def validate_payment_method(
        self,
        value,
    ):
        return validate_payment_method_enabled(
            value
        )

    def validate_shipping_method_code(
        self,
        value,
    ):
        return value.strip().upper()

    def validate_coupon_code(
        self,
        value,
    ):
        return value.strip().upper()


class OrderStatusUpdateSerializer(
    serializers.Serializer
):
    status = serializers.ChoiceField(
        choices=Order.Status.choices,
        required=False,
    )

    payment_status = serializers.ChoiceField(
        choices=Order.PaymentStatus.choices,
        required=False,
    )

    def validate(self, attributes):
        if not attributes:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "At least one of status or "
                        "payment_status is required."
                    )
                }
            )

        return attributes


OrderManagementUpdateSerializer = (
    OrderStatusUpdateSerializer
)