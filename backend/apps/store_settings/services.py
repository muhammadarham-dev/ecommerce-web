from rest_framework import serializers

from .models import StoreSettings


def get_store_settings():
    return StoreSettings.load()


def get_return_window_days():
    return get_store_settings().return_window_days


def get_low_stock_threshold():
    return get_store_settings().low_stock_threshold


def get_enabled_payment_methods():
    settings_object = get_store_settings()

    enabled_methods = []

    if settings_object.allow_cash_on_delivery:
        enabled_methods.append(
            {
                "value": "CASH_ON_DELIVERY",
                "label": "Cash on Delivery",
            }
        )

    if settings_object.allow_bank_transfer:
        enabled_methods.append(
            {
                "value": "BANK_TRANSFER",
                "label": "Bank Transfer",
            }
        )

    return enabled_methods


def validate_payment_method_enabled(
    payment_method,
):
    settings_object = get_store_settings()

    if (
        payment_method == "CASH_ON_DELIVERY"
        and not settings_object.allow_cash_on_delivery
    ):
        raise serializers.ValidationError(
            {
                "payment_method": (
                    "Cash on Delivery is currently unavailable."
                )
            }
        )

    if (
        payment_method == "BANK_TRANSFER"
        and not settings_object.allow_bank_transfer
    ):
        raise serializers.ValidationError(
            {
                "payment_method": (
                    "Bank Transfer is currently unavailable."
                )
            }
        )

    return payment_method