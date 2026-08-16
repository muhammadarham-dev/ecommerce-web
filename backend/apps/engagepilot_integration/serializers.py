from rest_framework import serializers


class CustomerScopedSerializer(serializers.Serializer):
    """Base request schema for trusted customer-scoped capabilities."""

    verified_customer_id = serializers.CharField(
        max_length=128,
    )


class ProductSearchRequestSerializer(serializers.Serializer):
    """Validate the universal products.search request."""

    query = serializers.CharField(
        min_length=2,
        max_length=200,
    )
    limit = serializers.IntegerField(
        min_value=1,
        max_value=100,
        default=10,
    )
    available_only = serializers.BooleanField(
        default=True,
    )
    min_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )
    max_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )
    vendor = serializers.CharField(
        max_length=160,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    product_type = serializers.CharField(
        max_length=160,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    tag = serializers.CharField(
        max_length=160,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    cursor = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    def validate(self, attrs):
        minimum = attrs.get("min_price")
        maximum = attrs.get("max_price")

        if (
            minimum is not None
            and maximum is not None
            and minimum > maximum
        ):
            raise serializers.ValidationError(
                {
                    "max_price": (
                        "max_price must be greater than or equal "
                        "to min_price."
                    )
                }
            )

        unsupported = {}

        for field_name in (
            "vendor",
            "tag",
        ):
            value = attrs.get(field_name)
            if isinstance(value, str) and value.strip():
                unsupported[field_name] = (
                    "This Django store does not expose this filter."
                )

        if unsupported:
            raise serializers.ValidationError(
                unsupported
            )

        return attrs


class InventoryCheckRequestSerializer(serializers.Serializer):
    """Validate inventory.check input."""

    item_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    requested_quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )
    location_id = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class InventoryUpdateRequestSerializer(serializers.Serializer):
    """Validate owner-approved inventory.update input."""

    item_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    quantity = serializers.IntegerField(
        min_value=0,
    )
    location_id = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class CartAddItemRequestSerializer(CustomerScopedSerializer):
    """Validate cart.add_item input."""

    cart_id = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    product_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    quantity = serializers.IntegerField(
        min_value=1,
    )


class CartGetRequestSerializer(CustomerScopedSerializer):
    """Validate cart.get input."""

    cart_id = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class CartLineActionRequestSerializer(CustomerScopedSerializer):
    """Validate a trusted cart-line action."""

    cart_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    line_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )


class CartUpdateQuantityRequestSerializer(
    CartLineActionRequestSerializer
):
    """Validate cart.update_quantity input."""

    quantity = serializers.IntegerField(
        min_value=1,
    )


class CartClearRequestSerializer(CustomerScopedSerializer):
    """Validate a confirmed cart.clear snapshot."""

    cart_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    expected_line_ids = serializers.ListField(
        child=serializers.CharField(
            min_length=1,
            max_length=500,
        ),
        allow_empty=True,
        max_length=250,
    )


class OrdersListRequestSerializer(CustomerScopedSerializer):
    """Validate orders.list input."""

    limit = serializers.IntegerField(
        min_value=1,
        max_value=25,
        default=10,
    )
    include_cancelled = serializers.BooleanField(
        default=False,
    )
    purpose = serializers.ChoiceField(
        choices=(
            "list",
            "status",
            "cancellation",
        ),
        default="list",
    )
    order_reference = serializers.CharField(
        max_length=80,
        required=False,
        allow_blank=True,
        allow_null=True,
    )


class ResolveOrderRequestSerializer(CustomerScopedSerializer):
    """Validate trusted customer-order resolution input."""

    order_reference = serializers.CharField(
        min_length=1,
        max_length=80,
    )
    allow_cancelled = serializers.BooleanField(
        default=False,
    )


class CancelOrderRequestSerializer(CustomerScopedSerializer):
    """Validate orders.cancel input after agent-side ownership checks."""

    order_id = serializers.CharField(
        min_length=1,
        max_length=160,
    )
    order_reference = serializers.CharField(
        max_length=80,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    ownership_verified = serializers.BooleanField(
        required=False,
        default=False,
    )


class CheckoutExpectedLineSerializer(serializers.Serializer):
    """Validate one line in a confirmed checkout snapshot."""

    line_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    quantity = serializers.IntegerField(
        min_value=1,
    )


class CheckoutPrepareRequestSerializer(CustomerScopedSerializer):
    """Validate checkout.prepare input."""

    cart_id = serializers.CharField(
        min_length=1,
        max_length=500,
    )
    expected_lines = CheckoutExpectedLineSerializer(
        many=True,
        allow_empty=False,
    )
