from django.contrib import admin

from .models import Coupon, CouponUsage


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "name",
        "discount_type",
        "value",
        "minimum_order_amount",
        "total_usage_limit",
        "per_customer_limit",
        "is_active",
        "starts_at",
        "expires_at",
    ]

    list_filter = [
        "discount_type",
        "is_active",
        "starts_at",
        "expires_at",
    ]

    search_fields = [
        "code",
        "name",
        "description",
    ]

    list_editable = [
        "is_active",
    ]

    ordering = [
        "-created_at",
    ]


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "coupon",
        "customer",
        "order",
        "discount_amount",
        "is_reversed",
        "created_at",
    ]

    list_filter = [
        "is_reversed",
        "created_at",
    ]

    search_fields = [
        "coupon__code",
        "customer__username",
        "customer__email",
        "order__order_number",
    ]

    readonly_fields = [
        "coupon",
        "customer",
        "order",
        "discount_amount",
        "is_reversed",
        "created_at",
        "reversed_at",
    ]