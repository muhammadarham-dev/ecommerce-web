from rest_framework import serializers

from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    current_usage_count = serializers.SerializerMethodField()
    is_currently_valid = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Coupon

        fields = [
            "id",
            "code",
            "name",
            "description",
            "discount_type",
            "value",
            "minimum_order_amount",
            "maximum_discount_amount",
            "total_usage_limit",
            "per_customer_limit",
            "starts_at",
            "expires_at",
            "is_active",
            "is_currently_valid",
            "current_usage_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_currently_valid",
            "current_usage_count",
            "created_at",
            "updated_at",
        ]

    def get_current_usage_count(self, coupon):
        annotated_count = getattr(
            coupon,
            "current_usage_count",
            None,
        )

        if annotated_count is not None:
            return annotated_count

        return coupon.usages.filter(
            is_reversed=False,
        ).count()

    def validate_code(self, value):
        normalized_code = value.strip().upper()

        if not normalized_code:
            raise serializers.ValidationError(
                "Coupon code is required."
            )

        queryset = Coupon.objects.filter(
            code__iexact=normalized_code,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A coupon with this code already exists."
            )

        return normalized_code

    def validate(self, attributes):
        discount_type = attributes.get(
            "discount_type",
            getattr(
                self.instance,
                "discount_type",
                None,
            ),
        )

        value = attributes.get(
            "value",
            getattr(
                self.instance,
                "value",
                None,
            ),
        )

        starts_at = attributes.get(
            "starts_at",
            getattr(
                self.instance,
                "starts_at",
                None,
            ),
        )

        expires_at = attributes.get(
            "expires_at",
            getattr(
                self.instance,
                "expires_at",
                None,
            ),
        )

        if (
            discount_type
            == Coupon.DiscountType.PERCENTAGE
            and value is not None
            and value > 100
        ):
            raise serializers.ValidationError(
                {
                    "value": (
                        "Percentage discount cannot exceed 100."
                    )
                }
            )

        if (
            starts_at
            and expires_at
            and expires_at <= starts_at
        ):
            raise serializers.ValidationError(
                {
                    "expires_at": (
                        "Expiry time must be later "
                        "than the start time."
                    )
                }
            )

        return attributes


class CustomerCouponSerializer(
    serializers.ModelSerializer
):
    is_currently_valid = serializers.BooleanField(
        read_only=True,
    )

    current_usage_count = serializers.IntegerField(
        read_only=True,
    )

    customer_usage_count = serializers.IntegerField(
        read_only=True,
    )

    customer_remaining_uses = (
        serializers.SerializerMethodField()
    )

    discount_label = serializers.SerializerMethodField()

    class Meta:
        model = Coupon

        fields = [
            "id",
            "code",
            "name",
            "description",
            "discount_type",
            "value",
            "discount_label",
            "minimum_order_amount",
            "maximum_discount_amount",
            "per_customer_limit",
            "customer_usage_count",
            "customer_remaining_uses",
            "current_usage_count",
            "starts_at",
            "expires_at",
            "is_currently_valid",
        ]

        read_only_fields = fields

    def get_customer_remaining_uses(self, coupon):
        usage_count = int(
            getattr(
                coupon,
                "customer_usage_count",
                0,
            )
            or 0
        )

        return max(
            int(coupon.per_customer_limit)
            - usage_count,
            0,
        )

    def get_discount_label(self, coupon):
        if (
            coupon.discount_type
            == Coupon.DiscountType.PERCENTAGE
        ):
            value = coupon.value.normalize()
            return f"{value}% off"

        return f"Fixed discount of {coupon.value}"


class CouponValidationSerializer(
    serializers.Serializer
):
    coupon_code = serializers.CharField(
        max_length=50,
    )

    def validate_coupon_code(self, value):
        normalized_code = value.strip().upper()

        if not normalized_code:
            raise serializers.ValidationError(
                "Coupon code is required."
            )

        return normalized_code