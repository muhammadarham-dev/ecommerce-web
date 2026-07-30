from django.contrib import admin

from .models import (
    ShippingMethod,
    ShippingRate,
    ShippingZone,
)


class ShippingRateInline(admin.TabularInline):
    model = ShippingRate
    extra = 1

    fields = [
        "method",
        "charge",
        "free_shipping_threshold",
        "estimated_min_days",
        "estimated_max_days",
        "cod_available",
        "is_active",
    ]


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "code",
        "country",
        "province",
        "city",
        "zone_level",
        "priority",
        "is_active",
    ]

    list_filter = [
        "country",
        "province",
        "city",
        "is_active",
    ]

    search_fields = [
        "name",
        "code",
        "country",
        "province",
        "city",
    ]

    list_editable = [
        "priority",
        "is_active",
    ]

    readonly_fields = [
        "zone_level",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-priority",
        "name",
    ]

    inlines = [
        ShippingRateInline,
    ]


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "code",
        "is_default",
        "is_active",
        "display_order",
    ]

    list_filter = [
        "is_default",
        "is_active",
    ]

    search_fields = [
        "name",
        "code",
        "description",
    ]

    list_editable = [
        "is_default",
        "is_active",
        "display_order",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    ordering = [
        "display_order",
        "name",
    ]


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "zone",
        "method",
        "charge",
        "free_shipping_threshold",
        "estimated_min_days",
        "estimated_max_days",
        "cod_available",
        "is_active",
    ]

    list_filter = [
        "method",
        "cod_available",
        "is_active",
        "zone__country",
        "zone__province",
        "zone__city",
    ]

    search_fields = [
        "zone__name",
        "zone__code",
        "method__name",
        "method__code",
    ]

    list_editable = [
        "charge",
        "cod_available",
        "is_active",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    ordering = [
        "zone__name",
        "method__display_order",
    ]