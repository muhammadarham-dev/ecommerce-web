from rest_framework.permissions import BasePermission


class IsStoreAdministrator(BasePermission):
    message = (
        "Only administrators can manage store settings."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role == user.Role.ADMIN
        )