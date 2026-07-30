from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductImageViewSet,
    ProductViewSet,
)


app_name = "products"


router = DefaultRouter()

router.register(
    "categories",
    CategoryViewSet,
    basename="category",
)

router.register(
    "products",
    ProductViewSet,
    basename="product",
)

router.register(
    "product-images",
    ProductImageViewSet,
    basename="product-image",
)


urlpatterns = router.urls