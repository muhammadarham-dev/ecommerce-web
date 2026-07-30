from django_filters import rest_framework as filters

from .models import AuditLog


class AuditLogFilter(filters.FilterSet):
    path = filters.CharFilter(
        field_name="path",
        lookup_expr="icontains",
    )

    route_name = filters.CharFilter(
        field_name="route_name",
        lookup_expr="icontains",
    )

    user_id = filters.NumberFilter(
        field_name="user_id",
    )

    username = filters.CharFilter(
        field_name="user__username",
        lookup_expr="icontains",
    )

    email = filters.CharFilter(
        field_name="user__email",
        lookup_expr="icontains",
    )

    ip_address = filters.CharFilter(
        field_name="ip_address",
        lookup_expr="exact",
    )

    status_code_min = filters.NumberFilter(
        field_name="status_code",
        lookup_expr="gte",
    )

    status_code_max = filters.NumberFilter(
        field_name="status_code",
        lookup_expr="lte",
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
        model = AuditLog

        fields = [
            "action",
            "method",
            "success",
            "status_code",
            "path",
            "route_name",
            "user_id",
            "username",
            "email",
            "ip_address",
        ]