from django.contrib.auth import get_user_model
from django.db.models.signals import (
    post_migrate,
    post_save,
)
from django.dispatch import receiver

from .models import AccountSecurityProfile


User = get_user_model()


@receiver(post_save, sender=User)
def create_account_security_profile(
    sender,
    instance,
    created,
    **kwargs,
):
    AccountSecurityProfile.objects.get_or_create(
        user=instance,
    )


@receiver(post_migrate)
def create_missing_security_profiles(
    sender,
    **kwargs,
):
    if sender.name != "apps.account_security":
        return

    existing_user_ids = set(
        AccountSecurityProfile.objects.values_list(
            "user_id",
            flat=True,
        )
    )

    missing_profiles = [
        AccountSecurityProfile(user=user)
        for user in User.objects.all()
        if user.id not in existing_user_ids
    ]

    if missing_profiles:
        AccountSecurityProfile.objects.bulk_create(
            missing_profiles,
            ignore_conflicts=True,
        )