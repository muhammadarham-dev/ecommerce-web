from __future__ import annotations

from decimal import Decimal
from typing import Any
from urllib.parse import urlparse

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from rest_framework import serializers

from apps.accounts.models import User
from apps.carts.models import Cart, CartItem
from apps.carts.services import (
    add_item_to_cart,
    update_cart_item_quantity,
)
from apps.inventory.services import adjust_stock_manually
from apps.orders.models import Order
from apps.orders.services import cancel_customer_order
from apps.products.models import Product
from apps.variants.models import ProductVariant


CURRENCY_CODE = "PKR"
PRODUCT_PREFIX = "product:"
VARIANT_PREFIX = "variant:"
CART_PREFIX = "cart:"
CART_ITEM_PREFIX = "cart-item:"
ORDER_PREFIX = "order:"


def normalize_text(value: Any) -> str | None:
    """Normalize an optional text value."""

    if not isinstance(value, str):
        return None

    normalized = " ".join(value.split()).strip()
    return normalized or None




def normalize_match_text(value: Any) -> str:
    """Normalize human catalog text for conservative matching."""

    normalized = normalize_text(value) or ""
    characters = [
        character.casefold()
        if character.isalnum()
        else " "
        for character in normalized
    ]
    return " ".join("".join(characters).split())


CATALOG_QUERY_STOP_WORDS = frozenset(
    {
        "a",
        "all",
        "an",
        "any",
        "are",
        "available",
        "availability",
        "currently",
        "current",
        "do",
        "have",
        "in",
        "is",
        "item",
        "items",
        "kindly",
        "list",
        "me",
        "of",
        "please",
        "product",
        "products",
        "show",
        "stock",
        "the",
        "to",
        "we",
        "what",
        "which",
        "you",
        "batao",
        "btao",
        "dikhao",
        "dikhado",
        "ha",
        "hai",
        "hain",
        "hy",
        "ka",
        "kaun",
        "ke",
        "ki",
        "konsa",
        "konsi",
        "konse",
        "konsy",
        "kya",
        "muje",
        "mujhe",
        "saare",
        "sab",
        "sare",
        "sary",
        "se",
        "wala",
        "wali",
    }
)


def catalog_query_tokens(
    value: Any,
) -> list[str]:
    """Return meaningful product-search tokens from human text."""

    normalized = normalize_match_text(
        value
    )

    return [
        token
        for token in normalized.split()
        if (
            len(token) >= 2
            and token
            not in CATALOG_QUERY_STOP_WORDS
        )
    ][:12]


def catalog_availability_requested(
    value: Any,
) -> bool:
    """Detect whether the human query explicitly asks for availability."""

    normalized = normalize_match_text(
        value
    )

    availability_markers = (
        "available",
        "in stock",
        "stock available",
        "stock me",
        "stock mein",
        "stock main",
    )

    return any(
        marker in normalized
        for marker in availability_markers
    )


def variant_match_label(variant: ProductVariant) -> str:
    """Build searchable human text for one variant."""

    option_values = [
        option.value.display_value
        for option in variant.options.select_related(
            "value"
        ).all()
    ]

    return normalize_match_text(
        " ".join(
            [
                variant.product.name,
                variant.sku,
                *option_values,
            ]
        )
    )

def public_id(prefix: str, value: Any) -> str:
    """Build a connector-scoped public identifier."""

    return f"{prefix}{value}"


def parse_public_pk(
    value: Any,
    *,
    prefix: str,
    field_name: str,
) -> int:
    """Parse a namespaced connector identifier into a database PK."""

    normalized = normalize_text(value)

    if normalized is None:
        raise serializers.ValidationError(
            {
                field_name: (
                    f"A valid {field_name} is required."
                )
            }
        )

    if not normalized.startswith(prefix):
        raise serializers.ValidationError(
            {
                field_name: (
                    f"{field_name} must use the '{prefix}' prefix."
                )
            }
        )

    raw_pk = normalized[len(prefix):]

    if not raw_pk.isdigit():
        raise serializers.ValidationError(
            {
                field_name: (
                    f"{field_name} contains an invalid identifier."
                )
            }
        )

    return int(raw_pk)


def resolve_customer(verified_customer_id: Any) -> User:
    """Resolve an active Django customer from trusted connector context."""

    normalized = normalize_text(
        verified_customer_id
    )

    if normalized is None:
        raise serializers.ValidationError(
            {
                "verified_customer_id": (
                    "A verified customer identity is required."
                )
            }
        )

    if normalized.startswith("customer:"):
        normalized = normalized[len("customer:"):]

    if not normalized.isdigit():
        raise serializers.ValidationError(
            {
                "verified_customer_id": (
                    "The verified Django customer ID is invalid."
                )
            }
        )

    customer = (
        User.objects
        .filter(
            pk=int(normalized),
            role=User.Role.CUSTOMER,
            is_active=True,
        )
        .first()
    )

    if customer is None:
        raise serializers.ValidationError(
            {
                "verified_customer_id": (
                    "The verified customer could not be found."
                )
            }
        )

    return customer


