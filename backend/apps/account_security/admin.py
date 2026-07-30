from django.contrib import admin

from .models import (
    AccountSecurityProfile,
    LoginAttempt,
)


@admin.register(AccountSecurityProfile)
class AccountSecurityProfileAdmin(
    admin.ModelAdmin
):
    list_display = [
        "id",
        "user",
        "email_display",
        "verification_status",
        "email_verified_at",
        "last_verification_email_sent_at",
        "last_password_reset_requested_at",
    ]

    list_filter = [
        "email_verified_at",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "user__username",
        "user__email",
        "verified_email",
    ]

    readonly_fields = [
        "user",
        "verified_email",
        "email_verified_at",
        "last_verification_email_sent_at",
        "last_password_reset_requested_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-updated_at",
    ]

    def email_display(self, profile):
        return profile.user.email

    email_display.short_description = (
        "Current Email"
    )

    def verification_status(self, profile):
        return (
            "Verified"
            if profile.is_email_verified
            else "Not Verified"
        )

    verification_status.short_description = (
        "Verification Status"
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "identifier_hint",
        "user",
        "ip_address",
        "successful",
        "failure_reason",
        "created_at",
    ]

    list_filter = [
        "successful",
        "failure_reason",
        "created_at",
    ]

    search_fields = [
        "identifier_hint",
        "user__username",
        "user__email",
        "ip_address",
        "user_agent",
    ]

    readonly_fields = [
        "user",
        "identifier_hash",
        "identifier_hint",
        "ip_address",
        "successful",
        "failure_reason",
        "user_agent",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False