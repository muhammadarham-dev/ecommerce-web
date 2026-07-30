import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


def validate_banner_image_size(uploaded_file):
    maximum_size = 8 * 1024 * 1024

    if uploaded_file.size > maximum_size:
        raise ValidationError(
            "Banner image size cannot exceed 8 MB."
        )


def banner_image_upload_path(instance, filename):
    extension = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{extension}"

    return (
        f"banners/"
        f"{instance.position.lower()}/"
        f"{unique_filename}"
    )


class Banner(models.Model):
    class Position(models.TextChoices):
        HERO = "HERO", "Hero Banner"
        PROMOTIONAL = "PROMOTIONAL", "Promotional Banner"
        CATEGORY = "CATEGORY", "Category Banner"
        SIDEBAR = "SIDEBAR", "Sidebar Banner"

    title = models.CharField(
        max_length=200,
    )

    subtitle = models.CharField(
        max_length=300,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    image = models.ImageField(
        upload_to=banner_image_upload_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "jpg",
                    "jpeg",
                    "png",
                    "webp",
                ],
            ),
            validate_banner_image_size,
        ],
    )

    mobile_image = models.ImageField(
        upload_to=banner_image_upload_path,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "jpg",
                    "jpeg",
                    "png",
                    "webp",
                ],
            ),
            validate_banner_image_size,
        ],
    )

    position = models.CharField(
        max_length=20,
        choices=Position.choices,
        default=Position.HERO,
    )

    button_text = models.CharField(
        max_length=100,
        blank=True,
    )

    button_url = models.CharField(
        max_length=500,
        blank=True,
    )

    background_color = models.CharField(
        max_length=20,
        blank=True,
        help_text="Optional hexadecimal background color.",
    )

    text_color = models.CharField(
        max_length=20,
        blank=True,
        help_text="Optional hexadecimal text color.",
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    is_active = models.BooleanField(
        default=True,
    )

    starts_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    ends_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_banners",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "display_order",
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(display_order__gte=0),
                name="banner_display_order_not_negative",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "position",
                    "is_active",
                    "display_order",
                ],
            ),
            models.Index(
                fields=[
                    "starts_at",
                    "ends_at",
                ],
            ),
        ]

    def clean(self):
        errors = {}

        if (
            self.starts_at
            and self.ends_at
            and self.ends_at <= self.starts_at
        ):
            errors["ends_at"] = (
                "The ending time must be later "
                "than the starting time."
            )

        if self.button_url and not self.button_text:
            errors["button_text"] = (
                "Button text is required when "
                "a button URL is provided."
            )

        if self.button_text and not self.button_url:
            errors["button_url"] = (
                "Button URL is required when "
                "button text is provided."
            )

        if errors:
            raise ValidationError(errors)

    @property
    def is_currently_visible(self):
        current_time = timezone.now()

        if not self.is_active:
            return False

        if (
            self.starts_at
            and current_time < self.starts_at
        ):
            return False

        if (
            self.ends_at
            and current_time > self.ends_at
        ):
            return False

        return True

    def __str__(self):
        return f"{self.title} - {self.position}"