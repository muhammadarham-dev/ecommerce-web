from django.urls import path

from .views import (
    CustomerReportView,
    InventoryReportView,
    ReportDashboardView,
    SalesReportView,
    TopSellingProductsReportView,
)


app_name = "reports"


urlpatterns = [
    path(
        "dashboard/",
        ReportDashboardView.as_view(),
        name="report-dashboard",
    ),

    path(
        "sales/",
        SalesReportView.as_view(),
        name="sales-report",
    ),

    path(
        "top-products/",
        TopSellingProductsReportView.as_view(),
        name="top-selling-products-report",
    ),

    path(
        "inventory/",
        InventoryReportView.as_view(),
        name="inventory-report",
    ),

    path(
        "customers/",
        CustomerReportView.as_view(),
        name="customer-report",
    ),
]