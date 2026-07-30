from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "customer",
        "rating",
        "is_approved",
        "created_at",
    ]

    list_filter = [
        "rating",
        "is_approved",
        "created_at",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "customer__username",
        "customer__email",
        "title",
        "comment",
        "order__order_number",
    ]

    readonly_fields = [
        "customer",
        "product",
        "order",
        "rating",
        "title",
        "comment",
        "created_at",
        "updated_at",
    ]

    list_editable = [
        "is_approved",
    ]

    ordering = [
        "-created_at",
    ]