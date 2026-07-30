from django.urls import path

from .views import (
    InventorySummaryView,
    ManualStockAdjustmentView,
    ProductStockHistoryView,
    StockMovementDetailView,
    StockMovementListView,
    VariantStockHistoryView,
)


app_name = "inventory"


urlpatterns = [
    path(
        "summary/",
        InventorySummaryView.as_view(),
        name="inventory-summary",
    ),

    path(
        "adjust/",
        ManualStockAdjustmentView.as_view(),
        name="manual-stock-adjustment",
    ),

    path(
        "movements/",
        StockMovementListView.as_view(),
        name="stock-movement-list",
    ),

    path(
        "movements/<int:pk>/",
        StockMovementDetailView.as_view(),
        name="stock-movement-detail",
    ),

    path(
        "products/<slug:product_slug>/history/",
        ProductStockHistoryView.as_view(),
        name="product-stock-history",
    ),

    path(
        "variants/<str:variant_sku>/history/",
        VariantStockHistoryView.as_view(),
        name="variant-stock-history",
    ),
]