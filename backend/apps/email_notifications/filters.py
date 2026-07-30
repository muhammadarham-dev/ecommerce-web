from django_filters import rest_framework as filters

from .models import EmailLog


class EmailLogFilter(filters.FilterSet):
    recipient = filters.CharFilter(
        field_name="recipient",
        lookup_expr="icontains",
    )

    order_number = filters.CharFilter(
        field_name="order__order_number",
        lookup_expr="iexact",
    )

    return_number = filters.CharFilter(
        field_name=(
            "return_request__return_number"
        ),
        lookup_expr="iexact",
    )

    user_id = filters.NumberFilter(
        field_name="user_id",
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
        model = EmailLog

        fields = [
            "email_type",
            "status",
            "recipient",
            "order_number",
            "return_number",
            "user_id",
        ]