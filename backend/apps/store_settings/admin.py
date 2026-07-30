from django.contrib import admin

from .models import StoreSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    fieldsets = [
        (
            "Store Branding",
            {
                "fields": [
                    "store_name",
                    "tagline",
                    "description",
                    "logo",
                    "favicon",
                ]
            },
        ),
        (
            "Contact Information",
            {
                "fields": [
                    "support_email",
                    "support_phone",
                    "whatsapp_number",
                    "address",
                    "city",
                    "province",
                    "country",
                    "postal_code",
                ]
            },
        ),
        (
            "Currency and Business Rules",
            {
                "fields": [
                    "currency_code",
                    "currency_symbol",
                    "tax_percentage",
                    "return_window_days",
                    "low_stock_threshold",
                    "order_cancellation_window_hours",
                ]
            },
        ),
        (
            "Payment Options",
            {
                "fields": [
                    "allow_cash_on_delivery",
                    "allow_bank_transfer",
                ]
            },
        ),
        (
            "Maintenance",
            {
                "fields": [
                    "maintenance_mode",
                    "maintenance_message",
                ]
            },
        ),
        (
            "Social Media",
            {
                "fields": [
                    "facebook_url",
                    "instagram_url",
                    "youtube_url",
                    "linkedin_url",
                    "twitter_url",
                ]
            },
        ),
        (
            "Audit Information",
            {
                "fields": [
                    "updated_by",
                    "created_at",
                    "updated_at",
                ]
            },
        ),
    ]

    readonly_fields = [
        "updated_by",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return not StoreSettings.objects.exists()

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        return False

    def save_model(
        self,
        request,
        obj,
        form,
        change,
    ):
        obj.updated_by = request.user

        super().save_model(
            request,
            obj,
            form,
            change,
        )