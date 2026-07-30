from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import (
    IsSystemHealthAdministrator,
)
from .serializers import (
    DetailedHealthResponseSerializer,
    LivenessResponseSerializer,
    ReadinessResponseSerializer,
)
from .services import (
    get_detailed_health_status,
    get_readiness_status,
)


class LivenessView(APIView):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    throttle_classes = []

    @extend_schema(
        tags=[
            "System Health",
        ],
        summary="Check API liveness",
        description=(
            "Confirms that the Django application "
            "process is running."
        ),
        request=None,
        responses={
            200: LivenessResponseSerializer,
        },
    )
    def get(self, request):
        return Response(
            {
                "status": "alive",
                "service": (
                    "Ecommerce Web API"
                ),
                "timestamp": timezone.now(),
            },
            status=status.HTTP_200_OK,
        )


class ReadinessView(APIView):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    throttle_classes = []

    @extend_schema(
        tags=[
            "System Health",
        ],
        summary="Check API readiness",
        description=(
            "Checks whether the database and cache "
            "services are available."
        ),
        request=None,
        responses={
            200: ReadinessResponseSerializer,
            503: ReadinessResponseSerializer,
        },
    )
    def get(self, request):
        health_data = (
            get_readiness_status()
        )

        response_status = (
            status.HTTP_200_OK
            if health_data["ready"]
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(
            health_data,
            status=response_status,
        )


class DetailedSystemHealthView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsSystemHealthAdministrator,
    ]

    @extend_schema(
        tags=[
            "System Health",
        ],
        summary="Get detailed system health",
        description=(
            "Returns detailed database, cache, "
            "migration and runtime information. "
            "Administrator access is required."
        ),
        request=None,
        responses={
            200: (
                DetailedHealthResponseSerializer
            ),
            503: (
                DetailedHealthResponseSerializer
            ),
        },
    )
    def get(self, request):
        health_data = (
            get_detailed_health_status()
        )

        response_status = (
            status.HTTP_200_OK
            if health_data["healthy"]
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(
            health_data,
            status=response_status,
        )