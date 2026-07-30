import logging

from django.conf import settings
from django.core.exceptions import (
    PermissionDenied as DjangoPermissionDenied,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from django.http import Http404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    MethodNotAllowed,
    NotAcceptable,
    NotAuthenticated,
    NotFound,
    ParseError,
    PermissionDenied,
    Throttled,
    UnsupportedMediaType,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import (
    exception_handler as drf_exception_handler,
)

from .exceptions import (
    ConflictError,
    ServiceUnavailableError,
    UnprocessableEntityError,
)


logger = logging.getLogger(__name__)


def make_json_safe(value):
    if isinstance(value, dict):
        return {
            str(key): make_json_safe(item_value)
            for key, item_value in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [
            make_json_safe(item)
            for item in value
        ]

    if value is None:
        return None

    if isinstance(
        value,
        (
            str,
            int,
            float,
            bool,
        ),
    ):
        return value

    return str(value)


def convert_django_validation_error(
    exception,
):
    if hasattr(exception, "message_dict"):
        return ValidationError(
            make_json_safe(
                exception.message_dict
            )
        )

    if hasattr(exception, "messages"):
        return ValidationError(
            {
                "non_field_errors": (
                    make_json_safe(
                        exception.messages
                    )
                )
            }
        )

    return ValidationError(
        {
            "non_field_errors": [
                str(exception),
            ]
        }
    )


def get_request_metadata(context):
    request = context.get("request")

    if request is None:
        return {
            "path": "",
            "request_id": None,
            "timestamp": timezone.now().isoformat(),
        }

    request_id = getattr(
        request,
        "audit_request_id",
        None,
    )

    return {
        "path": request.path,
        "request_id": (
            str(request_id)
            if request_id
            else None
        ),
        "timestamp": timezone.now().isoformat(),
    }


def find_first_error(value):
    if isinstance(value, dict):
        for item_value in value.values():
            error_message = find_first_error(
                item_value
            )

            if error_message:
                return error_message

        return ""

    if isinstance(value, (list, tuple)):
        for item in value:
            error_message = find_first_error(
                item
            )

            if error_message:
                return error_message

        return ""

    if value is None:
        return ""

    return str(value)


def get_error_code(
    exception,
    status_code,
):
    if isinstance(
        exception,
        (
            ValidationError,
            DjangoValidationError,
        ),
    ):
        return "validation_error"

    if isinstance(
        exception,
        (
            NotAuthenticated,
            AuthenticationFailed,
        ),
    ):
        return "authentication_failed"

    if isinstance(
        exception,
        (
            PermissionDenied,
            DjangoPermissionDenied,
        ),
    ):
        return "permission_denied"

    if isinstance(
        exception,
        (
            NotFound,
            Http404,
        ),
    ):
        return "not_found"

    if isinstance(
        exception,
        MethodNotAllowed,
    ):
        return "method_not_allowed"

    if isinstance(
        exception,
        ParseError,
    ):
        return "parse_error"

    if isinstance(
        exception,
        UnsupportedMediaType,
    ):
        return "unsupported_media_type"

    if isinstance(
        exception,
        NotAcceptable,
    ):
        return "not_acceptable"

    if isinstance(
        exception,
        Throttled,
    ):
        return "throttled"

    if isinstance(
        exception,
        ConflictError,
    ):
        return "conflict"

    if isinstance(
        exception,
        UnprocessableEntityError,
    ):
        return "unprocessable_entity"

    if isinstance(
        exception,
        ServiceUnavailableError,
    ):
        return "service_unavailable"

    if isinstance(
        exception,
        APIException,
    ):
        exception_code = exception.get_codes()

        if isinstance(exception_code, str):
            return exception_code

        return "api_error"

    status_codes = {
        status.HTTP_400_BAD_REQUEST: (
            "bad_request"
        ),
        status.HTTP_401_UNAUTHORIZED: (
            "authentication_failed"
        ),
        status.HTTP_403_FORBIDDEN: (
            "permission_denied"
        ),
        status.HTTP_404_NOT_FOUND: (
            "not_found"
        ),
        status.HTTP_409_CONFLICT: (
            "conflict"
        ),
        status.HTTP_429_TOO_MANY_REQUESTS: (
            "throttled"
        ),
        status.HTTP_500_INTERNAL_SERVER_ERROR: (
            "server_error"
        ),
        status.HTTP_503_SERVICE_UNAVAILABLE: (
            "service_unavailable"
        ),
    }

    return status_codes.get(
        status_code,
        "api_error",
    )


def get_error_message(
    exception,
    details,
    status_code,
):
    if isinstance(
        exception,
        (
            ValidationError,
            DjangoValidationError,
        ),
    ):
        return "Request validation failed."

    if isinstance(
        exception,
        (
            NotAuthenticated,
            AuthenticationFailed,
        ),
    ):
        return (
            find_first_error(details)
            or "Authentication credentials were not accepted."
        )

    if isinstance(
        exception,
        (
            PermissionDenied,
            DjangoPermissionDenied,
        ),
    ):
        return (
            find_first_error(details)
            or "You do not have permission to perform this action."
        )

    if isinstance(
        exception,
        (
            NotFound,
            Http404,
        ),
    ):
        return (
            find_first_error(details)
            or "The requested resource was not found."
        )

    if isinstance(
        exception,
        Throttled,
    ):
        return (
            find_first_error(details)
            or "Too many requests were submitted."
        )

    if status_code >= 500:
        return (
            "An unexpected server error occurred."
        )

    return (
        find_first_error(details)
        or "The request could not be completed."
    )


def build_error_payload(
    *,
    exception,
    status_code,
    details,
    context,
):
    safe_details = make_json_safe(
        details
    )

    error_data = {
        "code": get_error_code(
            exception,
            status_code,
        ),
        "message": get_error_message(
            exception,
            safe_details,
            status_code,
        ),
        "details": safe_details,
    }

    if isinstance(exception, Throttled):
        error_data["retry_after_seconds"] = (
            int(exception.wait)
            if exception.wait is not None
            else None
        )

    if (
        settings.DEBUG
        and status_code >= 500
    ):
        error_data["debug"] = {
            "exception": (
                exception.__class__.__name__
            )
        }

    return {
        "success": False,
        "status_code": status_code,
        "error": error_data,
        "meta": get_request_metadata(
            context
        ),
    }


def custom_exception_handler(
    exception,
    context,
):
    if isinstance(
        exception,
        DjangoValidationError,
    ):
        exception = (
            convert_django_validation_error(
                exception
            )
        )

    if isinstance(exception, ProtectedError):
        exception = ConflictError(
            detail=(
                "This record cannot be deleted because "
                "it is being used by another resource."
            )
        )

    elif isinstance(exception, IntegrityError):
        exception = ConflictError(
            detail=(
                "The operation conflicts with an "
                "existing database record."
            )
        )

    response = drf_exception_handler(
        exception,
        context,
    )

    if response is not None:
        original_details = response.data

        response.data = build_error_payload(
            exception=exception,
            status_code=response.status_code,
            details=original_details,
            context=context,
        )

        return response

    logger.error(
        "Unhandled API exception.",
        exc_info=(
            type(exception),
            exception,
            exception.__traceback__,
        ),
    )

    error_response = Response(
        status=(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    )

    error_response.data = build_error_payload(
        exception=exception,
        status_code=(
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ),
        details={
            "detail": (
                "An unexpected server error occurred."
            )
        },
        context=context,
    )

    return error_response