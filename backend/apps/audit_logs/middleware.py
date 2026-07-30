import ipaddress
import json
import time

from django.db.utils import (
    OperationalError,
    ProgrammingError,
)
from rest_framework_simplejwt.authentication import (
    JWTAuthentication,
)

from .models import AuditLog


class AuditLogMiddleware:
    tracked_methods = {
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    }

    sensitive_keywords = {
        "password",
        "current_password",
        "new_password",
        "confirm_password",
        "password_confirm",
        "token",
        "access",
        "refresh",
        "authorization",
        "secret",
        "api_key",
        "otp",
        "pin",
        "cvv",
        "card_number",
    }

    excluded_prefixes = (
        "/static/",
        "/media/",
        "/admin/jsi18n/",
    )

    maximum_body_size = 20 * 1024

    def __init__(self, get_response):
        self.get_response = get_response

        self.jwt_authentication = (
            JWTAuthentication()
        )

    def should_track(self, request):
        if request.method not in self.tracked_methods:
            return False

        if not request.path.startswith("/api/"):
            return False

        return not request.path.startswith(
            self.excluded_prefixes
        )

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

    def sanitize_value(self, value):
        if isinstance(value, dict):
            sanitized_data = {}

            for key, item_value in value.items():
                normalized_key = str(
                    key
                ).lower()

                is_sensitive = any(
                    keyword in normalized_key
                    for keyword
                    in self.sensitive_keywords
                )

                if is_sensitive:
                    sanitized_data[key] = (
                        "[REDACTED]"
                    )
                else:
                    sanitized_data[key] = (
                        self.sanitize_value(
                            item_value
                        )
                    )

            return sanitized_data

        if isinstance(value, list):
            return [
                self.sanitize_value(item)
                for item in value
            ]

        if isinstance(value, tuple):
            return [
                self.sanitize_value(item)
                for item in value
            ]

        if isinstance(
            value,
            (
                str,
                int,
                float,
                bool,
            ),
        ) or value is None:
            return value

        return str(value)

    def extract_json_body(self, request):
        content_length = request.META.get(
            "CONTENT_LENGTH",
            "",
        )

        try:
            body_size = int(
                content_length or 0
            )
        except ValueError:
            body_size = 0

        if body_size > self.maximum_body_size:
            return {
                "detail": (
                    "Request body was too large "
                    "to store in the audit log."
                )
            }

        content_type = (
            request.content_type or ""
        ).lower()

        try:
            if "application/json" in content_type:
                raw_body = request.body

                if not raw_body:
                    return {}

                decoded_body = raw_body.decode(
                    "utf-8"
                )

                parsed_body = json.loads(
                    decoded_body
                )

                return self.sanitize_value(
                    parsed_body
                )

            if (
                "multipart/form-data"
                in content_type
                or "application/x-www-form-urlencoded"
                in content_type
            ):
                form_data = {}

                for key in request.POST.keys():
                    values = request.POST.getlist(
                        key
                    )

                    form_data[key] = (
                        values
                        if len(values) > 1
                        else values[0]
                    )

                uploaded_files = {}

                for key in request.FILES.keys():
                    uploaded_files[key] = [
                        {
                            "name": file.name,
                            "size": file.size,
                            "content_type": (
                                file.content_type
                            ),
                        }
                        for file
                        in request.FILES.getlist(
                            key
                        )
                    ]

                if uploaded_files:
                    form_data[
                        "uploaded_files"
                    ] = uploaded_files

                return self.sanitize_value(
                    form_data
                )

        except (
            UnicodeDecodeError,
            json.JSONDecodeError,
            ValueError,
        ):
            return {
                "detail": (
                    "Request body could not "
                    "be parsed."
                )
            }

        except Exception:
            return {
                "detail": (
                    "Request body was unavailable."
                )
            }

        return {}

    def extract_query_params(self, request):
        query_data = {}

        for key in request.GET.keys():
            values = request.GET.getlist(key)

            query_data[key] = (
                values
                if len(values) > 1
                else values[0]
            )

        return self.sanitize_value(
            query_data
        )

    def normalize_ip_address(self, value):
        if not value:
            return None

        normalized_value = value.strip()

        try:
            return str(
                ipaddress.ip_address(
                    normalized_value
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
            first_address = forwarded_for.split(
                ","
            )[0]

            normalized_address = (
                self.normalize_ip_address(
                    first_address
                )
            )

            if normalized_address:
                return normalized_address

        return self.normalize_ip_address(
            request.META.get(
                "REMOTE_ADDR",
                "",
            )
        )

    def classify_action(self, request):
        path = request.path.lower()

        if (
            "token" in path
            or "login" in path
            or "sign-in" in path
        ):
            return AuditLog.Action.LOGIN

        if (
            "logout" in path
            or "sign-out" in path
        ):
            return AuditLog.Action.LOGOUT

        if "password/change" in path:
            return (
                AuditLog.Action.PASSWORD_CHANGE
            )

        if (
            "password/reset" in path
            or "password/forgot" in path
        ):
            return (
                AuditLog.Action.PASSWORD_RESET
            )

        if (
            "email/send" in path
            or "email/confirm" in path
            or "verify-email" in path
        ):
            return (
                AuditLog.Action.EMAIL_VERIFICATION
            )

        if "checkout" in path:
            return AuditLog.Action.CHECKOUT

        if (
            "cancel" in path
            and "order" in path
        ):
            return (
                AuditLog.Action.ORDER_CANCEL
            )

        if (
            "/status" in path
            or path.endswith("/status/")
        ):
            return (
                AuditLog.Action.STATUS_CHANGE
            )

        method_actions = {
            "POST": AuditLog.Action.CREATE,
            "PUT": AuditLog.Action.UPDATE,
            "PATCH": AuditLog.Action.UPDATE,
            "DELETE": AuditLog.Action.DELETE,
        }

        return method_actions.get(
            request.method,
            AuditLog.Action.OTHER,
        )

    def get_route_name(self, request):
        resolver_match = getattr(
            request,
            "resolver_match",
            None,
        )

        if resolver_match is None:
            return ""

        return (
            resolver_match.view_name
            or resolver_match.url_name
            or ""
        )

    def get_error_message(self, response):
        if response.status_code < 400:
            return ""

        response_data = getattr(
            response,
            "data",
            None,
        )

        if response_data is None:
            return (
                f"Request failed with HTTP "
                f"{response.status_code}."
            )

        sanitized_response = (
            self.sanitize_value(
                response_data
            )
        )

        if isinstance(
            sanitized_response,
            dict,
        ):
            detail = sanitized_response.get(
                "detail"
            )

            if detail:
                return str(detail)[:5000]

        try:
            serialized_response = json.dumps(
                sanitized_response,
                default=str,
            )

            return serialized_response[:5000]

        except (TypeError, ValueError):
            return (
                f"Request failed with HTTP "
                f"{response.status_code}."
            )

    def save_audit_log(
        self,
        *,
        request,
        response,
        user,
        request_data,
        query_params,
        duration_ms,
    ):
        try:
            AuditLog.objects.create(
                user=(
                    user
                    if user
                    and user.is_authenticated
                    else None
                ),
                action=self.classify_action(
                    request
                ),
                method=request.method,
                path=request.path[:1000],
                route_name=(
                    self.get_route_name(
                        request
                    )[:255]
                ),
                status_code=(
                    response.status_code
                ),
                success=(
                    200
                    <= response.status_code
                    < 400
                ),
                ip_address=(
                    self.get_ip_address(
                        request
                    )
                ),
                user_agent=(
                    request.META.get(
                        "HTTP_USER_AGENT",
                        "",
                    )[:5000]
                ),
                query_params=query_params,
                request_data=request_data,
                error_message=(
                    self.get_error_message(
                        response
                    )
                ),
                duration_ms=max(
                    0,
                    duration_ms,
                ),
            )

        except (
            OperationalError,
            ProgrammingError,
        ):
            pass

        except Exception:
            pass

    def __call__(self, request):
        if not self.should_track(request):
            return self.get_response(request)

        started_at = time.perf_counter()

        request_data = self.extract_json_body(
            request
        )

        query_params = (
            self.extract_query_params(
                request
            )
        )

        user = self.get_authenticated_user(
            request
        )

        try:
            response = self.get_response(
                request
            )

        except Exception:
            duration_ms = int(
                (
                    time.perf_counter()
                    - started_at
                )
                * 1000
            )

            try:
                AuditLog.objects.create(
                    user=(
                        user
                        if user
                        and user.is_authenticated
                        else None
                    ),
                    action=(
                        self.classify_action(
                            request
                        )
                    ),
                    method=request.method,
                    path=request.path[:1000],
                    route_name=(
                        self.get_route_name(
                            request
                        )[:255]
                    ),
                    status_code=500,
                    success=False,
                    ip_address=(
                        self.get_ip_address(
                            request
                        )
                    ),
                    user_agent=(
                        request.META.get(
                            "HTTP_USER_AGENT",
                            "",
                        )[:5000]
                    ),
                    query_params=query_params,
                    request_data=request_data,
                    error_message=(
                        "An unhandled server error occurred."
                    ),
                    duration_ms=max(
                        0,
                        duration_ms,
                    ),
                )

            except Exception:
                pass

            raise

        duration_ms = int(
            (
                time.perf_counter()
                - started_at
            )
            * 1000
        )

        self.save_audit_log(
            request=request,
            response=response,
            user=user,
            request_data=request_data,
            query_params=query_params,
            duration_ms=duration_ms,
        )

        return response