from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import (
    Avg,
    Count,
    DecimalField,
    IntegerField,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import (
    Coalesce,
    TruncDate,
)
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order, OrderItem
from apps.orders.permissions import (
    IsOrderManagerOrAdmin,
)
from apps.products.models import Product
from apps.store_settings.services import (
    get_low_stock_threshold,
)
from apps.variants.models import ProductVariant


User = get_user_model()


def decimal_output_field():
    return DecimalField(
        max_digits=18,
        decimal_places=2,
    )


def money_sum(field_name):
    return Coalesce(
        Sum(field_name),
        Value(Decimal("0.00")),
        output_field=decimal_output_field(),
    )


def quantity_sum(field_name):
    return Coalesce(
        Sum(field_name),
        Value(0),
        output_field=IntegerField(),
    )


def format_money(value):
    normalized_value = Decimal(
        str(value or "0.00")
    )

    return str(
        normalized_value.quantize(
            Decimal("0.01")
        )
    )


def get_report_date_range(request):
    date_from_value = request.query_params.get(
        "date_from",
        "",
    )

    date_to_value = request.query_params.get(
        "date_to",
        "",
    )

    date_from = None
    date_to = None

    if date_from_value:
        date_from = parse_date(
            date_from_value
        )

        if date_from is None:
            raise ValidationError(
                {
                    "date_from": (
                        "Use YYYY-MM-DD format."
                    )
                }
            )

    if date_to_value:
        date_to = parse_date(
            date_to_value
        )

        if date_to is None:
            raise ValidationError(
                {
                    "date_to": (
                        "Use YYYY-MM-DD format."
                    )
                }
            )

    if (
        date_from is not None
        and date_to is not None
        and date_to < date_from
    ):
        raise ValidationError(
            {
                "date_to": (
                    "The end date cannot be before "
                    "the start date."
                )
            }
        )

    return date_from, date_to


def apply_date_range(
    queryset,
    *,
    field_name,
    date_from,
    date_to,
):
    if date_from is not None:
        queryset = queryset.filter(
            **{
                f"{field_name}__date__gte": (
                    date_from
                )
            }
        )

    if date_to is not None:
        queryset = queryset.filter(
            **{
                f"{field_name}__date__lte": (
                    date_to
                )
            }
        )

    return queryset


def get_limit(
    request,
    *,
    default=10,
    maximum=100,
):
    raw_limit = request.query_params.get(
        "limit",
        str(default),
    )

    try:
        limit = int(raw_limit)
    except ValueError as error:
        raise ValidationError(
            {
                "limit": (
                    "Limit must be a valid integer."
                )
            }
        ) from error

    if limit < 1:
        raise ValidationError(
            {
                "limit": (
                    "Limit must be greater than zero."
                )
            }
        )

    return min(limit, maximum)


class ReportDashboardView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        today = timezone.localdate()
        last_30_days = (
            today - timedelta(days=29)
        )

        low_stock_threshold = (
            get_low_stock_threshold()
        )

        orders = Order.objects.all()

        valid_orders = orders.exclude(
            status=Order.Status.CANCELLED,
        )

        paid_orders = valid_orders.filter(
            payment_status=(
                Order.PaymentStatus.PAID
            ),
        )

        total_revenue = (
            paid_orders.aggregate(
                total=money_sum(
                    "total_amount"
                ),
            )["total"]
        )

        today_revenue = (
            paid_orders
            .filter(
                created_at__date=today,
            )
            .aggregate(
                total=money_sum(
                    "total_amount"
                ),
            )["total"]
        )

        simple_products = (
            Product.objects
            .filter(
                is_active=True,
                category__is_active=True,
                variants__isnull=True,
            )
            .distinct()
        )

        active_variants = (
            ProductVariant.objects
            .filter(
                is_active=True,
                product__is_active=True,
                product__category__is_active=True,
            )
        )

        daily_revenue_rows = (
            paid_orders
            .filter(
                created_at__date__gte=(
                    last_30_days
                ),
            )
            .annotate(
                report_date=TruncDate(
                    "created_at"
                ),
            )
            .values("report_date")
            .annotate(
                order_count=Count("id"),
                revenue=money_sum(
                    "total_amount"
                ),
            )
            .order_by("report_date")
        )

        order_status_rows = (
            orders
            .values("status")
            .annotate(
                count=Count("id"),
            )
            .order_by("status")
        )

        customer_role = getattr(
            getattr(User, "Role", None),
            "CUSTOMER",
            "CUSTOMER",
        )

        return Response(
            {
                "summary": {
                    "total_orders": (
                        orders.count()
                    ),
                    "today_orders": (
                        orders.filter(
                            created_at__date=today,
                        ).count()
                    ),
                    "paid_orders": (
                        paid_orders.count()
                    ),
                    "cancelled_orders": (
                        orders.filter(
                            status=(
                                Order.Status.CANCELLED
                            ),
                        ).count()
                    ),
                    "total_revenue": (
                        format_money(
                            total_revenue
                        )
                    ),
                    "today_revenue": (
                        format_money(
                            today_revenue
                        )
                    ),
                    "total_customers": (
                        User.objects.filter(
                            role=customer_role,
                        ).count()
                    ),
                    "simple_products": (
                        simple_products.count()
                    ),
                    "active_variants": (
                        active_variants.count()
                    ),
                    "low_stock_threshold": (
                        low_stock_threshold
                    ),
                    "low_stock_products": (
                        simple_products
                        .filter(
                            stock__gt=0,
                            stock__lte=(
                                low_stock_threshold
                            ),
                        )
                        .count()
                    ),
                    "out_of_stock_products": (
                        simple_products
                        .filter(stock=0)
                        .count()
                    ),
                    "low_stock_variants": (
                        active_variants
                        .filter(
                            stock__gt=0,
                            stock__lte=(
                                low_stock_threshold
                            ),
                        )
                        .count()
                    ),
                    "out_of_stock_variants": (
                        active_variants
                        .filter(stock=0)
                        .count()
                    ),
                },
                "orders_by_status": [
                    {
                        "status": row["status"],
                        "count": row["count"],
                    }
                    for row in order_status_rows
                ],
                "last_30_days_revenue": [
                    {
                        "date": (
                            row[
                                "report_date"
                            ].isoformat()
                        ),
                        "orders": (
                            row["order_count"]
                        ),
                        "revenue": (
                            format_money(
                                row["revenue"]
                            )
                        ),
                    }
                    for row in daily_revenue_rows
                ],
            },
            status=status.HTTP_200_OK,
        )


class SalesReportView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        date_from, date_to = (
            get_report_date_range(request)
        )

        orders = apply_date_range(
            Order.objects.all(),
            field_name="created_at",
            date_from=date_from,
            date_to=date_to,
        )

        valid_orders = orders.exclude(
            status=Order.Status.CANCELLED,
        )

        paid_orders = valid_orders.filter(
            payment_status=(
                Order.PaymentStatus.PAID
            ),
        )

        financial_summary = (
            paid_orders.aggregate(
                revenue=money_sum(
                    "total_amount"
                ),
                subtotal=money_sum(
                    "subtotal"
                ),
                shipping_revenue=money_sum(
                    "shipping_fee"
                ),
                discounts=money_sum(
                    "discount_amount"
                ),
                average_order_value=Avg(
                    "total_amount",
                    output_field=(
                        decimal_output_field()
                    ),
                ),
            )
        )

        daily_rows = (
            paid_orders
            .annotate(
                report_date=TruncDate(
                    "created_at"
                ),
            )
            .values("report_date")
            .annotate(
                orders=Count("id"),
                revenue=money_sum(
                    "total_amount"
                ),
            )
            .order_by("report_date")
        )

        status_rows = (
            orders
            .values("status")
            .annotate(
                count=Count("id"),
            )
            .order_by("status")
        )

        payment_method_rows = (
            valid_orders
            .values("payment_method")
            .annotate(
                count=Count("id"),
                total=money_sum(
                    "total_amount"
                ),
            )
            .order_by("payment_method")
        )

        return Response(
            {
                "date_range": {
                    "date_from": (
                        date_from.isoformat()
                        if date_from
                        else None
                    ),
                    "date_to": (
                        date_to.isoformat()
                        if date_to
                        else None
                    ),
                },
                "summary": {
                    "total_orders": (
                        orders.count()
                    ),
                    "valid_orders": (
                        valid_orders.count()
                    ),
                    "paid_orders": (
                        paid_orders.count()
                    ),
                    "cancelled_orders": (
                        orders.filter(
                            status=(
                                Order.Status.CANCELLED
                            ),
                        ).count()
                    ),
                    "revenue": format_money(
                        financial_summary[
                            "revenue"
                        ]
                    ),
                    "subtotal": format_money(
                        financial_summary[
                            "subtotal"
                        ]
                    ),
                    "shipping_revenue": (
                        format_money(
                            financial_summary[
                                "shipping_revenue"
                            ]
                        )
                    ),
                    "discounts": format_money(
                        financial_summary[
                            "discounts"
                        ]
                    ),
                    "average_order_value": (
                        format_money(
                            financial_summary[
                                "average_order_value"
                            ]
                        )
                    ),
                },
                "daily_sales": [
                    {
                        "date": (
                            row[
                                "report_date"
                            ].isoformat()
                        ),
                        "orders": row["orders"],
                        "revenue": format_money(
                            row["revenue"]
                        ),
                    }
                    for row in daily_rows
                ],
                "orders_by_status": [
                    {
                        "status": row["status"],
                        "count": row["count"],
                    }
                    for row in status_rows
                ],
                "payment_methods": [
                    {
                        "payment_method": (
                            row["payment_method"]
                        ),
                        "orders": row["count"],
                        "total": format_money(
                            row["total"]
                        ),
                    }
                    for row in payment_method_rows
                ],
            },
            status=status.HTTP_200_OK,
        )


class TopSellingProductsReportView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        date_from, date_to = (
            get_report_date_range(request)
        )

        limit = get_limit(
            request,
            default=10,
            maximum=100,
        )

        order_items = (
            OrderItem.objects
            .filter(
                order__payment_status=(
                    Order.PaymentStatus.PAID
                ),
            )
            .exclude(
                order__status=(
                    Order.Status.CANCELLED
                ),
            )
        )

        order_items = apply_date_range(
            order_items,
            field_name="order__created_at",
            date_from=date_from,
            date_to=date_to,
        )

        top_products = (
            order_items
            .values(
                "product_id",
                "product_name",
                "product_sku",
                "variant_id",
                "variant_name",
                "variant_sku",
            )
            .annotate(
                units_sold=quantity_sum(
                    "quantity"
                ),
                revenue=money_sum(
                    "line_total"
                ),
                order_count=Count(
                    "order_id",
                    distinct=True,
                ),
            )
            .order_by(
                "-units_sold",
                "-revenue",
            )[:limit]
        )

        return Response(
            {
                "date_range": {
                    "date_from": (
                        date_from.isoformat()
                        if date_from
                        else None
                    ),
                    "date_to": (
                        date_to.isoformat()
                        if date_to
                        else None
                    ),
                },
                "limit": limit,
                "products": [
                    {
                        "product_id": (
                            row["product_id"]
                        ),
                        "product_name": (
                            row["product_name"]
                        ),
                        "product_sku": (
                            row["product_sku"]
                        ),
                        "variant_id": (
                            row["variant_id"]
                        ),
                        "variant_name": (
                            row["variant_name"]
                        ),
                        "variant_sku": (
                            row["variant_sku"]
                        ),
                        "display_name": (
                            row["variant_name"]
                            or row["product_name"]
                        ),
                        "units_sold": (
                            row["units_sold"]
                        ),
                        "orders": (
                            row["order_count"]
                        ),
                        "revenue": format_money(
                            row["revenue"]
                        ),
                    }
                    for row in top_products
                ],
            },
            status=status.HTTP_200_OK,
        )


class InventoryReportView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        limit = get_limit(
            request,
            default=20,
            maximum=100,
        )

        low_stock_threshold = (
            get_low_stock_threshold()
        )

        simple_products = (
            Product.objects
            .filter(
                is_active=True,
                category__is_active=True,
                variants__isnull=True,
            )
            .select_related("category")
            .distinct()
        )

        active_variants = (
            ProductVariant.objects
            .filter(
                is_active=True,
                product__is_active=True,
                product__category__is_active=True,
            )
            .select_related(
                "product",
                "product__category",
            )
            .prefetch_related(
                "options",
                "options__attribute",
                "options__value",
            )
        )

        simple_total_units = (
            simple_products.aggregate(
                total=Coalesce(
                    Sum("stock"),
                    Value(0),
                    output_field=IntegerField(),
                ),
            )["total"]
        )

        variant_total_units = (
            active_variants.aggregate(
                total=Coalesce(
                    Sum("stock"),
                    Value(0),
                    output_field=IntegerField(),
                ),
            )["total"]
        )

        product_items = [
            {
                "target_type": "PRODUCT",
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "slug": product.slug,
                "category": (
                    product.category.name
                ),
                "stock": product.stock,
                "status": (
                    "OUT_OF_STOCK"
                    if product.stock == 0
                    else "LOW_STOCK"
                ),
            }
            for product in (
                simple_products
                .filter(
                    stock__lte=(
                        low_stock_threshold
                    ),
                )
                .order_by(
                    "stock",
                    "name",
                )[:limit]
            )
        ]

        variant_items = [
            {
                "target_type": "VARIANT",
                "id": variant.id,
                "name": variant.variant_name,
                "sku": variant.sku,
                "product_name": (
                    variant.product.name
                ),
                "product_slug": (
                    variant.product.slug
                ),
                "category": (
                    variant.product.category.name
                ),
                "stock": variant.stock,
                "status": (
                    "OUT_OF_STOCK"
                    if variant.stock == 0
                    else "LOW_STOCK"
                ),
            }
            for variant in (
                active_variants
                .filter(
                    stock__lte=(
                        low_stock_threshold
                    ),
                )
                .order_by(
                    "stock",
                    "product__name",
                    "sku",
                )[:limit]
            )
        ]

        low_stock_items = sorted(
            product_items + variant_items,
            key=lambda item: (
                item["stock"],
                item["name"],
            ),
        )[:limit]

        return Response(
            {
                "low_stock_threshold": (
                    low_stock_threshold
                ),
                "summary": {
                    "simple_products": {
                        "total": (
                            simple_products.count()
                        ),
                        "total_units": (
                            simple_total_units
                        ),
                        "low_stock": (
                            simple_products
                            .filter(
                                stock__gt=0,
                                stock__lte=(
                                    low_stock_threshold
                                ),
                            )
                            .count()
                        ),
                        "out_of_stock": (
                            simple_products
                            .filter(stock=0)
                            .count()
                        ),
                    },
                    "variants": {
                        "total": (
                            active_variants.count()
                        ),
                        "total_units": (
                            variant_total_units
                        ),
                        "low_stock": (
                            active_variants
                            .filter(
                                stock__gt=0,
                                stock__lte=(
                                    low_stock_threshold
                                ),
                            )
                            .count()
                        ),
                        "out_of_stock": (
                            active_variants
                            .filter(stock=0)
                            .count()
                        ),
                    },
                    "total_units": (
                        simple_total_units
                        + variant_total_units
                    ),
                },
                "low_stock_items": (
                    low_stock_items
                ),
            },
            status=status.HTTP_200_OK,
        )


class CustomerReportView(APIView):
    permission_classes = [
        IsOrderManagerOrAdmin,
    ]

    def get(self, request):
        date_from, date_to = (
            get_report_date_range(request)
        )

        limit = get_limit(
            request,
            default=10,
            maximum=100,
        )

        customer_role = getattr(
            getattr(User, "Role", None),
            "CUSTOMER",
            "CUSTOMER",
        )

        order_date_filter = Q()

        if date_from is not None:
            order_date_filter &= Q(
                orders__created_at__date__gte=(
                    date_from
                ),
            )

        if date_to is not None:
            order_date_filter &= Q(
                orders__created_at__date__lte=(
                    date_to
                ),
            )

        valid_order_filter = (
            order_date_filter
            & ~Q(
                orders__status=(
                    Order.Status.CANCELLED
                )
            )
        )

        paid_order_filter = (
            valid_order_filter
            & Q(
                orders__payment_status=(
                    Order.PaymentStatus.PAID
                )
            )
        )

        customers = (
            User.objects
            .filter(role=customer_role)
            .annotate(
                order_count=Count(
                    "orders",
                    filter=valid_order_filter,
                    distinct=True,
                ),
                total_spent=Coalesce(
                    Sum(
                        "orders__total_amount",
                        filter=paid_order_filter,
                    ),
                    Value(Decimal("0.00")),
                    output_field=(
                        decimal_output_field()
                    ),
                ),
            )
        )

        customers_with_orders = (
            customers
            .filter(order_count__gt=0)
            .count()
        )

        repeat_customers = (
            customers
            .filter(order_count__gt=1)
            .count()
        )

        top_customers = (
            customers
            .order_by(
                "-total_spent",
                "-order_count",
            )[:limit]
        )

        return Response(
            {
                "date_range": {
                    "date_from": (
                        date_from.isoformat()
                        if date_from
                        else None
                    ),
                    "date_to": (
                        date_to.isoformat()
                        if date_to
                        else None
                    ),
                },
                "summary": {
                    "total_customers": (
                        customers.count()
                    ),
                    "customers_with_orders": (
                        customers_with_orders
                    ),
                    "repeat_customers": (
                        repeat_customers
                    ),
                },
                "top_customers": [
                    {
                        "id": customer.id,
                        "username": (
                            customer.username
                        ),
                        "email": customer.email,
                        "full_name": (
                            customer.get_full_name()
                            or customer.username
                        ),
                        "orders": (
                            customer.order_count
                        ),
                        "total_spent": (
                            format_money(
                                customer.total_spent
                            )
                        ),
                    }
                    for customer in top_customers
                ],
            },
            status=status.HTTP_200_OK,
        )