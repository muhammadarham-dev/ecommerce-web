from django.contrib import admin

from .models import RecentlyViewedProduct


@admin.register(RecentlyViewedProduct)
class RecentlyViewedProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer",
        "product",
        "view_count",
        "viewed_at",
    ]

    list_filter = [
        "viewed_at",
        "product__category",
    ]

    search_fields = [
        "customer__username",
        "customer__email",
        "product__name",
        "product__sku",
    ]

    readonly_fields = [
        "customer",
        "product",
        "view_count",
        "viewed_at",
        "created_at",
    ]

    ordering = [
        "-viewed_at",
    ]