# Security Design

## 1. Security Goals

1. Protect customer identity, addresses, order history, and payment metadata.
2. Prevent unauthorized admin operations on products, orders, inventory, users, coupons, reviews, and R2 media.
3. Verify all payment webhooks before mutating order or stock state.
4. Keep secrets out of source control and logs.
5. Validate user input before persistence or provider calls.

## 2. Authentication

Current design:

| Item | Implementation |
| --- | --- |
| Login | `POST /auth/login` |
| Token | JWT bearer token signed with `JWT_SECRET` |
| Expiry | 24 hours |
| Strategy | `passport-jwt` extracts token from `Authorization` header |
| Password hashing | bcrypt |
| Frontend storage | `localStorage` stores `accessToken` and `user` |

Production recommendation: replace localStorage token storage with httpOnly, secure, sameSite cookies to reduce XSS token theft risk.

## 3. Authorization

Current backend guards:

| Route Group | Guard |
| --- | --- |
| `GET /auth/profile` | `JwtAuthGuard` |
| Admin user/role APIs | `JwtAuthGuard`, `RolesGuard`, `@Roles('admin')` |

Frontend admin route guard allows `admin` and `manager`.

Required hardening:

1. Add backend guards to all admin product, inventory, order, coupon, review moderation, return moderation, R2 media, analytics, and chat manager routes.
2. Add owner-or-admin checks for:
   - `GET /auth/users/:id/profile`
   - `PATCH /auth/users/:id/profile`
   - `PATCH /auth/users/:id/password`
   - address CRUD
   - wishlist by user id
   - member order history
3. Keep frontend route guards as UX only, not as security boundary.

## 4. Input Validation

Current design:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

DTO validation currently exists for auth login/register/roles. Several routes still accept `any`; they should get DTOs:

| Area | DTO Needed |
| --- | --- |
| Product create/update | `CreateProductDto`, `UpdateProductDto`, nested color/size DTOs |
| Payment create | Class-based `CreatePaymentDto` with nested item/customer validators |
| Coupon create/update | `CreateCouponDto`, `UpdateCouponDto` |
| Inventory adjust | `AdjustStockDto` |
| Review create/update | `CreateReviewDto`, `UpdateReviewStatusDto` |
| Return request | `CreateReturnRequestDto`, `UpdateReturnStatusDto` |
| Wishlist | `AddWishlistItemDto` |
| Chat | `CreateConversationDto`, `AddMessageDto` |

## 5. Payment Security

| Provider | Protection |
| --- | --- |
| PayOS | `PaymentWebhookGuard` sorts payload data, builds query string, computes HMAC SHA-256 with `PAYOS_CHECKSUM_KEY`, and compares using `timingSafeEqual` |
| Stripe | `NestFactory.create(AppModule, { rawBody: true })` preserves raw body; service verifies `stripe-signature` using `STRIPE_WEBHOOK_SECRET` |

Settlement rules:

1. Do not trust frontend payment status.
2. Verify webhook/provider status before marking a bill paid.
3. Verify Stripe amount and currency before settlement.
4. Make settlement idempotent so duplicate webhooks cannot decrement stock twice.
5. Store provider transaction payload for audit, but avoid logging sensitive full payloads in production.

## 6. Secrets Management

Secrets must remain in env vars or cloud secret stores:

```text
JWT_SECRET
MONGO_URI
REDIS_URL
PAYOS_CLIENT_ID
PAYOS_API_KEY
PAYOS_CHECKSUM_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
R2_ACCESS_KEY
R2_SECRET_KEY
EMAIL_PASSWORD
```

Redis should be private-network only. In cloud deployments, use TLS/authenticated managed Redis where available and keep `REDIS_URL` in the same secret store as database and payment credentials.

Never commit `.env`. Use:

| Environment | Secret Store |
| --- | --- |
| Local | `.env`, ignored by git |
| GitHub Actions | GitHub repository/environment secrets |
| AWS | AWS Secrets Manager |
| Azure | Container Apps secrets |

## 7. Transport and Browser Security

Production requirements:

1. Enforce HTTPS.
2. Restrict CORS to configured frontend origin. Current `app.enableCors()` allows all origins.
3. Add security headers at Nginx or Nest layer:
   - `Content-Security-Policy`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy`
4. Avoid rendering untrusted HTML. Vue interpolation is safe by default, but any future `v-html` must sanitize input.

## 8. Data Protection

| Data | Protection |
| --- | --- |
| Passwords | bcrypt hashes only |
| JWT secret | env secret |
| Payment cards | handled by Stripe; app does not store card data |
| Payment metadata | store provider ids and status only as needed |
| Customer addresses | MongoDB; require access controls and backup encryption |
| R2 media | public URLs for product media; customer-uploaded evidence should be reviewed before public exposure |

## 9. Rate Limiting and Abuse Controls

Recommended production controls:

| Area | Control |
| --- | --- |
| Login | IP + username throttling |
| Register | IP throttling and email verification |
| Coupon validation | Per-IP and per-session throttling |
| Chat | Message rate limit per guest/user |
| Checkout | Per-user/IP limit and stock reservation strategy if needed |
| Admin APIs | Per-user limit and audit log |

## 10. Security Test Cases

1. Login rejects wrong password.
2. Login rejects inactive user.
3. Admin user APIs reject unauthenticated users.
4. Admin user APIs reject non-admin users.
5. PayOS webhook rejects invalid signature.
6. Stripe webhook rejects invalid signature.
7. Duplicate Stripe/PayOS paid webhook does not decrease stock twice.
8. Guest order lookup rejects wrong email/orderCode pair.
9. Review creation rejects non-purchased product.
10. Profile/address update rejects another user's id.

## 11. Current Security Gaps

| Gap | Severity | Recommendation |
| --- | --- | --- |
| Several admin-like APIs are unguarded | High | Add `JwtAuthGuard` + role/permission guard |
| Profile/address/password routes accept user id without guard | High | Add owner-or-admin authorization |
| JWT stored in localStorage | Medium | Move to httpOnly secure cookie |
| CORS allows all origins | Medium | Restrict by `FRONTEND_URL` |
| DTO coverage is incomplete | Medium | Add DTOs and validation for all write APIs |
| Console logs include operational payload details | Low/Medium | Redact payment/customer data in production logs |
