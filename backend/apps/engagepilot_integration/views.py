from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import (
    EngagePilotServiceAuthentication,
)
from .serializers import (
    CancelOrderRequestSerializer,
    CartAddItemRequestSerializer,
    CartClearRequestSerializer,
    CartGetRequestSerializer,
    CartLineActionRequestSerializer,
    CartUpdateQuantityRequestSerializer,
    CheckoutPrepareRequestSerializer,
    InventoryCheckRequestSerializer,
    InventoryUpdateRequestSerializer,
    OrdersListRequestSerializer,
    ProductSearchRequestSerializer,
    ResolveOrderRequestSerializer,
)
from .services import (
    add_cart_item,
    cancel_verified_order,
    clear_cart,
    inventory_payload,
    list_customer_orders,
    prepare_checkout,
    read_cart,
    remove_cart_item,
    resolve_customer,
    resolve_customer_order,
    resolve_inventory_target,
    search_products,
    set_cart_item_quantity,
    update_inventory,
)


class EngagePilotAPIView(APIView):
    """Base view protected by EngagePilot service authentication."""

    authentication_classes = [
        EngagePilotServiceAuthentication,
    ]
    permission_classes = [
        IsAuthenticated,
    ]


class HealthView(EngagePilotAPIView):
    """Verify connector authentication and Django store readiness."""

    def get(self, request):
        del request

        return Response(
            {
                "status": "ready",
                "system": "django-commerce",
                "external_identifier": getattr(
                    settings,
                    "ENGAGEPILOT_STORE_IDENTIFIER",
                    "django-commerce-store",
                ),
                "name": getattr(
                    settings,
                    "ENGAGEPILOT_STORE_NAME",
                    "Django Commerce Store",
                ),
            }
        )


class ProductSearchView(EngagePilotAPIView):
    """Execute products.search against the Django catalog."""

    def post(self, request):
        serializer = ProductSearchRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        products, total_count = search_products(
            query=data["query"],
            limit=data["limit"],
            available_only=data["available_only"],
            min_price=data.get("min_price"),
            max_price=data.get("max_price"),
            product_type=data.get("product_type"),
        )

        return Response(
            {
                "message": (
                    f"Found {len(products)} product"
                    f"{'' if len(products) == 1 else 's'}."
                ),
                "query": data["query"],
                "products": products,
                "returned_count": len(products),
                "total_count": total_count,
                "has_more": total_count > len(products),
                "next_cursor": None,
                "previous_cursor": None,
            }
        )


class InventoryCheckView(EngagePilotAPIView):
    """Execute inventory.check."""

    def post(self, request):
        serializer = InventoryCheckRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product, variant, item_id = resolve_inventory_target(
            data["item_id"]
        )

        result = inventory_payload(
            item_reference=item_id,
            product=product,
            variant=variant,
            requested_quantity=data["requested_quantity"],
        )

        return Response(
            {
                "message": "Inventory information retrieved successfully.",
                **result,
            }
        )


class InventoryUpdateView(EngagePilotAPIView):
    """Execute an already owner-approved inventory.update."""

    def post(self, request):
        serializer = InventoryUpdateRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        result = update_inventory(
            item_id=serializer.validated_data["item_id"],
            quantity=serializer.validated_data["quantity"],
        )

        return Response(
            {
                "message": "Inventory updated successfully.",
                **result,
            }
        )


class CartAddItemView(EngagePilotAPIView):
    """Execute cart.add_item for a verified customer."""

    def post(self, request):
        serializer = CartAddItemRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        result = add_cart_item(
            customer=customer,
            cart_id=data.get("cart_id"),
            product_reference=data["product_id"],
            quantity=data["quantity"],
        )

        return Response(result)


class CartGetView(EngagePilotAPIView):
    """Execute cart.get for a verified customer."""

    def post(self, request):
        serializer = CartGetRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            read_cart(
                customer=customer,
                cart_id=data.get("cart_id"),
            )
        )


class CartRemoveItemView(EngagePilotAPIView):
    """Execute cart.remove_item for a verified customer."""

    def post(self, request):
        serializer = CartLineActionRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            remove_cart_item(
                customer=customer,
                cart_id=data["cart_id"],
                line_id=data["line_id"],
            )
        )


class CartUpdateQuantityView(EngagePilotAPIView):
    """Execute cart.update_quantity for a verified customer."""

    def post(self, request):
        serializer = CartUpdateQuantityRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            set_cart_item_quantity(
                customer=customer,
                cart_id=data["cart_id"],
                line_id=data["line_id"],
                quantity=data["quantity"],
            )
        )


class CartClearView(EngagePilotAPIView):
    """Execute confirmed cart.clear with snapshot verification."""

    def post(self, request):
        serializer = CartClearRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            clear_cart(
                customer=customer,
                cart_id=data["cart_id"],
                expected_line_ids=data["expected_line_ids"],
            )
        )


class OrdersListView(EngagePilotAPIView):
    """Execute verified-customer orders.list."""

    def post(self, request):
        serializer = OrdersListRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        result = list_customer_orders(
            customer=customer,
            limit=data["limit"],
            include_cancelled=data["include_cancelled"],
        )

        result["purpose"] = data["purpose"]
        result["requested_order_reference"] = (
            data.get("order_reference")
        )

        return Response(result)


class ResolveCustomerOrderView(EngagePilotAPIView):
    """Resolve one exact order while enforcing customer ownership."""

    def post(self, request):
        serializer = ResolveOrderRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        result = resolve_customer_order(
            customer=customer,
            order_reference=data["order_reference"],
            allow_cancelled=data["allow_cancelled"],
        )

        return Response(
            {
                "message": (
                    "Verified customer order resolved successfully."
                ),
                **result,
            }
        )


class CancelOrderView(EngagePilotAPIView):
    """Execute confirmed orders.cancel for one verified customer order."""

    def post(self, request):
        serializer = CancelOrderRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            cancel_verified_order(
                customer=customer,
                order_id=data["order_id"],
            )
        )


class CheckoutPrepareView(EngagePilotAPIView):
    """Verify the confirmed cart snapshot and return hosted checkout URL."""

    def post(self, request):
        serializer = CheckoutPrepareRequestSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = resolve_customer(
            data["verified_customer_id"]
        )

        return Response(
            prepare_checkout(
                customer=customer,
                cart_id=data["cart_id"],
                expected_lines=data["expected_lines"],
            )
        )
