from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .token_serializers import (
    LogoutAllDevicesSerializer,
    SecureLogoutSerializer,
    SecureTokenRefreshSerializer,
)


class SecureTokenRefreshView(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_scope = "token_refresh"

    def post(self, request):
        serializer = (
            SecureTokenRefreshSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        return Response(
            {
                "message": (
                    "Tokens refreshed successfully."
                ),
                **serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )


class SecureLogoutView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        serializer = SecureLogoutSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "Signed out successfully."
                )
            },
            status=status.HTTP_200_OK,
        )


class LogoutAllDevicesView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        serializer = (
            LogoutAllDevicesSerializer(
                data=request.data,
                context={
                    "request": request,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        result = serializer.save()

        return Response(
            {
                "message": (
                    "All active sessions have been "
                    "signed out successfully."
                ),
                "revoked_tokens": result[
                    "revoked_tokens"
                ],
            },
            status=status.HTTP_200_OK,
        )