from rest_framework.permissions import BasePermission


class IsCatalogManager(BasePermission):
    message = (
        "Only administrators and order managers "
        "can manage product variants."
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