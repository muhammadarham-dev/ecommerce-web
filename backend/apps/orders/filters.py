from django_filters import rest_framework as filters

from .models import Order


class OrderManagementFilter(filters.FilterSet):
    status = filters.ChoiceFilter(
        choices=Order.Status.choices,
    )

    payment_method = filters.ChoiceFilter(
        choices=Order.PaymentMethod.choices,
    )

    payment_status = filters.ChoiceFilter(
        choices=Order.PaymentStatus.choices,
    )

    created_from = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="gte",
    )

    created_to = filters.DateFilter(
        field_name="created_at__date",
        lookup_expr="lte",
    )

    city = filters.CharFilter(
        field_name="city",
        lookup_expr="iexact",
    )

    province = filters.CharFilter(
        field_name="province",
        lookup_expr="iexact",
    )

    class Meta:
        model = Order

        fields = [
            "status",
            "payment_method",
            "payment_status",
            "city",
            "province",
        ]