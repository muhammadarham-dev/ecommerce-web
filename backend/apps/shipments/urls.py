from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerShipmentDetailView,
    CustomerShipmentListView,
    ShipmentManagementViewSet,
)


app_name = "shipments"


management_router = DefaultRouter()

management_router.register(
    "shipments",
    ShipmentManagementViewSet,
    basename="management-shipment",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),

    path(
        "",
        CustomerShipmentListView.as_view(),
        name="customer-shipment-list",
    ),

    path(
        "<str:shipment_number>/",
        CustomerShipmentDetailView.as_view(),
        name="customer-shipment-detail",
    ),
]