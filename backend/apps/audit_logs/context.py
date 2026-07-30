from contextvars import ContextVar


_business_audit_context = ContextVar(
    "business_audit_context",
    default=None,
)


def set_business_audit_context(
    *,
    user=None,
    request_id=None,
    method="",
    path="",
    ip_address=None,
):
    return _business_audit_context.set(
        {
            "user": user,
            "request_id": request_id,
            "method": method,
            "path": path,
            "ip_address": ip_address,
        }
    )


def get_business_audit_context():
    context = _business_audit_context.get()

    if context is None:
        return {}

    return context.copy()


def reset_business_audit_context(token):
    _business_audit_context.reset(token)