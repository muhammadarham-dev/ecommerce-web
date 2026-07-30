import hashlib
import ipaddress
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import (
    authenticate,
    get_user_model,
)
from django.contrib.auth.models import (
    update_last_login,
)
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import (
    RefreshToken,
)

from .models import LoginAttempt


User = get_user_model()


def normalize_identifier(identifier):
    return identifier.strip().lower()


def hash_identifier(identifier):
    normalized_identifier = (
        normalize_identifier(identifier)
    )

    return hashlib.sha256(
        normalized_identifier.encode("utf-8")
    ).hexdigest()


def mask_identifier(identifier):
    normalized_identifier = (
        normalize_identifier(identifier)
    )

    if "@" in normalized_identifier:
        local_part, domain = (
            normalized_identifier.split(
                "@",
                1,
            )
        )

        visible_character = (
            local_part[:1]
            if local_part
            else "*"
        )

        return (
            f"{visible_character}***@{domain}"
        )

    if len(normalized_identifier) <= 2:
        return (
            normalized_identifier[:1]
            + "***"
        )

    return (
        normalized_identifier[:2]
        + "***"
    )


def normalize_ip_address(ip_address):
    if not ip_address:
        return None

    try:
        return str(
            ipaddress.ip_address(
                ip_address.strip()
            )
        )

    except ValueError:
        return None


def get_client_ip(request):
    forwarded_for = request.META.get(
        "HTTP_X_FORWARDED_FOR",
        "",
    )

    if forwarded_for:
        first_ip = forwarded_for.split(
            ","
        )[0]

        normalized_ip = normalize_ip_address(
            first_ip
        )

        if normalized_ip:
            return normalized_ip

    return normalize_ip_address(
        request.META.get(
            "REMOTE_ADDR",
            "",
        )
    )


def get_lockout_start_time():
    lockout_minutes = getattr(
        settings,
        "LOGIN_LOCKOUT_MINUTES",
        15,
    )

    return (
        timezone.now()
        - timedelta(
            minutes=lockout_minutes,
        )
    )


def get_identifier_failed_attempts(
    *,
    identifier_hash,
):
    return (
        LoginAttempt.objects
        .filter(
            identifier_hash=identifier_hash,
            successful=False,
            created_at__gte=(
                get_lockout_start_time()
            ),
        )
        .count()
    )


def get_ip_failed_attempts(
    *,
    ip_address,
):
    if ip_address is None:
        return 0

    return (
        LoginAttempt.objects
        .filter(
            ip_address=ip_address,
            successful=False,
            created_at__gte=(
                get_lockout_start_time()
            ),
        )
        .count()
    )


def get_remaining_lockout_seconds(
    *,
    queryset,
):
    latest_attempt = (
        queryset
        .order_by("-created_at")
        .first()
    )

    if latest_attempt is None:
        return 0

    lockout_minutes = getattr(
        settings,
        "LOGIN_LOCKOUT_MINUTES",
        15,
    )

    unlock_time = (
        latest_attempt.created_at
        + timedelta(
            minutes=lockout_minutes,
        )
    )

    remaining_seconds = int(
        (
            unlock_time
            - timezone.now()
        ).total_seconds()
    )

    return max(
        remaining_seconds,
        0,
    )


def get_user_by_identifier(identifier):
    normalized_identifier = (
        normalize_identifier(identifier)
    )

    if "@" in normalized_identifier:
        return (
            User.objects
            .filter(
                email__iexact=(
                    normalized_identifier
                )
            )
            .order_by("id")
            .first()
        )

    return (
        User.objects
        .filter(
            username__iexact=(
                normalized_identifier
            )
        )
        .order_by("id")
        .first()
    )


def record_login_attempt(
    *,
    identifier_hash,
    identifier_hint,
    ip_address,
    user_agent,
    successful,
    failure_reason,
    user=None,
):
    return LoginAttempt.objects.create(
        user=user,
        identifier_hash=identifier_hash,
        identifier_hint=identifier_hint,
        ip_address=ip_address,
        user_agent=user_agent[:5000],
        successful=successful,
        failure_reason=failure_reason,
    )


def build_user_data(user):
    security_profile = getattr(
        user,
        "security_profile",
        None,
    )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": (
            user.get_full_name()
            or user.username
        ),
        "role": getattr(
            user,
            "role",
            "",
        ),
        "is_email_verified": (
            security_profile.is_email_verified
            if security_profile
            else False
        ),
    }


