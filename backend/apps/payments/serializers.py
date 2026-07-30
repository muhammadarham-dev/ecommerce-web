from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    customer_username = serializers.CharField(
        source="customer.username",
        read_only=True,
    )

    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Payment

        fields = [
            "id",
            "payment_number",
            "order_number",
            "customer_username",
            "method",
            "status",
            "amount",
            "transaction_reference",
            "proof",
            "rejection_reason",
            "verified_by_username",
            "submitted_at",
            "verified_at",
            "rejected_at",
            "refunded_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class BankTransferSubmitSerializer(
    serializers.Serializer
):
    transaction_reference = serializers.CharField(
        max_length=100,
    )

    proof = serializers.FileField()

    def validate_transaction_reference(self, value):
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError(
                "Transaction reference is required."
            )

        payment = self.context.get("payment")

        queryset = Payment.objects.filter(
            transaction_reference__iexact=normalized_value,
        )

        if payment is not None:
            queryset = queryset.exclude(
                pk=payment.pk,
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "This transaction reference is already in use."
            )

        return normalized_value

    def validate_proof(self, value):
        proof_field = Payment._meta.get_field("proof")
        proof_field.run_validators(value)

        return value


class PaymentRejectSerializer(
    serializers.Serializer
):
    rejection_reason = serializers.CharField(
        max_length=2000,
    )

    def validate_rejection_reason(self, value):
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError(
                "Rejection reason is required."
            )

        return normalized_value