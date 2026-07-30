from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()

class UserSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
        ]

        read_only_fields = [
            "id",
            "role",
        ]

    def validate_username(self, value):
        normalized_username = value.strip()

        queryset = User.objects.filter(
            username__iexact=normalized_username,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return normalized_username

    def validate_email(self, value):
        normalized_email = (
            value.strip().lower()
        )

        queryset = User.objects.filter(
            email__iexact=normalized_email,
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this email address already exists."
            )

        return normalized_email

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password_confirm",
        ]

    def validate_email(self, value):
        normalized_email = value.strip().lower()

        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "A user with this email address already exists."
            )

        return normalized_email

    def validate(self, attributes):
        password = attributes.get("password")
        password_confirm = attributes.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError(
                {
                    "password_confirm": "Password confirmation does not match."
                }
            )

        temporary_user = User(
            username=attributes.get("username"),
            email=attributes.get("email"),
            first_name=attributes.get("first_name", ""),
            last_name=attributes.get("last_name", ""),
        )

        try:
            validate_password(password, user=temporary_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(
                {"password": list(error.messages)}
            ) from error

        return attributes

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            role=User.Role.CUSTOMER,
            **validated_data,
        )


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attributes):
        data = super().validate(attributes)

        data["user"] = UserSerializer(self.user).data

        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate_refresh(self, value):
        try:
            self.token = RefreshToken(value)
        except TokenError as error:
            raise serializers.ValidationError(
                "The refresh token is invalid or expired."
            ) from error

        return value

    def save(self, **kwargs):
        self.token.blacklist()