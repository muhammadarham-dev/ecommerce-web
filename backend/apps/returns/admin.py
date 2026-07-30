from django.contrib import admin

from .models import ReturnItem, ReturnRequest


class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0
    can_delete = False

    fields = [
        "order_item",
        "quantity",
        "unit_price",
        "line_total",
    ]

    readonly_fields = fields


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = [
        "return_number",
        "order",
        "customer",
        "reason",
        "status",
        "refund_amount",
        "created_at",
    ]

    list_filter = [
        "status",
        "reason",
        "created_at",
    ]

    search_fields = [
        "return_number",
        "order__order_number",
        "customer__username",
        "customer__email",
    ]

    readonly_fields = [
        "return_number",
        "customer",
        "order",
        "refund_amount",
        "created_at",
        "updated_at",
        "reviewed_at",
        "received_at",
        "refunded_at",
        "cancelled_at",
        "stock_restored_at",
    ]

    inlines = [
        ReturnItemInline,
    ]


@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "return_request",
        "order_item",
        "quantity",
        "unit_price",
        "line_total",
    ]

    search_fields = [
        "return_request__return_number",
        "order_item__product_name",
        "order_item__product_sku",
    ]

    readonly_fields = [
        "return_request",
        "order_item",
        "quantity",
        "unit_price",
        "line_total",
        "created_at",
    ]