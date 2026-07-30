from django_filters import rest_framework as filters

from .models import Shipment


class ShipmentFilter(filters.FilterSet):
    order_number = filters.CharFilter(
        field_name="order__order_number",
        lookup_expr="iexact",
    )

    tracking_number = filters.CharFilter(
        field_name="tracking_number",
        lookup_expr="icontains",
    )

    created_from = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="gte",
    )

    created_to = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="lte",
    )

    estimated_from = filters.DateFilter(
        field_name="estimated_delivery_date",
        lookup_expr="gte",
    )

    estimated_to = filters.DateFilter(
        field_name="estimated_delivery_date",
        lookup_expr="lte",
    )

    class Meta:
        model = Shipment

        fields = [
            "status",
            "courier_name",
            "order_number",
            "tracking_number",
        ]