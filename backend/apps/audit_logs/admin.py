from django.contrib import admin

from .models import (
    AuditLog,
    BusinessAuditEvent,
)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "request_id",
        "user",
        "action",
        "method",
        "short_path",
        "status_code",
        "success",
        "ip_address",
        "duration_ms",
        "created_at",
    ]

    list_filter = [
        "action",
        "method",
        "success",
        "status_code",
        "created_at",
    ]

    search_fields = [
        "request_id",
        "user__username",
        "user__email",
        "path",
        "route_name",
        "ip_address",
        "user_agent",
        "error_message",
    ]

    readonly_fields = [
        "request_id",
        "user",
        "action",
        "method",
        "path",
        "route_name",
        "status_code",
        "success",
        "ip_address",
        "user_agent",
        "query_params",
        "request_data",
        "error_message",
        "duration_ms",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    date_hierarchy = "created_at"

    def short_path(self, audit_log):
        if len(audit_log.path) <= 70:
            return audit_log.path

        return f"{audit_log.path[:67]}..."

    short_path.short_description = "Path"

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


@admin.register(BusinessAuditEvent)
class BusinessAuditEventAdmin(
    admin.ModelAdmin
):
    list_display = [
        "id",
        "event_type",
        "object_reference",
        "actor",
        "model_name",
        "method",
        "ip_address",
        "created_at",
    ]

    list_filter = [
        "event_type",
        "app_label",
        "model_name",
        "method",
        "created_at",
    ]

    search_fields = [
        "request_id",
        "object_id",
        "object_reference",
        "actor__username",
        "actor__email",
        "path",
    ]

    readonly_fields = [
        "request_id",
        "actor",
        "event_type",
        "app_label",
        "model_name",
        "object_id",
        "object_reference",
        "before_data",
        "after_data",
        "changed_fields",
        "metadata",
        "method",
        "path",
        "ip_address",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    date_hierarchy = "created_at"

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