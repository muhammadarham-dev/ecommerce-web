from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class ShippingZone(models.Model):
    name = models.CharField(
        max_length=150,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    country = models.CharField(
        max_length=100,
        default="Pakistan",
    )

    province = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    priority = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Higher priority zones are selected first "
            "when multiple zones match."
        ),
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-priority",
            "name",
        ]

        indexes = [
            models.Index(
                fields=[
                    "country",
                    "province",
                    "city",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "is_active",
                    "priority",
                ],
            ),
        ]

    @property
    def zone_level(self):
        if self.city:
            return "CITY"

        if self.province:
            return "PROVINCE"

        return "COUNTRY"

    def clean(self):
        duplicate_query = ShippingZone.objects.filter(
            country__iexact=self.country,
            province__iexact=self.province,
            city__iexact=self.city,
        )

        if self.pk:
            duplicate_query = duplicate_query.exclude(
                pk=self.pk,
            )

        if duplicate_query.exists():
            raise ValidationError(
                "A shipping zone already exists for this location."
            )

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        self.code = self.code.strip().upper()
        self.country = self.country.strip()
        self.province = self.province.strip()
        self.city = self.city.strip()

        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self):
        location_parts = [
            self.city,
            self.province,
            self.country,
        ]

        location = ", ".join(
            part
            for part in location_parts
            if part
        )

        return f"{self.name} ({location})"


class ShippingMethod(models.Model):
    name = models.CharField(
        max_length=100,
    )

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_default = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    display_order = models.PositiveIntegerField(
        default=0,
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
            "name",
        ]

        indexes = [
            models.Index(
                fields=[
                    "is_active",
                    "display_order",
                ],
            ),
            models.Index(
                fields=[
                    "is_default",
                    "is_active",
                ],
            ),
        ]

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        self.code = self.code.strip().upper()

        super().save(*args, **kwargs)

        if self.is_default:
            ShippingMethod.objects.filter(
                is_default=True,
            ).exclude(
                pk=self.pk,
            ).update(
                is_default=False,
            )

    def __str__(self):
        return self.name


class ShippingRate(models.Model):
    zone = models.ForeignKey(
        ShippingZone,
        on_delete=models.CASCADE,
        related_name="rates",
    )

    method = models.ForeignKey(
        ShippingMethod,
        on_delete=models.CASCADE,
        related_name="rates",
    )

    charge = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    free_shipping_threshold = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    estimated_min_days = models.PositiveIntegerField(
        default=3,
        validators=[
            MinValueValidator(1),
        ],
    )

    estimated_max_days = models.PositiveIntegerField(
        default=5,
        validators=[
            MinValueValidator(1),
        ],
    )

    cod_available = models.BooleanField(
        default=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "zone__name",
            "method__display_order",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "zone",
                    "method",
                ],
                name="unique_shipping_rate_per_zone_method",
            ),
            models.CheckConstraint(
                condition=Q(charge__gte=0),
                name="shipping_rate_charge_not_negative",
            ),
            models.CheckConstraint(
                condition=(
                    Q(free_shipping_threshold__isnull=True)
                    | Q(free_shipping_threshold__gte=0)
                ),
                name="shipping_free_threshold_not_negative",
            ),
            models.CheckConstraint(
                condition=Q(estimated_min_days__gte=1),
                name="shipping_min_days_positive",
            ),
            models.CheckConstraint(
                condition=Q(estimated_max_days__gte=1),
                name="shipping_max_days_positive",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "zone",
                    "method",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "cod_available",
                    "is_active",
                ],
            ),
        ]

    def clean(self):
        if (
            self.estimated_max_days
            < self.estimated_min_days
        ):
            raise ValidationError(
                {
                    "estimated_max_days": (
                        "Maximum delivery days cannot be "
                        "less than minimum delivery days."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.zone.name} - "
            f"{self.method.name}: {self.charge}"
        )