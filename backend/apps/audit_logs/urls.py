from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .business_views import (
    BusinessAuditEventViewSet,
    BusinessAuditSummaryView,
)
from .views import (
    AuditLogSummaryView,
    AuditLogViewSet,
)


app_name = "audit_logs"


router = DefaultRouter()

router.register(
    "logs",
    AuditLogViewSet,
    basename="audit-log",
)

router.register(
    "business-events",
    BusinessAuditEventViewSet,
    basename="business-audit-event",
)


urlpatterns = [
    path(
        "summary/",
        AuditLogSummaryView.as_view(),
        name="audit-log-summary",
    ),

    path(
        "business-summary/",
        BusinessAuditSummaryView.as_view(),
        name="business-audit-summary",
    ),

    path(
        "",
        include(router.urls),
    ),
]