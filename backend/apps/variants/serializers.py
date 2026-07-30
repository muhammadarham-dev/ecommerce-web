import re

from django.db import transaction
from django.utils.text import slugify
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
    slug = serializers.SlugField(
        read_only=True,
    )

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
            "slug",
            "attribute_name",
            "attribute_slug",
            "created_at",
            "updated_at",
        ]

        # The database constraint uses the generated slug.
        # Validation is handled below so clients never need
        # to send that internal field.
        validators = []

    def validate_value(self, value):
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError(
                "Attribute value is required."
            )

        if not slugify(normalized_value):
            raise serializers.ValidationError(
                "Enter a value containing letters or numbers."
            )

        return normalized_value

    def validate_display_value(self, value):
        return value.strip()

    def validate_color_code(self, value):
        normalized_value = value.strip()

        if not normalized_value:
            return ""

        if not normalized_value.startswith("#"):
            normalized_value = f"#{normalized_value}"

        if not re.fullmatch(
            r"#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})",
            normalized_value,
        ):
            raise serializers.ValidationError(
                "Enter a valid hexadecimal color code, "
                "for example #000000."
            )

        return normalized_value.upper()

    def validate(self, attributes):
        attribute = attributes.get(
            "attribute",
            getattr(
                self.instance,
                "attribute",
                None,
            ),
        )

        value = attributes.get(
            "value",
            getattr(
                self.instance,
                "value",
                "",
            ),
        )

        if attribute is None:
            return attributes

        value_slug = slugify(value)

        queryset = ProductAttributeValue.objects.filter(
            attribute=attribute,
            slug=value_slug,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                {
                    "value": (
                        "This value already exists for "
                        "the selected attribute."
                    )
                }
            )

        return attributes


class ProductAttributeSerializer(
    serializers.ModelSerializer
):
    slug = serializers.SlugField(
        read_only=True,
    )

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
            "slug",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "name": {
                "validators": [],
            },
        }

    def validate_name(self, value):
        normalized_name = value.strip()

        if not normalized_name:
            raise serializers.ValidationError(
                "Attribute name is required."
            )

        generated_slug = slugify(normalized_name)

        if not generated_slug:
            raise serializers.ValidationError(
                "Enter a name containing letters or numbers."
            )

        queryset = ProductAttribute.objects.filter(
            name__iexact=normalized_name,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "An attribute with this name already exists."
            )

        slug_queryset = ProductAttribute.objects.filter(
            slug=generated_slug,
        )

        if self.instance is not None:
            slug_queryset = slug_queryset.exclude(
                pk=self.instance.pk,
            )

        if slug_queryset.exists():
            raise serializers.ValidationError(
                "An attribute with an equivalent name "
                "already exists."
            )

        return normalized_name


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