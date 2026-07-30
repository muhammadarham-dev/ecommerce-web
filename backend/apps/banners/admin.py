from django.contrib import admin

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "position",
        "display_order",
        "is_active",
        "starts_at",
        "ends_at",
        "created_at",
    ]

    list_filter = [
        "position",
        "is_active",
        "starts_at",
        "ends_at",
        "created_at",
    ]

    search_fields = [
        "title",
        "subtitle",
        "description",
        "button_text",
        "button_url",
    ]

    list_editable = [
        "display_order",
        "is_active",
    ]

    readonly_fields = [
        "created_by",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "display_order",
        "-created_at",
    ]