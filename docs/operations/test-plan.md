# Test Plan and Test Cases

## 1. Scope

This test plan covers customer storefront, account, checkout, payment, admin operations, integrations, and deployment smoke tests.

## 2. Test Levels

| Level | Tools / Location | Purpose |
| --- | --- | --- |
| Unit | Jest in `nike-store-nest-js` | Service and guard behavior |
| Integration | Nest e2e tests with Supertest | API behavior and module wiring |
| Frontend smoke | Vite build/manual browser | Routing and key UI flows |
| System smoke | `scripts/local/smoke-test.ps1` | Running stack health |
| Provider sandbox | PayOS/Stripe sandbox | Payment lifecycle |

## 3. Test Commands

Backend:

```powershell
cd nike-store-nest-js
npm test
npm run test:e2e
npm run build
```

Frontend:

```powershell
cd tailwind4-vue3-nikeStore
npm run build
```

System:

```powershell
.\scripts\local\smoke-test.ps1
```

## 4. Functional Test Cases

### Auth

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| AUTH-01 | Register user | Submit valid username/password/email/role | User is created; password is hashed |
| AUTH-02 | Duplicate username | Register same username twice | API returns conflict |
| AUTH-03 | Login success | Login with correct credentials | Returns `accessToken` and user |
| AUTH-04 | Login wrong password | Login with wrong password | Returns unauthorized |
| AUTH-05 | Admin route as user | Call admin user route with non-admin token | Returns forbidden |
| AUTH-06 | Email verification | Enable verification and register | Verification email is sent; login blocked until verified |

### Catalog

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| CAT-01 | List products | `GET /shoes` | Returns product array |
| CAT-02 | Filter by category | `GET /shoes?category=men` | Only matching category |
| CAT-03 | Product detail | `GET /shoes/detail/:id` | Returns colors and sizes |
| CAT-04 | Missing product | Unknown product id | Returns not found |
| CAT-05 | Create product | Admin submits product with colors/sizes | Product appears in `shoes` and `shoesDetail` |
| CAT-06 | Redis cache hit | Call the same catalog/detail endpoint twice | Second call can be served from Redis and returns the same payload |
| CAT-07 | Cache invalidation | Create/update product, adjust inventory, or settle/cancel paid order | Matching `shoes:*` cache entries are invalidated |
| CAT-08 | Soft delete | Call soft delete | All nested stock becomes 0 and catalog cache is invalidated |

### Checkout and Payment

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| PAY-01 | Batch stock success | Check available cart items | Returns available |
| PAY-02 | Batch stock failure | Quantity exceeds stock | Returns unavailable item |
| PAY-03 | PayOS create | Submit valid order | Bill is `PENDING`; payment URL returned |
| PAY-04 | PayOS webhook invalid signature | Send invalid signature | Returns unauthorized |
| PAY-05 | PayOS paid webhook | Send valid paid webhook | Bill becomes `PAID`, fulfillment `CONFIRMED`, stock decreases once |
| PAY-06 | Stripe create intent | Submit valid order | Client secret returned; bill created |
| PAY-07 | Stripe amount mismatch | Tamper amount before settlement | API rejects settlement |
| PAY-08 | Duplicate webhook | Replay paid event | Stock is not decremented twice |
| PAY-09 | Guest lookup success | Email + orderCode | Returns matching order |
| PAY-10 | Guest lookup wrong email | Wrong email + orderCode | Rejects lookup |

### Admin Operations

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| ADM-01 | Dashboard stats | Open admin dashboard | Product/order metrics load |
| ADM-02 | Inventory adjust | Adjust product/color/size stock | Nested stock updates; movement logged |
| ADM-03 | Fulfillment update | Move paid order to SHIPPING | Status history row added |
| ADM-04 | Coupon create | Create percent coupon | Coupon validates on checkout |
| ADM-05 | Coupon expiry | Validate expired coupon | Rejected |
| ADM-06 | Hide review | Set review status hidden | Review excluded from public list |

### Reviews, Returns, Wishlist, Chat

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| ENG-01 | Create verified review | Paid user reviews purchased item | Review saved; rating recalculated |
| ENG-02 | Duplicate review | Review same item/order twice | Duplicate rejected |
| ENG-03 | Return request | Submit return for order item | Request saved as `REQUESTED` |
| ENG-04 | Return status | Admin approves request | Status/admin note updated |
| ENG-05 | Wishlist add/remove | Add and remove item | Unique wishlist state maintained |
| ENG-06 | Chat guest conversation | Create guest chat | Conversation id returned |
| ENG-07 | Chat manager reply | Manager sends message | Unread counters update |

## 5. Non-Functional Test Cases

| ID | Area | Test | Target |
| --- | --- | --- | --- |
| NFR-01 | Performance | `GET /shoes` with seeded catalog | Under 500ms locally for normal catalog size |
| NFR-02 | Reliability | Restart backend during idle state | Service recovers and `/health` passes |
| NFR-03 | Security | Unauthenticated admin write route | Must reject after guards are added |
| NFR-04 | Security | Invalid webhook signature | Must reject |
| NFR-05 | Data integrity | Payment settlement stock mutation | Exactly-once stock decrement |
| NFR-06 | Build | Docker backend/frontend build | Images build successfully |
| NFR-07 | Browser | Mobile product listing and checkout | No blocking layout defects |
| NFR-08 | Reliability | Stop Redis and call catalog APIs | APIs still return from MongoDB, with degraded cache performance only |

## 6. Test Data

| Data | Source |
| --- | --- |
| Admin user | `npm run seed:initial-user` |
| Product catalog | `npm run seed:nike` or `npm run seed:nike:catalog` |
| R2 media | `npm run seed:nike:r2` |
| Payment sandbox | PayOS/Stripe sandbox dashboards |

## 7. Release Exit Criteria

1. Backend unit and e2e tests pass.
2. Frontend production build succeeds.
3. Docker images build.
4. Smoke test passes.
5. At least one PayOS or Stripe sandbox checkout is verified.
6. Admin can log in and view products/orders.
7. No high-severity known security gap is newly introduced.
