from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.orders.models import Order
from apps.products.models import Product

from .models import (
    Ticket,
    TicketAttachment,
    TicketMessage,
)


User = get_user_model()


class TicketUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
        ]

        read_only_fields = fields


class TicketProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "sku",
        ]

        read_only_fields = fields


class TicketAttachmentSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = TicketAttachment

        fields = [
            "id",
            "file",
            "original_name",
            "created_at",
        ]

        read_only_fields = fields


class TicketMessageSerializer(serializers.ModelSerializer):
    sender = TicketUserSerializer(
        read_only=True,
    )

    attachments = TicketAttachmentSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = TicketMessage

        fields = [
            "id",
            "sender",
            "body",
            "is_internal_note",
            "attachments",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class TicketListSerializer(serializers.ModelSerializer):
    customer = TicketUserSerializer(
        read_only=True,
    )

    assigned_agent = TicketUserSerializer(
        read_only=True,
    )

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
        allow_null=True,
    )

    product = TicketProductSerializer(
        read_only=True,
    )

    class Meta:
        model = Ticket

        fields = [
            "id",
            "ticket_number",
            "customer",
            "order_number",
            "product",
            "assigned_agent",
            "category",
            "priority",
            "status",
            "subject",
            "created_at",
            "updated_at",
            "resolved_at",
            "closed_at",
        ]

        read_only_fields = fields


class TicketDetailSerializer(TicketListSerializer):
    messages = serializers.SerializerMethodField()

    can_customer_reply = serializers.BooleanField(
        read_only=True,
    )

    can_customer_close = serializers.BooleanField(
        read_only=True,
    )

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + [
            "can_customer_reply",
            "can_customer_close",
            "messages",
        ]

    def get_messages(self, ticket):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        messages = ticket.messages.all()

        is_staff_user = (
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role
                in {
                    user.Role.ADMIN,
                    user.Role.SUPPORT_AGENT,
                }
            )
        )

        if not is_staff_user:
            messages = messages.filter(
                is_internal_note=False,
            )

        return TicketMessageSerializer(
            messages,
            many=True,
            context=self.context,
        ).data


class TicketCreateSerializer(serializers.ModelSerializer):
    order_id = serializers.PrimaryKeyRelatedField(
        source="order",
        queryset=Order.objects.none(),
        required=False,
        allow_null=True,
    )

    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
        required=False,
        allow_null=True,
    )

    message = serializers.CharField(
        write_only=True,
        max_length=5000,
    )

    attachments = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True,
        max_length=5,
    )

    class Meta:
        model = Ticket

        fields = [
            "category",
            "priority",
            "subject",
            "order_id",
            "product_id",
            "message",
            "attachments",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            self.fields["order_id"].queryset = (
                Order.objects.filter(
                    customer=request.user,
                )
            )

    def validate(self, attributes):
        order = attributes.get("order")
        product = attributes.get("product")

        if order and product:
            product_exists_in_order = order.items.filter(
                product=product,
            ).exists()

            if not product_exists_in_order:
                raise serializers.ValidationError(
                    {
                        "product_id": (
                            "This product is not part "
                            "of the selected order."
                        )
                    }
                )

        return attributes

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]

        message_body = validated_data.pop("message")
        attachments = validated_data.pop(
            "attachments",
            [],
        )

        ticket = Ticket.objects.create(
            customer=request.user,
            **validated_data,
        )

        first_message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            body=message_body,
        )

        for attachment in attachments:
            TicketAttachment.objects.create(
                message=first_message,
                file=attachment,
                original_name=attachment.name,
            )

        return ticket


class TicketReplySerializer(serializers.Serializer):
    body = serializers.CharField(
        max_length=5000,
    )

    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        max_length=5,
    )


class StaffTicketReplySerializer(
    TicketReplySerializer
):
    is_internal_note = serializers.BooleanField(
        default=False,
    )


class TicketAssignmentSerializer(serializers.Serializer):
    assigned_agent_id = (
        serializers.PrimaryKeyRelatedField(
            source="assigned_agent",
            queryset=User.objects.filter(
                role__in=[
                    User.Role.ADMIN,
                    User.Role.SUPPORT_AGENT,
                ],
                is_active=True,
            ),
        )
    )


class TicketStatusUpdateSerializer(
    serializers.Serializer
):
    status = serializers.ChoiceField(
        choices=Ticket.Status.choices,
    )