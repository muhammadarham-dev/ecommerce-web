from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerTicketCloseView,
    CustomerTicketDetailView,
    CustomerTicketListCreateView,
    CustomerTicketReplyView,
    TicketDashboardView,
    TicketManagementViewSet,
)


app_name = "tickets"


management_router = DefaultRouter()

management_router.register(
    "tickets",
    TicketManagementViewSet,
    basename="management-ticket",
)


urlpatterns = [
    path(
        "management/dashboard/",
        TicketDashboardView.as_view(),
        name="management-dashboard",
    ),

    path(
        "management/",
        include(management_router.urls),
    ),

    path(
        "",
        CustomerTicketListCreateView.as_view(),
        name="customer-ticket-list-create",
    ),

    path(
        "<str:ticket_number>/reply/",
        CustomerTicketReplyView.as_view(),
        name="customer-ticket-reply",
    ),

    path(
        "<str:ticket_number>/close/",
        CustomerTicketCloseView.as_view(),
        name="customer-ticket-close",
    ),

    path(
        "<str:ticket_number>/",
        CustomerTicketDetailView.as_view(),
        name="customer-ticket-detail",
    ),
]