from django.contrib import admin

from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "email_type",
        "recipient",
        "status",
        "order",
        "return_request",
        "sent_at",
        "created_at",
    ]

    list_filter = [
        "email_type",
        "status",
        "sent_at",
        "created_at",
    ]

    search_fields = [
        "recipient",
        "subject",
        "message",
        "user__username",
        "user__email",
        "order__order_number",
        "return_request__return_number",
        "error_message",
    ]

    readonly_fields = [
        "user",
        "order",
        "return_request",
        "email_type",
        "status",
        "recipient",
        "subject",
        "message",
        "html_message",
        "metadata",
        "error_message",
        "sent_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False