def serialize_money(value: Any) -> str:
    """Return money as a stable two-decimal string."""

    return f"{Decimal(value):.2f}"


def primary_image_payload(product: Product) -> dict[str, Any] | None:
    """Return a safe primary product image representation."""

    image = (
        product.images
        .order_by("-is_primary", "id")
        .first()
    )

    if image is None or not image.image:
        return None

    return {
        "url": image.image.url,
        "alt_text": image.alt_text or product.name,
    }


def serialize_variant(
    variant: ProductVariant,
) -> dict[str, Any]:
    """Normalize a Django product variant for EngagePilot."""

    options = []

    for option in variant.options.select_related(
        "attribute",
        "value",
    ).all():
        options.append(
            {
                "name": option.attribute.name,
                "value": option.value.display_value,
            }
        )

    return {
        "external_id": public_id(
            VARIANT_PREFIX,
            variant.pk,
        ),
        "id": public_id(
            VARIANT_PREFIX,
            variant.pk,
        ),
        "title": variant.variant_name,
        "sku": variant.sku,
        "available": variant.in_stock,
        "quantity_available": variant.stock,
        "price": {
            "amount": serialize_money(
                variant.final_price
            ),
            "currency": CURRENCY_CODE,
        },
        "options": options,
    }


def serialize_product(
    product: Product,
) -> dict[str, Any]:
    """Normalize a Django product for EngagePilot."""

    variants = list(
        product.variants
        .filter(is_active=True)
        .prefetch_related(
            "options__attribute",
            "options__value",
        )
    )

    variant_payloads = [
        serialize_variant(variant)
        for variant in variants
    ]

    if variant_payloads:
        prices = [
            Decimal(variant["price"]["amount"])
            for variant in variant_payloads
        ]
        minimum_price = min(prices)
        maximum_price = max(prices)
        available = any(
            variant["available"]
            for variant in variant_payloads
        )
    else:
        minimum_price = product.final_price
        maximum_price = product.final_price
        available = product.in_stock

    return {
        "external_id": public_id(
            PRODUCT_PREFIX,
            product.pk,
        ),
        "id": public_id(
            PRODUCT_PREFIX,
            product.pk,
        ),
        "title": product.name,
        "name": product.name,
        "description": product.description,
        "handle": product.slug,
        "slug": product.slug,
        "sku": product.sku,
        "product_type": product.category.name,
        "category": product.category.name,
        "available": available,
        "in_stock": available,
        "image": primary_image_payload(product),
        "price": {
            "minimum": serialize_money(minimum_price),
            "maximum": serialize_money(maximum_price),
            "currency": CURRENCY_CODE,
        },
        "variants": variant_payloads,
    }


def search_products(
    *,
    query: str,
    limit: int,
    available_only: bool,
    min_price: Decimal | None,
    max_price: Decimal | None,
    product_type: str | None,
) -> tuple[list[dict[str, Any]], int]:
    """Search active products using natural multi-token catalog text.

    Product-level text matching is kept separate from reverse variant joins.
    This is important for simple products that have no variants: mixing deep
    ``variants__...`` lookups into the same OR expression can otherwise
    eliminate an otherwise valid product row on some generated SQL plans.

    Each meaningful token must match either the product itself (name, SKU,
    description or category) or one of its active variants/options.
    """

    normalized_query = " ".join(query.split())
    query_tokens = catalog_query_tokens(
        normalized_query
    )
    effective_available_only = (
        available_only
        or catalog_availability_requested(
            normalized_query
        )
    )

    queryset = (
        Product.objects
        .filter(is_active=True)
        .select_related("category")
        .prefetch_related(
            "images",
            "variants__options__attribute",
            "variants__options__value",
        )
    )

    def variant_product_ids_for(search_text: str):
        return (
            ProductVariant.objects
            .filter(is_active=True)
            .filter(
                Q(sku__icontains=search_text)
                | Q(options__value__value__icontains=search_text)
                | Q(
                    options__value__display_value__icontains=search_text
                )
            )
            .values("product_id")
            .distinct()
        )

    # A generic catalog request such as "what products are available"
    # intentionally produces no meaningful catalog tokens after stop-word
    # removal. In that case we must NOT re-apply the original sentence as a
    # literal database search term; leaving the queryset unfiltered means
    # "list the catalog" while the availability/price/category filters below
    # still apply normally.
    if query_tokens:
        for token in query_tokens:
            queryset = queryset.filter(
                Q(name__icontains=token)
                | Q(sku__icontains=token)
                | Q(description__icontains=token)
                | Q(category__name__icontains=token)
                | Q(pk__in=variant_product_ids_for(token))
            )

    queryset = queryset.distinct()

    if product_type:
        queryset = queryset.filter(
            category__name__icontains=product_type.strip()
        )

    # Price filtering accounts for both simple products and variants.
    if min_price is not None:
        queryset = queryset.filter(
            Q(
                variants__is_active=True,
                variants__price_override__gte=min_price,
            )
            | Q(
                variants__is_active=True,
                variants__price_override__isnull=True,
                discount_price__gte=min_price,
            )
            | Q(
                variants__is_active=True,
                variants__price_override__isnull=True,
                discount_price__isnull=True,
                price__gte=min_price,
            )
            | Q(
                variants__isnull=True,
                discount_price__gte=min_price,
            )
            | Q(
                variants__isnull=True,
                discount_price__isnull=True,
                price__gte=min_price,
            )
        ).distinct()

    if max_price is not None:
        queryset = queryset.filter(
            Q(
                variants__is_active=True,
                variants__price_override__lte=max_price,
            )
            | Q(
                variants__is_active=True,
                variants__price_override__isnull=True,
                discount_price__lte=max_price,
            )
            | Q(
                variants__is_active=True,
                variants__price_override__isnull=True,
                discount_price__isnull=True,
                price__lte=max_price,
            )
            | Q(
                variants__isnull=True,
                discount_price__lte=max_price,
            )
            | Q(
                variants__isnull=True,
                discount_price__isnull=True,
                price__lte=max_price,
            )
        ).distinct()

    if effective_available_only:
        available_variant_product_ids = (
            ProductVariant.objects
            .filter(
                is_active=True,
                stock__gt=0,
            )
            .values("product_id")
        )
        any_variant_product_ids = (
            ProductVariant.objects
            .values("product_id")
        )

        queryset = queryset.filter(
            Q(pk__in=available_variant_product_ids)
            | (
                Q(stock__gt=0)
                & ~Q(pk__in=any_variant_product_ids)
            )
        ).distinct()

    total_count = queryset.count()

    products = [
        serialize_product(product)
        for product in queryset[:limit]
    ]

    return products, total_count

