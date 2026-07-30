from django.urls import path

from .views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    NotificationDetailView,
    NotificationListView,
    UnreadNotificationCountView,
)


app_name = "notifications"


urlpatterns = [
    path(
        "",
        NotificationListView.as_view(),
        name="notification-list",
    ),

    path(
        "unread-count/",
        UnreadNotificationCountView.as_view(),
        name="unread-count",
    ),

    path(
        "mark-all-read/",
        MarkAllNotificationsReadView.as_view(),
        name="mark-all-read",
    ),

    path(
        "<int:pk>/read/",
        MarkNotificationReadView.as_view(),
        name="mark-read",
    ),

    path(
        "<int:pk>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
]