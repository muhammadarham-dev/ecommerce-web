from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = (
        "Only customers can calculate shipping charges."
    )

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and user.role == user.Role.CUSTOMER
        )


class IsShippingManager(BasePermission):
    message = (
        "Only administrators and order managers "
        "can manage shipping rates."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role
            in {
                user.Role.ADMIN,
                user.Role.ORDER_MANAGER,
            }
        )