def resolve_catalog_item(
    item_reference: Any,
) -> tuple[Product, ProductVariant | None, str]:
    """Resolve one exact product/variant from trusted ID or human text."""

    normalized = normalize_text(item_reference)

    if normalized is None:
        raise serializers.ValidationError(
            {
                "item_id": (
                    "A valid product or variant reference is required."
                )
            }
        )

    if normalized.startswith(VARIANT_PREFIX):
        variant_pk = parse_public_pk(
            normalized,
            prefix=VARIANT_PREFIX,
            field_name="item_id",
        )
        variant = (
            ProductVariant.objects
            .select_related("product", "product__category")
            .prefetch_related(
                "options__attribute",
                "options__value",
            )
            .filter(
                pk=variant_pk,
                is_active=True,
                product__is_active=True,
            )
            .first()
        )
        if variant is None:
            raise serializers.ValidationError(
                {"item_id": "The product variant was not found."}
            )
        return variant.product, variant, normalized

    if normalized.startswith(PRODUCT_PREFIX):
        product_pk = parse_public_pk(
            normalized,
            prefix=PRODUCT_PREFIX,
            field_name="item_id",
        )
        product = (
            Product.objects
            .select_related("category")
            .filter(
                pk=product_pk,
                is_active=True,
            )
            .first()
        )
        if product is None:
            raise serializers.ValidationError(
                {"item_id": "The product was not found."}
            )

        active_variants = list(
            ProductVariant.objects
            .filter(
                product=product,
                is_active=True,
            )[:2]
        )

        if active_variants:
            raise serializers.ValidationError(
                {
                    "item_id": (
                        "This product has variants. Select an exact "
                        "variant before adding it to the cart."
                    )
                }
            )

        return product, None, normalized

    exact_variant_matches = list(
        ProductVariant.objects
        .select_related("product", "product__category")
        .prefetch_related(
            "options__attribute",
            "options__value",
        )
        .filter(
            is_active=True,
            product__is_active=True,
        )
        .filter(
            Q(sku__iexact=normalized)
            | Q(combination_key__iexact=normalized)
        )[:2]
    )

    if len(exact_variant_matches) == 1:
        variant = exact_variant_matches[0]
        return (
            variant.product,
            variant,
            public_id(VARIANT_PREFIX, variant.pk),
        )

    exact_products = list(
        Product.objects
        .select_related("category")
        .filter(is_active=True)
        .filter(
            Q(name__iexact=normalized)
            | Q(sku__iexact=normalized)
            | Q(slug__iexact=normalized)
        )[:2]
    )

    if len(exact_products) == 1:
        product = exact_products[0]
        variants = list(
            ProductVariant.objects
            .filter(
                product=product,
                is_active=True,
            )
            .prefetch_related(
                "options__attribute",
                "options__value",
            )[:3]
        )

        if variants:
            if len(variants) == 1:
                variant = variants[0]
                return (
                    product,
                    variant,
                    public_id(VARIANT_PREFIX, variant.pk),
                )

            raise serializers.ValidationError(
                {
                    "item_id": (
                        "This product has multiple variants. "
                        "Please specify the intended variant."
                    )
                }
            )

        return (
            product,
            None,
            public_id(PRODUCT_PREFIX, product.pk),
        )

    normalized_match = normalize_match_text(normalized)

    query_tokens = [
        token
        for token in normalized_match.split()
        if len(token) >= 2
    ]

    candidate_filter = Q()
    for token in query_tokens[:12]:
        candidate_filter |= Q(
            name__icontains=token
        )

    product_name_queryset = (
        Product.objects
        .select_related("category")
        .filter(is_active=True)
        .order_by("name")
    )

    if query_tokens:
        product_name_queryset = (
            product_name_queryset.filter(
                candidate_filter
            )
        )

    product_name_candidates = list(
        product_name_queryset[:50]
    )

    query_token_set = set(query_tokens)

    contained_products = [
        product
        for product in product_name_candidates
        if (
            normalize_match_text(product.name)
            and (
                normalize_match_text(product.name)
                in normalized_match
                or (
                    query_token_set
                    and query_token_set.issubset(
                        set(
                            normalize_match_text(
                                product.name
                            ).split()
                        )
                    )
                )
            )
        )
    ]

    if len(contained_products) == 1:
        product = contained_products[0]
        variants = list(
            ProductVariant.objects
            .filter(
                product=product,
                is_active=True,
            )
            .select_related("product")
            .prefetch_related(
                "options__attribute",
                "options__value",
            )
        )

        if not variants:
            return (
                product,
                None,
                public_id(PRODUCT_PREFIX, product.pk),
            )

        product_tokens = set(
            normalize_match_text(product.name).split()
        )
        request_tokens = set(
            normalized_match.split()
        )
        variant_tokens = (
            request_tokens - product_tokens
        )

        if variant_tokens:
            matching_variants = [
                variant
                for variant in variants
                if variant_tokens.issubset(
                    set(
                        variant_match_label(variant).split()
                    )
                )
            ]

            if len(matching_variants) == 1:
                variant = matching_variants[0]
                return (
                    product,
                    variant,
                    public_id(VARIANT_PREFIX, variant.pk),
                )

        if len(variants) == 1:
            variant = variants[0]
            return (
                product,
                variant,
                public_id(VARIANT_PREFIX, variant.pk),
            )

        raise serializers.ValidationError(
            {
                "item_id": (
                    "The product was found, but the variant is "
                    "ambiguous. Please specify its options."
                )
            }
        )

    fuzzy_variants = list(
        ProductVariant.objects
        .select_related("product", "product__category")
        .prefetch_related(
            "options__attribute",
            "options__value",
        )
        .filter(
            is_active=True,
            product__is_active=True,
        )
        .filter(
            Q(product__name__icontains=normalized)
            | Q(sku__icontains=normalized)
            | Q(
                options__value__display_value__icontains=normalized
            )
        )
        .distinct()[:3]
    )

    if len(fuzzy_variants) == 1:
        variant = fuzzy_variants[0]
        return (
            variant.product,
            variant,
            public_id(VARIANT_PREFIX, variant.pk),
        )

    fuzzy_products = list(
        Product.objects
        .select_related("category")
        .filter(is_active=True)
        .filter(
            Q(name__icontains=normalized)
            | Q(sku__icontains=normalized)
            | Q(slug__icontains=normalized)
        )
        .distinct()[:3]
    )

    if len(fuzzy_products) == 1:
        product = fuzzy_products[0]
        variants = list(
            ProductVariant.objects
            .filter(
                product=product,
                is_active=True,
            )[:2]
        )
        if not variants:
            return (
                product,
                None,
                public_id(PRODUCT_PREFIX, product.pk),
            )

    if fuzzy_variants or fuzzy_products:
        raise serializers.ValidationError(
            {
                "item_id": (
                    "The product reference is ambiguous. "
                    "Please specify the exact product or variant."
                )
            }
        )

    raise serializers.ValidationError(
        {"item_id": "No matching product or variant was found."}
    )


