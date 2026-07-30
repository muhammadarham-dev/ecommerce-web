from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "payment_number",
        "order",
        "customer",
        "method",
        "status",
        "amount",
        "created_at",
    ]

    list_filter = [
        "method",
        "status",
        "created_at",
    ]

    search_fields = [
        "payment_number",
        "order__order_number",
        "customer__username",
        "customer__email",
        "transaction_reference",
    ]

    readonly_fields = [
        "payment_number",
        "order",
        "customer",
        "method",
        "amount",
        "transaction_reference",
        "proof",
        "submitted_at",
        "verified_at",
        "rejected_at",
        "refunded_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]