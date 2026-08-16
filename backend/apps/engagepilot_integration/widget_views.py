from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User


class EngagePilotCustomerWidgetSessionView(APIView):
    """Bootstrap a verified EngagePilot widget session for a logged-in customer.

    The browser authenticates to this Django endpoint with the store's normal
    customer JWT. Django then performs a trusted server-to-server bootstrap
    against EngagePilot using the private connector credential. The connector
    credential never reaches browser JavaScript.
    """

    permission_classes = [IsAuthenticated]

    @staticmethod
    def _bridge_configuration() -> tuple[str, str, str, list[str]]:
        """Return normalized widget-bridge settings and missing setting names."""

        service_token = str(
            getattr(settings, "ENGAGEPILOT_API_TOKEN", "") or ""
        ).strip()
        connection_id = str(
            getattr(settings, "ENGAGEPILOT_CONNECTION_ID", "") or ""
        ).strip()
        agent_service_url = str(
            getattr(settings, "ENGAGEPILOT_AGENT_SERVICE_URL", "") or ""
        ).strip().rstrip("/")

        missing: list[str] = []
        if not service_token:
            missing.append("ENGAGEPILOT_API_TOKEN")
        if not connection_id:
            missing.append("ENGAGEPILOT_CONNECTION_ID")
        if not agent_service_url:
            missing.append("ENGAGEPILOT_AGENT_SERVICE_URL")

        return service_token, connection_id, agent_service_url, missing

    def post(self, request):
        user = request.user

        if (
            not isinstance(user, User)
            or not user.is_active
            or user.role != User.Role.CUSTOMER
        ):
            return Response(
                {
                    "detail": (
                        "A signed-in customer account is required for "
                        "customer-specific EngagePilot actions."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        (
            service_token,
            connection_id,
            agent_service_url,
            missing_settings,
        ) = self._bridge_configuration()

        if missing_settings:
            detail = (
                "The EngagePilot customer widget identity bridge is "
                "not configured on this store."
            )

            if settings.DEBUG:
                detail = (
                    f"{detail} Missing settings: "
                    f"{', '.join(missing_settings)}."
                )

            return Response(
                {"detail": detail},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        preferred_language = request.data.get(
            "preferred_language",
            "auto",
        )
        if not isinstance(preferred_language, str):
            preferred_language = "auto"
        preferred_language = preferred_language.strip() or "auto"
        preferred_language = preferred_language[:30]

        page = request.data.get("page")
        safe_page: dict[str, str] = {}
        if isinstance(page, dict):
            page_url = page.get("url")
            page_title = page.get("title")

            if isinstance(page_url, str) and page_url.strip():
                safe_page["url"] = page_url.strip()[:1000]

            if isinstance(page_title, str) and page_title.strip():
                safe_page["title"] = page_title.strip()[:255]

        display_name = " ".join(
            part.strip()
            for part in [user.first_name, user.last_name]
            if isinstance(part, str) and part.strip()
        ).strip()

        fallback_identity = (
            user.email
            or getattr(user, "username", None)
            or f"Customer {user.pk}"
        )
        title = display_name or str(fallback_identity)

        bootstrap_payload = {
            "external_customer_id": f"customer:{user.pk}",
            "title": title[:255],
            "preferred_language": preferred_language,
            "conversation_metadata": {
                "source": "django_store_customer_widget",
                "store_customer_id": str(user.pk),
                "page": safe_page,
            },
        }

        bootstrap_url = (
            f"{agent_service_url}"
            "/api/v1/customer-sessions/bootstrap/"
        )

        outbound_request = Request(
            bootstrap_url,
            data=json.dumps(bootstrap_payload).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"Bearer {service_token}",
                "X-EngagePilot-Connection-ID": connection_id,
            },
            method="POST",
        )

        try:
            with urlopen(outbound_request, timeout=10) as response:
                raw_body = response.read().decode("utf-8")
                bootstrap_response = json.loads(raw_body)

        except HTTPError as exc:
            detail = (
                "EngagePilot rejected the verified customer session bootstrap."
            )

            try:
                error_payload = json.loads(
                    exc.read().decode("utf-8")
                )
                remote_detail = error_payload.get("detail")
                if isinstance(remote_detail, str) and remote_detail.strip():
                    detail = remote_detail.strip()
            except (ValueError, TypeError, UnicodeDecodeError):
                pass

            mapped_status = (
                status.HTTP_503_SERVICE_UNAVAILABLE
                if exc.code >= 500
                else status.HTTP_502_BAD_GATEWAY
            )

            response_payload = {"detail": detail}
            if settings.DEBUG:
                response_payload["upstream_status"] = exc.code
                response_payload["upstream"] = "engagepilot-agent-service"

            return Response(
                response_payload,
                status=mapped_status,
            )

        except (URLError, TimeoutError, OSError):
            return Response(
                {
                    "detail": (
                        "EngagePilot Agent Service could not be reached by "
                        "the store identity bridge."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except (ValueError, TypeError, UnicodeDecodeError):
            return Response(
                {
                    "detail": (
                        "EngagePilot returned an invalid customer session "
                        "bootstrap response."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        conversation = bootstrap_response.get("conversation")
        customer_token = bootstrap_response.get("customer_token")
        expires_at = bootstrap_response.get("expires_at")

        if (
            not isinstance(conversation, dict)
            or not isinstance(conversation.get("id"), str)
            or not isinstance(customer_token, str)
            or not customer_token.strip()
        ):
            return Response(
                {
                    "detail": (
                        "EngagePilot returned an incomplete verified "
                        "customer session."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        conversation_id = conversation["id"]

        return Response(
            {
                "identity_mode": "verified",
                "connection_id": connection_id,
                "conversation_id": conversation_id,
                "session_id": conversation_id,
                "customer_session_token": customer_token,
                "session_token": customer_token,
                "expires_at": expires_at,
                "customer": {
                    "id": f"customer:{user.pk}",
                    "name": display_name or None,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )
