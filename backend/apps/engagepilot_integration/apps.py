from django.apps import AppConfig


class EngagePilotIntegrationConfig(AppConfig):
    """Configure the EngagePilot connector integration API."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.engagepilot_integration"
    verbose_name = "EngagePilot Integration"
