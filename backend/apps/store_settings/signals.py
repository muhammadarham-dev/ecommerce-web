from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import StoreSettings


@receiver(post_migrate)
def create_default_store_settings(
    sender,
    **kwargs,
):
    if sender.name != "apps.store_settings":
        return

    StoreSettings.objects.get_or_create(
        pk=1,
    )