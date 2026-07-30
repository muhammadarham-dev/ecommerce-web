from django.contrib import admin

from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "target_display",
        "target_sku_display",
        "movement_type",
        "quantity_change",
        "previous_stock",
        "new_stock",
        "performed_by",
        "created_at",
    ]

    list_filter = [
        "movement_type",
        "created_at",
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "variant__sku",
        "variant__product__name",
        "order__order_number",
        "return_request__return_number",
        "performed_by__username",
        "performed_by__email",
        "note",
    ]

    readonly_fields = [
        "product",
        "variant",
        "order",
        "return_request",
        "movement_type",
        "quantity_change",
        "previous_stock",
        "new_stock",
        "note",
        "performed_by",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    def target_display(self, stock_movement):
        return stock_movement.target_name

    target_display.short_description = "Target"

    def target_sku_display(
        self,
        stock_movement,
    ):
        return stock_movement.target_sku

    target_sku_display.short_description = "SKU"

    def has_add_permission(
        self,
        request,
    ):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False