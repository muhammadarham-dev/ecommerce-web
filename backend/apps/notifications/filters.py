from django_filters import rest_framework as filters

from .models import Notification


class NotificationFilter(filters.FilterSet):
    is_read = filters.BooleanFilter()

    notification_type = filters.ChoiceFilter(
        choices=Notification.Type.choices,
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
        model = Notification

        fields = [
            "is_read",
            "notification_type",
        ]