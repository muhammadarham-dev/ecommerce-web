from rest_framework import serializers

from .models import AccountSecurityProfile
from .services import (
    change_account_password,
    confirm_email_verification,
    request_password_reset,
    reset_account_password,
    send_email_verification,
)


class AccountSecurityStatusSerializer(
    serializers.ModelSerializer
):
    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    is_email_verified = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = AccountSecurityProfile

        fields = [
            "username",
            "email",
            "verified_email",
            "is_email_verified",
            "email_verified_at",
            "last_verification_email_sent_at",
            "last_password_reset_requested_at",
        ]

        read_only_fields = fields


class EmailVerificationSendSerializer(
    serializers.Serializer
):
    def create(self, validated_data):
        request = self.context["request"]

        return send_email_verification(
            user=request.user,
        )


class EmailVerificationConfirmSerializer(
    serializers.Serializer
):
    token = serializers.CharField(
        trim_whitespace=False,
    )

    def create(self, validated_data):
        return confirm_email_verification(
            token=validated_data["token"],
        )


class ForgotPasswordSerializer(
    serializers.Serializer
):
    email = serializers.EmailField()

    def create(self, validated_data):
        return request_password_reset(
            email=validated_data["email"],
        )


class PasswordResetConfirmSerializer(
    serializers.Serializer
):
    uid = serializers.CharField(
        trim_whitespace=False,
    )

    token = serializers.CharField(
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    def validate(self, attributes):
        if (
            attributes["new_password"]
            != attributes["confirm_password"]
        ):
            raise serializers.ValidationError(
                {
                    "confirm_password": (
                        "The password confirmation "
                        "does not match."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        return reset_account_password(
            uid=validated_data["uid"],
            token=validated_data["token"],
            new_password=(
                validated_data["new_password"]
            ),
        )


class PasswordChangeSerializer(
    serializers.Serializer
):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
    )

    def validate(self, attributes):
        if (
            attributes["new_password"]
            != attributes["confirm_password"]
        ):
            raise serializers.ValidationError(
                {
                    "confirm_password": (
                        "The password confirmation "
                        "does not match."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        request = self.context["request"]

        return change_account_password(
            user=request.user,
            current_password=(
                validated_data[
                    "current_password"
                ]
            ),
            new_password=(
                validated_data["new_password"]
            ),
        )