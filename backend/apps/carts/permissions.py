from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = "Only customers can access the shopping cart."

    def has_permission(self, request, view):
        user = request.user

        return (
            user
            and user.is_authenticated
            and user.role == user.Role.CUSTOMER
        )