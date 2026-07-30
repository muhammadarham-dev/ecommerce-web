from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .filters import PaymentFilter
from .models import Payment
from .permissions import (
    IsCustomer,
    IsOrderManagerOrAdmin,
)
from .serializers import (
    BankTransferSubmitSerializer,
    PaymentRejectSerializer,
    PaymentSerializer,
)
from .services import (
    ensure_payment_record,
    refund_payment,
    reject_payment,
    submit_bank_transfer,
    verify_payment,
)


def get_payment_queryset():
    return (
        Payment.objects
        .select_related(
            "order",
            "customer",
            "verified_by",
        )
    )


class CustomerPaymentListView(
    generics.ListAPIView
):
    serializer_class = PaymentSerializer
    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return get_payment_queryset().filter(
            customer=self.request.user,
        )


class CustomerPaymentDetailView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order.objects.select_related("customer"),
            order_number=order_number,
            customer=request.user,
        )

        payment = ensure_payment_record(
            order=order,
        )

        payment = get_payment_queryset().get(
            pk=payment.pk,
        )

        return Response(
            PaymentSerializer(
                payment,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )


class BankTransferSubmitView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def post(self, request, order_number):
        order = get_object_or_404(
            Order.objects.select_related("customer"),
            order_number=order_number,
            customer=request.user,
        )

        payment = ensure_payment_record(
            order=order,
        )

        input_serializer = BankTransferSubmitSerializer(
            data=request.data,
            context={
                "payment": payment,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        payment = submit_bank_transfer(
            payment=payment,
            customer=request.user,
            transaction_reference=(
                input_serializer.validated_data[
                    "transaction_reference"
                ]
            ),
            proof=input_serializer.validated_data["proof"],
        )

        payment = get_payment_queryset().get(
            pk=payment.pk,
        )

        return Response(
            {
                "message": (
                    "Payment proof submitted successfully."
                ),
                "payment": PaymentSerializer(
                    payment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class PaymentManagementViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = PaymentSerializer
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    lookup_field = "payment_number"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = PaymentFilter

    search_fields = [
        "payment_number",
        "order__order_number",
        "customer__username",
        "customer__email",
        "transaction_reference",
    ]

    ordering_fields = [
        "amount",
        "status",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_payment_queryset()

    @action(
        detail=True,
        methods=["patch"],
        url_path="verify",
    )
    def verify(self, request, payment_number=None):
        payment = self.get_object()

        payment = verify_payment(
            payment=payment,
            verified_by=request.user,
        )

        payment = get_payment_queryset().get(
            pk=payment.pk,
        )

        return Response(
            {
                "message": "Payment verified successfully.",
                "payment": PaymentSerializer(
                    payment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="reject",
    )
    def reject(self, request, payment_number=None):
        payment = self.get_object()

        input_serializer = PaymentRejectSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        payment = reject_payment(
            payment=payment,
            verified_by=request.user,
            rejection_reason=(
                input_serializer.validated_data[
                    "rejection_reason"
                ]
            ),
        )

        payment = get_payment_queryset().get(
            pk=payment.pk,
        )

        return Response(
            {
                "message": "Payment rejected successfully.",
                "payment": PaymentSerializer(
                    payment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="refund",
    )
    def refund(self, request, payment_number=None):
        payment = self.get_object()

        payment = refund_payment(
            payment=payment,
            verified_by=request.user,
        )

        payment = get_payment_queryset().get(
            pk=payment.pk,
        )

        return Response(
            {
                "message": "Payment refunded successfully.",
                "payment": PaymentSerializer(
                    payment,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )