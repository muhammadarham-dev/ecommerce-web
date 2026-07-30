from decimal import Decimal

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
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
from rest_framework.views import APIView

from apps.products.models import Product
from apps.store_settings.services import (
    get_low_stock_threshold,
)
from apps.variants.models import ProductVariant

from .filters import OrderManagementFilter
from .models import Address, Order
from .permissions import (
    IsCustomer,
    IsOrderManagerOrAdmin,
)
from .serializers import (
    AddressSerializer,
    CheckoutSerializer,
    OrderManagementSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)
from .services import (
    cancel_customer_order,
    create_order_from_cart,
    update_order_by_manager,
)


def get_order_queryset():
    return (
        Order.objects
        .select_related(
            "customer",
            "address",
            "shipping_zone",
            "shipping_method",
        )
        .prefetch_related(
            "items",
            "items__product",
            "items__product__category",
            "items__variant",
            "items__variant__options",
            "items__variant__options__attribute",
            "items__variant__options__value",
        )
    )


class AddressViewSet(
    viewsets.ModelViewSet
):
    serializer_class = AddressSerializer

    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return (
            Address.objects
            .filter(
                user=self.request.user,
            )
            .order_by(
                "-is_default",
                "-updated_at",
            )
        )

    def perform_destroy(self, instance):
        user = instance.user
        was_default = instance.is_default

        instance.delete()

        if was_default:
            next_address = (
                user.addresses
                .order_by("-updated_at")
                .first()
            )

            if next_address:
                next_address.is_default = True

                next_address.save(
                    update_fields=[
                        "is_default",
                        "updated_at",
                    ]
                )


class OrderListView(
    generics.ListAPIView
):
    serializer_class = OrderSerializer

    permission_classes = [
        IsCustomer,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "order_number",
        "shipping_method_name",
        "shipping_zone_name",
        "items__product_name",
        "items__product_sku",
        "items__variant_name",
        "items__variant_sku",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "total_amount",
        "shipping_fee",
        "status",
        "payment_status",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            get_order_queryset()
            .filter(
                customer=self.request.user,
            )
            .distinct()
        )


class OrderDetailView(
    generics.RetrieveAPIView
):
    serializer_class = OrderSerializer

    permission_classes = [
        IsCustomer,
    ]

    lookup_field = "order_number"
    lookup_url_kwarg = "order_number"

    def get_queryset(self):
        return get_order_queryset().filter(
            customer=self.request.user,
        )


class CheckoutView(APIView):
    permission_classes = [
        IsCustomer,
    ]
    throttle_scope = "checkout"

    def post(self, request):
        input_serializer = CheckoutSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        order = create_order_from_cart(
            customer=request.user,
            address=(
                input_serializer.validated_data[
                    "address"
                ]
            ),
            payment_method=(
                input_serializer.validated_data[
                    "payment_method"
                ]
            ),
            shipping_method_code=(
                input_serializer.validated_data.get(
                    "shipping_method_code",
                    "",
                )
            ),
            notes=(
                input_serializer.validated_data.get(
                    "notes",
                    "",
                )
            ),
            coupon_code=(
                input_serializer.validated_data.get(
                    "coupon_code",
                    "",
                )
            ),
        )

        order = get_order_queryset().get(
            pk=order.pk,
        )

        output_serializer = OrderSerializer(
            order,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Order placed successfully."
                ),
                "order": (
                    output_serializer.data
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class CancelOrderView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(
        self,
        request,
        order_number,
    ):
        order = get_object_or_404(
            Order,
            customer=request.user,
            order_number=order_number,
        )

        order = cancel_customer_order(
            order=order,
        )

        order = get_order_queryset().get(
            pk=order.pk,
        )

        output_serializer = OrderSerializer(
            order,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Order cancelled successfully."
                ),
                "order": (
                    output_serializer.data
                ),
            },
            status=status.HTTP_200_OK,
        )


class OrderManagementViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        OrderManagementSerializer
    )

    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    lookup_field = "order_number"
    lookup_url_kwarg = "order_number"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = OrderManagementFilter

    search_fields = [
        "order_number",
        "customer__username",
        "customer__email",
        "recipient_name",
        "recipient_phone",
        "city",
        "province",
        "shipping_zone_name",
        "shipping_zone_code",
        "shipping_method_name",
        "shipping_method_code",
        "items__product_name",
        "items__product_sku",
        "items__variant_name",
        "items__variant_sku",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "total_amount",
        "shipping_fee",
        "status",
        "payment_status",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            get_order_queryset()
            .all()
            .distinct()
        )

    @action(
        detail=True,
        methods=[
            "patch",
        ],
        url_path="status",
    )
    def update_status(
        self,
        request,
        order_number=None,
    ):
        order = self.get_object()

        input_serializer = (
            OrderStatusUpdateSerializer(
                data=request.data,
            )
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        updated_order = update_order_by_manager(
            order=order,
            status_value=(
                input_serializer.validated_data.get(
                    "status"
                )
            ),
            payment_status_value=(
                input_serializer.validated_data.get(
                    "payment_status"
                )
            ),
            updated_by=request.user,
        )

        updated_order = (
            self.get_queryset()
            .get(pk=updated_order.pk)
        )

        output_serializer = (
            OrderManagementSerializer(
                updated_order,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "message": (
                    "Order updated successfully."
                ),
                "order": (
                    output_serializer.data
                ),
            },
            status=status.HTTP_200_OK,
        )


class OrderDashboardView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        orders = Order.objects.all()
        today = timezone.localdate()

        low_stock_threshold = (
            get_low_stock_threshold()
        )

        paid_revenue = (
            orders
            .filter(
                payment_status=(
                    Order.PaymentStatus.PAID
                ),
            )
            .exclude(
                status=Order.Status.CANCELLED,
            )
            .aggregate(
                total=Sum("total_amount"),
            )
            .get("total")
            or Decimal("0.00")
        )

        recent_orders = (
            get_order_queryset()
            .order_by("-created_at")[:5]
        )

        simple_products = (
            Product.objects
            .filter(
                is_active=True,
                category__is_active=True,
                variants__isnull=True,
            )
            .distinct()
        )

        active_variants = (
            ProductVariant.objects
            .filter(
                is_active=True,
                product__is_active=True,
                product__category__is_active=True,
            )
        )

        summary = {
            "low_stock_threshold": (
                low_stock_threshold
            ),

            "total_orders": orders.count(),

            "today_orders": orders.filter(
                created_at__date=today,
            ).count(),

            "pending_orders": orders.filter(
                status=Order.Status.PENDING,
            ).count(),

            "confirmed_orders": orders.filter(
                status=Order.Status.CONFIRMED,
            ).count(),

            "processing_orders": orders.filter(
                status=Order.Status.PROCESSING,
            ).count(),

            "shipped_orders": orders.filter(
                status=Order.Status.SHIPPED,
            ).count(),

            "delivered_orders": orders.filter(
                status=Order.Status.DELIVERED,
            ).count(),

            "cancelled_orders": orders.filter(
                status=Order.Status.CANCELLED,
            ).count(),

            "pending_payments": orders.filter(
                payment_status=(
                    Order.PaymentStatus.PENDING
                ),
            ).count(),

            "paid_orders": orders.filter(
                payment_status=(
                    Order.PaymentStatus.PAID
                ),
            ).exclude(
                status=Order.Status.CANCELLED,
            ).count(),

            "paid_revenue": str(
                paid_revenue.quantize(
                    Decimal("0.01")
                )
            ),

            "low_stock_products": (
                simple_products
                .filter(
                    stock__gt=0,
                    stock__lte=(
                        low_stock_threshold
                    ),
                )
                .count()
            ),

            "out_of_stock_products": (
                simple_products
                .filter(stock=0)
                .count()
            ),

            "low_stock_variants": (
                active_variants
                .filter(
                    stock__gt=0,
                    stock__lte=(
                        low_stock_threshold
                    ),
                )
                .count()
            ),

            "out_of_stock_variants": (
                active_variants
                .filter(stock=0)
                .count()
            ),
        }

        output_serializer = (
            OrderManagementSerializer(
                recent_orders,
                many=True,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "summary": summary,
                "recent_orders": (
                    output_serializer.data
                ),
            },
            status=status.HTTP_200_OK,
        )