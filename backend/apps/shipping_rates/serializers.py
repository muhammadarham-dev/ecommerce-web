from rest_framework import serializers

from apps.orders.models import Address, Order

from .models import (
    ShippingMethod,
    ShippingRate,
    ShippingZone,
)
from .services import calculate_shipping_quote


class ShippingZoneSerializer(
    serializers.ModelSerializer
):
    zone_level = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = ShippingZone

        fields = [
            "id",
            "name",
            "code",
            "country",
            "province",
            "city",
            "zone_level",
            "priority",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "zone_level",
            "created_at",
            "updated_at",
        ]


class ShippingMethodSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ShippingMethod

        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_default",
            "is_active",
            "display_order",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class PublicShippingMethodSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ShippingMethod

        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_default",
            "display_order",
        ]

        read_only_fields = fields


class ShippingRateSerializer(
    serializers.ModelSerializer
):
    zone_name = serializers.CharField(
        source="zone.name",
        read_only=True,
    )

    zone_code = serializers.CharField(
        source="zone.code",
        read_only=True,
    )

    method_name = serializers.CharField(
        source="method.name",
        read_only=True,
    )

    method_code = serializers.CharField(
        source="method.code",
        read_only=True,
    )

    class Meta:
        model = ShippingRate

        fields = [
            "id",
            "zone",
            "zone_name",
            "zone_code",
            "method",
            "method_name",
            "method_code",
            "charge",
            "free_shipping_threshold",
            "estimated_min_days",
            "estimated_max_days",
            "cod_available",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "zone_name",
            "zone_code",
            "method_name",
            "method_code",
            "created_at",
            "updated_at",
        ]

    def validate(self, attributes):
        minimum_days = attributes.get(
            "estimated_min_days",
            getattr(
                self.instance,
                "estimated_min_days",
                None,
            ),
        )

        maximum_days = attributes.get(
            "estimated_max_days",
            getattr(
                self.instance,
                "estimated_max_days",
                None,
            ),
        )

        if (
            minimum_days is not None
            and maximum_days is not None
            and maximum_days < minimum_days
        ):
            raise serializers.ValidationError(
                {
                    "estimated_max_days": (
                        "Maximum delivery days cannot be "
                        "less than minimum delivery days."
                    )
                }
            )

        return attributes


class ShippingQuoteInputSerializer(
    serializers.Serializer
):
    address_id = serializers.PrimaryKeyRelatedField(
        source="address",
        queryset=Address.objects.none(),
    )

    shipping_method_code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=50,
    )

    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        required=False,
        allow_blank=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            self.fields["address_id"].queryset = (
                Address.objects.filter(
                    user=request.user,
                )
            )

    def create(self, validated_data):
        request = self.context["request"]

        return calculate_shipping_quote(
            customer=request.user,
            address=validated_data["address"],
            method_code=validated_data.get(
                "shipping_method_code",
                "",
            ),
            payment_method=validated_data.get(
                "payment_method",
                "",
            ),
        )