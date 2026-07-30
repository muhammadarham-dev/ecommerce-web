from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProductAttributeManagementViewSet,
    ProductAttributeValueManagementViewSet,
    ProductVariantManagementViewSet,
    PublicProductVariantDetailView,
    PublicProductVariantListView,
)


app_name = "variants"


management_router = DefaultRouter()

management_router.register(
    "attributes",
    ProductAttributeManagementViewSet,
    basename="management-product-attribute",
)

management_router.register(
    "values",
    ProductAttributeValueManagementViewSet,
    basename="management-attribute-value",
)

management_router.register(
    "variants",
    ProductVariantManagementViewSet,
    basename="management-product-variant",
)


urlpatterns = [
    path(
        "management/",
        include(management_router.urls),
    ),
    path(
        "products/<slug:product_slug>/",
        PublicProductVariantListView.as_view(),
        name="public-product-variant-list",
    ),
    path(
        "<str:sku>/",
        PublicProductVariantDetailView.as_view(),
        name="public-product-variant-detail",
    ),
]