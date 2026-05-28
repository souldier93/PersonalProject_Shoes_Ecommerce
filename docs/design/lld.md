# Low-Level Design

## 1. Backend Module Design

The backend is a NestJS modular monolith. Each domain exposes a controller, a service, and one or more Mongoose schemas.

| Module | Controller | Service | Schemas / Models | Responsibility |
| --- | --- | --- | --- | --- |
| Auth | `AuthController` | `UsersService`, `EmailService` | `User`, `Role` | Registration, login, JWT payload validation, roles, profile, addresses |
| Shoes | `ShoesController` | `ShoesService` | `Shoe`, `ShoeDetail`, `Category`, `Counter`, `Bill` | Listing, filtering, product detail, CRUD, stock checks, dashboard stats |
| Payment | `PaymentController` | `PaymentService`, `OrderEmailService` | `Bill`, `ShoeDetail` | PayOS payment link, Stripe intent, webhooks, stock settlement, order lookup, fulfillment |
| Coupons | `CouponsController` | `CouponsService` | `Coupon` | Coupon CRUD, validation, usage increments |
| Inventory | `InventoryController` | `InventoryService` | `ShoeDetail`, `StockMovement` | Stock overview and manual adjustment audit trail |
| Reviews | `ReviewsController` | `ReviewsService` | `Review`, `Bill`, `ShoeDetail` | Verified-purchase reviews and product rating recalculation |
| Returns | `ReturnsController` | `ReturnsService` | `ReturnRequest`, `Bill` | Return/refund/exchange requests and admin status transitions |
| Wishlist | `WishlistController` | `WishlistService` | `WishlistItem`, `ShoeDetail` | Per-user wishlist and product enrichment |
| Chat | `ChatController` | `ChatService` | `ChatConversation`, `ShoeDetail` | Customer/manager messages and simple product-question bot replies |
| Analytics | `AnalyticsController` | `AnalyticsService` | `Bill`, `ShoeDetail` | Revenue, order, and catalog metrics |
| R2 | `R2Controller` | `R2Service` | External R2 bucket | Folder/media listing and generated public URLs |
| Redis | none | `RedisCacheService` | External Redis | JSON cache wrapper, TTL handling, and pattern invalidation for product catalog reads |

## 2. Auth Module

### Main Classes

| Class | Key Functions |
| --- | --- |
| `UsersService` | `onModuleInit`, `seedRoles`, `createUser`, `login`, `validateUser`, `findAll`, `findById`, `updateUserRole`, `updateProfile`, `changePassword`, address CRUD |
| `JwtStrategy` | Extract bearer token, validate `sub` user id, attach user to request |
| `RolesGuard` | Reads `@Roles()` metadata and checks `request.user.roleId.name` |
| `EmailService` | Sends verification email when email verification is enabled |

### Login Algorithm

```text
Input: username, password
1. Find active user by username and populate role.
2. Compare password using bcrypt.
3. If verification is required, reject unverified users.
4. Sign JWT with subject = user id and role metadata.
5. Return access token and user profile summary.
```

### Registration Algorithm

```text
Input: username, password, email, roleName, optional age
1. Validate DTO using class-validator and global ValidationPipe.
2. Reject duplicate username or email.
3. Resolve role by roleName.
4. Hash password.
5. If email verification is required, generate token and expiry.
6. Save user.
7. Optionally send verification email.
8. Return user summary and login token depending on service behavior.
```

## 3. Shoes Module

### Product Listing Model

`shoes` is optimized for listing cards:

```text
productId, name, category, productType, collection, price, color, thumbnail
```

`shoesDetail` is optimized for detail pages and stock:

```text
productId, name, category, productType, collection, price, colors[]
colors[].sizes[] holds stock by size.
```

### Filtering Function

`findWithFilters(query)` supports frontend listing behavior:

| Query | Behavior |
| --- | --- |
| `category` | Filter by category |
| `color` | Filter products that have matching color metadata |
| `price` / price range | Filter by price |
| `sort` | Supports ranking such as rating or price |

### Stock Check

```text
checkStock(productId, colorName, size)
1. Load shoesDetail by productId.
2. Find matching color.
3. Find matching size.
4. Return available stock and availability flag.
```

`checkStockBatch(items)` applies the same logic to all cart items before checkout.

### Catalog Cache

`ShoesService` caches read-heavy catalog responses through `RedisCacheService`.

| Function | Cache Key Family | Behavior |
| --- | --- | --- |
| `findAll` | `shoes:all:*` | Cache listing-card results |
| `findWithFilters` | `shoes:filters:*` | Cache normalized filter/sort queries |
| `findByProductId` | `shoes:product:*` | Cache listing variants for one product id |
| `findDetailByProductId` | `shoes:detail:*` | Cache full product detail |
| `findAllDetails` | `shoes:details:all` | Cache all detail documents |
| `findDetailsByCategory` | `shoes:details:category:*` | Cache category-specific detail documents |

