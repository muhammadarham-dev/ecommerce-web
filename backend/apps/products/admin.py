from django.contrib import admin

from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "slug",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "is_active",
        "created_at",
    ]

    search_fields = [
        "name",
        "description",
    ]

    prepopulated_fields = {
        "slug": ["name"],
    }

    ordering = ["name"]


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

    fields = [
        "image",
        "alt_text",
        "is_primary",
    ]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "sku",
        "category",
        "price",
        "discount_price",
        "stock",
        "is_active",
        "is_featured",
    ]

    list_filter = [
        "category",
        "is_active",
        "is_featured",
        "created_at",
    ]

    search_fields = [
        "name",
        "sku",
        "description",
    ]

    prepopulated_fields = {
        "slug": ["name"],
    }

    ordering = ["-created_at"]

    list_editable = [
        "price",
        "stock",
        "is_active",
        "is_featured",
    ]

    inlines = [
        ProductImageInline,
    ]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "is_primary",
        "created_at",
    ]

    list_filter = [
        "is_primary",
        "created_at",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "alt_text",
    ]