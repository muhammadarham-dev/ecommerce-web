from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EmailLogViewSet,
    EmailNotificationPreferenceBulkView,
    EmailNotificationPreferenceView,
)


app_name = "email_notifications"


router = DefaultRouter()

router.register(
    "logs",
    EmailLogViewSet,
    basename="email-log",
)


urlpatterns = [
    path(
        "preferences/",
        EmailNotificationPreferenceView.as_view(),
        name="email-preferences",
    ),

    path(
        "preferences/enable-all/",
        EmailNotificationPreferenceBulkView.as_view(
            mode="enable",
        ),
        name="email-preferences-enable-all",
    ),

    path(
        "preferences/disable-all/",
        EmailNotificationPreferenceBulkView.as_view(
            mode="disable",
        ),
        name="email-preferences-disable-all",
    ),

    path(
        "",
        include(router.urls),
    ),
]