Cache TTL is controlled by `REDIS_PRODUCTS_TTL_SECONDS` and defaults to 300 seconds. Product create/update/delete/soft-delete calls invalidate `shoes:*`. Inventory adjustments and payment stock mutations also invalidate `shoes:*` so storefront reads do not keep stale stock.

## 4. Payment Module

### Order State

Payment status:

```text
PENDING -> PAID
PENDING -> FAILED
PENDING/PAID -> CANCELLED
PAID -> REFUND_PENDING -> REFUNDED
```

Fulfillment status:

```text
AWAITING_PAYMENT -> CONFIRMED -> PACKING -> SHIPPING -> DELIVERED
CONFIRMED/PACKING -> CANCELLED
DELIVERED -> RETURN_REQUESTED -> REFUNDED
```

### PayOS Create Payment

```text
Input: CreatePaymentDto
1. Validate items and customer email/info.
2. Validate stock availability for all items.
3. Apply coupon discount if couponCode exists.
4. Create PayOS payment link.
5. Create Bill with PENDING/AWAITING_PAYMENT.
6. Send order-created email when mail is configured.
7. Return payment link and order metadata.
```

### Stripe Create/Confirm

```text
createStripePaymentIntent
1. Validate order input and stock.
2. Create Stripe PaymentIntent with amount converted for currency.
3. Create Bill with provider=stripe and stripePaymentIntentId.
4. Return client secret to frontend.

settleStripePaymentIntent
1. Load Bill by payment intent id.
2. Verify amount and currency.
3. Mark PAID and CONFIRMED if not already settled.
4. Decrease stock once.
5. Increment coupon usage if applicable.
6. Send payment-confirmed email.
```

### Webhook Handling

| Provider | Endpoint | Verification |
| --- | --- | --- |
| PayOS | `POST /payments/webhook` | HMAC SHA-256 over sorted payload data using `PAYOS_CHECKSUM_KEY` |
| Stripe | `POST /payments/stripe/webhook` | Stripe raw body plus `stripe-signature` header |

## 5. Supporting Modules

| Module | Low-Level Behavior |
| --- | --- |
| Coupons | Reject inactive, expired, usage-exceeded, below-minimum coupons; calculate percent/fixed discount with optional max cap |
| Inventory | Locate nested color/size stock, update to requested stock, insert `StockMovement` with before/after stock, invalidate product cache |
| Reviews | Require matching paid order item before creating review; unique index prevents duplicate review per product/order/user/color/size |
| Returns | Require paid/delivered order context; create request with status `REQUESTED`; admin transitions status |
| Wishlist | Unique item by user/product/color/size; enrich list with product detail for display |
| Chat | Create or reuse conversation by user/guest identity; append messages; update unread counters; simple bot can answer product queries |
| Analytics | Aggregate bills and products into revenue/order/catalog summary |
| R2 | List folders/subfolders/media using S3-compatible `ListObjectsV2Command`; generate public URLs from naming convention |
| Redis | Connect with `REDIS_URL`; skip cache work when disabled/unavailable; store JSON values with TTL; delete key patterns for catalog invalidation |

## 6. Frontend Module Design

| Area | Files | Responsibility |
| --- | --- | --- |
| Routing | `src/router/index.js` | Public, member, and admin routes; local role guard |
| API base | `src/utils/apiBase.js`, `src/utils/axios.js` | API base URL and bearer token interceptor |
| Cart | `src/utils/bagStorage.js`, `bagHelper.js`, `bagSync.js` | Local cart persistence and server stock refresh |
| Wishlist | `src/utils/wishlist.js`, `components/header/Wishlist.vue` | Wishlist events and UI |
| Catalog | `components/home`, `components/shoesDetail` | Listing, filters, product detail, stock, reviews |
| Checkout | `components/header/bag` | Guest checkout, payment creation, Stripe confirm, PayOS polling |
| Admin | `src/views/admin` | Products, orders, inventory, coupons, users, chat, analytics |

## 7. Error Handling and Validation

| Layer | Design |
| --- | --- |
| Controller input | `ValidationPipe` validates decorated DTOs; routes using `any` should be converted to DTOs |
| Domain errors | Services throw Nest exceptions such as `BadRequestException`, `NotFoundException`, `ConflictException`, `UnauthorizedException` |
| Frontend API errors | Axios interceptor clears auth on 401; components display local messages |
| Provider errors | Payment services catch provider failures and return provider-specific status or throw bad request |

## 8. Recommended LLD Improvements

1. Add DTO classes for product, coupon, inventory, return, review, wishlist, and chat request bodies.
2. Add ownership guards for profile/address/password APIs.
3. Wrap stock mutation and bill settlement in an idempotent settlement function with a provider event id.
4. Generate OpenAPI from decorators and add examples for every endpoint.
5. Move role/permission names into constants to avoid string drift between backend and frontend.
