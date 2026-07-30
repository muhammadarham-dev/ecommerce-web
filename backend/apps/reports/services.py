from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import (
    TruncDay,
    TruncMonth,
)

from apps.orders.models import Order, OrderItem
from apps.products.models import Product


User = get_user_model()

MONEY_PRECISION = Decimal("0.01")


def apply_order_date_range(
    queryset,
    *,
    date_from=None,
    date_to=None,
):
    if date_from is not None:
        queryset = queryset.filter(
            created_at__date__gte=date_from,
        )

    if date_to is not None:
        queryset = queryset.filter(
            created_at__date__lte=date_to,
        )

    return queryset


def get_valid_sales_orders(
    *,
    date_from=None,
    date_to=None,
):
    queryset = Order.objects.filter(
        payment_status=Order.PaymentStatus.PAID,
    ).exclude(
        status=Order.Status.CANCELLED,
    )

    return apply_order_date_range(
        queryset,
        date_from=date_from,
        date_to=date_to,
    )


def get_dashboard_summary(
    *,
    date_from=None,
    date_to=None,
):
    all_orders = apply_order_date_range(
        Order.objects.all(),
        date_from=date_from,
        date_to=date_to,
    )

    sales_orders = get_valid_sales_orders(
        date_from=date_from,
        date_to=date_to,
    )

    total_orders = all_orders.count()
    paid_orders = sales_orders.count()

    financial_totals = sales_orders.aggregate(
        revenue=Sum("total_amount"),
        subtotal=Sum("subtotal"),
        shipping=Sum("shipping_fee"),
        discounts=Sum("discount_amount"),
    )

    total_revenue = (
        financial_totals["revenue"]
        or Decimal("0.00")
    )

    total_subtotal = (
        financial_totals["subtotal"]
        or Decimal("0.00")
    )

    total_shipping = (
        financial_totals["shipping"]
        or Decimal("0.00")
    )

    total_discounts = (
        financial_totals["discounts"]
        or Decimal("0.00")
    )

    if paid_orders > 0:
        average_order_value = (
            total_revenue / paid_orders
        ).quantize(
            MONEY_PRECISION,
            rounding=ROUND_HALF_UP,
        )
    else:
        average_order_value = Decimal("0.00")

    order_status_breakdown = {
        item["status"]: item["count"]
        for item in (
            all_orders
            .values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )
    }

    payment_status_breakdown = {
        item["payment_status"]: item["count"]
        for item in (
            all_orders
            .values("payment_status")
            .annotate(count=Count("id"))
            .order_by("payment_status")
        )
    }

    customer_queryset = User.objects.filter(
        role=User.Role.CUSTOMER,
        is_active=True,
    )

    if date_from is not None:
        customer_queryset = customer_queryset.filter(
            date_joined__date__gte=date_from,
        )

    if date_to is not None:
        customer_queryset = customer_queryset.filter(
            date_joined__date__lte=date_to,
        )

    active_product_count = Product.objects.filter(
        is_active=True,
        category__is_active=True,
    ).count()

    out_of_stock_count = Product.objects.filter(
        is_active=True,
        stock=0,
    ).count()

    low_stock_count = Product.objects.filter(
        is_active=True,
        stock__gt=0,
        stock__lte=5,
    ).count()

    return {
        "date_range": {
            "date_from": (
                str(date_from)
                if date_from is not None
                else None
            ),
            "date_to": (
                str(date_to)
                if date_to is not None
                else None
            ),
        },
        "orders": {
            "total_orders": total_orders,
            "paid_orders": paid_orders,
            "order_status_breakdown": (
                order_status_breakdown
            ),
            "payment_status_breakdown": (
                payment_status_breakdown
            ),
        },
        "sales": {
            "total_revenue": str(total_revenue),
            "total_subtotal": str(total_subtotal),
            "total_shipping": str(total_shipping),
            "total_discounts": str(total_discounts),
            "average_order_value": str(
                average_order_value
            ),
        },
        "customers": {
            "new_customers": customer_queryset.count(),
        },
        "products": {
            "active_products": active_product_count,
            "low_stock_products": low_stock_count,
            "out_of_stock_products": (
                out_of_stock_count
            ),
        },
    }


def get_sales_report(
    *,
    date_from=None,
    date_to=None,
    group_by="day",
):
    queryset = get_valid_sales_orders(
        date_from=date_from,
        date_to=date_to,
    )

    if group_by == "month":
        period_expression = TruncMonth(
            "created_at"
        )
    else:
        period_expression = TruncDay(
            "created_at"
        )

    report_rows = (
        queryset
        .annotate(period=period_expression)
        .values("period")
        .annotate(
            order_count=Count("id"),
            revenue=Sum("total_amount"),
            subtotal=Sum("subtotal"),
            shipping=Sum("shipping_fee"),
            discounts=Sum("discount_amount"),
        )
        .order_by("period")
    )

    results = []

    for row in report_rows:
        results.append(
            {
                "period": row["period"].isoformat(),
                "order_count": row["order_count"],
                "revenue": str(
                    row["revenue"]
                    or Decimal("0.00")
                ),
                "subtotal": str(
                    row["subtotal"]
                    or Decimal("0.00")
                ),
                "shipping": str(
                    row["shipping"]
                    or Decimal("0.00")
                ),
                "discounts": str(
                    row["discounts"]
                    or Decimal("0.00")
                ),
            }
        )

    return results


def get_top_products(
    *,
    date_from=None,
    date_to=None,
    limit=10,
):
    queryset = OrderItem.objects.filter(
        order__payment_status=(
            Order.PaymentStatus.PAID
        ),
    ).exclude(
        order__status=Order.Status.CANCELLED,
    )

    if date_from is not None:
        queryset = queryset.filter(
            order__created_at__date__gte=date_from,
        )

    if date_to is not None:
        queryset = queryset.filter(
            order__created_at__date__lte=date_to,
        )

    rows = (
        queryset
        .values(
            "product_id",
            "product_name",
            "product_sku",
        )
        .annotate(
            units_sold=Sum("quantity"),
            revenue=Sum("line_total"),
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

    return [
        {
            "product_id": row["product_id"],
            "product_name": row["product_name"],
            "product_sku": row["product_sku"],
            "units_sold": row["units_sold"] or 0,
            "order_count": row["order_count"],
            "revenue": str(
                row["revenue"]
                or Decimal("0.00")
            ),
        }
        for row in rows
    ]


def get_low_stock_products(
    *,
    threshold=5,
    limit=20,
):
    products = (
        Product.objects
        .select_related("category")
        .filter(
            is_active=True,
            stock__lte=threshold,
        )
        .order_by(
            "stock",
            "name",
        )[:limit]
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "sku": product.sku,
            "category": product.category.name,
            "stock": product.stock,
            "is_out_of_stock": product.stock == 0,
        }
        for product in products
    ]