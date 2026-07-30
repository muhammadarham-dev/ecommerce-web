from rest_framework import serializers

from .models import Banner


class PublicBannerSerializer(
    serializers.ModelSerializer
):
    is_currently_visible = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Banner

        fields = [
            "id",
            "title",
            "subtitle",
            "description",
            "image",
            "mobile_image",
            "position",
            "button_text",
            "button_url",
            "background_color",
            "text_color",
            "display_order",
            "is_currently_visible",
        ]

        read_only_fields = fields


class BannerManagementSerializer(
    serializers.ModelSerializer
):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
        allow_null=True,
    )

    is_currently_visible = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Banner

        fields = [
            "id",
            "title",
            "subtitle",
            "description",
            "image",
            "mobile_image",
            "position",
            "button_text",
            "button_url",
            "background_color",
            "text_color",
            "display_order",
            "is_active",
            "starts_at",
            "ends_at",
            "is_currently_visible",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_currently_visible",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

    def validate(self, attributes):
        starts_at = attributes.get(
            "starts_at",
            getattr(
                self.instance,
                "starts_at",
                None,
            ),
        )

        ends_at = attributes.get(
            "ends_at",
            getattr(
                self.instance,
                "ends_at",
                None,
            ),
        )

        button_text = attributes.get(
            "button_text",
            getattr(
                self.instance,
                "button_text",
                "",
            ),
        )

        button_url = attributes.get(
            "button_url",
            getattr(
                self.instance,
                "button_url",
                "",
            ),
        )

        if (
            starts_at
            and ends_at
            and ends_at <= starts_at
        ):
            raise serializers.ValidationError(
                {
                    "ends_at": (
                        "The ending time must be later "
                        "than the starting time."
                    )
                }
            )

        if button_url and not button_text:
            raise serializers.ValidationError(
                {
                    "button_text": (
                        "Button text is required when "
                        "a button URL is provided."
                    )
                }
            )

        if button_text and not button_url:
            raise serializers.ValidationError(
                {
                    "button_url": (
                        "Button URL is required when "
                        "button text is provided."
                    )
                }
            )

        return attributes

    def validate_background_color(self, value):
        normalized_value = value.strip()

        if normalized_value and not (
            normalized_value.startswith("#")
            and len(normalized_value) in {
                4,
                7,
                9,
            }
        ):
            raise serializers.ValidationError(
                "Enter a valid hexadecimal color value."
            )

        return normalized_value

    def validate_text_color(self, value):
        normalized_value = value.strip()

        if normalized_value and not (
            normalized_value.startswith("#")
            and len(normalized_value) in {
                4,
                7,
                9,
            }
        ):
            raise serializers.ValidationError(
                "Enter a valid hexadecimal color value."
            )

        return normalized_value