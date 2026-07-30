from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)

from apps.account_security import (
    login_views,
    token_views,
)
from apps.account_security import (
    views as account_security_views,
)
from apps.account_security.login_serializers import (
    SecureLoginSerializer,
)
from apps.account_security.serializers import (
    PasswordChangeSerializer,
)
from apps.account_security.token_serializers import (
    SecureLogoutSerializer,
    SecureTokenRefreshSerializer,
)
from apps.audit_logs import (
    business_views as business_audit_views,
)
from apps.audit_logs import (
    views as audit_log_views,
)
from apps.carts import views as cart_views

from .schema_serializers import (
    AccountSecurityStatusResponseSerializer,
    AuthenticationResponseSerializer,
    CartItemCreateSchemaSerializer,
    CartItemUpdateSchemaSerializer,
    EmailVerificationConfirmRequestSerializer,
    EmptyRequestSerializer,
    ForgotPasswordRequestSerializer,
    GenericObjectSerializer,
    LogoutAllDevicesResponseSerializer,
    MessageResponseSerializer,
    PasswordResetConfirmRequestSerializer,
)


def annotate_view(
    *,
    module,
    class_name,
    serializer_class,
    operations,
):
    view_class = getattr(
        module,
        class_name,
    )

    view_class.serializer_class = (
        serializer_class
    )

    available_operations = {
        method_name: schema
        for method_name, schema
        in operations.items()
        if hasattr(
            view_class,
            method_name,
        )
    }

    if available_operations:
        view_class = extend_schema_view(
            **available_operations
        )(
            view_class
        )

    setattr(
        module,
        class_name,
        view_class,
    )


annotate_view(
    module=login_views,
    class_name="SecureLoginView",
    serializer_class=SecureLoginSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Secure user login",
            description=(
                "Authenticate a user using a username "
                "or email address and return JWT tokens."
            ),
            request=SecureLoginSerializer,
            responses={
                200: AuthenticationResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=login_views,
    class_name="LoginSecuritySummaryView",
    serializer_class=GenericObjectSerializer,
    operations={
        "get": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Get login security summary",
            description=(
                "Return successful, failed and blocked "
                "login attempt statistics."
            ),
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),
    },
)


annotate_view(
    module=token_views,
    class_name="SecureTokenRefreshView",
    serializer_class=(
        SecureTokenRefreshSerializer
    ),
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Refresh authentication tokens",
            description=(
                "Rotate the refresh token and generate "
                "new access and refresh tokens."
            ),
            request=(
                SecureTokenRefreshSerializer
            ),
            responses={
                200: AuthenticationResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=token_views,
    class_name="SecureLogoutView",
    serializer_class=SecureLogoutSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Sign out current session",
            description=(
                "Blacklist the supplied refresh token."
            ),
            request=SecureLogoutSerializer,
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=token_views,
    class_name="LogoutAllDevicesView",
    serializer_class=EmptyRequestSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Sign out all devices",
            description=(
                "Revoke all active refresh tokens "
                "belonging to the authenticated user."
            ),
            request=EmptyRequestSerializer,
            responses={
                200: (
                    LogoutAllDevicesResponseSerializer
                ),
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="AccountSecurityStatusView",
    serializer_class=(
        AccountSecurityStatusResponseSerializer
    ),
    operations={
        "get": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Get account security status",
            responses={
                200: (
                    AccountSecurityStatusResponseSerializer
                ),
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="SendEmailVerificationView",
    serializer_class=EmptyRequestSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Send email verification link",
            request=None,
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="ConfirmEmailVerificationView",
    serializer_class=(
        EmailVerificationConfirmRequestSerializer
    ),
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Confirm email verification",
            request=(
                EmailVerificationConfirmRequestSerializer
            ),
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="ForgotPasswordView",
    serializer_class=(
        ForgotPasswordRequestSerializer
    ),
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Request password reset email",
            request=(
                ForgotPasswordRequestSerializer
            ),
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="PasswordResetConfirmView",
    serializer_class=(
        PasswordResetConfirmRequestSerializer
    ),
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Reset account password",
            request=(
                PasswordResetConfirmRequestSerializer
            ),
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=account_security_views,
    class_name="PasswordChangeView",
    serializer_class=PasswordChangeSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Account Security",
            ],
            summary="Change account password",
            description=(
                "Change the authenticated user's "
                "password and revoke active sessions."
            ),
            request=PasswordChangeSerializer,
            responses={
                200: MessageResponseSerializer,
            },
        ),
    },
)


annotate_view(
    module=audit_log_views,
    class_name="AuditLogSummaryView",
    serializer_class=GenericObjectSerializer,
    operations={
        "get": extend_schema(
            tags=[
                "Audit Logs",
            ],
            summary="Get API audit summary",
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),
    },
)


annotate_view(
    module=business_audit_views,
    class_name="BusinessAuditSummaryView",
    serializer_class=GenericObjectSerializer,
    operations={
        "get": extend_schema(
            tags=[
                "Audit Logs",
            ],
            summary="Get business audit summary",
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),
    },
)


annotate_view(
    module=cart_views,
    class_name="CartDetailView",
    serializer_class=GenericObjectSerializer,
    operations={
        "get": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Get shopping cart",
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),
    },
)


annotate_view(
    module=cart_views,
    class_name="CartItemCreateView",
    serializer_class=(
        CartItemCreateSchemaSerializer
    ),
    operations={
        "post": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Add item to cart",
            request=(
                CartItemCreateSchemaSerializer
            ),
            responses={
                201: OpenApiTypes.OBJECT,
            },
        ),
    },
)


annotate_view(
    module=cart_views,
    class_name="CartItemDetailView",
    serializer_class=(
        CartItemUpdateSchemaSerializer
    ),
    operations={
        "put": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Replace cart item quantity",
            request=(
                CartItemUpdateSchemaSerializer
            ),
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),

        "patch": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Update cart item quantity",
            request=(
                CartItemUpdateSchemaSerializer
            ),
            responses={
                200: OpenApiTypes.OBJECT,
            },
        ),

        "delete": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Remove item from cart",
            responses={
                200: MessageResponseSerializer,
                204: None,
            },
        ),
    },
)


annotate_view(
    module=cart_views,
    class_name="ClearCartView",
    serializer_class=EmptyRequestSerializer,
    operations={
        "post": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Clear shopping cart",
            request=EmptyRequestSerializer,
            responses={
                200: MessageResponseSerializer,
                204: None,
            },
        ),

        "delete": extend_schema(
            tags=[
                "Cart",
            ],
            summary="Clear shopping cart",
            responses={
                200: MessageResponseSerializer,
                204: None,
            },
        ),
    },
)