from django.urls import path

from .widget_views import EngagePilotCustomerWidgetSessionView
from .views import (
    CancelOrderView,
    CartAddItemView,
    CartClearView,
    CartGetView,
    CartRemoveItemView,
    CartUpdateQuantityView,
    CheckoutPrepareView,
    HealthView,
    InventoryCheckView,
    InventoryUpdateView,
    OrdersListView,
    ProductSearchView,
    ResolveCustomerOrderView,
)


app_name = "engagepilot_integration"


urlpatterns = [

    # Accept both forms so embedded widgets are robust even when a host
    # normalizes endpoint URLs differently. The canonical URL keeps the
    # trailing slash; the alias avoids POST redirects through APPEND_SLASH.
    path(
        "widget/customer-session",
        EngagePilotCustomerWidgetSessionView.as_view(),
    ),
    path(
        "widget/customer-session/",
        EngagePilotCustomerWidgetSessionView.as_view(),
        name="widget-customer-session",
    ),
    path(
        "health/",
        HealthView.as_view(),
        name="health",
    ),
    path(
        "capabilities/products/search/",
        ProductSearchView.as_view(),
        name="products-search",
    ),
    path(
        "capabilities/inventory/check/",
        InventoryCheckView.as_view(),
        name="inventory-check",
    ),
    path(
        "capabilities/inventory/update/",
        InventoryUpdateView.as_view(),
        name="inventory-update",
    ),
    path(
        "capabilities/cart/add-item/",
        CartAddItemView.as_view(),
        name="cart-add-item",
    ),
    path(
        "capabilities/cart/get/",
        CartGetView.as_view(),
        name="cart-get",
    ),
    path(
        "capabilities/cart/remove-item/",
        CartRemoveItemView.as_view(),
        name="cart-remove-item",
    ),
    path(
        "capabilities/cart/update-quantity/",
        CartUpdateQuantityView.as_view(),
        name="cart-update-quantity",
    ),
    path(
        "capabilities/cart/clear/",
        CartClearView.as_view(),
        name="cart-clear",
    ),
    path(
        "capabilities/orders/list/",
        OrdersListView.as_view(),
        name="orders-list",
    ),
    path(
        "capabilities/orders/resolve/",
        ResolveCustomerOrderView.as_view(),
        name="orders-resolve",
    ),
    path(
        "capabilities/orders/cancel/",
        CancelOrderView.as_view(),
        name="orders-cancel",
    ),
    path(
        "capabilities/checkout/prepare/",
        CheckoutPrepareView.as_view(),
        name="checkout-prepare",
    ),
]
