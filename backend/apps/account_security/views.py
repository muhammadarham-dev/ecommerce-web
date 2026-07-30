from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccountSecurityProfile
from .serializers import (
    AccountSecurityStatusSerializer,
    EmailVerificationConfirmSerializer,
    EmailVerificationSendSerializer,
    ForgotPasswordSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
)


class AccountSecurityStatusView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        profile, _ = (
            AccountSecurityProfile.objects
            .get_or_create(user=request.user)
        )

        serializer = (
            AccountSecurityStatusSerializer(
                profile,
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class SendEmailVerificationView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]
    throttle_scope = "verification_email"

    def post(self, request):
        serializer = (
            EmailVerificationSendSerializer(
                data=request.data,
                context={
                    "request": request,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        profile = serializer.save()

        return Response(
            {
                "message": (
                    "Verification email sent successfully."
                ),
                "email": request.user.email,
                "is_email_verified": (
                    profile.is_email_verified
                ),
            },
            status=status.HTTP_200_OK,
        )


class ConfirmEmailVerificationView(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_scope = "verification_confirm"

    def post(self, request):
        serializer = (
            EmailVerificationConfirmSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        profile = serializer.save()

        return Response(
            {
                "message": (
                    "Email address verified successfully."
                ),
                "email": profile.user.email,
                "is_email_verified": (
                    profile.is_email_verified
                ),
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordView(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_scope = "password_email"

    def post(self, request):
        serializer = ForgotPasswordSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "If an active account exists for "
                    "this email address, a password "
                    "reset link has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = (
            PasswordResetConfirmSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "Password reset successfully. "
                    "You can now sign in using your "
                    "new password."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordChangeView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        result = serializer.save()

        return Response(
            {
                "message": (
                    "Password changed successfully. "
                    "All active sessions have been "
                    "signed out."
                ),
                "revoked_tokens": result[
                    "revoked_tokens"
                ],
            },
            status=status.HTTP_200_OK,
        )