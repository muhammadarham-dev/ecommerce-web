from django.db.models import (
    Avg,
    Count,
    Q,
)
from django.utils import timezone
from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    status,
    viewsets,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import AuditLogFilter
from .models import AuditLog
from .permissions import (
    IsAuditLogAdministrator,
)
from .serializers import AuditLogSerializer


def get_audit_log_queryset():
    return (
        AuditLog.objects
        .select_related("user")
        .all()
    )


class AuditLogViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = AuditLogSerializer

    permission_classes = [
        IsAuditLogAdministrator,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = AuditLogFilter

    search_fields = [
        "request_id",
        "path",
        "route_name",
        "user__username",
        "user__email",
        "ip_address",
        "user_agent",
        "error_message",
    ]

    ordering_fields = [
        "created_at",
        "duration_ms",
        "status_code",
        "action",
        "method",
        "success",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_audit_log_queryset()


class AuditLogSummaryView(APIView):
    permission_classes = [
        IsAuditLogAdministrator,
    ]

    def get(self, request):
        today = timezone.localdate()

        audit_logs = AuditLog.objects.all()

        today_logs = audit_logs.filter(
            created_at__date=today,
        )

        failed_logs = audit_logs.filter(
            success=False,
        )

        today_failed_logs = (
            today_logs.filter(
                success=False,
            )
        )

        average_duration = (
            today_logs.aggregate(
                average=Avg("duration_ms"),
            ).get("average")
            or 0
        )

        action_rows = (
            today_logs
            .values("action")
            .annotate(
                count=Count("id"),
            )
            .order_by("-count")
        )

        method_rows = (
            today_logs
            .values("method")
            .annotate(
                count=Count("id"),
            )
            .order_by("-count")
        )

        top_path_rows = (
            today_logs
            .values("path")
            .annotate(
                count=Count("id"),
            )
            .order_by("-count")[:10]
        )

        status_summary = {
            "successful_2xx": (
                today_logs
                .filter(
                    status_code__gte=200,
                    status_code__lt=300,
                )
                .count()
            ),
            "redirects_3xx": (
                today_logs
                .filter(
                    status_code__gte=300,
                    status_code__lt=400,
                )
                .count()
            ),
            "client_errors_4xx": (
                today_logs
                .filter(
                    status_code__gte=400,
                    status_code__lt=500,
                )
                .count()
            ),
            "server_errors_5xx": (
                today_logs
                .filter(
                    status_code__gte=500,
                )
                .count()
            ),
        }

        suspicious_requests = (
            today_logs
            .filter(
                Q(status_code=401)
                | Q(status_code=403)
                | Q(status_code=429)
            )
            .count()
        )

        latest_failed_logs = (
            get_audit_log_queryset()
            .filter(success=False)
            .order_by("-created_at")[:10]
        )

        return Response(
            {
                "summary": {
                    "total_logs": (
                        audit_logs.count()
                    ),
                    "today_logs": (
                        today_logs.count()
                    ),
                    "total_failed_requests": (
                        failed_logs.count()
                    ),
                    "today_failed_requests": (
                        today_failed_logs.count()
                    ),
                    "today_suspicious_requests": (
                        suspicious_requests
                    ),
                    "average_duration_ms": round(
                        float(average_duration),
                        2,
                    ),
                },
                "status_codes": status_summary,
                "actions": [
                    {
                        "action": row["action"],
                        "label": dict(
                            AuditLog.Action.choices
                        ).get(
                            row["action"],
                            row["action"],
                        ),
                        "count": row["count"],
                    }
                    for row in action_rows
                ],
                "methods": [
                    {
                        "method": row["method"],
                        "count": row["count"],
                    }
                    for row in method_rows
                ],
                "top_paths": [
                    {
                        "path": row["path"],
                        "count": row["count"],
                    }
                    for row in top_path_rows
                ],
                "latest_failed_requests": (
                    AuditLogSerializer(
                        latest_failed_logs,
                        many=True,
                    ).data
                ),
            },
            status=status.HTTP_200_OK,
        )