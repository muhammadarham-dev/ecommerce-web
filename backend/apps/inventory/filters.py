from django_filters import rest_framework as filters

from .models import StockMovement


class StockMovementFilter(filters.FilterSet):
    product = filters.CharFilter(
        method="filter_product",
    )

    variant = filters.CharFilter(
        field_name="variant__sku",
        lookup_expr="iexact",
    )

    order = filters.CharFilter(
        field_name="order__order_number",
        lookup_expr="iexact",
    )

    return_number = filters.CharFilter(
        field_name="return_request__return_number",
        lookup_expr="iexact",
    )

    created_from = filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="gte",
    )

    created_to = filters.DateTimeFilter(
        field_name="created_at",
        lookup_expr="lte",
    )

    performed_by = filters.NumberFilter(
        field_name="performed_by_id",
    )

    def filter_product(
        self,
        queryset,
        name,
        value,
    ):
        return queryset.filter(
            product__slug__iexact=value,
        ) | queryset.filter(
            variant__product__slug__iexact=value,
        )

    class Meta:
        model = StockMovement

        fields = [
            "movement_type",
            "product",
            "variant",
            "order",
            "return_number",
            "performed_by",
        ]