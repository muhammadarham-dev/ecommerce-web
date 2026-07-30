from django_filters import rest_framework as filters

from .models import Product


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(
        field_name="category__slug",
        lookup_expr="iexact",
    )

    min_price = filters.NumberFilter(
        field_name="price",
        lookup_expr="gte",
    )

    max_price = filters.NumberFilter(
        field_name="price",
        lookup_expr="lte",
    )

    in_stock = filters.BooleanFilter(
        method="filter_in_stock",
    )

    class Meta:
        model = Product
        fields = [
            "category",
            "is_active",
            "is_featured",
        ]

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock__gt=0)

        if value is False:
            return queryset.filter(stock=0)

        return queryset