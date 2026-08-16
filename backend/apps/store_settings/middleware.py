from django.db.utils import OperationalError, ProgrammingError
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)

from .services import get_store_settings


class StoreMaintenanceMiddleware:
    exempt_prefixes = (
        "/admin/",
        "/api/auth/",
        "/api/store-settings/",
        "/static/",
        "/media/",
        "/api/health/",
        "/api/integrations/engagepilot/",
    )

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authentication = JWTAuthentication()

    def get_authenticated_user(self, request):
        current_user = getattr(
            request,
            "user",
            None,
        )

        if (
            current_user
            and current_user.is_authenticated
        ):
            return current_user

        try:
            authentication_result = (
                self.jwt_authentication.authenticate(
                    request
                )
            )
        except Exception:
            authentication_result = None

        if authentication_result is None:
            return None

        user, _ = authentication_result

        return user

    def is_administrator(self, user):
        if not user or not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or getattr(user, "role", None) == "ADMIN"
        )

    def __call__(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)

        if request.path.startswith(
            self.exempt_prefixes
        ):
            return self.get_response(request)

        try:
            settings_object = get_store_settings()
        except (
            OperationalError,
            ProgrammingError,
        ):
            return self.get_response(request)

        if not settings_object.maintenance_mode:
            return self.get_response(request)

        authenticated_user = (
            self.get_authenticated_user(request)
        )

        if self.is_administrator(
            authenticated_user
        ):
            return self.get_response(request)

        return JsonResponse(
            {
                "detail": (
                    settings_object.maintenance_message
                ),
                "maintenance_mode": True,
                "store_name": (
                    settings_object.store_name
                ),
            },
            status=503,
        )