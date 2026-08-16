from django.db import transaction
from rest_framework import serializers

from apps.products.models import Product

from .models import (
    ProductAttribute,
    ProductAttributeValue,
    ProductVariant,
    ProductVariantOption,
)


class ProductAttributeValueSerializer(
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

    class Meta:
        model = ProductAttributeValue

        fields = [
            "id",
            "attribute",
            "attribute_name",
            "attribute_slug",
            "value",
            "slug",
            "display_value",
            "color_code",
            "display_order",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "attribute_name",
            "attribute_slug",
            "created_at",
            "updated_at",
        ]

    def validate_color_code(self, value):
        normalized_value = value.strip()

        if normalized_value and not (
            normalized_value.startswith("#")
            and len(normalized_value)
            in {
                4,
                7,
                9,
            }
        ):
            raise serializers.ValidationError(
                "Enter a valid hexadecimal color code."
            )

        return normalized_value


class ProductAttributeSerializer(
    serializers.ModelSerializer
):
    values = ProductAttributeValueSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProductAttribute

        fields = [
            "id",
            "name",
            "slug",
            "display_order",
            "is_active",
            "values",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductVariantOptionSerializer(
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

    value_name = serializers.CharField(
        source="value.value",
        read_only=True,
    )

    display_value = serializers.CharField(
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
            "attribute",
            "attribute_name",
            "attribute_slug",
            "value",
            "value_name",
            "display_value",
            "value_slug",
            "color_code",
        ]

        read_only_fields = fields


class ProductVariantSerializer(
    serializers.ModelSerializer
):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    product_slug = serializers.CharField(
        source="product.slug",
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

    variant_name = serializers.CharField(
        read_only=True,
    )

    options = ProductVariantOptionSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProductVariant

        fields = [
            "id",
            "product",
            "product_name",
            "product_slug",
            "sku",
            "variant_name",
            "price_override",
            "final_price",
            "stock",
            "in_stock",
            "is_active",
            "options",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class ProductVariantWriteSerializer(
    serializers.ModelSerializer
):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
    )

    attribute_value_ids = (
        serializers.PrimaryKeyRelatedField(
            source="attribute_values",
            queryset=(
                ProductAttributeValue.objects
                .filter(
                    is_active=True,
                    attribute__is_active=True,
                )
                .select_related("attribute")
            ),
            many=True,
            write_only=True,
        )
    )

    class Meta:
        model = ProductVariant

        fields = [
            "product_id",
            "sku",
            "price_override",
            "stock",
            "is_active",
            "attribute_value_ids",
        ]

    def build_combination_key(self, values):
        sorted_values = sorted(
            values,
            key=lambda item: (
                item.attribute_id,
                item.id,
            ),
        )

        return "|".join(
            (
                f"{value.attribute_id}:"
                f"{value.id}"
            )
            for value in sorted_values
        )

    def validate_attribute_value_ids(
        self,
        values,
    ):
        if not values:
            raise serializers.ValidationError(
                "At least one attribute value is required."
            )

        value_ids = [
            value.id
            for value in values
        ]

        if len(value_ids) != len(set(value_ids)):
            raise serializers.ValidationError(
                "Duplicate attribute values are not allowed."
            )

        attribute_ids = [
            value.attribute_id
            for value in values
        ]

        if len(attribute_ids) != len(
            set(attribute_ids)
        ):
            raise serializers.ValidationError(
                "Only one value can be selected "
                "for each attribute."
            )

        return values

    def validate(self, attributes):
        product = attributes.get(
            "product",
            getattr(
                self.instance,
                "product",
                None,
            ),
        )

        values = attributes.get(
            "attribute_values",
        )

        if values is None and self.instance is not None:
            values = [
                option.value
                for option in (
                    self.instance.options
                    .select_related(
                        "value",
                        "attribute",
                    )
                    .all()
                )
            ]

        if values is None:
            raise serializers.ValidationError(
                {
                    "attribute_value_ids": (
                        "At least one attribute value "
                        "is required."
                    )
                }
            )

        combination_key = (
            self.build_combination_key(values)
        )

        queryset = ProductVariant.objects.filter(
            product=product,
            combination_key=combination_key,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "attribute_value_ids": (
                        "This variant combination "
                        "already exists for the product."
                    )
                }
            )

        attributes["combination_key"] = (
            combination_key
        )

        return attributes

    @transaction.atomic
    def create(self, validated_data):
        attribute_values = validated_data.pop(
            "attribute_values"
        )

        combination_key = validated_data.pop(
            "combination_key"
        )

        variant = ProductVariant.objects.create(
            combination_key=combination_key,
            **validated_data,
        )

        ProductVariantOption.objects.bulk_create(
            [
                ProductVariantOption(
                    variant=variant,
                    attribute=value.attribute,
                    value=value,
                )
                for value in attribute_values
            ]
        )

        return variant

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        attribute_values = validated_data.pop(
            "attribute_values",
            None,
        )

        combination_key = validated_data.pop(
            "combination_key",
            instance.combination_key,
        )

        for field_name, field_value in (
            validated_data.items()
        ):
            setattr(
                instance,
                field_name,
                field_value,
            )

        instance.combination_key = combination_key
        instance.save()

        if attribute_values is not None:
            instance.options.all().delete()

            ProductVariantOption.objects.bulk_create(
                [
                    ProductVariantOption(
                        variant=instance,
                        attribute=value.attribute,
                        value=value,
                    )
                    for value in attribute_values
                ]
            )

        return instance