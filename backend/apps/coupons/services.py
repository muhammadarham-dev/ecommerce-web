from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Coupon, CouponUsage


MONEY_PRECISION = Decimal("0.01")


def validate_coupon(
    *,
    coupon,
    customer,
    subtotal,
):
    current_time = timezone.now()

    if not coupon.is_active:
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "This coupon is currently inactive."
                )
            }
        )

    if (
        coupon.starts_at
        and current_time < coupon.starts_at
    ):
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "This coupon is not active yet."
                )
            }
        )

    if (
        coupon.expires_at
        and current_time > coupon.expires_at
    ):
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "This coupon has expired."
                )
            }
        )

    if subtotal < coupon.minimum_order_amount:
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "Your order amount must be at least "
                    f"{coupon.minimum_order_amount} "
                    "to use this coupon."
                )
            }
        )

    active_usages = coupon.usages.filter(
        is_reversed=False,
    )

    if (
        coupon.total_usage_limit is not None
        and active_usages.count()
        >= coupon.total_usage_limit
    ):
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "This coupon has reached its usage limit."
                )
            }
        )

    customer_usage_count = active_usages.filter(
        customer=customer,
    ).count()

    if customer_usage_count >= coupon.per_customer_limit:
        raise serializers.ValidationError(
            {
                "coupon_code": (
                    "You have already reached the usage "
                    "limit for this coupon."
                )
            }
        )


def calculate_discount(
    *,
    coupon,
    subtotal,
):
    if (
        coupon.discount_type
        == Coupon.DiscountType.PERCENTAGE
    ):
        discount_amount = (
            subtotal * coupon.value
        ) / Decimal("100.00")

        if coupon.maximum_discount_amount is not None:
            discount_amount = min(
                discount_amount,
                coupon.maximum_discount_amount,
            )

    else:
        discount_amount = coupon.value

    discount_amount = min(
        discount_amount,
        subtotal,
    )

    return discount_amount.quantize(
        MONEY_PRECISION,
        rounding=ROUND_HALF_UP,
    )


def get_coupon_discount(
    *,
    code,
    customer,
    subtotal,
    lock=False,
):
    normalized_code = code.strip().upper()

    if not normalized_code:
        raise serializers.ValidationError(
            {
                "coupon_code": "Coupon code is required."
            }
        )

    queryset = Coupon.objects

    if lock:
        queryset = queryset.select_for_update()

    try:
        coupon = queryset.get(
            code__iexact=normalized_code,
        )
    except Coupon.DoesNotExist as error:
        raise serializers.ValidationError(
            {
                "coupon_code": "Invalid coupon code."
            }
        ) from error

    validate_coupon(
        coupon=coupon,
        customer=customer,
        subtotal=subtotal,
    )

    discount_amount = calculate_discount(
        coupon=coupon,
        subtotal=subtotal,
    )

    return coupon, discount_amount


def create_coupon_usage(
    *,
    coupon,
    customer,
    order,
    discount_amount,
):
    return CouponUsage.objects.create(
        coupon=coupon,
        customer=customer,
        order=order,
        discount_amount=discount_amount,
    )


@transaction.atomic
def reverse_coupon_usage(*, order):
    usage = (
        CouponUsage.objects
        .select_for_update()
        .filter(
            order=order,
            is_reversed=False,
        )
        .first()
    )

    if usage is None:
        return None

    usage.is_reversed = True
    usage.reversed_at = timezone.now()

    usage.save(
        update_fields=[
            "is_reversed",
            "reversed_at",
        ]
    )

    return usage