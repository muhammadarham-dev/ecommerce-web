from django.db.models import Avg, Count, Q
from django_filters.rest_framework import (
    DjangoFilterBackend,
)
from rest_framework import (
    filters,
    mixins,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from .filters import ReviewFilter
from .models import Review
from .permissions import (
    IsAdmin,
    IsCustomer,
    IsReviewOwnerOrAdmin,
)
from .serializers import (
    AdminReviewSerializer,
    ReviewCreateSerializer,
    ReviewModerationSerializer,
    ReviewSerializer,
    ReviewUpdateSerializer,
)


def get_review_queryset():
    return (
        Review.objects
        .select_related(
            "customer",
            "product",
            "order",
        )
    )


class ReviewViewSet(viewsets.ModelViewSet):
    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_class = ReviewFilter

    ordering_fields = [
        "rating",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        queryset = get_review_queryset()
        user = self.request.user

        if self.action == "mine":
            return queryset.filter(
                customer=user,
            )

        if self.action in {
            "partial_update",
            "destroy",
        }:
            if (
                user.is_authenticated
                and (
                    user.is_superuser
                    or user.role == user.Role.ADMIN
                )
            ):
                return queryset

            return queryset.filter(
                customer=user,
            )

        return queryset.filter(
            is_approved=True,
        )

    def get_permissions(self):
        if self.action in {
            "list",
            "retrieve",
        }:
            return [
                AllowAny(),
            ]

        if self.action == "create":
            return [
                IsCustomer(),
            ]

        if self.action == "mine":
            return [
                IsCustomer(),
            ]

        if self.action in {
            "partial_update",
            "destroy",
        }:
            return [
                IsAuthenticated(),
                IsReviewOwnerOrAdmin(),
            ]

        return [
            IsAuthenticated(),
        ]

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer

        if self.action == "partial_update":
            return ReviewUpdateSerializer

        return ReviewSerializer

    def create(self, request, *args, **kwargs):
        input_serializer = ReviewCreateSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        review = input_serializer.save()

        output_serializer = ReviewSerializer(
            review,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Product review submitted successfully."
                ),
                "review": output_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):
        review = self.get_object()

        input_serializer = ReviewUpdateSerializer(
            review,
            data=request.data,
            partial=True,
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        review = input_serializer.save()

        return Response(
            {
                "message": (
                    "Product review updated successfully."
                ),
                "review": ReviewSerializer(
                    review,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        review.delete()

        return Response(
            {
                "message": (
                    "Product review deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
    )
    def mine(self, request):
        queryset = self.filter_queryset(
            self.get_queryset()
        )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = ReviewSerializer(
                page,
                many=True,
                context={
                    "request": request,
                },
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = ReviewSerializer(
            queryset,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ReviewManagementViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AdminReviewSerializer

    permission_classes = [
        IsAdmin,
    ]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ReviewFilter

    search_fields = [
        "customer__username",
        "customer__email",
        "product__name",
        "product__slug",
        "product__sku",
        "order__order_number",
        "title",
        "comment",
    ]

    ordering_fields = [
        "rating",
        "is_approved",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return get_review_queryset()

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        review.delete()

        return Response(
            {
                "message": (
                    "Review deleted successfully."
                ),
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="dashboard",
    )
    def dashboard(self, request):
        queryset = self.get_queryset()

        summary = queryset.aggregate(
            total_reviews=Count("id"),
            published_reviews=Count(
                "id",
                filter=Q(
                    is_approved=True,
                ),
            ),
            hidden_reviews=Count(
                "id",
                filter=Q(
                    is_approved=False,
                ),
            ),
            verified_reviews=Count(
                "id",
                filter=Q(
                    order__status="DELIVERED",
                ),
            ),
            average_rating=Avg("rating"),
        )

        rating_counts = {
            str(item["rating"]): item["count"]
            for item in (
                queryset
                .values("rating")
                .annotate(
                    count=Count("id"),
                )
                .order_by("rating")
            )
        }

        return Response(
            {
                "summary": {
                    "total_reviews": (
                        summary["total_reviews"]
                        or 0
                    ),
                    "published_reviews": (
                        summary["published_reviews"]
                        or 0
                    ),
                    "hidden_reviews": (
                        summary["hidden_reviews"]
                        or 0
                    ),
                    "verified_reviews": (
                        summary["verified_reviews"]
                        or 0
                    ),
                    "average_rating": (
                        round(
                            float(
                                summary[
                                    "average_rating"
                                ]
                                or 0
                            ),
                            2,
                        )
                    ),
                },
                "rating_counts": rating_counts,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="moderate",
    )
    def moderate(
        self,
        request,
        pk=None,
    ):
        review = self.get_object()

        input_serializer = (
            ReviewModerationSerializer(
                data=request.data,
            )
        )

        input_serializer.is_valid(
            raise_exception=True,
        )

        review.is_approved = (
            input_serializer.validated_data[
                "is_approved"
            ]
        )

        review.save(
            update_fields=[
                "is_approved",
                "updated_at",
            ],
        )

        return Response(
            {
                "message": (
                    "Review published successfully."
                    if review.is_approved
                    else "Review hidden successfully."
                ),
                "review": AdminReviewSerializer(
                    review,
                    context={
                        "request": request,
                    },
                ).data,
            },
            status=status.HTTP_200_OK,
        )
