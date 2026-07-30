from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    generics,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ShipmentFilter
from .models import Shipment
from .permissions import (
    IsCustomer,
    IsOrderManagerOrAdmin,
)
from .serializers import (
    ShipmentCreateSerializer,
    ShipmentSerializer,
    ShipmentUpdateSerializer,
)
from .services import (
    create_shipment,
    update_shipment,
)


def get_shipment_queryset():
    return (
        Shipment.objects
        .select_related(
            "order",
            "order__customer",
            "created_by",
            "updated_by",
        )
        .prefetch_related(
            "events",
            "events__created_by",
        )
    )


class CustomerShipmentListView(
    generics.ListAPIView
):
    serializer_class = ShipmentSerializer
    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return get_shipment_queryset().filter(
            order__customer=self.request.user,
        )


class CustomerShipmentDetailView(
    generics.RetrieveAPIView
):
    serializer_class = ShipmentSerializer
    permission_classes = [
        IsCustomer,
    ]

    lookup_field = "shipment_number"
    lookup_url_kwarg = "shipment_number"

    def get_queryset(self):
        return get_shipment_queryset().filter(
            order__customer=self.request.user,
        )


class ShipmentManagementViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = ShipmentSerializer
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    lookup_field = "shipment_number"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ShipmentFilter

    search_fields = [
        "shipment_number",
        "tracking_number",
        "courier_name",
        "order__order_number",
        "order__customer__username",
        "order__customer__email",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "estimated_delivery_date",
        "status",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_shipment_queryset()

    @action(
        detail=False,
        methods=["post"],
        url_path="create",
    )
    def create_shipment_action(self, request):
        input_serializer = ShipmentCreateSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        validated_data = (
            input_serializer.validated_data
        )

        shipment = create_shipment(
            order=validated_data["order"],
            created_by=request.user,
            courier_name=validated_data.get(
                "courier_name",
                "",
            ),
            tracking_number=validated_data.get(
                "tracking_number",
                "",
            ),
            estimated_delivery_date=(
                validated_data.get(
                    "estimated_delivery_date",
                )
            ),
            message=validated_data.get(
                "message",
                "",
            ),
            location=validated_data.get(
                "location",
                "",
            ),
        )

        shipment = get_shipment_queryset().get(
            pk=shipment.pk,
        )

        return Response(
            {
                "message": (
                    "Shipment created successfully."
                ),
                "shipment": ShipmentSerializer(
                    shipment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="update",
    )
    def update_shipment_action(
        self,
        request,
        shipment_number=None,
    ):
        shipment = self.get_object()

        input_serializer = ShipmentUpdateSerializer(
            data=request.data,
            context={
                "shipment": shipment,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        validated_data = (
            input_serializer.validated_data
        )

        shipment = update_shipment(
            shipment=shipment,
            updated_by=request.user,
            status_value=validated_data.get(
                "status",
            ),
            courier_name=validated_data.get(
                "courier_name",
            ),
            tracking_number=validated_data.get(
                "tracking_number",
            ),
            estimated_delivery_date=(
                validated_data.get(
                    "estimated_delivery_date",
                )
                if "estimated_delivery_date"
                in validated_data
                else None
            ),
            message=validated_data.get(
                "message",
                "",
            ),
            location=validated_data.get(
                "location",
                "",
            ),
        )

        shipment = get_shipment_queryset().get(
            pk=shipment.pk,
        )

        return Response(
            {
                "message": (
                    "Shipment updated successfully."
                ),
                "shipment": ShipmentSerializer(
                    shipment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )