from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.carts.models import Cart, CartItem
from apps.inventory.models import StockMovement
from apps.payments.models import Payment
from apps.products.models import Category, Product
from apps.shipping_rates.models import (
    ShippingMethod,
    ShippingRate,
    ShippingZone,
)
from apps.variants.models import ProductVariant

from .models import Address, Order, OrderItem


class CheckoutTests(APITestCase):
    checkout_url = "/api/orders/checkout/"

    def setUp(self):
        self.customer = User.objects.create_user(
            username="checkout_customer",
            email="checkout@example.com",
            password="StrongPass123!",
            role=User.Role.CUSTOMER,
        )

        self.category = Category.objects.create(
            name="Audio",
            description="Audio products",
        )

        self.product = Product.objects.create(
            category=self.category,
            name="Wireless Headphones",
            sku="AUDIO-001",
            description="Test headphones",
            price=Decimal("1000.00"),
            stock=5,
            is_active=True,
        )

        self.address = Address.objects.create(
            user=self.customer,
            recipient_name="Checkout Customer",
            phone_number="03001234567",
            address_line_1="Test Street 1",
            city="Sahiwal",
            province="Punjab",
            postal_code="57000",
            country="Pakistan",
            is_default=True,
        )

        self.shipping_zone = ShippingZone.objects.create(
            name="Pakistan",
            code="PK",
            country="Pakistan",
            province="",
            city="",
            priority=1,
            is_active=True,
        )

        self.shipping_method = ShippingMethod.objects.create(
            name="Standard Delivery",
            code="STANDARD",
            is_default=True,
            is_active=True,
        )

        ShippingRate.objects.create(
            zone=self.shipping_zone,
            method=self.shipping_method,
            charge=Decimal("250.00"),
            estimated_min_days=2,
            estimated_max_days=4,
            cod_available=True,
            is_active=True,
        )

        self.cart = Cart.objects.create(
            user=self.customer,
        )

        self.client.force_authenticate(
            user=self.customer,
        )

    def checkout(self, **overrides):
        payload = {
            "address_id": self.address.pk,
            "payment_method": (
                Order.PaymentMethod.CASH_ON_DELIVERY
            ),
            "shipping_method_code": "STANDARD",
            "notes": "Leave at reception.",
        }
        payload.update(overrides)

        return self.client.post(
            self.checkout_url,
            payload,
            format="json",
        )

    def test_checkout_simple_product_creates_complete_order(self):
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertFalse(
            CartItem.objects.filter(cart=self.cart).exists()
        )

        order = Order.objects.get()
        order_item = OrderItem.objects.get()

        self.assertEqual(order.subtotal, Decimal("2000.00"))
        self.assertEqual(order.shipping_fee, Decimal("250.00"))
        self.assertEqual(order.total_amount, Decimal("2250.00"))
        self.assertEqual(order_item.variant_id, None)
        self.assertEqual(order_item.quantity, 2)
        self.assertEqual(order_item.unit_price, Decimal("1000.00"))

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

        movement = StockMovement.objects.get(
            order=order,
            movement_type=StockMovement.Type.SALE,
        )
        self.assertEqual(movement.product_id, self.product.id)
        self.assertEqual(movement.variant_id, None)
        self.assertEqual(movement.quantity_change, -2)

    def test_checkout_variant_product_creates_variant_snapshot(self):
        variant_product = Product.objects.create(
            category=self.category,
            name="Variant Headphones",
            sku="AUDIO-002",
            description="Variant test product",
            price=Decimal("1500.00"),
            stock=0,
            is_active=True,
        )
        variant = ProductVariant.objects.create(
            product=variant_product,
            sku="AUDIO-002-BLUE",
            price_override=Decimal("1400.00"),
            stock=4,
            combination_key="blue",
            is_active=True,
        )
        CartItem.objects.create(
            cart=self.cart,
            product=variant_product,
            variant=variant,
            quantity=1,
        )

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        order_item = OrderItem.objects.get()
        self.assertEqual(order_item.variant_id, variant.id)
        self.assertEqual(order_item.variant_sku, variant.sku)
        self.assertEqual(order_item.unit_price, Decimal("1400.00"))

        variant.refresh_from_db()
        self.assertEqual(variant.stock, 3)

        movement = StockMovement.objects.get(
            order=order_item.order,
            movement_type=StockMovement.Type.SALE,
        )
        self.assertEqual(movement.product_id, None)
        self.assertEqual(movement.variant_id, variant.id)

    def test_checkout_empty_cart_returns_validation_error(self):
        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertEqual(Order.objects.count(), 0)

    def test_checkout_insufficient_stock_preserves_cart(self):
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=6,
        )

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertEqual(Order.objects.count(), 0)
        self.assertTrue(
            CartItem.objects.filter(cart=self.cart).exists()
        )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
