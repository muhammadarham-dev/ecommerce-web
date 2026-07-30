from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.store_settings.services import (
    get_low_stock_threshold,
)
from apps.variants.models import ProductVariant

from .filters import StockMovementFilter
from .models import StockMovement
from .permissions import IsInventoryManager
from .serializers import (
    ManualStockAdjustmentSerializer,
    StockMovementSerializer,
)


def get_stock_movement_queryset():
    return (
        StockMovement.objects
        .select_related(
            "product",
            "product__category",
            "variant",
            "variant__product",
            "variant__product__category",
            "order",
            "return_request",
            "performed_by",
        )
        .prefetch_related(
            "variant__options",
            "variant__options__attribute",
            "variant__options__value",
        )
    )


class StockMovementListView(
    generics.ListAPIView
):
    serializer_class = StockMovementSerializer

    permission_classes = [
        IsInventoryManager,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = StockMovementFilter

    search_fields = [
        "product__name",
        "product__sku",
        "variant__sku",
        "variant__product__name",
        "order__order_number",
        "return_request__return_number",
        "performed_by__username",
        "performed_by__email",
        "note",
    ]

    ordering_fields = [
        "created_at",
        "quantity_change",
        "previous_stock",
        "new_stock",
        "movement_type",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_stock_movement_queryset()


class StockMovementDetailView(
    generics.RetrieveAPIView
):
    serializer_class = StockMovementSerializer

    permission_classes = [
        IsInventoryManager,
    ]

    queryset = get_stock_movement_queryset()


class ManualStockAdjustmentView(APIView):
    permission_classes = [
        IsInventoryManager,
    ]

    def post(self, request):
        input_serializer = (
            ManualStockAdjustmentSerializer(
                data=request.data,
                context={
                    "request": request,
                },
            )
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        stock_movement = input_serializer.save()

        stock_movement = (
            get_stock_movement_queryset()
            .get(pk=stock_movement.pk)
        )

        output_serializer = StockMovementSerializer(
            stock_movement,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Stock adjusted successfully."
                ),
                "stock_movement": (
                    output_serializer.data
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class ProductStockHistoryView(
    generics.ListAPIView
):
    serializer_class = StockMovementSerializer

    permission_classes = [
        IsInventoryManager,
    ]

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "created_at",
        "quantity_change",
        "previous_stock",
        "new_stock",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        product_slug = self.kwargs[
            "product_slug"
        ]

        return (
            get_stock_movement_queryset()
            .filter(
                Q(product__slug=product_slug)
                | Q(
                    variant__product__slug=(
                        product_slug
                    )
                )
            )
            .distinct()
        )


class VariantStockHistoryView(
    generics.ListAPIView
):
    serializer_class = StockMovementSerializer

    permission_classes = [
        IsInventoryManager,
    ]

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "created_at",
        "quantity_change",
        "previous_stock",
        "new_stock",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        variant_sku = self.kwargs[
            "variant_sku"
        ]

        return (
            get_stock_movement_queryset()
            .filter(
                variant__sku__iexact=variant_sku,
            )
        )


class InventorySummaryView(APIView):
    permission_classes = [
        IsInventoryManager,
    ]

    def get(self, request):
        low_stock_threshold = (
            get_low_stock_threshold()
        )

        simple_products = (
            Product.objects
            .filter(
                is_active=True,
                category__is_active=True,
                variants__isnull=True,
            )
            .select_related("category")
            .distinct()
        )

        active_variants = (
            ProductVariant.objects
            .filter(
                is_active=True,
                product__is_active=True,
                product__category__is_active=True,
            )
            .select_related(
                "product",
                "product__category",
            )
        )

        simple_product_stock = (
            simple_products.aggregate(
                total=Sum("stock"),
            ).get("total")
            or 0
        )

        variant_stock = (
            active_variants.aggregate(
                total=Sum("stock"),
            ).get("total")
            or 0
        )

        low_stock_products = (
            simple_products
            .filter(
                stock__gt=0,
                stock__lte=low_stock_threshold,
            )
            .order_by(
                "stock",
                "name",
            )[:10]
        )

        low_stock_variants = (
            active_variants
            .filter(
                stock__gt=0,
                stock__lte=low_stock_threshold,
            )
            .prefetch_related(
                "options",
                "options__attribute",
                "options__value",
            )
            .order_by(
                "stock",
                "product__name",
                "sku",
            )[:10]
        )

        low_stock_product_data = [
            {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "sku": product.sku,
                "category": (
                    product.category.name
                ),
                "stock": product.stock,
                "target_type": "PRODUCT",
            }
            for product in low_stock_products
        ]

        low_stock_variant_data = [
            {
                "id": variant.id,
                "name": variant.variant_name,
                "product_name": (
                    variant.product.name
                ),
                "product_slug": (
                    variant.product.slug
                ),
                "sku": variant.sku,
                "category": (
                    variant.product.category.name
                ),
                "stock": variant.stock,
                "target_type": "VARIANT",
            }
            for variant in low_stock_variants
        ]

        return Response(
            {
                "low_stock_threshold": (
                    low_stock_threshold
                ),
                "simple_products": {
                    "total": (
                        simple_products.count()
                    ),
                    "in_stock": (
                        simple_products
                        .filter(stock__gt=0)
                        .count()
                    ),
                    "low_stock": (
                        simple_products
                        .filter(
                            stock__gt=0,
                            stock__lte=(
                                low_stock_threshold
                            ),
                        )
                        .count()
                    ),
                    "out_of_stock": (
                        simple_products
                        .filter(stock=0)
                        .count()
                    ),
                    "total_units": (
                        simple_product_stock
                    ),
                },
                "variants": {
                    "total": (
                        active_variants.count()
                    ),
                    "in_stock": (
                        active_variants
                        .filter(stock__gt=0)
                        .count()
                    ),
                    "low_stock": (
                        active_variants
                        .filter(
                            stock__gt=0,
                            stock__lte=(
                                low_stock_threshold
                            ),
                        )
                        .count()
                    ),
                    "out_of_stock": (
                        active_variants
                        .filter(stock=0)
                        .count()
                    ),
                    "total_units": variant_stock,
                },
                "total_available_units": (
                    simple_product_stock
                    + variant_stock
                ),
                "stock_movements": (
                    StockMovement.objects.count()
                ),
                "low_stock_items": {
                    "products": (
                        low_stock_product_data
                    ),
                    "variants": (
                        low_stock_variant_data
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )