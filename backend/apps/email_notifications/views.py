from django_filters.rest_framework import (
    DjangoFilterBackend,
)

from rest_framework import (
    filters,
    generics,
    status,
    viewsets,
)

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import EmailLogFilter

from .models import (
    EmailLog,
    EmailNotificationPreference,
)

from .permissions import (
    IsEmailLogAdministrator,
)

from .serializers import (
    EmailLogSerializer,
    EmailNotificationPreferenceSerializer,
)


class EmailLogViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = EmailLogSerializer

    permission_classes = [
        IsEmailLogAdministrator,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = EmailLogFilter

    search_fields = [
        "recipient",
        "subject",
        "message",
        "user__username",
        "user__email",
        "order__order_number",
        "return_request__return_number",
        "error_message",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "sent_at",
        "email_type",
        "status",
        "recipient",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            EmailLog.objects
            .select_related(
                "user",
                "order",
                "return_request",
            )
            .all()
        )


class EmailNotificationPreferenceView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = (
        EmailNotificationPreferenceSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    http_method_names = [
        "get",
        "patch",
        "head",
        "options",
    ]

    def get_object(self):
        preference, _ = (
            EmailNotificationPreference.objects
            .get_or_create(
                user=self.request.user,
            )
        )

        return preference

    def patch(
        self,
        request,
        *args,
        **kwargs,
    ):
        preference = self.get_object()

        serializer = self.get_serializer(
            preference,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "Email preferences updated "
                    "successfully."
                ),
                "preferences": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class EmailNotificationPreferenceBulkView(
    APIView
):
    permission_classes = [
        IsAuthenticated,
    ]

    mode = None

    def post(self, request):
        preference, _ = (
            EmailNotificationPreference.objects
            .get_or_create(
                user=request.user,
            )
        )

        enabled = self.mode == "enable"

        preference.set_all_preferences(
            enabled=enabled,
        )

        serializer = (
            EmailNotificationPreferenceSerializer(
                preference,
            )
        )

        action_message = (
            "enabled"
            if enabled
            else "disabled"
        )

        return Response(
            {
                "message": (
                    "All email notifications "
                    f"{action_message} successfully."
                ),
                "preferences": serializer.data,
            },
            status=status.HTTP_200_OK,
        )