from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .permissions import IsCustomer
from .serializers import (
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
)


def get_cart_queryset():
    return (
        Cart.objects
        .select_related("user")
        .prefetch_related(
            "items",
            "items__product",
            "items__product__category",
            "items__product__images",
            "items__variant",
            "items__variant__options",
            "items__variant__options__attribute",
            "items__variant__options__value",
        )
    )


class CartDetailView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(
            user=request.user,
        )

        cart = get_cart_queryset().get(
            pk=cart.pk,
        )

        return Response(
            CartSerializer(
                cart,
                context={
                    "request": request,
                },
            ).data,
            status=status.HTTP_200_OK,
        )


class CartItemCreateView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def post(self, request):
        input_serializer = CartItemCreateSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        cart_item = input_serializer.save()

        cart_item = (
            CartItem.objects
            .select_related(
                "product",
                "product__category",
                "variant",
            )
            .prefetch_related(
                "product__images",
                "variant__options",
                "variant__options__attribute",
                "variant__options__value",
            )
            .get(pk=cart_item.pk)
        )

        return Response(
            {
                "message": (
                    "Product added to cart successfully."
                ),
                "cart_item": CartItemSerializer(
                    cart_item,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CartItemDetailView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def patch(self, request, pk):
        cart_item = get_object_or_404(
            CartItem.objects.select_related(
                "cart",
                "product",
                "variant",
            ),
            pk=pk,
            cart__user=request.user,
        )

        input_serializer = CartItemUpdateSerializer(
            cart_item,
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        cart_item = input_serializer.save()

        cart_item = (
            CartItem.objects
            .select_related(
                "product",
                "product__category",
                "variant",
            )
            .prefetch_related(
                "product__images",
                "variant__options",
                "variant__options__attribute",
                "variant__options__value",
            )
            .get(pk=cart_item.pk)
        )

        return Response(
            {
                "message": (
                    "Cart item updated successfully."
                ),
                "cart_item": CartItemSerializer(
                    cart_item,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        cart_item = get_object_or_404(
            CartItem,
            pk=pk,
            cart__user=request.user,
        )

        cart_item.delete()

        return Response(
            {
                "message": (
                    "Product removed from cart successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )


class ClearCartView(APIView):
    permission_classes = [
        IsCustomer,
    ]

    def delete(self, request):
        deleted_count, _ = (
            CartItem.objects
            .filter(cart__user=request.user)
            .delete()
        )

        return Response(
            {
                "message": "Cart cleared successfully.",
                "deleted_items": deleted_count,
            },
            status=status.HTTP_200_OK,
        )