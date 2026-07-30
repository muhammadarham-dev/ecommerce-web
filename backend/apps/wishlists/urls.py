from django.urls import path

from .views import (
    ClearWishlistView,
    MoveWishlistItemToCartView,
    WishlistCountView,
    WishlistItemDeleteView,
    WishlistListCreateView,
)


app_name = "wishlists"


urlpatterns = [
    path(
        "",
        WishlistListCreateView.as_view(),
        name="wishlist-list-create",
    ),

    path(
        "count/",
        WishlistCountView.as_view(),
        name="wishlist-count",
    ),

    path(
        "clear/",
        ClearWishlistView.as_view(),
        name="wishlist-clear",
    ),

    path(
        "<int:pk>/move-to-cart/",
        MoveWishlistItemToCartView.as_view(),
        name="wishlist-move-to-cart",
    ),

    path(
        "<int:pk>/",
        WishlistItemDeleteView.as_view(),
        name="wishlist-item-delete",
    ),
]