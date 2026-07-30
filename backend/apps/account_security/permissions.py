from rest_framework.permissions import (
    BasePermission,
)


class IsAccountSecurityAdministrator(
    BasePermission
):
    message = (
        "Only administrators can access "
        "login security records."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        admin_role = getattr(
            getattr(user, "Role", None),
            "ADMIN",
            "ADMIN",
        )

        return (
            user.is_superuser
            or getattr(user, "role", None)
            == admin_role
        )