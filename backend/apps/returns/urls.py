from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerReturnCancelView,
    CustomerReturnDetailView,
    CustomerReturnListCreateView,
    ReturnManagementViewSet,
)


app_name = "returns"


management_router = DefaultRouter()

management_router.register(
    "requests",
    ReturnManagementViewSet,
    basename="management-return-request",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),
    path(
        "",
        CustomerReturnListCreateView.as_view(),
        name="customer-return-list-create",
    ),
    path(
        "<str:return_number>/cancel/",
        CustomerReturnCancelView.as_view(),
        name="customer-return-cancel",
    ),
    path(
        "<str:return_number>/",
        CustomerReturnDetailView.as_view(),
        name="customer-return-detail",
    ),
]