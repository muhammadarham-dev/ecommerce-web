from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

from apps.products.models import Product


class ProductAttribute(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
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
        ]

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductAttributeValue(models.Model):
    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.CASCADE,
        related_name="values",
    )

    value = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=120,
        blank=True,
    )

    display_value = models.CharField(
        max_length=100,
        blank=True,
    )

    color_code = models.CharField(
        max_length=20,
        blank=True,
        help_text=(
            "Optional hexadecimal color code, "
            "for example #000000."
        ),
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
            "attribute__display_order",
            "display_order",
            "value",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "attribute",
                    "slug",
                ],
                name="unique_attribute_value_slug",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "attribute",
                    "is_active",
                    "display_order",
                ],
            ),
        ]

    def save(self, *args, **kwargs):
        self.value = self.value.strip()
        self.slug = slugify(self.value)
        self.display_value = (
            self.display_value.strip()
            if self.display_value
            else self.value
        )
        self.color_code = self.color_code.strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.attribute.name}: {self.display_value}"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    attribute_values = models.ManyToManyField(
        ProductAttributeValue,
        through="ProductVariantOption",
        related_name="product_variants",
    )

    price_override = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    stock = models.PositiveIntegerField(
        default=0,
    )

    combination_key = models.CharField(
        max_length=500,
        editable=False,
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
            "product__name",
            "sku",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "product",
                    "combination_key",
                ],
                name="unique_variant_combination_per_product",
            ),
            models.CheckConstraint(
                condition=Q(stock__gte=0),
                name="product_variant_stock_not_negative",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "product",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "sku",
                ],
            ),
            models.Index(
                fields=[
                    "stock",
                    "is_active",
                ],
            ),
        ]

    @property
    def final_price(self):
        if self.price_override is not None:
            return self.price_override

        return self.product.final_price

    @property
    def in_stock(self):
        return self.is_active and self.stock > 0

    @property
    def variant_name(self):
        option_names = [
            option.value.display_value
            for option in self.options.select_related(
                "value",
            ).all()
        ]

        if not option_names:
            return self.product.name

        return (
            f"{self.product.name} - "
            f"{' / '.join(option_names)}"
        )

    def __str__(self):
        return f"{self.product.name} - {self.sku}"


class ProductVariantOption(models.Model):
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="options",
    )

    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.PROTECT,
        related_name="variant_options",
    )

    value = models.ForeignKey(
        ProductAttributeValue,
        on_delete=models.PROTECT,
        related_name="variant_options",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "attribute__display_order",
            "attribute__name",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "variant",
                    "attribute",
                ],
                name="unique_attribute_per_variant",
            ),
            models.UniqueConstraint(
                fields=[
                    "variant",
                    "value",
                ],
                name="unique_value_per_variant",
            ),
        ]

    def __str__(self):
        return (
            f"{self.variant.sku} - "
            f"{self.attribute.name}: {self.value.value}"
        )