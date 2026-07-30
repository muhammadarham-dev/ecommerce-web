from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import (
    filters,
    generics,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import TicketManagementFilter
from .models import Ticket
from .permissions import (
    IsCustomer,
    IsSupportAgentOrAdmin,
)
from .serializers import (
    StaffTicketReplySerializer,
    TicketAssignmentSerializer,
    TicketCreateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    TicketReplySerializer,
    TicketStatusUpdateSerializer,
)
from .services import (
    add_ticket_message,
    assign_ticket,
    close_ticket_by_customer,
    update_ticket_status,
)


def get_ticket_queryset():
    return (
        Ticket.objects
        .select_related(
            "customer",
            "order",
            "product",
            "assigned_agent",
        )
        .prefetch_related(
            "messages__sender",
            "messages__attachments",
        )
    )


def ensure_agent_can_modify_ticket(user, ticket):
    if user.is_superuser or user.role == user.Role.ADMIN:
        return

    if ticket.assigned_agent_id != user.id:
        raise PermissionDenied(
            "You must claim this ticket before modifying it."
        )


class CustomerTicketListCreateView(
    generics.ListCreateAPIView
):
    permission_classes = [IsCustomer]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_queryset(self):
        return get_ticket_queryset().filter(
            customer=self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketCreateSerializer

        return TicketListSerializer

    def create(self, request, *args, **kwargs):
        input_serializer = TicketCreateSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        ticket = input_serializer.save()

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Support ticket created successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerTicketDetailView(
    generics.RetrieveAPIView
):
    serializer_class = TicketDetailSerializer
    permission_classes = [IsCustomer]

    lookup_field = "ticket_number"
    lookup_url_kwarg = "ticket_number"

    def get_queryset(self):
        return get_ticket_queryset().filter(
            customer=self.request.user,
        )


class CustomerTicketReplyView(APIView):
    permission_classes = [IsCustomer]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def post(self, request, ticket_number):
        ticket = get_object_or_404(
            Ticket,
            customer=request.user,
            ticket_number=ticket_number,
        )

        serializer = TicketReplySerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        ticket = add_ticket_message(
            ticket=ticket,
            sender=request.user,
            body=serializer.validated_data["body"],
            attachments=serializer.validated_data.get(
                "attachments",
                [],
            ),
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Reply added successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerTicketCloseView(APIView):
    permission_classes = [IsCustomer]

    def post(self, request, ticket_number):
        ticket = get_object_or_404(
            Ticket,
            customer=request.user,
            ticket_number=ticket_number,
        )

        ticket = close_ticket_by_customer(
            ticket=ticket,
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Ticket closed successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class TicketManagementViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = TicketDetailSerializer
    permission_classes = [IsSupportAgentOrAdmin]

    lookup_field = "ticket_number"

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = TicketManagementFilter

    search_fields = [
        "ticket_number",
        "subject",
        "customer__username",
        "customer__email",
        "order__order_number",
        "product__name",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "priority",
        "status",
    ]

    ordering = [
        "-updated_at",
    ]

    def get_queryset(self):
        return get_ticket_queryset()

    def get_serializer_class(self):
        if self.action == "list":
            return TicketListSerializer

        return TicketDetailSerializer

    @action(
        detail=True,
        methods=["post"],
        url_path="claim",
    )
    def claim(self, request, ticket_number=None):
        ticket = self.get_object()

        if (
            ticket.assigned_agent
            and ticket.assigned_agent_id != request.user.id
            and not request.user.is_superuser
            and request.user.role != request.user.Role.ADMIN
        ):
            raise PermissionDenied(
                "This ticket is already assigned "
                "to another support agent."
            )

        ticket = assign_ticket(
            ticket=ticket,
            assigned_agent=request.user,
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Ticket claimed successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="assign",
    )
    def assign(self, request, ticket_number=None):
        if (
            not request.user.is_superuser
            and request.user.role
            != request.user.Role.ADMIN
        ):
            raise PermissionDenied(
                "Only administrators can assign "
                "tickets to other agents."
            )

        ticket = self.get_object()

        serializer = TicketAssignmentSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        ticket = assign_ticket(
            ticket=ticket,
            assigned_agent=(
                serializer.validated_data[
                    "assigned_agent"
                ]
            ),
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Ticket assigned successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
    )
    def update_status(
        self,
        request,
        ticket_number=None,
    ):
        ticket = self.get_object()

        ensure_agent_can_modify_ticket(
            request.user,
            ticket,
        )

        serializer = TicketStatusUpdateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        ticket = update_ticket_status(
            ticket=ticket,
            status_value=(
                serializer.validated_data["status"]
            ),
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Ticket status updated successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reply",
    )
    def reply(self, request, ticket_number=None):
        ticket = self.get_object()

        ensure_agent_can_modify_ticket(
            request.user,
            ticket,
        )

        serializer = StaffTicketReplySerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        ticket = add_ticket_message(
            ticket=ticket,
            sender=request.user,
            body=serializer.validated_data["body"],
            attachments=serializer.validated_data.get(
                "attachments",
                [],
            ),
            is_internal_note=(
                serializer.validated_data.get(
                    "is_internal_note",
                    False,
                )
            ),
        )

        ticket = get_ticket_queryset().get(
            pk=ticket.pk,
        )

        return Response(
            {
                "message": "Reply added successfully.",
                "ticket": TicketDetailSerializer(
                    ticket,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TicketDashboardView(APIView):
    permission_classes = [IsSupportAgentOrAdmin]

    def get(self, request):
        tickets = Ticket.objects.all()

        summary = {
            "total_tickets": tickets.count(),
            "open_tickets": tickets.filter(
                status=Ticket.Status.OPEN,
            ).count(),
            "unassigned_tickets": tickets.filter(
                assigned_agent__isnull=True,
            ).exclude(
                status=Ticket.Status.CLOSED,
            ).count(),
            "assigned_to_me": tickets.filter(
                assigned_agent=request.user,
            ).exclude(
                status=Ticket.Status.CLOSED,
            ).count(),
            "in_progress_tickets": tickets.filter(
                status=Ticket.Status.IN_PROGRESS,
            ).count(),
            "waiting_for_customer": tickets.filter(
                status=(
                    Ticket.Status.WAITING_FOR_CUSTOMER
                ),
            ).count(),
            "resolved_tickets": tickets.filter(
                status=Ticket.Status.RESOLVED,
            ).count(),
            "closed_tickets": tickets.filter(
                status=Ticket.Status.CLOSED,
            ).count(),
            "urgent_tickets": tickets.filter(
                priority=Ticket.Priority.URGENT,
            ).exclude(
                status=Ticket.Status.CLOSED,
            ).count(),
        }

        urgent_tickets = (
            get_ticket_queryset()
            .filter(
                priority=Ticket.Priority.URGENT,
            )
            .exclude(
                status=Ticket.Status.CLOSED,
            )[:5]
        )

        return Response(
            {
                "summary": summary,
                "urgent_tickets": TicketListSerializer(
                    urgent_tickets,
                    many=True,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )