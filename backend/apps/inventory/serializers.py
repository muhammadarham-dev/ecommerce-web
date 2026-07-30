from rest_framework import serializers

from apps.products.models import Product
from apps.variants.models import ProductVariant

from .models import StockMovement
from .services import adjust_stock_manually


class StockMovementSerializer(
    serializers.ModelSerializer
):
    movement_type_display = serializers.CharField(
        source="get_movement_type_display",
        read_only=True,
    )

    target_type = serializers.CharField(
        read_only=True,
    )

    target_name = serializers.CharField(
        read_only=True,
    )

    target_sku = serializers.CharField(
        read_only=True,
    )

    product_id = serializers.IntegerField(
        source="product.id",
        read_only=True,
        allow_null=True,
    )

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
        allow_null=True,
    )

    product_slug = serializers.CharField(
        source="product.slug",
        read_only=True,
        allow_null=True,
    )

    variant_id = serializers.IntegerField(
        source="variant.id",
        read_only=True,
        allow_null=True,
    )

    variant_name = serializers.CharField(
        source="variant.variant_name",
        read_only=True,
        allow_null=True,
    )

    variant_sku = serializers.CharField(
        source="variant.sku",
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

    performed_by_username = serializers.CharField(
        source="performed_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = StockMovement

        fields = [
            "id",
            "movement_type",
            "movement_type_display",
            "target_type",
            "target_name",
            "target_sku",
            "product_id",
            "product_name",
            "product_slug",
            "variant_id",
            "variant_name",
            "variant_sku",
            "order_number",
            "return_number",
            "quantity_change",
            "previous_stock",
            "new_stock",
            "note",
            "performed_by_username",
            "created_at",
        ]

        read_only_fields = fields


class ManualStockAdjustmentSerializer(
    serializers.Serializer
):
    class Operation:
        INCREASE = "INCREASE"
        DECREASE = "DECREASE"
        SET = "SET"

        choices = [
            (INCREASE, "Increase"),
            (DECREASE, "Decrease"),
            (SET, "Set Exact Quantity"),
        ]

    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=(
            Product.objects
            .select_related("category")
            .all()
        ),
        required=False,
        allow_null=True,
    )

    variant_id = serializers.PrimaryKeyRelatedField(
        source="variant",
        queryset=(
            ProductVariant.objects
            .select_related(
                "product",
                "product__category",
            )
            .all()
        ),
        required=False,
        allow_null=True,
    )

    operation = serializers.ChoiceField(
        choices=Operation.choices,
    )

    quantity = serializers.IntegerField(
        min_value=0,
    )

    note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    def validate(self, attributes):
        product = attributes.get("product")
        variant = attributes.get("variant")
        operation = attributes["operation"]
        quantity = attributes["quantity"]

        if (
            product is None and variant is None
        ) or (
            product is not None
            and variant is not None
        ):
            raise serializers.ValidationError(
                {
                    "target": (
                        "Provide either product_id "
                        "or variant_id."
                    )
                }
            )

        if (
            operation
            in {
                self.Operation.INCREASE,
                self.Operation.DECREASE,
            }
            and quantity <= 0
        ):
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Quantity must be greater "
                        "than zero."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        request = self.context["request"]

        _, stock_movement = adjust_stock_manually(
            performed_by=request.user,
            **validated_data,
        )

        return stock_movement