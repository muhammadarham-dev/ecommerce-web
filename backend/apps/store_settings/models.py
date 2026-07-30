from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models


ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".ico",
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024


def validate_store_image(file):
    extension = Path(file.name).suffix.lower()

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            "Only JPG, JPEG, PNG, WEBP and ICO files are allowed."
        )

    if file.size > MAX_IMAGE_SIZE:
        raise ValidationError(
            "Image size cannot exceed 5 MB."
        )


class StoreSettings(models.Model):
    store_name = models.CharField(
        max_length=150,
        default="Ecommerce Store",
    )

    tagline = models.CharField(
        max_length=255,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    logo = models.ImageField(
        upload_to="store/settings/logo/",
        validators=[
            validate_store_image,
        ],
        null=True,
        blank=True,
    )

    favicon = models.ImageField(
        upload_to="store/settings/favicon/",
        validators=[
            validate_store_image,
        ],
        null=True,
        blank=True,
    )

    support_email = models.EmailField(
        blank=True,
    )

    support_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    whatsapp_number = models.CharField(
        max_length=30,
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    province = models.CharField(
        max_length=100,
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        default="Pakistan",
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
    )

    currency_code = models.CharField(
        max_length=10,
        default="PKR",
    )

    currency_symbol = models.CharField(
        max_length=10,
        default="Rs.",
    )

    tax_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    return_window_days = models.PositiveIntegerField(
        default=7,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(365),
        ],
    )

    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        validators=[
            MinValueValidator(1),
        ],
    )

    order_cancellation_window_hours = (
        models.PositiveIntegerField(
            default=24,
            validators=[
                MinValueValidator(1),
            ],
        )
    )

    maintenance_mode = models.BooleanField(
        default=False,
    )

    maintenance_message = models.CharField(
        max_length=500,
        blank=True,
        default=(
            "The store is temporarily unavailable. "
            "Please try again later."
        ),
    )

    allow_cash_on_delivery = models.BooleanField(
        default=True,
    )

    allow_bank_transfer = models.BooleanField(
        default=True,
    )

    facebook_url = models.URLField(
        blank=True,
    )

    instagram_url = models.URLField(
        blank=True,
    )

    youtube_url = models.URLField(
        blank=True,
    )

    linkedin_url = models.URLField(
        blank=True,
    )

    twitter_url = models.URLField(
        blank=True,
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="store_settings_updates",
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
        verbose_name = "Store Settings"
        verbose_name_plural = "Store Settings"

    @classmethod
    def load(cls):
        settings_object, _ = cls.objects.get_or_create(
            pk=1,
        )

        return settings_object

    def clean(self):
        if (
            self.maintenance_mode
            and not self.maintenance_message.strip()
        ):
            raise ValidationError(
                {
                    "maintenance_message": (
                        "A maintenance message is required "
                        "when maintenance mode is enabled."
                    )
                }
            )

        if (
            not self.allow_cash_on_delivery
            and not self.allow_bank_transfer
        ):
            raise ValidationError(
                "At least one payment method must remain enabled."
            )

    def save(self, *args, **kwargs):
        self.pk = 1

        self.store_name = self.store_name.strip()
        self.tagline = self.tagline.strip()
        self.support_phone = self.support_phone.strip()
        self.whatsapp_number = self.whatsapp_number.strip()
        self.city = self.city.strip()
        self.province = self.province.strip()
        self.country = self.country.strip()
        self.postal_code = self.postal_code.strip()
        self.currency_code = (
            self.currency_code.strip().upper()
        )
        self.currency_symbol = (
            self.currency_symbol.strip()
        )
        self.maintenance_message = (
            self.maintenance_message.strip()
        )

        self.full_clean()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "Store settings cannot be deleted."
        )

    def __str__(self):
        return self.store_name