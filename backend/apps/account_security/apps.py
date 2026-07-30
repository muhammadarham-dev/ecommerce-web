from django.apps import AppConfig


class AccountSecurityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.account_security"
    label = "account_security"

    def ready(self):
        from . import signals  # noqa: F401