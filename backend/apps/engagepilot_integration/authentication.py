from dataclasses import dataclass
from secrets import compare_digest
from uuid import UUID

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


@dataclass(frozen=True, slots=True)
class EngagePilotServicePrincipal:
    """Authenticated machine principal for one EngagePilot connection."""

    connection_id: str

    @property
    def is_authenticated(self) -> bool:
        """Machine principals are authenticated after token validation."""

        return True

    @property
    def is_anonymous(self) -> bool:
        """Machine principals are not anonymous."""

        return False

    @property
    def pk(self) -> str:
        """Provide a stable key for DRF throttling."""

        return f"engagepilot:{self.connection_id}"

    @property
    def id(self) -> str:
        """Mirror Django user-style identifier access."""

        return self.pk

    def __str__(self) -> str:
        return self.pk


class EngagePilotServiceAuthentication(BaseAuthentication):
    """Authenticate EngagePilot requests with a service Bearer token."""

    keyword = "Bearer"

    def authenticate(self, request):
        configured_token = str(
            getattr(
                settings,
                "ENGAGEPILOT_API_TOKEN",
                "",
            )
            or ""
        ).strip()

        if not configured_token:
            raise AuthenticationFailed(
                "EngagePilot integration is not configured."
            )

        authorization = request.headers.get(
            "Authorization",
            "",
        ).strip()

        parts = authorization.split(None, 1)

        if (
            len(parts) != 2
            or parts[0].casefold()
            != self.keyword.casefold()
        ):
            raise AuthenticationFailed(
                "A valid EngagePilot Bearer token is required."
            )

        supplied_token = parts[1].strip()

        if (
            not supplied_token
            or not compare_digest(
                supplied_token,
                configured_token,
            )
        ):
            raise AuthenticationFailed(
                "The EngagePilot Bearer token is invalid."
            )

        raw_connection_id = request.headers.get(
            "X-EngagePilot-Connection-ID",
            "",
        ).strip()

        if not raw_connection_id:
            raise AuthenticationFailed(
                "X-EngagePilot-Connection-ID is required."
            )

        try:
            connection_id = str(
                UUID(raw_connection_id)
            )
        except (TypeError, ValueError) as exc:
            raise AuthenticationFailed(
                "X-EngagePilot-Connection-ID must be a valid UUID."
            ) from exc

        principal = EngagePilotServicePrincipal(
            connection_id=connection_id,
        )

        return (
            principal,
            {
                "connection_id": connection_id,
                "service": "engagepilot",
            },
        )

    def authenticate_header(self, request):
        del request
        return self.keyword
