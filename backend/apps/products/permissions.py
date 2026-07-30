from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsCatalogManagerOrReadOnly(BasePermission):
    message = "Only administrators and order managers can modify the catalog."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

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