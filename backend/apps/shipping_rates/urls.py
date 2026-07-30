from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PublicShippingMethodViewSet,
    ShippingMethodManagementViewSet,
    ShippingQuoteView,
    ShippingRateManagementViewSet,
    ShippingZoneManagementViewSet,
)


app_name = "shipping_rates"


public_router = DefaultRouter()

public_router.register(
    "methods",
    PublicShippingMethodViewSet,
    basename="public-shipping-method",
)


management_router = DefaultRouter()

management_router.register(
    "zones",
    ShippingZoneManagementViewSet,
    basename="management-shipping-zone",
)

management_router.register(
    "methods",
    ShippingMethodManagementViewSet,
    basename="management-shipping-method",
)

management_router.register(
    "rates",
    ShippingRateManagementViewSet,
    basename="management-shipping-rate",
)


urlpatterns = [
    path(
        "",
        include(public_router.urls),
    ),

    path(
        "quote/",
        ShippingQuoteView.as_view(),
        name="shipping-quote",
    ),

    path(
        "management/",
        include(management_router.urls),
    ),
]