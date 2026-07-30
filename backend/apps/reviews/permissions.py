from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = "Only customers can submit product reviews."

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and user.role == user.Role.CUSTOMER
        )


class IsReviewOwnerOrAdmin(BasePermission):
    message = "You can only modify your own review."

    def has_object_permission(
        self,
        request,
        view,
        review,
    ):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role == user.Role.ADMIN
            or review.customer_id == user.id
        )


class IsAdmin(BasePermission):
    message = "Only administrators can moderate reviews."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role == user.Role.ADMIN
        )
