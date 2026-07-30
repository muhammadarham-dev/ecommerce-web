from django_filters import rest_framework as filters

from .models import ProductVariant


class ProductVariantFilter(filters.FilterSet):
    product = filters.CharFilter(
        field_name="product__slug",
        lookup_expr="iexact",
    )

    category = filters.CharFilter(
        field_name="product__category__slug",
        lookup_expr="iexact",
    )

    minimum_stock = filters.NumberFilter(
        field_name="stock",
        lookup_expr="gte",
    )

    maximum_stock = filters.NumberFilter(
        field_name="stock",
        lookup_expr="lte",
    )

    in_stock = filters.BooleanFilter(
        method="filter_in_stock",
    )

    def filter_in_stock(
        self,
        queryset,
        name,
        value,
    ):
        if value is True:
            return queryset.filter(
                is_active=True,
                stock__gt=0,
            )

        if value is False:
            return queryset.filter(
                stock=0,
            )

        return queryset

    class Meta:
        model = ProductVariant

        fields = [
            "product",
            "category",
            "is_active",
            "in_stock",
        ]