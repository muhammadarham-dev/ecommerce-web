from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.contrib.auth.tokens import (
    default_token_generator,
)
from django.core import signing
from django.core.mail import send_mail
from django.db import transaction
from django.db.utils import (
    OperationalError,
    ProgrammingError,
)
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)

from .token_services import (
    blacklist_all_user_tokens,
)
from rest_framework import serializers

from .models import AccountSecurityProfile


User = get_user_model()


EMAIL_VERIFICATION_SALT = (
    "ecommerce-account-email-verification"
)


def get_security_profile(*, user):
    profile, _ = (
        AccountSecurityProfile.objects
        .get_or_create(user=user)
    )

    return profile


def get_store_email_identity():
    store_name = "Ecommerce Store"
    support_email = settings.DEFAULT_FROM_EMAIL

    try:
        from apps.store_settings.services import (
            get_store_settings,
        )

        store_settings = get_store_settings()

        store_name = (
            store_settings.store_name
            or store_name
        )

        support_email = (
            store_settings.support_email
            or support_email
        )

    except (
        OperationalError,
        ProgrammingError,
    ):
        pass

    return store_name, support_email


def build_frontend_url(
    *,
    path,
    query_parameters,
):
    frontend_url = getattr(
        settings,
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    query_string = urlencode(
        query_parameters
    )

    return (
        f"{frontend_url}/{path.lstrip('/')}?"
        f"{query_string}"
    )


def validate_request_cooldown(
    *,
    previous_request_time,
    field_name,
):
    if previous_request_time is None:
        return

    cooldown_seconds = getattr(
        settings,
        "ACCOUNT_EMAIL_COOLDOWN_SECONDS",
        60,
    )

    elapsed_seconds = (
        timezone.now()
        - previous_request_time
    ).total_seconds()

    if elapsed_seconds < cooldown_seconds:
        remaining_seconds = int(
            cooldown_seconds - elapsed_seconds
        ) + 1

        raise serializers.ValidationError(
            {
                field_name: (
                    "Please wait "
                    f"{remaining_seconds} seconds "
                    "before requesting another email."
                )
            }
        )


@transaction.atomic
def send_email_verification(*, user):
    if not user.is_active:
        raise serializers.ValidationError(
            {
                "account": (
                    "This account is inactive."
                )
            }
        )

    email = (user.email or "").strip().lower()

    if not email:
        raise serializers.ValidationError(
            {
                "email": (
                    "A valid email address is required."
                )
            }
        )

    profile = (
        AccountSecurityProfile.objects
        .select_for_update()
        .get_or_create(user=user)[0]
    )

    if profile.is_email_verified:
        raise serializers.ValidationError(
            {
                "email": (
                    "Your email address is already verified."
                )
            }
        )

    validate_request_cooldown(
        previous_request_time=(
            profile.last_verification_email_sent_at
        ),
        field_name="email",
    )

    token = signing.dumps(
        {
            "user_id": user.pk,
            "email": email,
        },
        salt=EMAIL_VERIFICATION_SALT,
        compress=True,
    )

    verification_url = build_frontend_url(
        path="verify-email",
        query_parameters={
            "token": token,
        },
    )

    store_name, support_email = (
        get_store_email_identity()
    )

    subject = (
        f"Verify your email address - "
        f"{store_name}"
    )

    message = (
        f"Hello {user.get_full_name() or user.username},\n\n"
        f"Please verify your email address for {store_name}.\n\n"
        f"Verification link:\n"
        f"{verification_url}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create this account, "
        f"you can ignore this email.\n\n"
        f"Support: {support_email}"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[
            email,
        ],
        fail_silently=False,
    )

    profile.last_verification_email_sent_at = (
        timezone.now()
    )

    profile.save(
        update_fields=[
            "last_verification_email_sent_at",
            "updated_at",
        ]
    )

    return profile


@transaction.atomic
def confirm_email_verification(*, token):
    verification_timeout = getattr(
        settings,
        "EMAIL_VERIFICATION_TIMEOUT",
        60 * 60 * 24,
    )

    try:
        token_data = signing.loads(
            token,
            salt=EMAIL_VERIFICATION_SALT,
            max_age=verification_timeout,
        )

    except signing.SignatureExpired as error:
        raise serializers.ValidationError(
            {
                "token": (
                    "The email verification link has expired."
                )
            }
        ) from error

    except signing.BadSignature as error:
        raise serializers.ValidationError(
            {
                "token": (
                    "The email verification link is invalid."
                )
            }
        ) from error

    user_id = token_data.get("user_id")
    token_email = (
        token_data.get("email") or ""
    ).strip().lower()

    try:
        user = User.objects.get(
            pk=user_id,
            is_active=True,
        )

    except User.DoesNotExist as error:
        raise serializers.ValidationError(
            {
                "token": (
                    "The account associated with this "
                    "verification link is unavailable."
                )
            }
        ) from error

    current_email = (
        user.email or ""
    ).strip().lower()

    if (
        not current_email
        or current_email != token_email
    ):
        raise serializers.ValidationError(
            {
                "token": (
                    "This verification link does not "
                    "match the current email address."
                )
            }
        )

    profile = (
        AccountSecurityProfile.objects
        .select_for_update()
        .get_or_create(user=user)[0]
    )

    if not profile.is_email_verified:
        profile.mark_email_verified()

    return profile


@transaction.atomic
def request_password_reset(*, email):
    normalized_email = email.strip().lower()

    user = (
        User.objects
        .filter(
            email__iexact=normalized_email,
            is_active=True,
        )
        .order_by("id")
        .first()
    )

    if user is None:
        return None

    profile = (
        AccountSecurityProfile.objects
        .select_for_update()
        .get_or_create(user=user)[0]
    )

    validate_request_cooldown(
        previous_request_time=(
            profile.last_password_reset_requested_at
        ),
        field_name="email",
    )

    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    token = default_token_generator.make_token(
        user
    )

    reset_url = build_frontend_url(
        path="reset-password",
        query_parameters={
            "uid": uid,
            "token": token,
        },
    )

    store_name, support_email = (
        get_store_email_identity()
    )

    subject = (
        f"Reset your password - {store_name}"
    )

    message = (
        f"Hello {user.get_full_name() or user.username},\n\n"
        f"We received a password reset request "
        f"for your {store_name} account.\n\n"
        f"Password reset link:\n"
        f"{reset_url}\n\n"
        f"This link will expire in one hour.\n\n"
        f"If you did not request this reset, "
        f"you can ignore this email.\n\n"
        f"Support: {support_email}"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[
            user.email,
        ],
        fail_silently=False,
    )

    profile.last_password_reset_requested_at = (
        timezone.now()
    )

    profile.save(
        update_fields=[
            "last_password_reset_requested_at",
            "updated_at",
        ]
    )

    return profile


@transaction.atomic
def reset_account_password(
    *,
    uid,
    token,
    new_password,
):
    try:
        user_id = urlsafe_base64_decode(
            uid
        ).decode()

        user = User.objects.get(
            pk=user_id,
            is_active=True,
        )

    except (
        TypeError,
        ValueError,
        OverflowError,
        UnicodeDecodeError,
        User.DoesNotExist,
    ) as error:
        raise serializers.ValidationError(
            {
                "token": (
                    "The password reset link is invalid."
                )
            }
        ) from error

    if not default_token_generator.check_token(
        user,
        token,
    ):
        raise serializers.ValidationError(
            {
                "token": (
                    "The password reset link is invalid "
                    "or has expired."
                )
            }
        )

    validate_password(
        new_password,
        user=user,
    )

    user.set_password(
        new_password
    )

    user.save(
        update_fields=[
            "password",
        ]
    )

    blacklist_all_user_tokens(
        user=user,
    )

    profile = get_security_profile(
        user=user,
    )

    profile.last_password_reset_requested_at = None

    profile.save(
        update_fields=[
            "last_password_reset_requested_at",
            "updated_at",
        ]
    )

    return user


@transaction.atomic
def change_account_password(
    *,
    user,
    current_password,
    new_password,
):
    if not user.check_password(
        current_password
    ):
        raise serializers.ValidationError(
            {
                "current_password": (
                    "The current password is incorrect."
                )
            }
        )

    if current_password == new_password:
        raise serializers.ValidationError(
            {
                "new_password": (
                    "The new password must be different "
                    "from the current password."
                )
            }
        )

    validate_password(
        new_password,
        user=user,
    )

    user.set_password(
        new_password
    )

    user.save(
        update_fields=[
            "password",
        ]
    )

    revoked_tokens = (
        blacklist_all_user_tokens(
            user=user,
        )
    )

    return {
        "user": user,
        "revoked_tokens": revoked_tokens,
    }