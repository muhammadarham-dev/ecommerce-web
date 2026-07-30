from datetime import timedelta

from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    generics,
    status,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import LoginAttemptFilter
from .login_attempt_serializers import (
    LoginAttemptSerializer,
)
from .login_serializers import (
    SecureLoginSerializer,
)
from .models import LoginAttempt
from .permissions import (
    IsAccountSecurityAdministrator,
)


class SecureLoginView(APIView):
    permission_classes = [
        AllowAny,
    ]
    throttle_scope = "secure_login"

    def post(self, request):
        serializer = SecureLoginSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        login_data = serializer.save()

        return Response(
            {
                "message": (
                    "Signed in successfully."
                ),
                **login_data,
            },
            status=status.HTTP_200_OK,
        )


class LoginAttemptListView(
    generics.ListAPIView
):
    serializer_class = (
        LoginAttemptSerializer
    )

    permission_classes = [
        IsAccountSecurityAdministrator,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = LoginAttemptFilter

    search_fields = [
        "identifier_hint",
        "ip_address",
        "user__username",
        "user__email",
        "user_agent",
    ]

    ordering_fields = [
        "created_at",
        "successful",
        "failure_reason",
        "ip_address",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            LoginAttempt.objects
            .select_related("user")
            .all()
        )


class LoginSecuritySummaryView(APIView):
    permission_classes = [
        IsAccountSecurityAdministrator,
    ]

    def get(self, request):
        today = timezone.localdate()

        lockout_minutes = getattr(
            settings,
            "LOGIN_LOCKOUT_MINUTES",
            15,
        )

        lockout_start = (
            timezone.now()
            - timedelta(
                minutes=lockout_minutes,
            )
        )

        attempts = LoginAttempt.objects.all()

        today_attempts = attempts.filter(
            created_at__date=today,
        )

        recent_failed_attempts = (
            attempts.filter(
                successful=False,
                created_at__gte=lockout_start,
            )
        )

        top_failed_ips = (
            recent_failed_attempts
            .exclude(ip_address__isnull=True)
            .values("ip_address")
            .annotate(
                attempts=Count("id"),
            )
            .order_by("-attempts")[:10]
        )

        latest_failed_attempts = (
            LoginAttempt.objects
            .select_related("user")
            .filter(successful=False)
            .order_by("-created_at")[:10]
        )

        return Response(
            {
                "settings": {
                    "identifier_attempt_limit": getattr(
                        settings,
                        "LOGIN_MAX_IDENTIFIER_ATTEMPTS",
                        5,
                    ),
                    "ip_attempt_limit": getattr(
                        settings,
                        "LOGIN_MAX_IP_ATTEMPTS",
                        20,
                    ),
                    "lockout_minutes": (
                        lockout_minutes
                    ),
                },
                "summary": {
                    "total_attempts": (
                        attempts.count()
                    ),
                    "today_attempts": (
                        today_attempts.count()
                    ),
                    "today_successful": (
                        today_attempts.filter(
                            successful=True,
                        ).count()
                    ),
                    "today_failed": (
                        today_attempts.filter(
                            successful=False,
                        ).count()
                    ),
                    "recent_failed_attempts": (
                        recent_failed_attempts.count()
                    ),
                    "blocked_identifier_attempts": (
                        today_attempts.filter(
                            failure_reason=(
                                LoginAttempt
                                .FailureReason
                                .IDENTIFIER_BLOCKED
                            )
                        ).count()
                    ),
                    "blocked_ip_attempts": (
                        today_attempts.filter(
                            failure_reason=(
                                LoginAttempt
                                .FailureReason
                                .IP_BLOCKED
                            )
                        ).count()
                    ),
                },
                "top_failed_ips": [
                    {
                        "ip_address": (
                            row["ip_address"]
                        ),
                        "attempts": (
                            row["attempts"]
                        ),
                    }
                    for row in top_failed_ips
                ],
                "latest_failed_attempts": (
                    LoginAttemptSerializer(
                        latest_failed_attempts,
                        many=True,
                    ).data
                ),
            },
            status=status.HTTP_200_OK,
        )