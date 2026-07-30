from django.urls import path

from .views import (
    ClearRecentlyViewedView,
    RecentlyViewedCountView,
    RecentlyViewedDeleteView,
    RecentlyViewedListView,
    TrackProductView,
)


app_name = "recently_viewed"


urlpatterns = [
    path(
        "",
        RecentlyViewedListView.as_view(),
        name="recently-viewed-list",
    ),

    path(
        "count/",
        RecentlyViewedCountView.as_view(),
        name="recently-viewed-count",
    ),

    path(
        "clear/",
        ClearRecentlyViewedView.as_view(),
        name="recently-viewed-clear",
    ),

    path(
        "track/<slug:slug>/",
        TrackProductView.as_view(),
        name="recently-viewed-track",
    ),

    path(
        "<int:pk>/",
        RecentlyViewedDeleteView.as_view(),
        name="recently-viewed-delete",
    ),
]