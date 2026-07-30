from django.urls import path

from .views import (
    PublicStoreSettingsView,
    StoreSettingsManagementView,
)


app_name = "store_settings"


urlpatterns = [
    path(
        "",
        PublicStoreSettingsView.as_view(),
        name="public-store-settings",
    ),

    path(
        "management/",
        StoreSettingsManagementView.as_view(),
        name="store-settings-management",
    ),
]