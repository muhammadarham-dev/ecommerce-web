from django.conf import settings
from django.db import models
from django.utils import timezone


class AccountSecurityProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="security_profile",
    )

    verified_email = models.EmailField(
        blank=True,
    )

    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_verification_email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_password_reset_requested_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-updated_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "verified_email",
                ],
            ),
            models.Index(
                fields=[
                    "email_verified_at",
                ],
            ),
        ]

    @property
    def is_email_verified(self):
        current_email = (
            self.user.email or ""
        ).strip().lower()

        verified_email = (
            self.verified_email or ""
        ).strip().lower()

        return bool(
            current_email
            and verified_email
            and current_email == verified_email
            and self.email_verified_at is not None
        )

    def mark_email_verified(self):
        self.verified_email = (
            self.user.email.strip().lower()
        )

        self.email_verified_at = timezone.now()

        self.save(
            update_fields=[
                "verified_email",
                "email_verified_at",
                "updated_at",
            ]
        )

    def clear_email_verification(self):
        self.verified_email = ""
        self.email_verified_at = None

        self.save(
            update_fields=[
                "verified_email",
                "email_verified_at",
                "updated_at",
            ]
        )

    def __str__(self):
        status_value = (
            "Verified"
            if self.is_email_verified
            else "Not Verified"
        )

        return (
            f"{self.user.username} - "
            f"{status_value}"
        )


class LoginAttempt(models.Model):
    class FailureReason(models.TextChoices):
        INVALID_CREDENTIALS = (
            "INVALID_CREDENTIALS",
            "Invalid Credentials",
        )

        IDENTIFIER_BLOCKED = (
            "IDENTIFIER_BLOCKED",
            "Identifier Temporarily Blocked",
        )

        IP_BLOCKED = (
            "IP_BLOCKED",
            "IP Address Temporarily Blocked",
        )

        INACTIVE_ACCOUNT = (
            "INACTIVE_ACCOUNT",
            "Inactive Account",
        )

        NONE = "NONE", "None"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="login_attempts",
        null=True,
        blank=True,
    )

    identifier_hash = models.CharField(
        max_length=64,
        db_index=True,
    )

    identifier_hint = models.CharField(
        max_length=255,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    successful = models.BooleanField(
        default=False,
    )

    failure_reason = models.CharField(
        max_length=40,
        choices=FailureReason.choices,
        default=FailureReason.NONE,
    )

    user_agent = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "identifier_hash",
                    "successful",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "ip_address",
                    "successful",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "user",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "failure_reason",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        login_status = (
            "Successful"
            if self.successful
            else "Failed"
        )

        return (
            f"{self.identifier_hint} - "
            f"{login_status}"
        )