def inventory_payload(
    *,
    item_reference: str,
    product: Product,
    variant: ProductVariant | None,
    requested_quantity: int,
) -> dict[str, Any]:
    """Build normalized inventory output."""

    target = variant or product
    quantity_available = int(target.stock)
    available_for_sale = bool(
        product.is_active
        and (
            variant.is_active
            if variant is not None
            else True
        )
        and quantity_available > 0
    )

    item = {
        "item_id": item_reference,
        "product_id": public_id(
            PRODUCT_PREFIX,
            product.pk,
        ),
        "product_title": product.name,
        "variant_id": (
            public_id(
                VARIANT_PREFIX,
                variant.pk,
            )
            if variant is not None
            else None
        ),
        "variant_title": (
            variant.variant_name
            if variant is not None
            else None
        ),
        "sku": (
            variant.sku
            if variant is not None
            else product.sku
        ),
        "price": serialize_money(
            target.final_price
        ),
        "currency": CURRENCY_CODE,
    }

    return {
        "item_id": item_reference,
        "requested_quantity": requested_quantity,
        "quantity_available": quantity_available,
        "quantity_known": True,
        "available_for_sale": available_for_sale,
        "currently_not_in_stock": False,
        "can_fulfill_requested_quantity": (
            quantity_available >= requested_quantity
        ),
        "stock_status": (
            "in_stock"
            if quantity_available > 0
            else "out_of_stock"
        ),
        "location_id": None,
        "item": item,
    }


