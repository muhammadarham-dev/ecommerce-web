import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


def generate_order_number():
    unique_part = uuid.uuid4().hex[:12].upper()
    return f"ORD-{unique_part}"


class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    recipient_name = models.CharField(
        max_length=150,
    )

    phone_number = models.CharField(
        max_length=30,
    )

    address_line_1 = models.CharField(
        max_length=255,
    )

    address_line_2 = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
    )

    province = models.CharField(
        max_length=100,
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        default="Pakistan",
    )

    is_default = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-is_default",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "is_default",
                ],
            ),
            models.Index(
                fields=[
                    "city",
                    "province",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.recipient_name} - "
            f"{self.city}, {self.province}"
        )


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = (
            "CASH_ON_DELIVERY",
            "Cash on Delivery",
        )

        BANK_TRANSFER = (
            "BANK_TRANSFER",
            "Bank Transfer",
        )

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order_number = models.CharField(
        max_length=25,
        unique=True,
        default=generate_order_number,
        editable=False,
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH_ON_DELIVERY,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    shipping_zone = models.ForeignKey(
        "shipping_rates.ShippingZone",
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )

    shipping_method = models.ForeignKey(
        "shipping_rates.ShippingMethod",
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
        blank=True,
    )

    shipping_zone_name = models.CharField(
        max_length=150,
        blank=True,
    )

    shipping_zone_code = models.CharField(
        max_length=50,
        blank=True,
    )

    shipping_method_name = models.CharField(
        max_length=100,
        blank=True,
    )

    shipping_method_code = models.CharField(
        max_length=50,
        blank=True,
    )

    free_shipping_applied = models.BooleanField(
        default=False,
    )

    estimated_delivery_min_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    estimated_delivery_max_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    estimated_delivery_start = models.DateField(
        null=True,
        blank=True,
    )

    estimated_delivery_end = models.DateField(
        null=True,
        blank=True,
    )

    recipient_name = models.CharField(
        max_length=150,
    )

    recipient_phone = models.CharField(
        max_length=30,
    )

    address_line_1 = models.CharField(
        max_length=255,
    )

    address_line_2 = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
    )

    province = models.CharField(
        max_length=100,
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        default="Pakistan",
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    coupon_code = models.CharField(
        max_length=50,
        blank=True,
    )

    discount_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    notes = models.TextField(
        blank=True,
    )

    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    cancelled_at = models.DateTimeField(
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
            "-created_at",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="order_subtotal_not_negative",
            ),
            models.CheckConstraint(
                condition=Q(shipping_fee__gte=0),
                name="order_shipping_fee_not_negative",
            ),
            models.CheckConstraint(
                condition=Q(discount_amount__gte=0),
                name="order_discount_not_negative",
            ),
            models.CheckConstraint(
                condition=Q(total_amount__gte=0),
                name="order_total_not_negative",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "order_number",
                ],
            ),
            models.Index(
                fields=[
                    "customer",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "status",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "payment_status",
                    "created_at",
                ],
            ),
            models.Index(
                fields=[
                    "shipping_method_code",
                    "created_at",
                ],
            ),
        ]

    @property
    def can_cancel(self):
        return self.status in {
            self.Status.PENDING,
            self.Status.CONFIRMED,
        }

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    variant = models.ForeignKey(
        "variants.ProductVariant",
        on_delete=models.PROTECT,
        related_name="order_items",
        null=True,
        blank=True,
    )

    product_name = models.CharField(
        max_length=255,
    )

    product_sku = models.CharField(
        max_length=100,
    )

    variant_name = models.CharField(
        max_length=255,
        blank=True,
    )

    variant_sku = models.CharField(
        max_length=100,
        blank=True,
    )

    variant_options = models.JSONField(
        default=list,
        blank=True,
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    quantity = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1),
        ],
    )

    line_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "id",
        ]

        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0),
                name="order_item_quantity_positive",
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="order_item_unit_price_not_negative",
            ),
            models.CheckConstraint(
                condition=Q(line_total__gte=0),
                name="order_item_line_total_not_negative",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "order",
                    "product",
                ],
            ),
            models.Index(
                fields=[
                    "order",
                    "variant",
                ],
            ),
        ]

    def __str__(self):
        item_name = (
            self.variant_name
            or self.product_name
        )

        return (
            f"{item_name} × {self.quantity} "
            f"for {self.order.order_number}"
        )