from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CouponManagementViewSet,
    CustomerCouponDetailView,
    CustomerCouponListView,
    CustomerCouponValidateView,
)


app_name = "coupons"


management_router = DefaultRouter()

management_router.register(
    "coupons",
    CouponManagementViewSet,
    basename="management-coupon",
)


urlpatterns = [
    path(
        "available/",
        CustomerCouponListView.as_view(),
        name="available-coupons",
    ),

    path(
        "available/<str:code>/",
        CustomerCouponDetailView.as_view(),
        name="available-coupon-detail",
    ),

    path(
        "validate/",
        CustomerCouponValidateView.as_view(),
        name="coupon-validate",
    ),

    path(
        "management/",
        include(management_router.urls),
    ),
]