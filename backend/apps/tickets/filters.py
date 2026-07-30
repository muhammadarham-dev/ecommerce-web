from django_filters import rest_framework as filters

from .models import Ticket


class TicketManagementFilter(filters.FilterSet):
    assigned_to_me = filters.BooleanFilter(
        method="filter_assigned_to_me",
    )

    unassigned = filters.BooleanFilter(
        method="filter_unassigned",
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
        model = Ticket

        fields = [
            "category",
            "priority",
            "status",
            "assigned_agent",
        ]

    def filter_assigned_to_me(
        self,
        queryset,
        name,
        value,
    ):
        if value and self.request.user.is_authenticated:
            return queryset.filter(
                assigned_agent=self.request.user,
            )

        return queryset

    def filter_unassigned(
        self,
        queryset,
        name,
        value,
    ):
        if value is True:
            return queryset.filter(
                assigned_agent__isnull=True,
            )

        if value is False:
            return queryset.filter(
                assigned_agent__isnull=False,
            )

        return queryset