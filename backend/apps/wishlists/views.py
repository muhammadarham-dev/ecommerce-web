from django.shortcuts import get_object_or_404
from rest_framework import (
    filters,
    generics,
    status,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.carts.serializers import CartItemSerializer

from .models import WishlistItem
from .permissions import IsCustomer
from .serializers import (
    MoveWishlistToCartSerializer,
    WishlistAddSerializer,
    WishlistItemSerializer,
)
from .services import (
    add_product_to_wishlist,
    move_wishlist_item_to_cart,
)


def get_wishlist_queryset():
    return (
        WishlistItem.objects
        .select_related(
            "customer",
            "product",
            "product__category",
        )
        .prefetch_related(
            "product__images",
        )
    )


class WishlistListCreateView(
    generics.ListCreateAPIView
):
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
        "created_at",
        "product__name",
        "product__price",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_wishlist_queryset().filter(
            customer=self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WishlistAddSerializer

        return WishlistItemSerializer

    def create(self, request, *args, **kwargs):
        input_serializer = WishlistAddSerializer(
            data=request.data,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        wishlist_item, created = (
            add_product_to_wishlist(
                customer=request.user,
                product=input_serializer.validated_data[
                    "product"
                ],
            )
        )

        wishlist_item = get_wishlist_queryset().get(
            pk=wishlist_item.pk,
        )

        output_serializer = WishlistItemSerializer(
            wishlist_item,
            context={
                "request": request,
            },
        )

        if created:
            message = "Product added to wishlist."
            response_status = status.HTTP_201_CREATED

        else:
            message = "Product is already in your wishlist."
            response_status = status.HTTP_200_OK

        return Response(
            {
                "message": message,
                "wishlist_item": output_serializer.data,
            },
            status=response_status,
        )


class WishlistItemDeleteView(
    generics.DestroyAPIView
):
    permission_classes = [
        IsCustomer,
    ]

    def get_queryset(self):
        return WishlistItem.objects.filter(
            customer=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        wishlist_item = self.get_object()
        wishlist_item.delete()

        return Response(
            {
                "message": (
                    "Product removed from wishlist."
                ),
            },
            status=status.HTTP_200_OK,
        )


class MoveWishlistItemToCartView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(self, request, pk):
        wishlist_item = get_object_or_404(
            WishlistItem,
            pk=pk,
            customer=request.user,
        )

        input_serializer = (
            MoveWishlistToCartSerializer(
                data=request.data,
            )
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        cart_item = move_wishlist_item_to_cart(
            wishlist_item=wishlist_item,
            customer=request.user,
            quantity=input_serializer.validated_data[
                "quantity"
            ],
        )

        output_serializer = CartItemSerializer(
            cart_item,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Product moved from wishlist to cart."
                ),
                "cart_item": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ClearWishlistView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def delete(self, request):
        deleted_count, _ = (
            WishlistItem.objects
            .filter(customer=request.user)
            .delete()
        )

        return Response(
            {
                "message": "Wishlist cleared successfully.",
                "deleted_items": deleted_count,
            },
            status=status.HTTP_200_OK,
        )


class WishlistCountView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def get(self, request):
        wishlist_count = (
            WishlistItem.objects
            .filter(customer=request.user)
            .count()
        )

        return Response(
            {
                "wishlist_count": wishlist_count,
            },
            status=status.HTTP_200_OK,
        )