from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ReviewManagementViewSet,
    ReviewViewSet,
)


app_name = "reviews"


management_router = DefaultRouter()

management_router.register(
    "reviews",
    ReviewManagementViewSet,
    basename="management-review",
)


public_router = DefaultRouter()

public_router.register(
    "",
    ReviewViewSet,
    basename="review",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),

    path(
        "",
        include(public_router.urls),
    ),
]
