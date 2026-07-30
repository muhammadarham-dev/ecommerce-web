from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F, Q
from django.utils.text import slugify
from pathlib import Path
from uuid import uuid4


def generate_unique_slug(instance, value):
    base_slug = slugify(value) or "item"
    slug = base_slug
    counter = 2

    model_class = instance.__class__

    while (
        model_class.objects.filter(slug=slug)
        .exclude(pk=instance.pk)
        .exists()
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def category_image_upload_path(instance, filename):
    return f"categories/{instance.slug}/{filename}"


def product_image_upload_path(instance, filename):
    extension = Path(filename).suffix.lower() or ".jpg"
    unique_filename = f"{uuid4().hex}{extension}"

    return (
        f"products/"
        f"{instance.product_id}/"
        f"{unique_filename}"
    )


class Category(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    image = models.ImageField(
        upload_to=category_image_upload_path,
        max_length=255,
        blank=True,
        null=True,
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
        ordering = ["name"]
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    name = models.CharField(
        max_length=255,
    )

    slug = models.SlugField(
        max_length=280,
        unique=True,
        blank=True,
    )

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField()

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01")),
        ],
    )

    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[
            MinValueValidator(Decimal("0.01")),
        ],
    )

    stock = models.PositiveIntegerField(
        default=0,
    )

    is_active = models.BooleanField(
        default=True,
    )

    is_featured = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=Q(price__gt=0),
                name="product_price_greater_than_zero",
            ),
            models.CheckConstraint(
                condition=(
                    Q(discount_price__isnull=True)
                    | Q(discount_price__lt=F("price"))
                ),
                name="product_discount_less_than_price",
            ),
        ]

        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["is_active", "is_featured"]),
        ]

    def clean(self):
        errors = {}

        if self.discount_price is not None:
            if self.discount_price >= self.price:
                errors["discount_price"] = (
                    "Discount price must be lower than the regular price."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)

        super().save(*args, **kwargs)

    @property
    def final_price(self):
        if self.discount_price is not None:
            return self.discount_price

        return self.price

    @property
    def in_stock(self):
        return self.stock > 0

    def __str__(self):
        return f"{self.name} ({self.sku})"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to=product_image_upload_path,
        max_length=255,
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-is_primary",
            "id",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="unique_primary_image_per_product",
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.product_id:
            return super().save(*args, **kwargs)

        with transaction.atomic():
            other_images = ProductImage.objects.filter(
                product_id=self.product_id,
            ).exclude(pk=self.pk)

            if not other_images.exists():
                self.is_primary = True

            if self.is_primary:
                other_images.filter(
                    is_primary=True,
                ).update(is_primary=False)

            return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        product_id = self.product_id
        was_primary = self.is_primary

        with transaction.atomic():
            result = super().delete(*args, **kwargs)

            if was_primary and product_id:
                replacement = (
                    ProductImage.objects
                    .filter(product_id=product_id)
                    .order_by("id")
                    .first()
                )

                if replacement is not None:
                    ProductImage.objects.filter(
                        pk=replacement.pk,
                    ).update(is_primary=True)

            return result

    def __str__(self):
        return f"Image for {self.product.name}"