from django.contrib import admin

from .models import (
    Ticket,
    TicketAttachment,
    TicketMessage,
)


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0

    fields = [
        "sender",
        "body",
        "is_internal_note",
        "created_at",
    ]

    readonly_fields = [
        "created_at",
    ]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        "ticket_number",
        "subject",
        "customer",
        "category",
        "priority",
        "status",
        "assigned_agent",
        "created_at",
        "updated_at",
    ]

    list_filter = [
        "category",
        "priority",
        "status",
        "created_at",
    ]

    search_fields = [
        "ticket_number",
        "subject",
        "customer__username",
        "customer__email",
        "order__order_number",
        "product__name",
    ]

    readonly_fields = [
        "ticket_number",
        "customer",
        "order",
        "product",
        "created_at",
        "updated_at",
        "resolved_at",
        "closed_at",
    ]

    ordering = [
        "-updated_at",
    ]

    inlines = [
        TicketMessageInline,
    ]


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "ticket",
        "sender",
        "is_internal_note",
        "created_at",
    ]

    list_filter = [
        "is_internal_note",
        "created_at",
    ]

    search_fields = [
        "ticket__ticket_number",
        "sender__username",
        "sender__email",
        "body",
    ]


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "message",
        "original_name",
        "created_at",
    ]

    search_fields = [
        "message__ticket__ticket_number",
        "original_name",
    ]

    readonly_fields = [
        "created_at",
    ]