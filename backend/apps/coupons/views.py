from decimal import Decimal

from django.db.models import Count, F, Q
from django.utils import timezone

from rest_framework import (
    filters,
    generics,
    status,
    viewsets,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.carts.models import CartItem

from .models import Coupon
from .permissions import (
    IsCustomer,
    IsOrderManagerOrAdmin,
)
from .serializers import (
    CouponSerializer,
    CouponValidationSerializer,
    CustomerCouponSerializer,
)
from .services import get_coupon_discount


def get_available_coupon_queryset(customer):
    current_time = timezone.now()

    return (
        Coupon.objects
        .annotate(
            current_usage_count=Count(
                "usages",
                filter=Q(
                    usages__is_reversed=False,
                ),
                distinct=True,
            ),
            customer_usage_count=Count(
                "usages",
                filter=Q(
                    usages__customer=customer,
                    usages__is_reversed=False,
                ),
                distinct=True,
            ),
        )
        .filter(
            is_active=True,
        )
        .filter(
            Q(starts_at__isnull=True)
            | Q(starts_at__lte=current_time)
        )
        .filter(
            Q(expires_at__isnull=True)
            | Q(expires_at__gte=current_time)
        )
        .filter(
            Q(total_usage_limit__isnull=True)
            | Q(
                current_usage_count__lt=F(
                    "total_usage_limit"
                )
            )
        )
        .filter(
            customer_usage_count__lt=F(
                "per_customer_limit"
            )
        )
        .order_by(
            "expires_at",
            "code",
        )
    )


class CouponManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = CouponSerializer

    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    lookup_field = "code"

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "code",
        "name",
        "description",
    ]

    ordering_fields = [
        "code",
        "value",
        "starts_at",
        "expires_at",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return Coupon.objects.prefetch_related(
            "usages",
        )


class CustomerCouponListView(
    generics.ListAPIView
):
    serializer_class = CustomerCouponSerializer

    permission_classes = [
        IsCustomer,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "code",
        "name",
        "description",
    ]

    ordering_fields = [
        "code",
        "value",
        "minimum_order_amount",
        "expires_at",
    ]

    ordering = [
        "expires_at",
        "code",
    ]

    def get_queryset(self):
        return get_available_coupon_queryset(
            customer=self.request.user,
        )


class CustomerCouponDetailView(
    generics.RetrieveAPIView
):
    serializer_class = CustomerCouponSerializer

    permission_classes = [
        IsCustomer,
    ]

    lookup_field = "code"
    lookup_url_kwarg = "code"

    def get_queryset(self):
        return get_available_coupon_queryset(
            customer=self.request.user,
        )


class CustomerCouponValidateView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(self, request):
        input_serializer = CouponValidationSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        cart_items = list(
            CartItem.objects
            .filter(cart__user=request.user)
            .select_related(
                "product",
                "variant",
            )
        )

        if not cart_items:
            return Response(
                {
                    "cart": "Your shopping cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtotal = sum(
            (
                item.unit_price * item.quantity
                for item in cart_items
            ),
            Decimal("0.00"),
        )

        coupon, discount_amount = get_coupon_discount(
            code=input_serializer.validated_data[
                "coupon_code"
            ],
            customer=request.user,
            subtotal=subtotal,
            lock=False,
        )

        total_after_discount = max(
            subtotal - discount_amount,
            Decimal("0.00"),
        )

        return Response(
            {
                "message": "Coupon applied successfully.",
                "coupon": {
                    "code": coupon.code,
                    "name": coupon.name,
                    "description": coupon.description,
                    "discount_type": (
                        coupon.discount_type
                    ),
                    "value": str(coupon.value),
                    "minimum_order_amount": str(
                        coupon.minimum_order_amount
                    ),
                    "maximum_discount_amount": (
                        str(coupon.maximum_discount_amount)
                        if coupon.maximum_discount_amount
                        is not None
                        else None
                    ),
                    "expires_at": coupon.expires_at,
                },
                "subtotal": str(subtotal),
                "discount_amount": str(
                    discount_amount
                ),
                "total_after_discount": str(
                    total_after_discount
                ),
            },
            status=status.HTTP_200_OK,
        )