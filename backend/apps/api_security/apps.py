from django.apps import AppConfig


class ApiSecurityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.api_security"
    label = "api_security"

    def ready(self):
        from . import schema_annotations  # noqa: F401