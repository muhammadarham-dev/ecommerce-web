from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import (
    TokenError,
)
from rest_framework_simplejwt.settings import (
    api_settings,
)
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import (
    RefreshToken,
)


User = get_user_model()


def get_user_from_refresh_token(
    *,
    refresh_token,
):
    try:
        token = RefreshToken(
            refresh_token
        )

    except TokenError as error:
        raise serializers.ValidationError(
            {
                "refresh": (
                    "The refresh token is invalid "
                    "or has expired."
                )
            }
        ) from error

    user_id = token.get(
        api_settings.USER_ID_CLAIM
    )

    if user_id is None:
        raise serializers.ValidationError(
            {
                "refresh": (
                    "The refresh token does not contain "
                    "a valid user identifier."
                )
            }
        )

    user_lookup = {
        api_settings.USER_ID_FIELD: user_id,
    }

    user = (
        User.objects
        .filter(
            **user_lookup,
        )
        .first()
    )

    if user is None or not user.is_active:
        raise serializers.ValidationError(
            {
                "refresh": (
                    "The account associated with this "
                    "refresh token is unavailable."
                )
            }
        )

    return user, token


@transaction.atomic
def blacklist_refresh_token(
    *,
    refresh_token,
):
    try:
        token = RefreshToken(
            refresh_token
        )

        token.blacklist()

    except TokenError as error:
        raise serializers.ValidationError(
            {
                "refresh": (
                    "The refresh token is invalid, "
                    "expired or already revoked."
                )
            }
        ) from error

    return token


@transaction.atomic
def blacklist_all_user_tokens(
    *,
    user,
):
    outstanding_tokens = (
        OutstandingToken.objects
        .filter(
            user=user,
            expires_at__gt=timezone.now(),
        )
        .select_for_update()
    )

    revoked_tokens = 0

    for outstanding_token in outstanding_tokens:
        _, created = (
            BlacklistedToken.objects
            .get_or_create(
                token=outstanding_token,
            )
        )

        if created:
            revoked_tokens += 1

    return revoked_tokens