def resolve_inventory_target(
    item_id: Any,
) -> tuple[Product, ProductVariant | None, str]:
    """Resolve only connector-scoped IDs for inventory operations."""

    normalized = normalize_text(item_id)

    if normalized is None:
        raise serializers.ValidationError(
            {"item_id": "A valid inventory item ID is required."}
        )

    if normalized.startswith(VARIANT_PREFIX):
        variant_pk = parse_public_pk(
            normalized,
            prefix=VARIANT_PREFIX,
            field_name="item_id",
        )
        variant = (
            ProductVariant.objects
            .select_related("product", "product__category")
            .filter(
                pk=variant_pk,
                product__is_active=True,
            )
            .first()
        )
        if variant is None:
            raise serializers.ValidationError(
                {"item_id": "The inventory variant was not found."}
            )
        return variant.product, variant, normalized

    if normalized.startswith(PRODUCT_PREFIX):
        product_pk = parse_public_pk(
            normalized,
            prefix=PRODUCT_PREFIX,
            field_name="item_id",
        )
        product = (
            Product.objects
            .select_related("category")
            .filter(
                pk=product_pk,
                is_active=True,
            )
            .first()
        )
        if product is None:
            raise serializers.ValidationError(
                {"item_id": "The inventory product was not found."}
            )
        if ProductVariant.objects.filter(
            product=product,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                {
                    "item_id": (
                        "This product uses variants. Use the exact "
                        "variant inventory ID."
                    )
                }
            )
        return product, None, normalized

    raise serializers.ValidationError(
        {
            "item_id": (
                "Inventory item IDs must be trusted product: or "
                "variant: identifiers."
            )
        }
    )


def update_inventory(
    *,
    item_id: str,
    quantity: int,
) -> dict[str, Any]:
    """Set stock through the existing transactional inventory service."""

    product, variant, normalized_item_id = (
        resolve_inventory_target(item_id)
    )

    target = variant or product
    previous_quantity = int(target.stock)

    if previous_quantity == quantity:
        return {
            **inventory_payload(
                item_reference=normalized_item_id,
                product=product,
                variant=variant,
                requested_quantity=quantity,
            ),
            "previous_quantity": previous_quantity,
            "updated_quantity": quantity,
            "changed": False,
        }

    updated_target, stock_movement = adjust_stock_manually(
        operation="SET",
        quantity=quantity,
        performed_by=None,
        product=(
            product
            if variant is None
            else None
        ),
        variant=variant,
        note=(
            "EngagePilot owner-approved inventory update."
        ),
    )

    refreshed_product = (
        updated_target.product
        if isinstance(updated_target, ProductVariant)
        else updated_target
    )
    refreshed_variant = (
        updated_target
        if isinstance(updated_target, ProductVariant)
        else None
    )

    return {
        **inventory_payload(
            item_reference=normalized_item_id,
            product=refreshed_product,
            variant=refreshed_variant,
            requested_quantity=quantity,
        ),
        "previous_quantity": previous_quantity,
        "updated_quantity": int(updated_target.stock),
        "changed": True,
        "stock_movement_id": stock_movement.pk,
    }


def get_customer_cart(
    *,
    customer: User,
    cart_id: Any = None,
    create_if_missing: bool = False,
    lock: bool = False,
) -> Cart:
    """Resolve one customer-owned cart, optionally creating it."""

    normalized_cart_id = normalize_text(cart_id)

    queryset = Cart.objects
    if lock:
        queryset = queryset.select_for_update()

    if normalized_cart_id is not None:
        cart_pk = parse_public_pk(
            normalized_cart_id,
            prefix=CART_PREFIX,
            field_name="cart_id",
        )
        cart = queryset.filter(
            pk=cart_pk,
            user=customer,
        ).first()
        if cart is None:
            raise serializers.ValidationError(
                {"cart_id": "The cart was not found for this customer."}
            )
        return cart

    cart = queryset.filter(
        user=customer,
    ).first()

    if cart is not None:
        return cart

    if not create_if_missing:
        raise serializers.ValidationError(
            {"cart_id": "No active cart exists for this customer."}
        )

    cart, _ = Cart.objects.get_or_create(
        user=customer,
    )

    if lock:
        return Cart.objects.select_for_update().get(
            pk=cart.pk
        )

    return cart


def serialize_cart_line(
    item: CartItem,
) -> dict[str, Any]:
    """Normalize one Django cart item."""

    return {
        "line_id": public_id(
            CART_ITEM_PREFIX,
            item.pk,
        ),
        "quantity": item.quantity,
        "merchandise_id": (
            public_id(VARIANT_PREFIX, item.variant_id)
            if item.variant_id
            else public_id(PRODUCT_PREFIX, item.product_id)
        ),
        "product_id": public_id(
            PRODUCT_PREFIX,
            item.product_id,
        ),
        "product_title": item.product.name,
        "product_handle": item.product.slug,
        "variant_title": (
            item.variant.variant_name
            if item.variant_id
            else None
        ),
        "sku": (
            item.variant.sku
            if item.variant_id
            else item.product.sku
        ),
        "unit_price": serialize_money(
            item.unit_price
        ),
        "line_total": serialize_money(
            item.line_total
        ),
        "currency": CURRENCY_CODE,
        "can_remove": True,
        "can_update_quantity": True,
    }


