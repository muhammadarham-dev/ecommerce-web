from django_filters import rest_framework as filters

from .models import Payment


class PaymentFilter(filters.FilterSet):
    order_number = filters.CharFilter(
        field_name="order__order_number",
        lookup_expr="iexact",
    )

    created_from = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="gte",
    )

    created_to = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="lte",
    )

    class Meta:
        model = Payment

        fields = [
            "method",
            "status",
            "order_number",
        ]