from django.urls import path

from .views import (
    CartDetailView,
    CartItemCreateView,
    CartItemDetailView,
    ClearCartView,
)


app_name = "carts"


urlpatterns = [
    path(
        "",
        CartDetailView.as_view(),
        name="cart-detail",
    ),
    path(
        "items/",
        CartItemCreateView.as_view(),
        name="cart-item-create",
    ),
    path(
        "items/<int:pk>/",
        CartItemDetailView.as_view(),
        name="cart-item-detail",
    ),
    path(
        "clear/",
        ClearCartView.as_view(),
        name="cart-clear",
    ),
]