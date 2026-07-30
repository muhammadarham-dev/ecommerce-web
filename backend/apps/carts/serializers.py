from rest_framework import serializers

from apps.products.models import Product, ProductImage
from apps.variants.models import (
    ProductVariant,
    ProductVariantOption,
)

from .models import Cart, CartItem
from .services import (
    add_item_to_cart,
    update_cart_item_quantity,
)


class CartProductImageSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ProductImage

        fields = [
            "id",
            "image",
            "alt_text",
            "is_primary",
        ]

        read_only_fields = fields


class CartProductSerializer(
    serializers.ModelSerializer
):
    final_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    images = CartProductImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "price",
            "discount_price",
            "final_price",
            "stock",
            "is_active",
            "images",
        ]

        read_only_fields = fields


class CartVariantOptionSerializer(
    serializers.ModelSerializer
):
    attribute_name = serializers.CharField(
        source="attribute.name",
        read_only=True,
    )

    attribute_slug = serializers.CharField(
        source="attribute.slug",
        read_only=True,
    )

    value = serializers.CharField(
        source="value.display_value",
        read_only=True,
    )

    value_slug = serializers.CharField(
        source="value.slug",
        read_only=True,
    )

    color_code = serializers.CharField(
        source="value.color_code",
        read_only=True,
    )

    class Meta:
        model = ProductVariantOption

        fields = [
            "id",
            "attribute_name",
            "attribute_slug",
            "value",
            "value_slug",
            "color_code",
        ]

        read_only_fields = fields


class CartVariantSerializer(
    serializers.ModelSerializer
):
    final_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    variant_name = serializers.CharField(
        read_only=True,
    )

    in_stock = serializers.BooleanField(
        read_only=True,
    )

    options = CartVariantOptionSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProductVariant

        fields = [
            "id",
            "sku",
            "variant_name",
            "price_override",
            "final_price",
            "stock",
            "in_stock",
            "is_active",
            "options",
        ]

        read_only_fields = fields


class CartItemSerializer(
    serializers.ModelSerializer
):
    product = CartProductSerializer(
        read_only=True,
    )

    variant = CartVariantSerializer(
        read_only=True,
    )

    display_name = serializers.CharField(
        read_only=True,
    )

    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    line_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = CartItem

        fields = [
            "id",
            "product",
            "variant",
            "display_name",
            "quantity",
            "unit_price",
            "line_total",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    total_items = serializers.IntegerField(
        read_only=True,
    )

    subtotal = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Cart

        fields = [
            "id",
            "items",
            "total_items",
            "subtotal",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class CartItemCreateSerializer(
    serializers.Serializer
):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=(
            Product.objects
            .filter(
                is_active=True,
                category__is_active=True,
            )
            .select_related("category")
        ),
    )

    variant_id = serializers.PrimaryKeyRelatedField(
        source="variant",
        queryset=(
            ProductVariant.objects
            .filter(
                is_active=True,
                product__is_active=True,
                product__category__is_active=True,
            )
            .select_related(
                "product",
                "product__category",
            )
        ),
        required=False,
        allow_null=True,
    )

    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )

    def validate(self, attributes):
        product = attributes["product"]
        variant = attributes.get("variant")

        if (
            variant is not None
            and variant.product_id != product.id
        ):
            raise serializers.ValidationError(
                {
                    "variant_id": (
                        "The selected variant does not belong "
                        "to this product."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        request = self.context["request"]

        cart_item, _ = add_item_to_cart(
            customer=request.user,
            product=validated_data["product"],
            variant=validated_data.get("variant"),
            quantity=validated_data["quantity"],
        )

        return cart_item


class CartItemUpdateSerializer(
    serializers.Serializer
):
    quantity = serializers.IntegerField(
        min_value=1,
    )

    def update(
        self,
        instance,
        validated_data,
    ):
        request = self.context["request"]

        return update_cart_item_quantity(
            cart_item=instance,
            customer=request.user,
            quantity=validated_data["quantity"],
        )