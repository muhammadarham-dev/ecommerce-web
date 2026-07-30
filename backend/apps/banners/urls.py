from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BannerManagementViewSet,
    PublicBannerListView,
)


app_name = "banners"


management_router = DefaultRouter()

management_router.register(
    "banners",
    BannerManagementViewSet,
    basename="management-banner",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),
    path(
        "",
        PublicBannerListView.as_view(),
        name="public-banner-list",
    ),
]