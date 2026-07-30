from django.http import JsonResponse
from django.utils import timezone
from django.views.defaults import (
    page_not_found,
    server_error,
)


def build_error_response(
    *,
    request,
    status_code,
    code,
    message,
):
    request_id = getattr(
        request,
        "audit_request_id",
        None,
    )

    return JsonResponse(
        {
            "success": False,
            "status_code": status_code,
            "error": {
                "code": code,
                "message": message,
                "details": {
                    "detail": message,
                },
            },
            "meta": {
                "path": request.path,
                "request_id": (
                    str(request_id)
                    if request_id
                    else None
                ),
                "timestamp": (
                    timezone.now().isoformat()
                ),
            },
        },
        status=status_code,
    )


def custom_page_not_found(
    request,
    exception,
):
    if request.path.startswith("/api/"):
        return build_error_response(
            request=request,
            status_code=404,
            code="not_found",
            message=(
                "The requested API endpoint "
                "was not found."
            ),
        )

    return page_not_found(
        request,
        exception,
    )


def custom_server_error(request):
    if request.path.startswith("/api/"):
        return build_error_response(
            request=request,
            status_code=500,
            code="server_error",
            message=(
                "An unexpected server error occurred."
            ),
        )

    return server_error(request)