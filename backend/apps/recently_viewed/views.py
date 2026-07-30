from django.shortcuts import get_object_or_404
from rest_framework import (
    filters,
    generics,
    status,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import RecentlyViewedProduct
from .permissions import IsCustomer
from .serializers import RecentlyViewedSerializer
from .services import record_product_view


def get_recently_viewed_queryset():
    return (
        RecentlyViewedProduct.objects
        .select_related(
            "customer",
            "product",
            "product__category",
        )
        .prefetch_related(
            "product__images",
        )
    )


class RecentlyViewedListView(
    generics.ListAPIView
):
    serializer_class = RecentlyViewedSerializer
    permission_classes = [
        IsCustomer,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "product__name",
        "product__sku",
        "product__category__name",
    ]

    ordering_fields = [
        "viewed_at",
        "view_count",
        "product__name",
        "product__price",
    ]

    ordering = [
        "-viewed_at",
    ]

    def get_queryset(self):
        return get_recently_viewed_queryset().filter(
            customer=self.request.user,
            product__is_active=True,
            product__category__is_active=True,
        )


class TrackProductView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(self, request, slug):
        product = get_object_or_404(
            Product.objects
            .select_related("category")
            .prefetch_related("images"),
            slug=slug,
            is_active=True,
            category__is_active=True,
        )

        recently_viewed = record_product_view(
            customer=request.user,
            product=product,
        )

        recently_viewed = (
            get_recently_viewed_queryset()
            .get(pk=recently_viewed.pk)
        )

        output_serializer = RecentlyViewedSerializer(
            recently_viewed,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": "Product view recorded successfully.",
                "recently_viewed": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class RecentlyViewedDeleteView(
    generics.DestroyAPIView
):
    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return RecentlyViewedProduct.objects.filter(
            customer=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        recently_viewed = self.get_object()
        recently_viewed.delete()

        return Response(
            {
                "message": (
                    "Product removed from recently viewed history."
                ),
            },
            status=status.HTTP_200_OK,
        )


class ClearRecentlyViewedView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def delete(self, request):
        deleted_count, _ = (
            RecentlyViewedProduct.objects
            .filter(customer=request.user)
            .delete()
        )

        return Response(
            {
                "message": (
                    "Recently viewed history cleared successfully."
                ),
                "deleted_items": deleted_count,
            },
            status=status.HTTP_200_OK,
        )


class RecentlyViewedCountView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def get(self, request):
        count = (
            RecentlyViewedProduct.objects
            .filter(
                customer=request.user,
                product__is_active=True,
                product__category__is_active=True,
            )
            .count()
        )

        return Response(
            {
                "recently_viewed_count": count,
            },
            status=status.HTTP_200_OK,
        )