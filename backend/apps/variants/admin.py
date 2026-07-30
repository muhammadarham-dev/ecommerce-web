from django.contrib import admin

from .models import (
    ProductAttribute,
    ProductAttributeValue,
    ProductVariant,
    ProductVariantOption,
)


class ProductAttributeValueInline(
    admin.TabularInline
):
    model = ProductAttributeValue
    extra = 1

    fields = [
        "value",
        "display_value",
        "color_code",
        "display_order",
        "is_active",
    ]


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "slug",
        "display_order",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "is_active",
        "created_at",
    ]

    search_fields = [
        "name",
        "slug",
    ]

    list_editable = [
        "display_order",
        "is_active",
    ]

    prepopulated_fields = {
        "slug": [
            "name",
        ],
    }

    inlines = [
        ProductAttributeValueInline,
    ]

    ordering = [
        "display_order",
        "name",
    ]


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(
    admin.ModelAdmin
):
    list_display = [
        "id",
        "attribute",
        "value",
        "display_value",
        "color_code",
        "display_order",
        "is_active",
    ]

    list_filter = [
        "attribute",
        "is_active",
    ]

    search_fields = [
        "attribute__name",
        "value",
        "display_value",
    ]

    list_editable = [
        "display_order",
        "is_active",
    ]

    ordering = [
        "attribute__display_order",
        "display_order",
        "value",
    ]


class ProductVariantOptionInline(
    admin.TabularInline
):
    model = ProductVariantOption
    extra = 1

    fields = [
        "attribute",
        "value",
    ]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "sku",
        "price_override",
        "stock",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "is_active",
        "product__category",
        "created_at",
    ]

    search_fields = [
        "sku",
        "product__name",
        "product__sku",
    ]

    list_editable = [
        "stock",
        "is_active",
    ]

    readonly_fields = [
        "combination_key",
        "created_at",
        "updated_at",
    ]

    inlines = [
        ProductVariantOptionInline,
    ]

    ordering = [
        "product__name",
        "sku",
    ]


@admin.register(ProductVariantOption)
class ProductVariantOptionAdmin(
    admin.ModelAdmin
):
    list_display = [
        "id",
        "variant",
        "attribute",
        "value",
        "created_at",
    ]

    list_filter = [
        "attribute",
        "created_at",
    ]

    search_fields = [
        "variant__sku",
        "variant__product__name",
        "attribute__name",
        "value__value",
    ]

    readonly_fields = [
        "created_at",
    ]