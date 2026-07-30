from django_filters import rest_framework as filters

from .models import ReturnRequest


class ReturnRequestFilter(filters.FilterSet):
    order_number = filters.CharFilter(
        field_name="order__order_number",
        lookup_expr="iexact",
    )

    customer = filters.CharFilter(
        method="filter_customer",
    )

    created_from = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="gte",
    )

    created_to = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="lte",
    )

    def filter_customer(
        self,
        queryset,
        name,
        value,
    ):
        return queryset.filter(
            customer__username__icontains=value,
        )

    class Meta:
        model = ReturnRequest

        fields = [
            "status",
            "reason",
            "order_number",
        ]