from django_filters import rest_framework as filters

from .models import Banner


class BannerFilter(filters.FilterSet):
    title = filters.CharFilter(
        field_name="title",
        lookup_expr="icontains",
    )

    active_from = filters.DateTimeFilter(
        field_name="starts_at",
        lookup_expr="gte",
    )

    active_until = filters.DateTimeFilter(
        field_name="ends_at",
        lookup_expr="lte",
    )

    class Meta:
        model = Banner

        fields = [
            "position",
            "is_active",
            "title",
        ]