from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from .models import RecentlyViewedProduct


@transaction.atomic
def record_product_view(
    *,
    customer,
    product,
):
    recently_viewed, created = (
        RecentlyViewedProduct.objects.get_or_create(
            customer=customer,
            product=product,
        )
    )

    if not created:
        RecentlyViewedProduct.objects.filter(
            pk=recently_viewed.pk,
        ).update(
            view_count=F("view_count") + 1,
            viewed_at=timezone.now(),
        )

        recently_viewed.refresh_from_db()

    limit = getattr(
        settings,
        "RECENTLY_VIEWED_LIMIT",
        30,
    )

    old_item_ids = list(
        RecentlyViewedProduct.objects
        .filter(customer=customer)
        .order_by("-viewed_at")
        .values_list("id", flat=True)[limit:]
    )

    if old_item_ids:
        RecentlyViewedProduct.objects.filter(
            id__in=old_item_ids,
        ).delete()

    return recently_viewed