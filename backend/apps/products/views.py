from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

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

    def get_product_image(self, product, image_pk):
        return get_object_or_404(
            ProductImage.objects.select_related("product"),
            pk=image_pk,
            product=product,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="images",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request, slug=None):
        product = self.get_object()
        payload = request.data.copy()
        payload["product_id"] = str(product.pk)

        serializer = ProductImageSerializer(
            data=payload,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path=r"images/(?P<image_pk>\d+)/primary",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def set_primary_image(self, request, slug=None, image_pk=None):
        product = self.get_object()
        image = self.get_product_image(product, image_pk)

        serializer = ProductImageSerializer(
            image,
            data={"is_primary": True},
            partial=True,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_pk>\d+)",
    )
    def delete_image(self, request, slug=None, image_pk=None):
        product = self.get_object()
        image = self.get_product_image(product, image_pk)
        image.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [IsCatalogManagerOrReadOnly]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_queryset(self):
        queryset = (
            ProductImage.objects
            .select_related("product", "product__category")
            .all()
        )

        product_id = self.request.query_params.get("product")

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        if user_can_manage_catalog(self.request.user):
            return queryset

        return queryset.filter(
            product__is_active=True,
            product__category__is_active=True,
        )
