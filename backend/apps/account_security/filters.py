from django_filters import rest_framework as filters

from .models import LoginAttempt


class LoginAttemptFilter(filters.FilterSet):
    username = filters.CharFilter(
        field_name="user__username",
        lookup_expr="icontains",
    )

    email = filters.CharFilter(
        field_name="user__email",
        lookup_expr="icontains",
    )

    identifier_hint = filters.CharFilter(
        field_name="identifier_hint",
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
        model = LoginAttempt

        fields = [
            "successful",
            "failure_reason",
            "ip_address",
            "user",
            "username",
            "email",
            "identifier_hint",
        ]