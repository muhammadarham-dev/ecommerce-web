from django.db.models import Avg, Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .filters import ProductFilter
from .models import Category, Product, ProductImage
from .permissions import IsCatalogManagerOrReadOnly
from .serializers import (
    CategorySerializer,
    ProductImageSerializer,
    ProductSerializer,
)


def user_can_manage_catalog(user):
    if not user or not user.is_authenticated:
        return False

    return (
        user.is_superuser
        or user.role
        in {
            user.Role.ADMIN,
            user.Role.ORDER_MANAGER,
        }
    )


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsCatalogManagerOrReadOnly]
    lookup_field = "slug"

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "name",
        "created_at",
        "updated_at",
    ]

    ordering = ["name"]

    def get_queryset(self):
        queryset = Category.objects.all()

        if user_can_manage_catalog(self.request.user):
            return queryset

        return queryset.filter(
            is_active=True,
        )


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsCatalogManagerOrReadOnly]
    lookup_field = "slug"

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

    filterset_class = ProductFilter

    search_fields = [
        "name",
        "sku",
        "description",
        "category__name",
    ]

    ordering_fields = [
        "name",
        "price",
        "stock",
        "average_rating",
        "review_count",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = (
            Product.objects
            .select_related("category")
            .prefetch_related("images")
            .annotate(
                average_rating=Avg(
                    "reviews__rating",
                    filter=Q(
                        reviews__is_approved=True,
                    ),
                ),
                review_count=Count(
                    "reviews",
                    filter=Q(
                        reviews__is_approved=True,
                    ),
                    distinct=True,
                ),
            )
        )

        if user_can_manage_catalog(self.request.user):
            return queryset

        return queryset.filter(
            is_active=True,
            category__is_active=True,
        )


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [IsCatalogManagerOrReadOnly]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    queryset = (
        ProductImage.objects
        .select_related("product")
        .all()
    )