from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    CancelOrderView,
    CheckoutView,
    OrderDashboardView,
    OrderDetailView,
    OrderListView,
    OrderManagementViewSet,
)


app_name = "orders"


address_router = DefaultRouter()

address_router.register(
    "",
    AddressViewSet,
    basename="address",
)


management_router = DefaultRouter()

management_router.register(
    "orders",
    OrderManagementViewSet,
    basename="management-order",
)


urlpatterns = [
    path(
        "management/dashboard/",
        OrderDashboardView.as_view(),
        name="management-dashboard",
    ),

    path(
        "management/",
        include(management_router.urls),
    ),

    path(
        "addresses/",
        include(address_router.urls),
    ),

    path(
        "checkout/",
        CheckoutView.as_view(),
        name="checkout",
    ),

    path(
        "",
        OrderListView.as_view(),
        name="order-list",
    ),

    path(
        "<str:order_number>/cancel/",
        CancelOrderView.as_view(),
        name="order-cancel",
    ),

    path(
        "<str:order_number>/",
        OrderDetailView.as_view(),
        name="order-detail",
    ),
]