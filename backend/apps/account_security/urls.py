from django.urls import path

from .login_views import (
    LoginAttemptListView,
    LoginSecuritySummaryView,
    SecureLoginView,
)
from .token_views import (
    LogoutAllDevicesView,
    SecureLogoutView,
    SecureTokenRefreshView,
)
from .views import (
    AccountSecurityStatusView,
    ConfirmEmailVerificationView,
    ForgotPasswordView,
    PasswordChangeView,
    PasswordResetConfirmView,
    SendEmailVerificationView,
)


app_name = "account_security"


urlpatterns = [
    path(
        "login/",
        SecureLoginView.as_view(),
        name="secure-login",
    ),

    path(
        "token/refresh/",
        SecureTokenRefreshView.as_view(),
        name="secure-token-refresh",
    ),

    path(
        "logout/",
        SecureLogoutView.as_view(),
        name="secure-logout",
    ),

    path(
        "logout-all/",
        LogoutAllDevicesView.as_view(),
        name="logout-all-devices",
    ),

    path(
        "login-attempts/",
        LoginAttemptListView.as_view(),
        name="login-attempt-list",
    ),

    path(
        "login-summary/",
        LoginSecuritySummaryView.as_view(),
        name="login-security-summary",
    ),

    path(
        "status/",
        AccountSecurityStatusView.as_view(),
        name="account-security-status",
    ),

    path(
        "email/send/",
        SendEmailVerificationView.as_view(),
        name="send-email-verification",
    ),

    path(
        "email/confirm/",
        ConfirmEmailVerificationView.as_view(),
        name="confirm-email-verification",
    ),

    path(
        "password/forgot/",
        ForgotPasswordView.as_view(),
        name="forgot-password",
    ),

    path(
        "password/reset/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),

    path(
        "password/change/",
        PasswordChangeView.as_view(),
        name="password-change",
    ),
]