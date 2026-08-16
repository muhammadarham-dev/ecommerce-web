# Django Store → EngagePilot Verified Customer Widget Bridge

## Why this exists

The public EngagePilot widget can safely create guest sessions for product search, stock checks and public knowledge. Cart, orders and checkout require a real store customer identity.

The browser must **not** receive the EngagePilot connector API token. This bridge validates the normal Django customer JWT, then calls the Agent Service customer-session bootstrap server-to-server using the private connector token.

## Files

Copy these files into the Django ecommerce backend:

- `apps/engagepilot_integration/widget_views.py` (new)
- `apps/engagepilot_integration/urls.py` (updated complete file)

## Django `.env`

Keep the existing `ENGAGEPILOT_API_TOKEN` and add:

```env
ENGAGEPILOT_AGENT_SERVICE_URL=http://127.0.0.1:8001
ENGAGEPILOT_CONNECTION_ID=0e526f90-dace-4320-aa05-66b35571bdd7
```

`ENGAGEPILOT_API_TOKEN` must match the `api_token` (or `customer_bootstrap_token`) stored for this connected system in EngagePilot.

## New store endpoint

```text
POST /api/integrations/engagepilot/widget/customer-session/
Authorization: Bearer <normal ecommerce customer access JWT>
```

The response contains a short-lived EngagePilot customer session token, not the private connector token.

## Standalone widget embed

```html
<script
  src="http://127.0.0.1:8010/engagepilot-widget.js"
  data-engagepilot
  data-connection-id="0e526f90-dace-4320-aa05-66b35571bdd7"
  data-bridge-url="http://127.0.0.1:8001/api/v1/widget"
  data-identity-bridge-url="http://127.0.0.1:8000/api/integrations/engagepilot/widget/customer-session/"
  data-auth-token-storage-key="access_token"
  data-exclude-paths="/login,/register,/forgot-password,/reset-password,/verify-email,/admin"
  data-position="bottom-right"
  data-demo="false"
></script>
```

## Expected behavior

### Logged out
- Widget hidden on login/register/reset/admin routes.
- Product search and inventory check work as guest.
- Cart/orders/checkout stay blocked.

### Logged in as CUSTOMER
- Widget calls the Django identity bridge with the ecommerce JWT.
- Django validates the user and bootstraps `customer:<pk>` with Agent Service.
- Widget swaps to `identity_mode=verified`.
- Customer capabilities are available according to EngagePilot connection policies.

### Admin / staff account
- Identity bridge returns 403; customer-specific capabilities are not unlocked.
- `/admin` routes are hidden by default.

## Compile check

```powershell
python -m py_compile `
  apps\engagepilot_integration\widget_views.py `
  apps\engagepilot_integration\urls.py
```

## Direct identity bridge test

Use a normal ecommerce customer JWT in `$customerAccessToken`:

```powershell
$headers = @{
  Authorization = "Bearer $customerAccessToken"
}

$session = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/integrations/engagepilot/widget/customer-session/" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"preferred_language":"auto"}'

$session.identity_mode
$session.session_id
```

Expected:

```text
verified
<conversation uuid>
```

Do not print/share `customer_session_token`.


## v0.3.2 route compatibility

The customer-session identity endpoint accepts both `/widget/customer-session` and `/widget/customer-session/`. The trailing-slash form remains canonical.
