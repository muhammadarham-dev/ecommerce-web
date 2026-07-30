import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"

        PASSWORD_CHANGE = (
            "PASSWORD_CHANGE",
            "Password Change",
        )

        PASSWORD_RESET = (
            "PASSWORD_RESET",
            "Password Reset",
        )

        EMAIL_VERIFICATION = (
            "EMAIL_VERIFICATION",
            "Email Verification",
        )

        CHECKOUT = "CHECKOUT", "Checkout"

        ORDER_CANCEL = (
            "ORDER_CANCEL",
            "Order Cancellation",
        )

        STATUS_CHANGE = (
            "STATUS_CHANGE",
            "Status Change",
        )

        OTHER = "OTHER", "Other"

    request_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True,
    )

    action = models.CharField(
        max_length=30,
        choices=Action.choices,
        default=Action.OTHER,
    )

    method = models.CharField(
        max_length=10,
    )

    path = models.CharField(
        max_length=1000,
    )

    route_name = models.CharField(
        max_length=255,
        blank=True,
    )

    status_code = models.PositiveIntegerField(
        default=200,
    )

    success = models.BooleanField(
        default=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    query_params = models.JSONField(
        default=dict,
        blank=True,
    )

    request_data = models.JSONField(
        default=dict,
        blank=True,
    )

    error_message = models.TextField(
        blank=True,
    )

    duration_ms = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "action",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "success",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "status_code",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "ip_address",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "method",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        username = (
            self.user.username
            if self.user
            else "Anonymous"
        )

        return (
            f"{self.action} - "
            f"{username} - "
            f"{self.path}"
        )


class BusinessAuditEvent(models.Model):
    class Type(models.TextChoices):
        PRODUCT_CREATED = (
            "PRODUCT_CREATED",
            "Product Created",
        )

        PRODUCT_UPDATED = (
            "PRODUCT_UPDATED",
            "Product Updated",
        )

        PRODUCT_DELETED = (
            "PRODUCT_DELETED",
            "Product Deleted",
        )

        COUPON_CREATED = (
            "COUPON_CREATED",
            "Coupon Created",
        )

        COUPON_UPDATED = (
            "COUPON_UPDATED",
            "Coupon Updated",
        )

        COUPON_DELETED = (
            "COUPON_DELETED",
            "Coupon Deleted",
        )

        STOCK_MOVEMENT = (
            "STOCK_MOVEMENT",
            "Stock Movement",
        )

        RETURN_CREATED = (
            "RETURN_CREATED",
            "Return Created",
        )

        RETURN_STATUS_CHANGED = (
            "RETURN_STATUS_CHANGED",
            "Return Status Changed",
        )

        PAYMENT_STATUS_CHANGED = (
            "PAYMENT_STATUS_CHANGED",
            "Payment Status Changed",
        )

        REFUND_PROCESSED = (
            "REFUND_PROCESSED",
            "Refund Processed",
        )

        OTHER = "OTHER", "Other"

    request_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="business_audit_events",
        null=True,
        blank=True,
    )

    event_type = models.CharField(
        max_length=50,
        choices=Type.choices,
        default=Type.OTHER,
    )

    app_label = models.CharField(
        max_length=100,
    )

    model_name = models.CharField(
        max_length=100,
    )

    object_id = models.CharField(
        max_length=100,
        blank=True,
    )

    object_reference = models.CharField(
        max_length=255,
        blank=True,
    )

    before_data = models.JSONField(
        default=dict,
        blank=True,
    )

    after_data = models.JSONField(
        default=dict,
        blank=True,
    )

    changed_fields = models.JSONField(
        default=list,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    method = models.CharField(
        max_length=10,
        blank=True,
    )

    path = models.CharField(
        max_length=1000,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "event_type",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "actor",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "app_label",
                    "model_name",
                    "object_id",
                ],
            ),
            models.Index(
                fields=[
                    "request_id",
                    "created_at",
                ],
            ),
        ]

    def __str__(self):
        reference = (
            self.object_reference
            or self.object_id
            or "Unknown"
        )

        return (
            f"{self.get_event_type_display()} - "
            f"{reference}"
        )