def serialize_cart(cart: Cart) -> dict[str, Any]:
    """Normalize a customer cart for the universal connector contract."""

    items = list(
        cart.items
        .select_related(
            "product",
            "product__category",
            "variant",
        )
        .prefetch_related(
            "variant__options__attribute",
            "variant__options__value",
        )
        .order_by("id")
    )

    lines = [
        serialize_cart_line(item)
        for item in items
    ]

    subtotal = sum(
        (
            item.line_total
            for item in items
        ),
        Decimal("0.00"),
    )

    total_quantity = sum(
        item.quantity
        for item in items
    )

    return {
        "cart_id": public_id(
            CART_PREFIX,
            cart.pk,
        ),
        "total_quantity": total_quantity,
        "checkout_url": None,
        "subtotal_amount": serialize_money(subtotal),
        "total_amount": serialize_money(subtotal),
        "currency": CURRENCY_CODE,
        "lines": lines,
        "line_count": len(lines),
        "has_more_lines": False,
    }


@transaction.atomic
def add_cart_item(
    *,
    customer: User,
    cart_id: Any,
    product_reference: str,
    quantity: int,
) -> dict[str, Any]:
    """Add an item using the existing transactional cart service."""

    existing_cart = get_customer_cart(
        customer=customer,
        cart_id=cart_id,
        create_if_missing=True,
        lock=True,
    )

    product, variant, resolved_item_id = resolve_catalog_item(
        product_reference
    )

    cart_item, created = add_item_to_cart(
        customer=customer,
        product=product,
        variant=variant,
        quantity=quantity,
    )

    if cart_item.cart_id != existing_cart.pk:
        raise serializers.ValidationError(
            {
                "cart_id": (
                    "The cart service returned a different customer cart."
                )
            }
        )

    cart = Cart.objects.get(pk=existing_cart.pk)

    return {
        "message": (
            "Item added to the Django Commerce cart successfully."
        ),
        "item_id": resolved_item_id,
        "quantity_added": quantity,
        "line_created": created,
        "cart": serialize_cart(cart),
    }


def read_cart(
    *,
    customer: User,
    cart_id: Any,
) -> dict[str, Any]:
    """Read the verified customer's current or explicitly named cart.

    ``current`` is an internal server-to-server EngagePilot sentinel. It is
    converted to ``None`` before normal cart resolution, so the existing
    customer ownership check remains authoritative.
    """

    normalized_cart_id = normalize_text(
        cart_id
    )

    if (
        normalized_cart_id is not None
        and normalized_cart_id.casefold() == "current"
    ):
        normalized_cart_id = None

    cart = get_customer_cart(
        customer=customer,
        cart_id=normalized_cart_id,
        create_if_missing=True,
    )

    return {
        "message": "Django Commerce cart retrieved successfully.",
        "cart": serialize_cart(cart),
    }


@transaction.atomic
def remove_cart_item(
    *,
    customer: User,
    cart_id: str,
    line_id: str,
) -> dict[str, Any]:
    """Remove one verified customer cart line."""

    cart = get_customer_cart(
        customer=customer,
        cart_id=cart_id,
        lock=True,
    )

    line_pk = parse_public_pk(
        line_id,
        prefix=CART_ITEM_PREFIX,
        field_name="line_id",
    )

    item = (
        CartItem.objects
        .select_for_update()
        .filter(
            pk=line_pk,
            cart=cart,
        )
        .first()
    )

    if item is None:
        raise serializers.ValidationError(
            {"line_id": "The cart line was not found."}
        )

    item.delete()

    return {
        "message": "Item removed from the Django Commerce cart successfully.",
        "removed_line_id": line_id,
        "cart": serialize_cart(cart),
    }


@transaction.atomic
def set_cart_item_quantity(
    *,
    customer: User,
    cart_id: str,
    line_id: str,
    quantity: int,
) -> dict[str, Any]:
    """Update one verified cart line through the existing service."""

    cart = get_customer_cart(
        customer=customer,
        cart_id=cart_id,
        lock=True,
    )

    line_pk = parse_public_pk(
        line_id,
        prefix=CART_ITEM_PREFIX,
        field_name="line_id",
    )

    cart_item = (
        CartItem.objects
        .select_related(
            "cart",
            "product",
            "variant",
        )
        .filter(
            pk=line_pk,
            cart=cart,
        )
        .first()
    )

    if cart_item is None:
        raise serializers.ValidationError(
            {"line_id": "The cart line was not found."}
        )

    update_cart_item_quantity(
        cart_item=cart_item,
        customer=customer,
        quantity=quantity,
    )

    return {
        "message": (
            "Django Commerce cart quantity updated successfully."
        ),
        "updated_line_id": line_id,
        "updated_quantity": quantity,
        "cart": serialize_cart(cart),
    }


