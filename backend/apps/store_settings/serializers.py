from rest_framework import serializers

from .models import StoreSettings


class PublicStoreSettingsSerializer(
    serializers.ModelSerializer
):
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()

    class Meta:
        model = StoreSettings

        fields = [
            "store_name",
            "tagline",
            "description",
            "logo_url",
            "favicon_url",
            "support_email",
            "support_phone",
            "whatsapp_number",
            "address",
            "city",
            "province",
            "country",
            "postal_code",
            "currency_code",
            "currency_symbol",
            "tax_percentage",
            "return_window_days",
            "maintenance_mode",
            "maintenance_message",
            "allow_cash_on_delivery",
            "allow_bank_transfer",
            "facebook_url",
            "instagram_url",
            "youtube_url",
            "linkedin_url",
            "twitter_url",
        ]

        read_only_fields = fields

    def build_file_url(self, file_field):
        if not file_field:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                file_field.url
            )

        return file_field.url

    def get_logo_url(self, settings_object):
        return self.build_file_url(
            settings_object.logo,
        )

    def get_favicon_url(self, settings_object):
        return self.build_file_url(
            settings_object.favicon,
        )


class StoreSettingsManagementSerializer(
    serializers.ModelSerializer
):
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()

    updated_by_username = serializers.CharField(
        source="updated_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = StoreSettings

        fields = [
            "id",
            "store_name",
            "tagline",
            "description",
            "logo",
            "logo_url",
            "favicon",
            "favicon_url",
            "support_email",
            "support_phone",
            "whatsapp_number",
            "address",
            "city",
            "province",
            "country",
            "postal_code",
            "currency_code",
            "currency_symbol",
            "tax_percentage",
            "return_window_days",
            "low_stock_threshold",
            "order_cancellation_window_hours",
            "maintenance_mode",
            "maintenance_message",
            "allow_cash_on_delivery",
            "allow_bank_transfer",
            "facebook_url",
            "instagram_url",
            "youtube_url",
            "linkedin_url",
            "twitter_url",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "logo_url",
            "favicon_url",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "logo": {
                "required": False,
                "allow_null": True,
            },
            "favicon": {
                "required": False,
                "allow_null": True,
            },
        }

    def build_file_url(self, file_field):
        if not file_field:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                file_field.url
            )

        return file_field.url

    def get_logo_url(self, settings_object):
        return self.build_file_url(
            settings_object.logo,
        )

    def get_favicon_url(self, settings_object):
        return self.build_file_url(
            settings_object.favicon,
        )

    def validate_currency_code(self, value):
        normalized_value = value.strip().upper()

        if len(normalized_value) < 3:
            raise serializers.ValidationError(
                "Currency code must contain at least 3 characters."
            )

        return normalized_value

    def validate(self, attributes):
        maintenance_mode = attributes.get(
            "maintenance_mode",
            getattr(
                self.instance,
                "maintenance_mode",
                False,
            ),
        )

        maintenance_message = attributes.get(
            "maintenance_message",
            getattr(
                self.instance,
                "maintenance_message",
                "",
            ),
        )

        allow_cash_on_delivery = attributes.get(
            "allow_cash_on_delivery",
            getattr(
                self.instance,
                "allow_cash_on_delivery",
                True,
            ),
        )

        allow_bank_transfer = attributes.get(
            "allow_bank_transfer",
            getattr(
                self.instance,
                "allow_bank_transfer",
                True,
            ),
        )

        if (
            maintenance_mode
            and not maintenance_message.strip()
        ):
            raise serializers.ValidationError(
                {
                    "maintenance_message": (
                        "A maintenance message is required "
                        "when maintenance mode is enabled."
                    )
                }
            )

        if (
            not allow_cash_on_delivery
            and not allow_bank_transfer
        ):
            raise serializers.ValidationError(
                {
                    "payment_methods": (
                        "At least one payment method "
                        "must remain enabled."
                    )
                }
            )

        return attributes