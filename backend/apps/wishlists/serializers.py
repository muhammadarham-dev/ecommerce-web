from rest_framework import serializers

from apps.products.models import Product

from .models import WishlistItem


class WishlistProductSerializer(
    serializers.ModelSerializer
):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    category_slug = serializers.CharField(
        source="category.slug",
        read_only=True,
    )

    final_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    in_stock = serializers.BooleanField(
        read_only=True,
    )

    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "category_name",
            "category_slug",
            "price",
            "discount_price",
            "final_price",
            "stock",
            "in_stock",
            "is_active",
            "primary_image",
        ]

        read_only_fields = fields

    def get_primary_image(self, product):
        images = list(product.images.all())

        if not images:
            return None

        primary_image = next(
            (
                image
                for image in images
                if image.is_primary
            ),
            images[0],
        )

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                primary_image.image.url
            )

        return primary_image.image.url


class WishlistItemSerializer(
    serializers.ModelSerializer
):
    product = WishlistProductSerializer(
        read_only=True,
    )

    class Meta:
        model = WishlistItem

        fields = [
            "id",
            "product",
            "created_at",
        ]

        read_only_fields = fields


class WishlistAddSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.filter(
            is_active=True,
            category__is_active=True,
        ),
    )


class MoveWishlistToCartSerializer(
    serializers.Serializer
):
    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )