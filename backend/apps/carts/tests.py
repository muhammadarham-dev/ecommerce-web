from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import Cart, CartItem


class CartItemEndpointTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="cart-customer",
            email="cart-customer@example.com",
            password="StrongPassword123!",
            role=User.Role.CUSTOMER,
        )

        self.other_customer = User.objects.create_user(
            username="other-customer",
            email="other-customer@example.com",
            password="StrongPassword123!",
            role=User.Role.CUSTOMER,
        )

        self.category = Category.objects.create(
            name="Cart Test Category",
            is_active=True,
        )

        self.product = Product.objects.create(
            category=self.category,
            name="Cart Test Product",
            sku="CART-TEST-001",
            description="A product used by cart endpoint tests.",
            price="100.00",
            stock=10,
            is_active=True,
        )

        self.cart = Cart.objects.create(
            user=self.customer,
        )

        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2,
        )

        self.detail_url = reverse(
            "carts:cart-item-detail",
            kwargs={"pk": self.cart_item.pk},
        )

        self.client.force_authenticate(
            user=self.customer,
        )

    def test_customer_can_update_simple_product_quantity(self):
        response = self.client.patch(
            self.detail_url,
            {"quantity": 3},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.cart_item.refresh_from_db()

        self.assertEqual(
            self.cart_item.quantity,
            3,
        )

        self.assertEqual(
            response.data["cart_item"]["quantity"],
            3,
        )

    def test_quantity_above_stock_returns_validation_error(self):
        response = self.client.patch(
            self.detail_url,
            {"quantity": 11},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.cart_item.refresh_from_db()

        self.assertEqual(
            self.cart_item.quantity,
            2,
        )

    def test_customer_cannot_update_another_customers_cart_item(self):
        other_cart = Cart.objects.create(
            user=self.other_customer,
        )

        other_item = CartItem.objects.create(
            cart=other_cart,
            product=self.product,
            quantity=1,
        )

        response = self.client.patch(
            reverse(
                "carts:cart-item-detail",
                kwargs={"pk": other_item.pk},
            ),
            {"quantity": 2},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_customer_can_remove_cart_item(self):
        response = self.client.delete(
            self.detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            CartItem.objects.filter(
                pk=self.cart_item.pk,
            ).exists()
        )
