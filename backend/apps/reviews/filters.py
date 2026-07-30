from django_filters import rest_framework as filters

from .models import Review


class ReviewFilter(filters.FilterSet):
    product = filters.CharFilter(
        field_name="product__slug",
        lookup_expr="iexact",
    )

    customer = filters.CharFilter(
        field_name="customer__username",
        lookup_expr="iexact",
    )

    rating = filters.NumberFilter(
        field_name="rating",
    )

    minimum_rating = filters.NumberFilter(
        field_name="rating",
        lookup_expr="gte",
    )

    is_approved = filters.BooleanFilter(
        field_name="is_approved",
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
        model = Review

        fields = [
            "product",
            "customer",
            "rating",
            "is_approved",
        ]
