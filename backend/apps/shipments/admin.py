from django.contrib import admin

from .models import Shipment, ShipmentEvent


class ShipmentEventInline(admin.TabularInline):
    model = ShipmentEvent
    extra = 0
    can_delete = False

    fields = [
        "status",
        "message",
        "location",
        "created_by",
        "created_at",
    ]

    readonly_fields = [
        "status",
        "message",
        "location",
        "created_by",
        "created_at",
    ]


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        "shipment_number",
        "order",
        "status",
        "courier_name",
        "tracking_number",
        "estimated_delivery_date",
        "created_at",
    ]

    list_filter = [
        "status",
        "courier_name",
        "created_at",
    ]

    search_fields = [
        "shipment_number",
        "tracking_number",
        "courier_name",
        "order__order_number",
        "order__customer__username",
        "order__customer__email",
    ]

    readonly_fields = [
        "shipment_number",
        "order",
        "created_by",
        "updated_by",
        "shipped_at",
        "delivered_at",
        "created_at",
        "updated_at",
    ]

    inlines = [
        ShipmentEventInline,
    ]

    ordering = [
        "-created_at",
    ]


@admin.register(ShipmentEvent)
class ShipmentEventAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "shipment",
        "status",
        "location",
        "created_by",
        "created_at",
    ]

    list_filter = [
        "status",
        "created_at",
    ]

    search_fields = [
        "shipment__shipment_number",
        "shipment__order__order_number",
        "message",
        "location",
    ]

    readonly_fields = [
        "shipment",
        "status",
        "message",
        "location",
        "created_by",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]