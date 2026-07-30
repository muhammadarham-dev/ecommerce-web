from django.contrib import admin

from .models import (
    Address,
    Order,
    OrderItem,
)


class OrderItemInline(
    admin.TabularInline
):
    model = OrderItem
    extra = 0
    can_delete = False

    fields = [
        "product",
        "product_name",
        "product_sku",
        "variant",
        "variant_name",
        "variant_sku",
        "variant_options",
        "unit_price",
        "quantity",
        "line_total",
    ]

    readonly_fields = fields


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "customer",
        "status",
        "payment_method",
        "payment_status",
        "shipping_method_code",
        "shipping_fee",
        "total_amount",
        "created_at",
    ]

    list_filter = [
        "status",
        "payment_method",
        "payment_status",
        "shipping_method_code",
        "shipping_zone_code",
        "free_shipping_applied",
        "created_at",
    ]

    search_fields = [
        "order_number",
        "customer__username",
        "customer__email",
        "recipient_name",
        "recipient_phone",
        "coupon_code",
        "shipping_zone_name",
        "shipping_zone_code",
        "shipping_method_name",
        "shipping_method_code",
        "items__product_name",
        "items__product_sku",
        "items__variant_name",
        "items__variant_sku",
    ]

    readonly_fields = [
        "order_number",
        "customer",
        "address",

        "shipping_zone",
        "shipping_method",
        "shipping_zone_name",
        "shipping_zone_code",
        "shipping_method_name",
        "shipping_method_code",
        "free_shipping_applied",

        "estimated_delivery_min_days",
        "estimated_delivery_max_days",
        "estimated_delivery_start",
        "estimated_delivery_end",

        "subtotal",
        "shipping_fee",
        "coupon_code",
        "discount_amount",
        "total_amount",

        "confirmed_at",
        "shipped_at",
        "delivered_at",
        "cancelled_at",

        "created_at",
        "updated_at",
    ]

    fieldsets = [
        (
            "Order Information",
            {
                "fields": [
                    "order_number",
                    "customer",
                    "address",
                    "status",
                    "payment_method",
                    "payment_status",
                ]
            },
        ),
        (
            "Shipping Information",
            {
                "fields": [
                    "shipping_zone",
                    "shipping_method",
                    "shipping_zone_name",
                    "shipping_zone_code",
                    "shipping_method_name",
                    "shipping_method_code",
                    "free_shipping_applied",
                    "estimated_delivery_min_days",
                    "estimated_delivery_max_days",
                    "estimated_delivery_start",
                    "estimated_delivery_end",
                ]
            },
        ),
        (
            "Delivery Address",
            {
                "fields": [
                    "recipient_name",
                    "recipient_phone",
                    "address_line_1",
                    "address_line_2",
                    "city",
                    "province",
                    "postal_code",
                    "country",
                ]
            },
        ),
        (
            "Payment Summary",
            {
                "fields": [
                    "subtotal",
                    "shipping_fee",
                    "coupon_code",
                    "discount_amount",
                    "total_amount",
                ]
            },
        ),
        (
            "Additional Information",
            {
                "fields": [
                    "notes",
                    "confirmed_at",
                    "shipped_at",
                    "delivered_at",
                    "cancelled_at",
                    "created_at",
                    "updated_at",
                ]
            },
        ),
    ]

    inlines = [
        OrderItemInline,
    ]

    ordering = [
        "-created_at",
    ]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order",
        "product_name",
        "variant_sku",
        "unit_price",
        "quantity",
        "line_total",
    ]

    list_filter = [
        "created_at",
        "product__category",
    ]

    search_fields = [
        "order__order_number",
        "product_name",
        "product_sku",
        "variant_name",
        "variant_sku",
    ]

    readonly_fields = [
        "order",
        "product",
        "product_name",
        "product_sku",
        "variant",
        "variant_name",
        "variant_sku",
        "variant_options",
        "unit_price",
        "quantity",
        "line_total",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "recipient_name",
        "phone_number",
        "city",
        "province",
        "is_default",
        "created_at",
    ]

    list_filter = [
        "is_default",
        "city",
        "province",
        "created_at",
    ]

    search_fields = [
        "user__username",
        "user__email",
        "recipient_name",
        "phone_number",
        "city",
        "province",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]