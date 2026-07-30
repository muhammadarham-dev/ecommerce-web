from django_filters import rest_framework as filters

from .models import BusinessAuditEvent


class BusinessAuditEventFilter(
    filters.FilterSet
):
    actor_id = filters.NumberFilter(
        field_name="actor_id",
    )

    username = filters.CharFilter(
        field_name="actor__username",
        lookup_expr="icontains",
    )

    request_id = filters.UUIDFilter(
        field_name="request_id",
    )

    object_reference = filters.CharFilter(
        field_name="object_reference",
        lookup_expr="icontains",
    )

    path = filters.CharFilter(
        field_name="path",
        lookup_expr="icontains",
    )

    created_from = filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="gte",
    )

    created_to = filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="lte",
    )

    class Meta:
        model = BusinessAuditEvent

        fields = [
            "event_type",
            "actor_id",
            "username",
            "request_id",
            "app_label",
            "model_name",
            "object_id",
            "object_reference",
            "method",
            "path",
            "ip_address",
        ]