from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BankTransferSubmitView,
    CustomerPaymentDetailView,
    CustomerPaymentListView,
    PaymentManagementViewSet,
)


app_name = "payments"


management_router = DefaultRouter()

management_router.register(
    "payments",
    PaymentManagementViewSet,
    basename="management-payment",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),
    path(
        "",
        CustomerPaymentListView.as_view(),
        name="customer-payment-list",
    ),
    path(
        "<str:order_number>/submit-bank-transfer/",
        BankTransferSubmitView.as_view(),
        name="submit-bank-transfer",
    ),
    path(
        "<str:order_number>/",
        CustomerPaymentDetailView.as_view(),
        name="customer-payment-detail",
    ),
]