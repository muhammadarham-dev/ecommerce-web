import ipaddress
import uuid

from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)

from .context import (
    reset_business_audit_context,
    set_business_audit_context,
)


class BusinessAuditContextMiddleware:
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

    def normalize_ip_address(self, value):
        if not value:
            return None

        try:
            return str(
                ipaddress.ip_address(
                    value.strip()
                )
            )
        except ValueError:
            return None

    def get_ip_address(self, request):
        forwarded_for = request.META.get(
            "HTTP_X_FORWARDED_FOR",
            "",
        )

        if forwarded_for:
            first_ip = forwarded_for.split(
                ","
            )[0]

            normalized_ip = (
                self.normalize_ip_address(
                    first_ip
                )
            )

            if normalized_ip:
                return normalized_ip

        return self.normalize_ip_address(
            request.META.get(
                "REMOTE_ADDR",
                "",
            )
        )

    def __call__(self, request):
        request_id = uuid.uuid4()

        request.audit_request_id = request_id

        user = self.get_authenticated_user(
            request
        )

        context_token = (
            set_business_audit_context(
                user=user,
                request_id=request_id,
                method=request.method,
                path=request.path,
                ip_address=(
                    self.get_ip_address(request)
                ),
            )
        )

        try:
            response = self.get_response(
                request
            )

            response[
                "X-Request-ID"
            ] = str(request_id)

            return response

        finally:
            reset_business_audit_context(
                context_token
            )