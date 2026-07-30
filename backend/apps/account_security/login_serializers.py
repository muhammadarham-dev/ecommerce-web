from rest_framework import serializers

from .login_services import secure_login


class SecureLoginSerializer(
    serializers.Serializer
):
    identifier = serializers.CharField(
        max_length=255,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        max_length=128,
    )

    def validate_identifier(self, value):
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError(
                "Username or email is required."
            )

        return normalized_value

    def create(self, validated_data):
        request = self.context["request"]

        return secure_login(
            request=request,
            identifier=(
                validated_data["identifier"]
            ),
            password=(
                validated_data["password"]
            ),
        )