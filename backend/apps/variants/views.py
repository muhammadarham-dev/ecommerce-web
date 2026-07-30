from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    generics,
    viewsets,
)
from rest_framework.permissions import AllowAny

from .filters import ProductVariantFilter
from .models import (
    ProductAttribute,
    ProductAttributeValue,
    ProductVariant,
)
from .permissions import IsCatalogManager
from .serializers import (
    ProductAttributeSerializer,
    ProductAttributeValueSerializer,
    ProductVariantSerializer,
    ProductVariantWriteSerializer,
)


def get_variant_queryset():
    return (
        ProductVariant.objects
        .select_related(
            "product",
            "product__category",
        )
        .prefetch_related(
            "options",
            "options__attribute",
            "options__value",
        )
    )


class PublicProductVariantListView(
    generics.ListAPIView
):
    serializer_class = ProductVariantSerializer
    permission_classes = [
        AllowAny,
    ]

    def get_queryset(self):
        return get_variant_queryset().filter(
            product__slug=self.kwargs[
                "product_slug"
            ],
            product__is_active=True,
            product__category__is_active=True,
            is_active=True,
        )


class PublicProductVariantDetailView(
    generics.RetrieveAPIView
):
    serializer_class = ProductVariantSerializer
    permission_classes = [
        AllowAny,
    ]

    lookup_field = "sku"
    lookup_url_kwarg = "sku"

    def get_queryset(self):
        return get_variant_queryset().filter(
            product__is_active=True,
            product__category__is_active=True,
            is_active=True,
        )


class ProductAttributeManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ProductAttributeSerializer
    permission_classes = [
        IsCatalogManager,
    ]

    lookup_field = "slug"

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "slug",
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
        return ProductAttribute.objects.prefetch_related(
            "values",
        )


class ProductAttributeValueManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ProductAttributeValueSerializer
    permission_classes = [
        IsCatalogManager,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "attribute",
        "is_active",
    ]

    search_fields = [
        "value",
        "display_value",
        "attribute__name",
    ]

    ordering_fields = [
        "value",
        "display_order",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "attribute__display_order",
        "display_order",
        "value",
    ]

    def get_queryset(self):
        return (
            ProductAttributeValue.objects
            .select_related("attribute")
            .all()
        )


class ProductVariantManagementViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        IsCatalogManager,
    ]

    lookup_field = "sku"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ProductVariantFilter

    search_fields = [
        "sku",
        "product__name",
        "product__sku",
    ]

    ordering_fields = [
        "sku",
        "stock",
        "price_override",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "product__name",
        "sku",
    ]

    def get_queryset(self):
        return get_variant_queryset()

    def get_serializer_class(self):
        if self.action in {
            "create",
            "update",
            "partial_update",
        }:
            return ProductVariantWriteSerializer

        return ProductVariantSerializer