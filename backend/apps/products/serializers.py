from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category

        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
    )

    class Meta:
        model = ProductImage

        fields = [
            "id",
            "product_id",
            "image",
            "alt_text",
            "is_primary",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_image(self, value):
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Product images must be 5 MB or smaller."
            )

        return value

    def validate_alt_text(self, value):
        return value.strip()

    def validate(self, attributes):
        product = attributes.get("product")

        if (
            self.instance is not None
            and product is not None
            and product.pk != self.instance.product_id
        ):
            raise serializers.ValidationError(
                {
                    "product_id": (
                        "A product image cannot be moved to another product."
                    )
                }
            )

        return attributes


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(
        read_only=True,
    )

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(
            is_active=True,
        ),
        source="category",
        write_only=True,
    )

    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    final_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    average_rating = serializers.FloatField(
        read_only=True,
        allow_null=True,
    )

    review_count = serializers.IntegerField(
        read_only=True,
    )

    in_stock = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "category",
            "category_id",
            "name",
            "slug",
            "sku",
            "description",
            "price",
            "discount_price",
            "final_price",
            "stock",
            "in_stock",
            "is_active",
            "is_featured",
            "average_rating",
            "review_count",
            "images",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "final_price",
            "in_stock",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, attributes):
        price = attributes.get(
            "price",
            getattr(
                self.instance,
                "price",
                None,
            ),
        )

        discount_price = attributes.get(
            "discount_price",
            getattr(
                self.instance,
                "discount_price",
                None,
            ),
        )

        if (
            discount_price is not None
            and price is not None
            and discount_price >= price
        ):
            raise serializers.ValidationError(
                {
                    "discount_price": (
                        "Discount price must be lower "
                        "than the regular price."
                    )
                }
            )

        return attributes