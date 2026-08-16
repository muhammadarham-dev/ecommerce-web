from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.api_security.error_views import (
    custom_page_not_found,
    custom_server_error,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/auth/",
        include("apps.accounts.urls"),
    ),

    path(
        "api/catalog/",
        include("apps.products.urls"),
    ),

    path(
        "api/cart/",
        include("apps.carts.urls"),
    ),

    path(
        "api/orders/",
        include("apps.orders.urls"),
    ),

    path(
        "api/tickets/",
        include("apps.tickets.urls"),
    ),

    path(
        "api/notifications/",
        include("apps.notifications.urls"),
    ),

    path(
        "api/reviews/",
        include("apps.reviews.urls"),
    ),

    path(
        "api/returns/",
        include("apps.returns.urls"),
    ),

    path(
        "api/payments/",
        include("apps.payments.urls"),
    ),

    path(
        "api/wishlist/",
        include("apps.wishlists.urls"),
    ),

    path(
        "api/coupons/",
        include("apps.coupons.urls"),
    ),

    path(
        "api/shipments/",
        include("apps.shipments.urls"),
    ),

    path(
        "api/reports/",
        include("apps.reports.urls"),
    ),

    path(
        "api/banners/",
        include("apps.banners.urls"),
    ),

    path(
        "api/recently-viewed/",
        include("apps.recently_viewed.urls"),
    ),

    path(
        "api/variants/",
        include("apps.variants.urls"),
    ),

    path(
        "api/inventory/",
        include("apps.inventory.urls"),
    ),

    path(
        "api/shipping-rates/",
        include("apps.shipping_rates.urls"),
    ),

    path(
        "api/store-settings/",
        include("apps.store_settings.urls"),
    ),

    path(
        "api/account-security/",
        include("apps.account_security.urls"),
    ),

    path(
        "api/email-notifications/",
        include("apps.email_notifications.urls"),
    ),

    path(
        "api/audit-logs/",
        include("apps.audit_logs.urls"),
    ),

    path(
        "api/integrations/engagepilot/",
        include("apps.engagepilot_integration.urls"),
    ),
]


if getattr(
    settings,
    "ENABLE_API_DOCS",
    False,
):
    urlpatterns += [
        path(
            "api/schema/",
            SpectacularAPIView.as_view(),
            name="openapi-schema",
        ),

        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(
                url_name="openapi-schema",
            ),
            name="swagger-ui",
        ),

        path(
            "api/redoc/",
            SpectacularRedocView.as_view(
                url_name="openapi-schema",
            ),
            name="redoc",
        ),

        path(
    "api/health/",
    include("apps.system_health.urls"),
),
    ]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )


handler404 = custom_page_not_found
handler500 = custom_server_error