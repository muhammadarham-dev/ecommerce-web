from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import (
    InvalidToken,
    TokenError,
)
from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import (
    api_settings,
)
from rest_framework_simplejwt.tokens import (
    RefreshToken,
)

from .login_services import build_user_data
from .token_services import (
    blacklist_all_user_tokens,
    blacklist_refresh_token,
)


User = get_user_model()


class SecureTokenRefreshSerializer(
    TokenRefreshSerializer
):
    def validate(self, attributes):
        raw_refresh_token = attributes[
            "refresh"
        ]

        try:
            refresh_token = RefreshToken(
                raw_refresh_token
            )

        except TokenError as error:
            raise InvalidToken(
                "The refresh token is invalid, "
                "expired or revoked."
            ) from error

        user_id = refresh_token.get(
            api_settings.USER_ID_CLAIM
        )

        if user_id is None:
            raise InvalidToken(
                "The refresh token does not contain "
                "a valid user identifier."
            )

        user_lookup = {
            api_settings.USER_ID_FIELD: user_id,
        }

        user = (
            User.objects
            .select_related(
                "security_profile",
            )
            .filter(
                **user_lookup,
                is_active=True,
            )
            .first()
        )

        if user is None:
            raise InvalidToken(
                "The account associated with this "
                "refresh token is unavailable."
            )

        token_data = super().validate(
            attributes
        )

        token_data["user"] = build_user_data(
            user
        )

        return token_data


class SecureLogoutSerializer(
    serializers.Serializer
):
    refresh = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def create(self, validated_data):
        blacklist_refresh_token(
            refresh_token=(
                validated_data["refresh"]
            )
        )

        return {
            "revoked": True,
        }


class LogoutAllDevicesSerializer(
    serializers.Serializer
):
    def create(self, validated_data):
        request = self.context["request"]

        revoked_tokens = (
            blacklist_all_user_tokens(
                user=request.user,
            )
        )

        return {
            "revoked_tokens": revoked_tokens,
        }