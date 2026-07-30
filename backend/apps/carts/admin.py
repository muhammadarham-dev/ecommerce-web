from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    can_delete = True

    fields = [
        "product",
        "variant",
        "quantity",
        "unit_price",
        "line_total",
        "created_at",
        "updated_at",
    ]

    readonly_fields = [
        "unit_price",
        "line_total",
        "created_at",
        "updated_at",
    ]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "total_items",
        "subtotal",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "user__username",
        "user__email",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-updated_at",
    ]

    inlines = [
        CartItemInline,
    ]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "cart",
        "product",
        "variant",
        "quantity",
        "unit_price",
        "line_total",
        "created_at",
    ]

    list_filter = [
        "created_at",
        "updated_at",
        "product__category",
    ]

    search_fields = [
        "cart__user__username",
        "cart__user__email",
        "product__name",
        "product__sku",
        "variant__sku",
    ]

    readonly_fields = [
        "unit_price",
        "line_total",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]