@transaction.atomic
def clear_cart(
    *,
    customer: User,
    cart_id: str,
    expected_line_ids: list[str],
) -> dict[str, Any]:
    """Clear a cart only if the confirmed snapshot is still current."""

    cart = get_customer_cart(
        customer=customer,
        cart_id=cart_id,
        lock=True,
    )

    current_items = list(
        CartItem.objects
        .select_for_update()
        .filter(cart=cart)
        .order_by("id")
    )

    current_line_ids = [
        public_id(CART_ITEM_PREFIX, item.pk)
        for item in current_items
    ]

    normalized_expected = sorted(
        str(value).strip()
        for value in expected_line_ids
    )

    if sorted(current_line_ids) != normalized_expected:
        raise serializers.ValidationError(
            {
                "expected_line_ids": (
                    "Cart contents changed after confirmation was "
                    "requested. Review the cart and confirm again."
                )
            }
        )

    removed_count = len(current_items)

    CartItem.objects.filter(
        cart=cart,
    ).delete()

    return {
        "message": "Django Commerce cart cleared successfully.",
        "cleared_line_count": removed_count,
        "cart": serialize_cart(cart),
    }


def serialize_order(order: Order) -> dict[str, Any]:
    """Normalize a Django order to the universal customer order shape."""

    items = []

    for item in order.items.all().order_by("id"):
        items.append(
            {
                "line_item_id": f"order-item:{item.pk}",
                "product_id": public_id(
                    PRODUCT_PREFIX,
                    item.product_id,
                ),
                "variant_id": (
                    public_id(
                        VARIANT_PREFIX,
                        item.variant_id,
                    )
                    if item.variant_id
                    else None
                ),
                "product_title": item.product_name,
                "variant_title": item.variant_name or None,
                "sku": item.variant_sku or item.product_sku,
                "quantity": item.quantity,
                "unit_price": serialize_money(item.unit_price),
                "line_total": serialize_money(item.line_total),
                "currency": CURRENCY_CODE,
            }
        )

    is_cancelled = (
        order.status == Order.Status.CANCELLED
    )

    closed = order.status in {
        Order.Status.DELIVERED,
        Order.Status.CANCELLED,
    }

    closed_at = (
        order.cancelled_at
        if is_cancelled
        else order.delivered_at
    )

    return {
        "order_id": public_id(
            ORDER_PREFIX,
            order.pk,
        ),
        "order_name": order.order_number,
        "created_at": order.created_at.isoformat(),
        "cancelled_at": (
            order.cancelled_at.isoformat()
            if order.cancelled_at
            else None
        ),
        "closed": closed,
        "closed_at": (
            closed_at.isoformat()
            if closed_at
            else None
        ),
        "confirmed": (
            order.confirmed_at is not None
            or order.status
            != Order.Status.PENDING
        ),
        "financial_status": order.payment_status,
        "fulfillment_status": order.status,
        "fully_paid": (
            order.payment_status
            == Order.PaymentStatus.PAID
        ),
        "restockable": order.can_cancel,
        "total_amount": serialize_money(
            order.total_amount
        ),
        "currency": CURRENCY_CODE,
        "item_count": len(items),
        "items": items,
        "is_cancelled": is_cancelled,
        "potentially_cancellable": order.can_cancel,
    }


def list_customer_orders(
    *,
    customer: User,
    limit: int,
    include_cancelled: bool,
) -> dict[str, Any]:
    """List only orders owned by a verified Django customer."""

    queryset = (
        Order.objects
        .filter(customer=customer)
        .prefetch_related("items")
        .order_by("-created_at")
    )

    if not include_cancelled:
        queryset = queryset.exclude(
            status=Order.Status.CANCELLED
        )

    orders = [
        serialize_order(order)
        for order in queryset[:limit]
    ]

    cancellable_count = sum(
        1
        for order in orders
        if order["potentially_cancellable"]
    )

    return {
        "message": "Customer orders retrieved successfully.",
        "verified_customer_id": str(customer.pk),
        "orders": orders,
        "count": len(orders),
        "cancellable_count": cancellable_count,
        "include_cancelled": include_cancelled,
    }


