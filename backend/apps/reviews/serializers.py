from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.orders.models import Order
from apps.products.models import Product

from .models import Review


User = get_user_model()


class ReviewCustomerSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "full_name",
        ]

        read_only_fields = fields

    def get_full_name(self, user):
        return user.get_full_name() or user.username


class AdminReviewCustomerSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "full_name",
        ]

        read_only_fields = fields

    def get_full_name(self, user):
        return user.get_full_name() or user.username


class ReviewProductSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "sku",
        ]

        read_only_fields = fields


class ReviewSerializer(serializers.ModelSerializer):
    customer = ReviewCustomerSerializer(
        read_only=True,
    )

    product = ReviewProductSerializer(
        read_only=True,
    )

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    is_verified_purchase = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "customer",
            "product",
            "order_number",
            "rating",
            "title",
            "comment",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_is_verified_purchase(self, review):
        return (
            review.order.status
            == Order.Status.DELIVERED
        )


class AdminReviewSerializer(
    serializers.ModelSerializer
):
    customer = AdminReviewCustomerSerializer(
        read_only=True,
    )

    product = ReviewProductSerializer(
        read_only=True,
    )

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True,
    )

    is_verified_purchase = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "customer",
            "product",
            "order_number",
            "rating",
            "title",
            "comment",
            "is_approved",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_is_verified_purchase(self, review):
        return (
            review.order.status
            == Order.Status.DELIVERED
        )


class ReviewCreateSerializer(
    serializers.ModelSerializer
):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.filter(
            is_active=True,
        ),
    )

    order_id = serializers.PrimaryKeyRelatedField(
        source="order",
        queryset=Order.objects.none(),
    )

    class Meta:
        model = Review

        fields = [
            "product_id",
            "order_id",
            "rating",
            "title",
            "comment",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            self.fields["order_id"].queryset = (
                Order.objects.filter(
                    customer=request.user,
                    status=Order.Status.DELIVERED,
                )
            )

    def validate(self, attributes):
        request = self.context["request"]
        customer = request.user

        product = attributes["product"]
        order = attributes["order"]

        if order.customer_id != customer.id:
            raise serializers.ValidationError(
                {
                    "order_id": (
                        "This order does not belong to you."
                    )
                }
            )

        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError(
                {
                    "order_id": (
                        "You can only review products "
                        "from delivered orders."
                    )
                }
            )

        product_exists_in_order = (
            order.items.filter(
                product=product,
            ).exists()
        )

        if not product_exists_in_order:
            raise serializers.ValidationError(
                {
                    "product_id": (
                        "This product is not part "
                        "of the selected order."
                    )
                }
            )

        existing_review = Review.objects.filter(
            customer=customer,
            product=product,
        ).exists()

        if existing_review:
            raise serializers.ValidationError(
                {
                    "product_id": (
                        "You have already reviewed "
                        "this product."
                    )
                }
            )

        return attributes

    def create(self, validated_data):
        request = self.context["request"]

        return Review.objects.create(
            customer=request.user,
            **validated_data,
        )


class ReviewUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Review

        fields = [
            "rating",
            "title",
            "comment",
        ]


class ReviewModerationSerializer(
    serializers.Serializer
):
    is_approved = serializers.BooleanField()
