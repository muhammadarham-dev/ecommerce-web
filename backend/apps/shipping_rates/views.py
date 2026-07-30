from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    status,
    viewsets,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ShippingMethod,
    ShippingRate,
    ShippingZone,
)
from .permissions import (
    IsCustomer,
    IsShippingManager,
)
from .serializers import (
    PublicShippingMethodSerializer,
    ShippingMethodSerializer,
    ShippingQuoteInputSerializer,
    ShippingRateSerializer,
    ShippingZoneSerializer,
)


class PublicShippingMethodViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        PublicShippingMethodSerializer
    )

    permission_classes = [
        AllowAny,
    ]

    lookup_field = "code"

    def get_queryset(self):
        return (
            ShippingMethod.objects
            .filter(is_active=True)
            .order_by(
                "display_order",
                "name",
            )
        )


class ShippingZoneManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ShippingZoneSerializer
    permission_classes = [
        IsShippingManager,
    ]

    lookup_field = "code"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "country",
        "province",
        "city",
        "is_active",
    ]

    search_fields = [
        "name",
        "code",
        "country",
        "province",
        "city",
    ]

    ordering_fields = [
        "name",
        "priority",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-priority",
        "name",
    ]

    def get_queryset(self):
        return ShippingZone.objects.all()


class ShippingMethodManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ShippingMethodSerializer
    permission_classes = [
        IsShippingManager,
    ]

    lookup_field = "code"

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "code",
        "description",
    ]

    ordering_fields = [
        "name",
        "display_order",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "display_order",
        "name",
    ]

    def get_queryset(self):
        return ShippingMethod.objects.all()


class ShippingRateManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ShippingRateSerializer
    permission_classes = [
        IsShippingManager,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "zone",
        "method",
        "cod_available",
        "is_active",
    ]

    search_fields = [
        "zone__name",
        "zone__code",
        "zone__country",
        "zone__province",
        "zone__city",
        "method__name",
        "method__code",
    ]

    ordering_fields = [
        "charge",
        "free_shipping_threshold",
        "estimated_min_days",
        "estimated_max_days",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "zone__name",
        "method__display_order",
    ]

    def get_queryset(self):
        return (
            ShippingRate.objects
            .select_related(
                "zone",
                "method",
            )
            .all()
        )


class ShippingQuoteView(APIView):
    permission_classes = [
        IsCustomer,
    ]
    throttle_scope = "shipping_quote"

    def post(self, request):
        input_serializer = (
            ShippingQuoteInputSerializer(
                data=request.data,
                context={
                    "request": request,
                },
            )
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        quote = input_serializer.save()

        return Response(
            {
                "zone": {
                    "id": quote["zone"].id,
                    "name": quote["zone"].name,
                    "code": quote["zone"].code,
                    "country": quote["zone"].country,
                    "province": quote["zone"].province,
                    "city": quote["zone"].city,
                },
                "shipping_method": {
                    "id": quote["method"].id,
                    "name": quote["method"].name,
                    "code": quote["method"].code,
                },
                "subtotal": str(
                    quote["subtotal"]
                ),
                "shipping_fee": str(
                    quote["shipping_fee"]
                ),
                "total_amount": str(
                    quote["total_amount"]
                ),
                "free_shipping_applied": (
                    quote["free_shipping_applied"]
                ),
                "estimated_delivery": {
                    "minimum_days": (
                        quote[
                            "rate"
                        ].estimated_min_days
                    ),
                    "maximum_days": (
                        quote[
                            "rate"
                        ].estimated_max_days
                    ),
                },
                "cod_available": (
                    quote["rate"].cod_available
                ),
            },
            status=status.HTTP_200_OK,
        )