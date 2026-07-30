from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ReturnRequestFilter
from .models import ReturnRequest
from .permissions import IsCustomer, IsOrderManagerOrAdmin
from .serializers import (
    ReturnCreateSerializer,
    ReturnRequestSerializer,
    ReturnStatusUpdateSerializer,
)
from .services import (
    cancel_return_request,
    update_return_status,
)


def get_return_queryset():
    return (
        ReturnRequest.objects
        .select_related(
            "customer",
            "order",
            "reviewed_by",
        )
        .prefetch_related(
            "items__order_item__product",
        )
    )


class CustomerReturnListCreateView(
    generics.ListCreateAPIView
):
    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return get_return_queryset().filter(
            customer=self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReturnCreateSerializer

        return ReturnRequestSerializer

    def create(self, request, *args, **kwargs):
        input_serializer = ReturnCreateSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        return_request = input_serializer.save()

        return_request = get_return_queryset().get(
            pk=return_request.pk,
        )

        output_serializer = ReturnRequestSerializer(
            return_request,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Return request created successfully."
                ),
                "return_request": output_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerReturnDetailView(
    generics.RetrieveAPIView
):
    serializer_class = ReturnRequestSerializer
    permission_classes = [
        IsCustomer,
    ]

    lookup_field = "return_number"
    lookup_url_kwarg = "return_number"

    def get_queryset(self):
        return get_return_queryset().filter(
            customer=self.request.user,
        )


class CustomerReturnCancelView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(self, request, return_number):
        return_request = get_object_or_404(
            ReturnRequest,
            return_number=return_number,
            customer=request.user,
        )

        return_request = cancel_return_request(
            return_request=return_request,
        )

        return_request = get_return_queryset().get(
            pk=return_request.pk,
        )

        output_serializer = ReturnRequestSerializer(
            return_request,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Return request cancelled successfully."
                ),
                "return_request": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ReturnManagementViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = ReturnRequestSerializer
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    lookup_field = "return_number"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ReturnRequestFilter

    search_fields = [
        "return_number",
        "order__order_number",
        "customer__username",
        "customer__email",
        "details",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "refund_amount",
        "status",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_return_queryset()

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
    )
    def update_status(
        self,
        request,
        return_number=None,
    ):
        return_request = self.get_object()

        input_serializer = ReturnStatusUpdateSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        return_request = update_return_status(
            return_request=return_request,
            status_value=(
                input_serializer.validated_data["status"]
            ),
            admin_note=(
                input_serializer.validated_data.get(
                    "admin_note",
                    "",
                )
            ),
            reviewed_by=request.user,
        )

        return_request = get_return_queryset().get(
            pk=return_request.pk,
        )

        output_serializer = ReturnRequestSerializer(
            return_request,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Return request updated successfully."
                ),
                "return_request": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )