# Integration Doc

## 1. PayOS

| Item | Value |
| --- | --- |
| Purpose | Vietnam bank transfer/QR checkout |
| Create payment endpoint | `POST /payments` |
| Webhook endpoint | `POST /payments/webhook` |
| Required env vars | `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL` |
| Data stored | `paymentLinkId`, provider transaction payload, bill status |

### Flow

1. Frontend submits order payload to `POST /payments`.
2. Backend validates stock and customer information.
3. Backend creates PayOS payment link.
4. Backend stores `Bill` as `PENDING`.
5. PayOS calls webhook after payment result.
6. Backend verifies HMAC signature and settles order.

### Failure Handling

| Failure | Handling |
| --- | --- |
| Missing PayOS credentials | Payment creation fails |
| Invalid webhook signature | `401 Unauthorized` |
| Duplicate paid webhook | Should return success without duplicate stock mutation |
| Stock unavailable before payment creation | Reject order creation |

## 2. Stripe

| Item | Value |
| --- | --- |
| Purpose | Card/international payment |
| Create intent endpoint | `POST /payments/stripe/create-intent` |
| Client confirm endpoint | `POST /payments/stripe/confirm` |
| Webhook endpoint | `POST /payments/stripe/webhook` |
| Required backend env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY` |
| Required frontend env var | `VITE_STRIPE_PUBLISHABLE_KEY` |

### Flow

1. Frontend requests PaymentIntent.
2. Backend validates stock, computes amount, creates Stripe PaymentIntent.
3. Backend stores a `Bill` with `paymentProvider=stripe`.
4. Frontend confirms payment with Stripe.js.
5. Backend settles via explicit confirm endpoint or Stripe webhook.
6. Backend verifies amount/currency before marking the order paid.

### Refund

`cancelAndRefundOrder` can create a Stripe refund when the order has a Stripe payment intent. Non-Stripe refunds require manual transfer handling.

## 3. Cloudflare R2

| Item | Value |
| --- | --- |
| Purpose | Product media storage |
| Backend module | `R2Module` |
| SDK | AWS SDK S3-compatible client |
| Required env vars | `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |

### Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /r2/folders` | List top-level product folders |
| `GET /r2/subfolders?folder=...` | List subfolders |
| `GET /r2/media?folder=...&subfolder=...` | List images and videos |
| `GET /r2/images?folder=...&subfolder=...` | Backward-compatible image list |
| `GET /r2/generate-urls` | Generate predictable public URLs |

### Naming Guidance

Keep object keys predictable by product slug, style code, and color name. Avoid changing public URL patterns without migrating product documents.

## 4. Gmail SMTP

| Item | Value |
| --- | --- |
| Purpose | Verification and order emails |
| Library | Nodemailer |
| Required env vars | `EMAIL_USER`, `EMAIL_PASSWORD` |
| Optional env vars | `ORDER_NOTIFICATION_EMAIL`, `EMAIL_VERIFICATION_REQUIRED`, `FRONTEND_URL`, `BACKEND_URL` |

### Email Types

| Email | Service |
| --- | --- |
| Account verification | `EmailService` |
| Order created | `OrderEmailService` |
| Payment confirmed | `OrderEmailService` |
| Cancellation/refund update | `OrderEmailService` |

If Gmail credentials are missing, order emails are skipped with a warning.

## 5. MongoDB

| Item | Value |
| --- | --- |
| Purpose | Primary application database |
| Local Docker image | `mongo:7` |
| Env vars | `MONGO_URI`, `MONGO_DB_NAME` |
| ODM | Mongoose |

### Connection

NestJS uses `MongooseModule.forRootAsync` with `ConfigService`. Default fallback:

```text
mongodb://localhost:27017/nike-store
```

## 6. Redis Cache

| Item | Value |
| --- | --- |
| Purpose | Product catalog response cache |
| Backend module | `RedisModule`, `RedisCacheService` |
| Client | `ioredis` |
| Env vars | `REDIS_ENABLED`, `REDIS_URL`, `REDIS_PRODUCTS_TTL_SECONDS` |
| Key namespace | `shoes:*` |
| Default TTL | `300` seconds |

### Cache Behavior

1. `ShoesService` checks Redis before MongoDB for listing/filter/detail reads.
2. Cache misses read MongoDB and store the derived response with the configured TTL.
3. Product create/update/delete/soft-delete calls invalidate `shoes:*`.
4. Inventory adjustments and payment stock decrease/restore calls also invalidate `shoes:*`.
5. If Redis is disabled or unavailable, the backend logs a warning and continues through MongoDB.

## 7. Nginx Gateway

The gateway is used by `docker-compose.microservices.yml`.

| Path | Upstream |
| --- | --- |
| `/` | frontend |
| `/api/auth/` | backend `/auth/` |
| `/api/shoes/` | backend `/shoes/` |
| `/api/inventory/` | backend `/inventory/` |
| `/api/payments/` | backend `/payments/` |
| `/api/coupons/` | backend `/coupons/` |
| `/api/chat/` | backend `/chat/` |
| `/api/reviews/` | backend `/reviews/` |
| `/api/returns/` | backend `/returns/` |

## 8. Integration Test Checklist

1. `GET /health` returns `status=ok`.
2. R2 folder listing succeeds with production credentials.
3. PayOS sandbox payment creates a payment link.
4. PayOS webhook with invalid signature is rejected.
5. Stripe test card creates and settles a PaymentIntent.
6. Stripe webhook with invalid signature is rejected.
7. Gmail order-created email sends when credentials exist.
8. Mongo connection failure fails fast at backend startup.
9. Redis cache hit returns the same catalog response and product/inventory/payment writes invalidate `shoes:*`.
10. Redis outage does not break catalog APIs; responses fall back to MongoDB.
