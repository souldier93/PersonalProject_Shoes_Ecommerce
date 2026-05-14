# Microservices Roadmap

Do not split everything at once. The current app should run as a containerized monolith first, then extract services one by one.

## Current Logical Modules

The NestJS backend already has clean module boundaries:

- `auth`: users, roles, profile, addresses
- `shoes`: catalog, product detail, stock checks
- `payment`: checkout, PayOS, bills, fulfillment
- `inventory`: stock movements and low-stock overview
- `coupons`: promo codes
- `reviews`: product reviews
- `returns`: return/exchange requests
- `wishlist`: user wishlist
- `chat`: support chat and chatbot
- `analytics`: dashboard metrics

These modules are the future service boundaries.

## Extraction Order

1. `support-service`
   - Move `chat`, `reviews`, and `returns`.
   - Low risk because it can mostly read order/product data and write support data.

2. `catalog-service`
   - Move `shoes`, product seed scripts, stock read APIs.
   - Keep stock reservation/payment updates carefully coordinated.

3. `order-service`
   - Move `payment`, bills, fulfillment, coupon application.
   - Higher risk because payment and stock updates must stay consistent.

4. `identity-service`
   - Move `auth`, users, roles.
   - Add JWT issuer and shared auth middleware for other services.

5. `analytics-service`
   - Move analytics aggregation.
   - Can subscribe to events later instead of querying operational databases directly.

## API Gateway Shape

Frontend should not call every service directly.

```text
Vue App
  -> API Gateway
      /auth      -> identity-service
      /shoes     -> catalog-service
      /payments  -> order-service
      /coupons   -> order-service
      /inventory -> catalog-service
      /chat      -> support-service
      /reviews   -> support-service
      /returns   -> support-service
      /analytics -> analytics-service
```

The current Nginx frontend proxy already uses `/api`, which is the first step toward this gateway model.

## Data Strategy

Phase 1:

- Shared MongoDB database.
- Separate collections per module.
- Useful for extraction without breaking existing behavior.

Phase 2:

- Each service owns its own database or schema.
- Services communicate through HTTP APIs.
- Stock/payment consistency is handled by explicit APIs.

Phase 3:

- Add event messaging for async work:
  - AWS: SNS/SQS or EventBridge.
  - Azure: Service Bus or Event Grid.
- Examples:
  - `OrderPaid`
  - `StockAdjusted`
  - `ReturnRequested`
  - `ReviewSubmitted`

## First Real Extraction: Support Service

Create a new NestJS app with:

- `chat`
- `reviews`
- `returns`

Required external calls:

- `GET /orders/:orderCode` from order service.
- `GET /products/:productId` from catalog service.

Keep the current endpoints unchanged behind the gateway so the Vue app does not need to change.
