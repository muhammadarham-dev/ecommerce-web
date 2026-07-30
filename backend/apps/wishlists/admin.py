from django.contrib import admin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "product",
        "created_at",
    ]

    search_fields = [
        "customer__username",
        "customer__email",
        "product__name",
        "product__sku",
    ]

    list_filter = [
        "created_at",
        "product__category",
    ]

    readonly_fields = [
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]