def resolve_customer_order(
    *,
    customer: User,
    order_reference: str,
    allow_cancelled: bool,
) -> dict[str, Any]:
    """Resolve exactly one order inside the verified customer's orders."""

    normalized = normalize_text(order_reference)

    if normalized is None:
        raise serializers.ValidationError(
            {"order_reference": "An order reference is required."}
        )

    queryset = (
        Order.objects
        .filter(customer=customer)
        .prefetch_related("items")
    )

    if normalized.startswith(ORDER_PREFIX):
        order_pk = parse_public_pk(
            normalized,
            prefix=ORDER_PREFIX,
            field_name="order_reference",
        )
        queryset = queryset.filter(pk=order_pk)
    else:
        reference = normalized.lstrip("#")
        queryset = queryset.filter(
            order_number__iexact=reference
        )

    matches = list(queryset[:2])

    if not matches:
        raise serializers.ValidationError(
            {
                "order_reference": (
                    "No matching order was found for the verified customer."
                )
            }
        )

    if len(matches) > 1:
        raise serializers.ValidationError(
            {
                "order_reference": (
                    "More than one order matched this reference."
                )
            }
        )

    order = matches[0]

    if (
        order.status == Order.Status.CANCELLED
        and not allow_cancelled
    ):
        raise serializers.ValidationError(
            {"order_reference": "This order is already cancelled."}
        )

    return {
        **serialize_order(order),
        "verified_customer_id": str(customer.pk),
        "ownership_verified": True,
    }


@transaction.atomic
def cancel_verified_order(
    *,
    customer: User,
    order_id: str,
) -> dict[str, Any]:
    """Cancel one verified customer-owned order using business services."""

    order_pk = parse_public_pk(
        order_id,
        prefix=ORDER_PREFIX,
        field_name="order_id",
    )

    order = (
        Order.objects
        .select_for_update()
        .filter(
            pk=order_pk,
            customer=customer,
        )
        .first()
    )

    if order is None:
        raise serializers.ValidationError(
            {"order_id": "The verified customer order was not found."}
        )

    cancelled_order = cancel_customer_order(
        order=order
    )

    return {
        "message": "Django Commerce order cancelled successfully.",
        **serialize_order(cancelled_order),
        "verified_customer_id": str(customer.pk),
        "ownership_verified": True,
        "cancelled": True,
    }


def checkout_url() -> str:
    """
    Return the configured checkout handoff URL.

    Production requires HTTPS. Local HTTP is allowed only while
    Django DEBUG mode is enabled and the hostname is localhost.
    """

    configured = str(
        getattr(
            settings,
            "ENGAGEPILOT_CHECKOUT_URL",
            "",
        )
        or ""
    ).strip()

    if not configured:
        raise serializers.ValidationError(
            {
                "checkout_url": (
                    "ENGAGEPILOT_CHECKOUT_URL "
                    "is not configured."
                )
            }
        )

    parsed = urlparse(configured)

    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.netloc
    ):
        raise serializers.ValidationError(
            {
                "checkout_url": (
                    "ENGAGEPILOT_CHECKOUT_URL "
                    "must be a valid HTTP or HTTPS URL."
                )
            }
        )

    hostname = (
        parsed.hostname or ""
    ).lower()

    is_local_development = (
        settings.DEBUG
        and hostname
        in {
            "localhost",
            "127.0.0.1",
            "::1",
        }
    )

    if (
        parsed.scheme != "https"
        and not is_local_development
    ):
        raise serializers.ValidationError(
            {
                "checkout_url": (
                    "ENGAGEPILOT_CHECKOUT_URL "
                    "must use HTTPS outside local development."
                )
            }
        )

    return configured
@transaction.atomic
def prepare_checkout(
    *,
    customer: User,
    cart_id: str,
    expected_lines: list[dict[str, Any]],
) -> dict[str, Any]:
    """Verify a confirmed cart snapshot and return hosted checkout handoff."""

    cart = get_customer_cart(
        customer=customer,
        cart_id=cart_id,
        lock=True,
    )

    # Lock only the cart-item rows that make up the confirmed snapshot.
    #
    # Do not join nullable related rows (notably ``variant``) into the same
    # SELECT ... FOR UPDATE statement. PostgreSQL rejects FOR UPDATE when it
    # would apply to the nullable side of an outer join. The checkout snapshot
    # comparison below only needs the cart-item primary key and quantity, so
    # related product/variant joins are unnecessary here.
    current_items = list(
        CartItem.objects
        .select_for_update()
        .filter(cart=cart)
        .order_by("id")
    )

    if not current_items:
        raise serializers.ValidationError(
            {"cart_id": "The cart is empty."}
        )

    current_snapshot = sorted(
        (
            public_id(CART_ITEM_PREFIX, item.pk),
            item.quantity,
        )
        for item in current_items
    )

    expected_snapshot = sorted(
        (
            str(line["line_id"]).strip(),
            int(line["quantity"]),
        )
        for line in expected_lines
    )

    if current_snapshot != expected_snapshot:
        raise serializers.ValidationError(
            {
                "expected_lines": (
                    "Cart contents changed after checkout confirmation "
                    "was requested. Review the cart and confirm again."
                )
            }
        )

    cart_payload = serialize_cart(cart)
    secure_checkout_url = checkout_url()

    cart_payload["checkout_url"] = secure_checkout_url

    return {
        "message": "Django Commerce checkout is ready.",
        "checkout_url": secure_checkout_url,
        "checkout_ready": True,
        "handoff_type": "hosted_checkout",
        "payment_collected_by_agent": False,
        "order_placed_by_agent": False,
        "cart_id": cart_payload["cart_id"],
        "cart": cart_payload,
    }