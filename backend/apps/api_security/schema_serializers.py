from rest_framework import serializers


class EmptyRequestSerializer(serializers.Serializer):
    pass


class MessageResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class UserSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()

    username = serializers.CharField()

    email = serializers.EmailField(
        allow_blank=True,
    )

    first_name = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    last_name = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    full_name = serializers.CharField()

    role = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    is_email_verified = serializers.BooleanField()


class AuthenticationResponseSerializer(
    serializers.Serializer
):
    message = serializers.CharField()

    access = serializers.CharField()

    refresh = serializers.CharField()

    user = UserSummarySerializer()


class LogoutAllDevicesResponseSerializer(
    serializers.Serializer
):
    message = serializers.CharField()

    revoked_tokens = serializers.IntegerField()


class AccountSecurityStatusResponseSerializer(
    serializers.Serializer
):
    user_id = serializers.IntegerField(
        required=False,
    )

    username = serializers.CharField(
        required=False,
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    is_email_verified = serializers.BooleanField(
        required=False,
    )

    verified_email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    email_verified_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    last_verification_email_sent_at = (
        serializers.DateTimeField(
            required=False,
            allow_null=True,
        )
    )

    last_password_reset_requested_at = (
        serializers.DateTimeField(
            required=False,
            allow_null=True,
        )
    )


class EmailVerificationConfirmRequestSerializer(
    serializers.Serializer
):
    uid = serializers.CharField()

    token = serializers.CharField()


class ForgotPasswordRequestSerializer(
    serializers.Serializer
):
    email = serializers.EmailField()


class PasswordResetConfirmRequestSerializer(
    serializers.Serializer
):
    uid = serializers.CharField()

    token = serializers.CharField()

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )


class CartItemCreateSchemaSerializer(
    serializers.Serializer
):
    product_id = serializers.IntegerField()

    variant_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )


class CartItemUpdateSchemaSerializer(
    serializers.Serializer
):
    quantity = serializers.IntegerField(
        min_value=1,
    )


class GenericObjectSerializer(
    serializers.Serializer
):
    data = serializers.JSONField(
        required=False,
    )