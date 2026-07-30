from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    generics,
    viewsets,
)
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import AllowAny

from .filters import BannerFilter
from .models import Banner
from .permissions import IsAdminRole
from .serializers import (
    BannerManagementSerializer,
    PublicBannerSerializer,
)


def get_current_banner_queryset():
    current_time = timezone.now()

    return (
        Banner.objects
        .filter(is_active=True)
        .filter(
            Q(starts_at__isnull=True)
            | Q(starts_at__lte=current_time)
        )
        .filter(
            Q(ends_at__isnull=True)
            | Q(ends_at__gte=current_time)
        )
        .order_by(
            "display_order",
            "-created_at",
        )
    )


class PublicBannerListView(
    generics.ListAPIView
):
    serializer_class = PublicBannerSerializer
    permission_classes = [
        AllowAny,
    ]

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = [
        "position",
    ]

    def get_queryset(self):
        return get_current_banner_queryset()


class BannerManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = BannerManagementSerializer
    permission_classes = [
        IsAdminRole,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = BannerFilter

    search_fields = [
        "title",
        "subtitle",
        "description",
        "button_text",
        "button_url",
    ]

    ordering_fields = [
        "title",
        "position",
        "display_order",
        "starts_at",
        "ends_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "display_order",
        "-created_at",
    ]

    def get_queryset(self):
        return (
            Banner.objects
            .select_related("created_by")
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
        )