@transaction.atomic
def secure_login(
    *,
    request,
    identifier,
    password,
):
    normalized_identifier = (
        normalize_identifier(identifier)
    )

    identifier_hash = hash_identifier(
        normalized_identifier
    )

    identifier_hint = mask_identifier(
        normalized_identifier
    )

    ip_address = get_client_ip(
        request
    )

    user_agent = request.META.get(
        "HTTP_USER_AGENT",
        "",
    )

    max_identifier_attempts = getattr(
        settings,
        "LOGIN_MAX_IDENTIFIER_ATTEMPTS",
        5,
    )

    max_ip_attempts = getattr(
        settings,
        "LOGIN_MAX_IP_ATTEMPTS",
        20,
    )

    identifier_attempts = (
        get_identifier_failed_attempts(
            identifier_hash=identifier_hash,
        )
    )

    if (
        identifier_attempts
        >= max_identifier_attempts
    ):
        identifier_queryset = (
            LoginAttempt.objects
            .filter(
                identifier_hash=(
                    identifier_hash
                ),
                successful=False,
                created_at__gte=(
                    get_lockout_start_time()
                ),
            )
        )

        remaining_seconds = (
            get_remaining_lockout_seconds(
                queryset=identifier_queryset,
            )
        )

        record_login_attempt(
            identifier_hash=identifier_hash,
            identifier_hint=identifier_hint,
            ip_address=ip_address,
            user_agent=user_agent,
            successful=False,
            failure_reason=(
                LoginAttempt
                .FailureReason
                .IDENTIFIER_BLOCKED
            ),
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Too many failed login attempts. "
                    "Please try again later."
                ),
                "locked": True,
                "retry_after_seconds": (
                    remaining_seconds
                ),
            }
        )

    ip_attempts = get_ip_failed_attempts(
        ip_address=ip_address,
    )

    if ip_attempts >= max_ip_attempts:
        ip_queryset = (
            LoginAttempt.objects
            .filter(
                ip_address=ip_address,
                successful=False,
                created_at__gte=(
                    get_lockout_start_time()
                ),
            )
        )

        remaining_seconds = (
            get_remaining_lockout_seconds(
                queryset=ip_queryset,
            )
        )

        record_login_attempt(
            identifier_hash=identifier_hash,
            identifier_hint=identifier_hint,
            ip_address=ip_address,
            user_agent=user_agent,
            successful=False,
            failure_reason=(
                LoginAttempt
                .FailureReason
                .IP_BLOCKED
            ),
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Too many failed login attempts "
                    "from this network. "
                    "Please try again later."
                ),
                "locked": True,
                "retry_after_seconds": (
                    remaining_seconds
                ),
            }
        )

    candidate_user = get_user_by_identifier(
        normalized_identifier
    )

    if (
        candidate_user is not None
        and not candidate_user.is_active
    ):
        record_login_attempt(
            identifier_hash=identifier_hash,
            identifier_hint=identifier_hint,
            ip_address=ip_address,
            user_agent=user_agent,
            successful=False,
            failure_reason=(
                LoginAttempt
                .FailureReason
                .INACTIVE_ACCOUNT
            ),
            user=candidate_user,
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Unable to sign in using "
                    "the provided credentials."
                )
            }
        )

    authenticated_user = None

    if candidate_user is not None:
        username_field = (
            User.USERNAME_FIELD
        )

        username_value = getattr(
            candidate_user,
            username_field,
        )

        authenticated_user = authenticate(
            request=request,
            password=password,
            **{
                username_field: username_value,
            },
        )

    if authenticated_user is None:
        record_login_attempt(
            identifier_hash=identifier_hash,
            identifier_hint=identifier_hint,
            ip_address=ip_address,
            user_agent=user_agent,
            successful=False,
            failure_reason=(
                LoginAttempt
                .FailureReason
                .INVALID_CREDENTIALS
            ),
            user=candidate_user,
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Unable to sign in using "
                    "the provided credentials."
                )
            }
        )

    record_login_attempt(
        identifier_hash=identifier_hash,
        identifier_hint=identifier_hint,
        ip_address=ip_address,
        user_agent=user_agent,
        successful=True,
        failure_reason=(
            LoginAttempt.FailureReason.NONE
        ),
        user=authenticated_user,
    )

    update_last_login(
        None,
        authenticated_user,
    )

    refresh_token = RefreshToken.for_user(
        authenticated_user
    )

    return {
        "access": str(
            refresh_token.access_token
        ),
        "refresh": str(
            refresh_token
        ),
        "user": build_user_data(
            authenticated_user
        ),
    }