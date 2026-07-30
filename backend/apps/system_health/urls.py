from django.urls import path

from .views import (
    DetailedSystemHealthView,
    LivenessView,
    ReadinessView,
)


app_name = "system_health"


urlpatterns = [
    path(
        "live/",
        LivenessView.as_view(),
        name="liveness",
    ),

    path(
        "ready/",
        ReadinessView.as_view(),
        name="readiness",
    ),

    path(
        "details/",
        DetailedSystemHealthView.as_view(),
        name="detailed-health",
    ),
]