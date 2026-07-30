from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import (
    ProductAttribute,
    ProductAttributeValue,
)


class AttributeManagementApiTests(APITestCase):
    attributes_url = "/api/variants/management/attributes/"
    values_url = "/api/variants/management/values/"

    def setUp(self):
        self.admin = User.objects.create_user(
            username="variant-admin",
            email="variant-admin@example.com",
            password="test-password",
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(self.admin)

    def create_attribute(self, name="Color"):
        response = self.client.post(
            self.attributes_url,
            {
                "name": name,
                "display_order": 0,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        return response

    def test_attribute_is_created_without_client_slug(self):
        response = self.create_attribute("Color")

        self.assertEqual(response.data["name"], "Color")
        self.assertEqual(response.data["slug"], "color")
        self.assertTrue(
            ProductAttribute.objects.filter(
                name="Color",
                slug="color",
            ).exists()
        )

    def test_duplicate_attribute_name_returns_validation_error(self):
        self.create_attribute("Color")

        response = self.client.post(
            self.attributes_url,
            {
                "name": " color ",
                "display_order": 1,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "already exists",
            str(response.data).lower(),
        )

    def test_attribute_value_is_created_without_client_slug(self):
        attribute_id = self.create_attribute("Color").data["id"]

        response = self.client.post(
            self.values_url,
            {
                "attribute": attribute_id,
                "value": "black",
                "display_value": "Black",
                "color_code": "000000",
                "display_order": 0,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertEqual(response.data["slug"], "black")
        self.assertEqual(response.data["color_code"], "#000000")
        self.assertTrue(
            ProductAttributeValue.objects.filter(
                attribute_id=attribute_id,
                value="black",
                slug="black",
            ).exists()
        )

    def test_duplicate_normalized_value_is_rejected_per_attribute(self):
        attribute_id = self.create_attribute("Color").data["id"]
        payload = {
            "attribute": attribute_id,
            "value": "Navy Blue",
            "display_value": "Navy Blue",
            "color_code": "#000080",
            "display_order": 0,
            "is_active": True,
        }

        first_response = self.client.post(
            self.values_url,
            payload,
            format="json",
        )
        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
            first_response.data,
        )

        duplicate_response = self.client.post(
            self.values_url,
            {
                **payload,
                "value": "navy-blue",
            },
            format="json",
        )

        self.assertEqual(
            duplicate_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "already exists",
            str(duplicate_response.data).lower(),
        )

    def test_same_value_can_be_used_for_different_attributes(self):
        color_id = self.create_attribute("Color").data["id"]
        material_id = self.create_attribute("Material").data["id"]

        for attribute_id in (color_id, material_id):
            response = self.client.post(
                self.values_url,
                {
                    "attribute": attribute_id,
                    "value": "Black",
                    "display_value": "Black",
                    "color_code": "",
                    "display_order": 0,
                    "is_active": True,
                },
                format="json",
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                response.data,
            )

    def test_updating_value_regenerates_generated_slug(self):
        attribute_id = self.create_attribute("Color").data["id"]
        create_response = self.client.post(
            self.values_url,
            {
                "attribute": attribute_id,
                "value": "Blue",
                "display_value": "Blue",
                "color_code": "#0000FF",
                "display_order": 0,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(
            create_response.status_code,
            status.HTTP_201_CREATED,
            create_response.data,
        )

        value_id = create_response.data["id"]
        update_response = self.client.patch(
            f"{self.values_url}{value_id}/",
            {
                "value": "Royal Blue",
                "display_value": "Royal Blue",
            },
            format="json",
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
            update_response.data,
        )
        self.assertEqual(
            update_response.data["slug"],
            "royal-blue",
        )

    def test_invalid_color_code_returns_field_error(self):
        attribute_id = self.create_attribute("Color").data["id"]

        response = self.client.post(
            self.values_url,
            {
                "attribute": attribute_id,
                "value": "Broken Color",
                "display_value": "Broken Color",
                "color_code": "not-a-color",
                "display_order": 0,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "hexadecimal",
            str(response.data).lower(),
        )
