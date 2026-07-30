import base64
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product, ProductImage


User = get_user_model()


ONE_PIXEL_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwC"
    "AAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class ProductImageApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            username="catalog-admin",
            email="catalog-admin@example.com",
            password="StrongPass123!",
            role=User.Role.ADMIN,
        )
        cls.customer = User.objects.create_user(
            username="catalog-customer",
            email="catalog-customer@example.com",
            password="StrongPass123!",
            role=User.Role.CUSTOMER,
        )
        cls.category = Category.objects.create(
            name="Test Category",
        )
        cls.product = Product.objects.create(
            category=cls.category,
            name="Test Product",
            sku="TEST-PRODUCT-001",
            description="Product used by the catalog image tests.",
            price="99.99",
            stock=10,
        )

    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media_root,
        )
        self.settings_override.enable()
        self.client.force_authenticate(self.admin)

    def tearDown(self):
        self.settings_override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)

    def make_image(self, name):
        return SimpleUploadedFile(
            name,
            ONE_PIXEL_PNG,
            content_type="image/png",
        )

    def upload_url(self):
        return (
            f"/api/catalog/products/{self.product.slug}/images/"
        )

    def test_nested_upload_attaches_image_without_creating_product(self):
        product_count = Product.objects.count()

        response = self.client.post(
            self.upload_url(),
            {
                "image": self.make_image("front.png"),
                "alt_text": "Front view",
                "is_primary": "false",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), product_count)
        self.assertEqual(ProductImage.objects.count(), 1)

        image = ProductImage.objects.get()
        self.assertEqual(image.product_id, self.product.id)
        self.assertTrue(image.is_primary)
        self.assertEqual(response.data["product_id"], self.product.id)

    def test_primary_image_switch_and_delete_promotes_replacement(self):
        first = ProductImage.objects.create(
            product=self.product,
            image=self.make_image("first.png"),
            alt_text="First image",
        )
        second = ProductImage.objects.create(
            product=self.product,
            image=self.make_image("second.png"),
            alt_text="Second image",
        )

        self.assertTrue(first.is_primary)
        self.assertFalse(second.is_primary)

        set_primary_url = (
            f"/api/catalog/products/{self.product.slug}/images/"
            f"{second.id}/primary/"
        )
        response = self.client.patch(
            set_primary_url,
            {"is_primary": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(first.is_primary)
        self.assertTrue(second.is_primary)

        delete_url = (
            f"/api/catalog/products/{self.product.slug}/images/"
            f"{second.id}/"
        )
        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        first.refresh_from_db()
        self.assertTrue(first.is_primary)

    def test_customer_cannot_upload_product_image(self):
        self.client.force_authenticate(self.customer)

        response = self.client.post(
            self.upload_url(),
            {
                "image": self.make_image("blocked.png"),
                "alt_text": "Blocked image",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(ProductImage.objects.exists())


    def test_existing_image_cannot_be_moved_to_another_product(self):
        other_product = Product.objects.create(
            category=self.category,
            name="Move Target Product",
            sku="TEST-PRODUCT-003",
            description="A product that must not receive an existing image.",
            price="39.99",
            stock=4,
        )
        image = ProductImage.objects.create(
            product=self.product,
            image=self.make_image("fixed-owner.png"),
        )

        response = self.client.patch(
            f"/api/catalog/product-images/{image.id}/",
            {"product_id": other_product.id},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        image.refresh_from_db()
        self.assertEqual(image.product_id, self.product.id)

    def test_image_cannot_be_managed_through_wrong_product(self):
        other_product = Product.objects.create(
            category=self.category,
            name="Other Product",
            sku="TEST-PRODUCT-002",
            description="Another product.",
            price="49.99",
            stock=5,
        )
        image = ProductImage.objects.create(
            product=self.product,
            image=self.make_image("owned.png"),
        )

        wrong_product_url = (
            f"/api/catalog/products/{other_product.slug}/images/"
            f"{image.id}/"
        )
        response = self.client.delete(wrong_product_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(ProductImage.objects.filter(pk=image.pk).exists())
