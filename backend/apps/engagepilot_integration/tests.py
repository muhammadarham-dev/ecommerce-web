from decimal import Decimal
from uuid import uuid4

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Category, Product
from apps.engagepilot_integration.services import search_products


@override_settings(
    ENGAGEPILOT_API_TOKEN="test-engagepilot-token",
    ENGAGEPILOT_STORE_IDENTIFIER="test-django-store",
    ENGAGEPILOT_STORE_NAME="Test Django Store",
)
class EngagePilotAuthenticationTests(APITestCase):
    """Verify service-token and connection-header protection."""

    def setUp(self):
        self.url = reverse(
            "engagepilot_integration:health"
        )
        self.connection_id = str(uuid4())

    def test_health_rejects_missing_token(self):
        response = self.client.get(
            self.url,
            HTTP_X_ENGAGEPILOT_CONNECTION_ID=(
                self.connection_id
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_health_rejects_invalid_connection_id(self):
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=(
                "Bearer test-engagepilot-token"
            ),
            HTTP_X_ENGAGEPILOT_CONNECTION_ID=(
                "not-a-uuid"
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_health_accepts_valid_service_credentials(self):
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=(
                "Bearer test-engagepilot-token"
            ),
            HTTP_X_ENGAGEPILOT_CONNECTION_ID=(
                self.connection_id
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["status"],
            "ready",
        )
        self.assertEqual(
            response.data["system"],
            "django-commerce",
        )


class EngagePilotProductSearchServiceTests(APITestCase):
    """Verify natural multi-token catalog search used by agent tools."""

    def test_search_products_matches_non_contiguous_title_tokens(self):
        category = Category.objects.create(
            name="Headphones",
        )
        product = Product.objects.create(
            category=category,
            name=(
                "JBL Tune 770NC Wireless Over Ear Headphones "
                "with Adaptive Noise Cancellation"
            ),
            sku="PRD-101-SEARCH-TEST",
            description="Wireless over-ear headphones",
            price=Decimal("5900.00"),
            stock=5,
            is_active=True,
        )

        products, total_count = search_products(
            query="JBL Tune 770NC headphones",
            limit=10,
            available_only=True,
            min_price=None,
            max_price=None,
            product_type=None,
        )

        self.assertEqual(total_count, 1)
        self.assertEqual(len(products), 1)
        self.assertEqual(
            products[0]["external_id"],
            f"product:{product.pk}",
        )