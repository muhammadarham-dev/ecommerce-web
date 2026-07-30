# Project Routes

## Backend API Base Routes

| Module | Base route |
|---|---|
| Authentication and profile | `/api/auth/` |
| Account security | `/api/account-security/` |
| Catalog, categories, products, images | `/api/catalog/` |
| Variants and attributes | `/api/variants/` |
| Inventory | `/api/inventory/` |
| Cart | `/api/cart/` |
| Orders and addresses | `/api/orders/` |
| Payments | `/api/payments/` |
| Returns | `/api/returns/` |
| Reviews | `/api/reviews/` |
| Wishlists | `/api/wishlist/` |
| Support tickets | `/api/tickets/` |
| Notifications | `/api/notifications/` |
| Email notifications | `/api/email-notifications/` |
| Coupons | `/api/coupons/` |
| Shipments | `/api/shipments/` |
| Shipping rates | `/api/shipping-rates/` |
| Banners | `/api/banners/` |
| Recently viewed | `/api/recently-viewed/` |
| Reports | `/api/reports/` |
| Store settings | `/api/store-settings/` |
| Audit logs | `/api/audit-logs/` |
| Health checks | `/api/health/` |
| OpenAPI schema | `/api/schema/` |
| Swagger UI | `/api/docs/` |
| ReDoc | `/api/redoc/` |

API documentation routes are controlled by `ENABLE_API_DOCS`. Health routes are always registered.

## Product and Image API Routes

| Method | Route | Purpose |
|---|---|---|
| GET, POST | `/api/catalog/products/` | List or create products |
| GET, PATCH, DELETE | `/api/catalog/products/{product_slug}/` | Retrieve, update, or delete a product |
| POST | `/api/catalog/products/{product_slug}/images/` | Upload an image to the selected product |
| PATCH | `/api/catalog/products/{product_slug}/images/{image_id}/primary/` | Set an image as primary |
| DELETE | `/api/catalog/products/{product_slug}/images/{image_id}/` | Delete an image from the selected product |
| GET, POST | `/api/catalog/categories/` | List or create categories |
| GET, PATCH, DELETE | `/api/catalog/categories/{category_slug}/` | Retrieve, update, or delete a category |

## Customer Frontend Routes

| Page | Route |
|---|---|
| Home | `/` |
| Product catalog | `/products` |
| Product details | `/products/:productId` |
| Store information | `/store-information` |
| Login | `/login` |
| Registration | `/register` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password` |
| Verify email | `/verify-email` |
| Account | `/account` |
| Security | `/security` |
| Change password | `/change-password` |
| Email preferences | `/email-preferences` |
| Available coupons | `/coupons` |
| Cart | `/cart` |
| Wishlist | `/wishlist` |
| Recently viewed | `/recently-viewed` |
| Checkout | `/checkout` |
| Orders | `/orders` |
| Order details | `/orders/:orderNumber` |
| Order success | `/order-success/:orderNumber` |
| Bank transfer | `/payments/:orderNumber` |
| Reviews | `/reviews` |
| Write review | `/reviews/write/:orderNumber/:productId` |
| Returns | `/returns` |
| Create return | `/returns/create/:orderNumber` |
| Return details | `/returns/:returnNumber` |
| Tickets | `/tickets` |
| Create ticket | `/tickets/create` |
| Ticket details | `/tickets/:ticketNumber` |
| Notifications | `/notifications` |
| Shipments | `/shipments` |
| Shipment details | `/shipments/:shipmentNumber` |

## Administration Frontend Routes

| Page | Route |
|---|---|
| Dashboard | `/admin/dashboard` |
| Products | `/admin/products` |
| Create product | `/admin/products/create` |
| Edit product and images | `/admin/products/:productSlug/edit` |
| Categories | `/admin/categories` |
| Create category | `/admin/categories/create` |
| Edit category | `/admin/categories/:categorySlug/edit` |
| Variants | `/admin/variants` |
| Create variant | `/admin/variants/create` |
| Edit variant | `/admin/variants/:variantSku/edit` |
| Inventory | `/admin/inventory` |
| Stock history | `/admin/inventory/history` |
| Orders | `/admin/orders` |
| Order details | `/admin/orders/:orderNumber` |
| Returns | `/admin/returns` |
| Return details | `/admin/returns/:returnNumber` |
| Support tickets | `/admin/tickets` |
| Ticket details | `/admin/tickets/:ticketNumber` |
| Shipments | `/admin/shipments` |
| Shipment details | `/admin/shipments/:shipmentNumber` |
| Coupons | `/admin/coupons` |
| Create coupon | `/admin/coupons/create` |
| Edit coupon | `/admin/coupons/:couponCode/edit` |
| Reviews | `/admin/reviews` |
| Review details | `/admin/reviews/:reviewId` |
| Banners | `/admin/banners` |
| Create banner | `/admin/banners/create` |
| Edit banner | `/admin/banners/:bannerId/edit` |
| Shipping rates | `/admin/shipping-rates` |
| Create shipping rate | `/admin/shipping-rates/create` |
| Edit shipping rate | `/admin/shipping-rates/:shippingRateId/edit` |
| Store settings | `/admin/store-settings` |
