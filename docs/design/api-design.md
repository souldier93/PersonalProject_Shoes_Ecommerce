# API Design Doc

## 1. Base URLs

| Environment | Base URL |
| --- | --- |
| Local backend | `http://localhost:3000` |
| Local frontend build with gateway | `/api` |
| Docker frontend | `http://localhost:8080` |
| Microservice gateway | `http://localhost:8081/api` |

Current backend routes are not prefixed with `/api` inside NestJS. The optional Nginx gateway maps `/api/<module>` to the monolith.

## 2. Resource Naming

Current route names mostly use plural resources:

| Resource | Base Path |
| --- | --- |
| Auth/users/roles | `/auth` |
| Products | `/shoes` |
| Payments/orders | `/payments` |
| Coupons | `/coupons` |
| Inventory | `/inventory` |
| Reviews | `/reviews` |
| Returns | `/returns` |
| Wishlist | `/wishlist` |
| Chat | `/chat` |
| Analytics | `/analytics` |
| R2 media | `/r2` |

Recommended future standard:

```text
/api/v1/products instead of /shoes
/api/v1/orders instead of /payments/orders
/api/v1/auth/login can remain action-style because login is not CRUD
```

## 3. Authentication

JWT bearer tokens are returned by login/register and sent as:

```http
Authorization: Bearer <accessToken>
```

Protected routes currently include:

| Route | Requirement |
| --- | --- |
| `GET /auth/profile` | Authenticated user |
| `GET /auth/users` | Admin role |
| `GET /auth/users/:id` | Admin role |
| `PATCH /auth/users/:id/role` | Admin role |
| `GET /auth/roles/all` | Admin role |
| `POST /auth/roles` | Admin role |

Recommended: protect profile/address/password update routes with owner-or-admin authorization.

## 4. Request and Response Format

The current API returns plain objects/arrays from Nest services. For new endpoints, use a consistent envelope:

```json
{
  "data": {
    "id": "..."
  }
}
```

Collection response:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "perPage": 20
  }
}
```

Error response:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "email must be an email" }
    ]
  }
}
```

## 5. Status Codes

| Scenario | Status |
| --- | --- |
| Read/update success | `200 OK` |
| Create success | `201 Created` |
| Delete success | `200 OK` today, recommend `204 No Content` |
| Validation failure | `400 Bad Request` or `422 Unprocessable Entity` |
| Missing/invalid token | `401 Unauthorized` |
| Authenticated but not allowed | `403 Forbidden` |
| Missing resource | `404 Not Found` |
| Duplicate username/email/coupon | `409 Conflict` |
| Provider or server error | `500 Internal Server Error` with generic client message |

## 6. Pagination, Filtering, Sorting

Current product listing accepts query parameters from the frontend. Recommended shape:

```http
GET /shoes?category=men&color=black&priceMin=1000000&priceMax=5000000&sort=-createdAt&page=1&perPage=24
```

Admin order listing should add:

```http
GET /payments/orders?status=PAID&fulfillmentStatus=SHIPPING&page=1&perPage=50
```

## 7. Endpoint Summary

Full details are in [API Reference](../api-reference.md).

| Module | Public Read | Public Write | Admin/Protected |
| --- | --- | --- | --- |
| Auth | `GET /auth/verify-email`, `GET /auth/users/:id/profile` | `POST /auth/login`, `POST /auth/register`, `POST /auth/resend-verification` | user/role management |
| Shoes | product list/detail/stock | product create/update/soft-delete currently unguarded | should be admin-protected |
| Payments | order status, guest lookup | create payment, webhooks, cancel/refund | order list and fulfillment should be admin-protected |
| Coupons | validate | create/update currently unguarded | should be admin-protected |
| Inventory | overview | adjust currently unguarded | should be admin-protected |
| Reviews | product reviews | create review | hide/unhide review should be admin-protected |
| Returns | list/user list currently public | create request | status update should be admin-protected |
| Wishlist | user wishlist | add/remove | owner-protected recommended |
| Chat | conversation APIs | customer/manager messages | manager queue should be protected |
| R2 | media browse | none | should be admin-protected |

## 8. Webhook Design

| Webhook | Endpoint | Required Security |
| --- | --- | --- |
| PayOS | `POST /payments/webhook` | Verify HMAC signature with `PAYOS_CHECKSUM_KEY`, use timing-safe comparison |
| Stripe | `POST /payments/stripe/webhook` | Verify raw body and `stripe-signature` with `STRIPE_WEBHOOK_SECRET` |

Webhook handlers must be idempotent: a repeated paid event should not decrease stock twice.

## 9. Rate Limits

Recommended production limits:

| Route Group | Limit |
| --- | --- |
| `POST /auth/login` | 5 attempts/min/IP |
| `POST /auth/register` | 10 attempts/hour/IP |
| Product reads | 120 requests/min/IP |
| Checkout/payment create | 10 requests/min/user or IP |
| Webhooks | Provider IP allowlist where possible plus signature verification |
| Admin write APIs | 60 requests/min/user |

## 10. Versioning

Current routes are unversioned. Recommended next step:

1. Add global prefix `/api/v1`.
2. Keep gateway compatibility for `/api/<module>` during migration.
3. Treat field additions as non-breaking.
4. Use `/api/v2` only for breaking changes such as renamed resources or changed auth semantics.
