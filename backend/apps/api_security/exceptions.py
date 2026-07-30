from rest_framework import status
from rest_framework.exceptions import APIException


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = (
        "The requested operation conflicts "
        "with the current resource state."
    )
    default_code = "conflict"


class UnprocessableEntityError(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = (
        "The request could not be processed."
    )
    default_code = "unprocessable_entity"


class ServiceUnavailableError(APIException):
    status_code = (
        status.HTTP_503_SERVICE_UNAVAILABLE
    )
    default_detail = (
        "The requested service is temporarily unavailable."
    )
    default_code = "service_unavailable"