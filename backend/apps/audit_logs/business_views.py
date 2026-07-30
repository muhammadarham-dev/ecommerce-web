from django.db.models import Count
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

from .business_filters import (
    BusinessAuditEventFilter,
)
from .business_serializers import (
    BusinessAuditEventSerializer,
)
from .models import BusinessAuditEvent
from .permissions import (
    IsAuditLogAdministrator,
)


def get_business_event_queryset():
    return (
        BusinessAuditEvent.objects
        .select_related("actor")
        .all()
    )


class BusinessAuditEventViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        BusinessAuditEventSerializer
    )

    permission_classes = [
        IsAuditLogAdministrator,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = (
        BusinessAuditEventFilter
    )

    search_fields = [
        "object_reference",
        "object_id",
        "app_label",
        "model_name",
        "actor__username",
        "actor__email",
        "path",
        "metadata",
    ]

    ordering_fields = [
        "created_at",
        "event_type",
        "app_label",
        "model_name",
        "actor",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_business_event_queryset()


class BusinessAuditSummaryView(APIView):
    permission_classes = [
        IsAuditLogAdministrator,
    ]

    def get(self, request):
        today = timezone.localdate()

        events = BusinessAuditEvent.objects.all()

        today_events = events.filter(
            created_at__date=today,
        )

        event_type_rows = (
            today_events
            .values("event_type")
            .annotate(
                count=Count("id"),
            )
            .order_by("-count")
        )

        latest_events = (
            get_business_event_queryset()
            .order_by("-created_at")[:10]
        )

        latest_refunds = (
            get_business_event_queryset()
            .filter(
                event_type=(
                    BusinessAuditEvent.Type.REFUND_PROCESSED
                ),
            )
            .order_by("-created_at")[:10]
        )

        return Response(
            {
                "summary": {
                    "total_events": (
                        events.count()
                    ),
                    "today_events": (
                        today_events.count()
                    ),
                    "product_changes": (
                        today_events.filter(
                            event_type__in=[
                                BusinessAuditEvent.Type.PRODUCT_CREATED,
                                BusinessAuditEvent.Type.PRODUCT_UPDATED,
                                BusinessAuditEvent.Type.PRODUCT_DELETED,
                            ]
                        ).count()
                    ),
                    "coupon_changes": (
                        today_events.filter(
                            event_type__in=[
                                BusinessAuditEvent.Type.COUPON_CREATED,
                                BusinessAuditEvent.Type.COUPON_UPDATED,
                                BusinessAuditEvent.Type.COUPON_DELETED,
                            ]
                        ).count()
                    ),
                    "stock_movements": (
                        today_events.filter(
                            event_type=(
                                BusinessAuditEvent.Type.STOCK_MOVEMENT
                            ),
                        ).count()
                    ),
                    "refunds_processed": (
                        today_events.filter(
                            event_type=(
                                BusinessAuditEvent.Type.REFUND_PROCESSED
                            ),
                        ).count()
                    ),
                },
                "events_by_type": [
                    {
                        "event_type": (
                            row["event_type"]
                        ),
                        "label": dict(
                            BusinessAuditEvent.Type.choices
                        ).get(
                            row["event_type"],
                            row["event_type"],
                        ),
                        "count": row["count"],
                    }
                    for row in event_type_rows
                ],
                "latest_events": (
                    BusinessAuditEventSerializer(
                        latest_events,
                        many=True,
                    ).data
                ),
                "latest_refunds": (
                    BusinessAuditEventSerializer(
                        latest_refunds,
                        many=True,
                    ).data
                ),
            },
            status=status.HTTP_200_OK,
        )