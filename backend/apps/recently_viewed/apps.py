from django.apps import AppConfig


class RecentlyViewedConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.recently_viewed"
    label = "recently_viewed"