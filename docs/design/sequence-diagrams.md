# Sequence Diagrams

This file keeps the primary end-to-end flows. The complete generated set for every use case is available in [sequence-diagrams-all-uc.md](sequence-diagrams-all-uc.md), with 76 rendered SVG diagrams and PlantUML sources.

## 1. Register and Login

```mermaid
sequenceDiagram
  actor User
  participant FE as Vue SPA
  participant Auth as AuthController
  participant UserSvc as UsersService
  participant DB as MongoDB
  participant Mail as Gmail SMTP

  User->>FE: Submit registration form
  FE->>Auth: POST /auth/register
  Auth->>UserSvc: createUser(dto)
  UserSvc->>DB: Check duplicate username/email
  UserSvc->>DB: Resolve role
  UserSvc->>DB: Save hashed user
  alt EMAIL_VERIFICATION_REQUIRED=true
    UserSvc->>Mail: Send verification email
  end
  UserSvc-->>Auth: User/token response
  Auth-->>FE: 201-style response

  User->>FE: Submit login form
  FE->>Auth: POST /auth/login
  Auth->>UserSvc: login(dto)
  UserSvc->>DB: Find active user + role
  UserSvc->>UserSvc: bcrypt compare
  UserSvc-->>Auth: accessToken + user
  Auth-->>FE: Login success
  FE->>FE: Store token/user in localStorage
```

## 2. Browse Product Detail

```mermaid
sequenceDiagram
  actor User
  participant FE as Product Detail
  participant Shoes as ShoesController
  participant Service as ShoesService
  participant Redis as Redis Cache
  participant DB as MongoDB
  participant Reviews as ReviewsController

  User->>FE: Open /shoes/:id
  FE->>Shoes: GET /shoes/detail/:productId
  Shoes->>Service: findDetailByProductId(productId)
  Service->>Redis: GET shoes:detail:productId
  alt cache hit
    Redis-->>Service: Product detail JSON
  else cache miss
    Service->>DB: Read shoesDetail
    DB-->>Service: Product detail with colors/sizes
    Service->>Redis: SET shoes:detail:productId with TTL
  end
  Service-->>FE: Detail data
  FE->>Reviews: GET /reviews/product/:productId
  Reviews->>DB: Read approved reviews
  DB-->>FE: Reviews + rating summary
```

## 3. Guest Checkout with PayOS

```mermaid
sequenceDiagram
  actor Guest
  participant FE as Checkout
  participant Shoes as Shoes API
  participant Payment as Payment API
  participant PayOS
  participant DB as MongoDB
  participant Redis as Redis Cache
  participant Mail as Gmail SMTP

  Guest->>FE: Fill checkout and choose PayOS
  FE->>Shoes: POST /shoes/check-stock-batch
  Shoes-->>FE: Availability result
  FE->>Payment: POST /payments
  Payment->>DB: Validate coupon and stock
  Payment->>PayOS: Create payment link
  PayOS-->>Payment: checkoutUrl, paymentLinkId
  Payment->>DB: Create Bill PENDING/AWAITING_PAYMENT
  Payment->>Mail: Send order-created email
  Payment-->>FE: Payment URL and order data
  Guest->>PayOS: Complete bank transfer
  PayOS->>Payment: POST /payments/webhook
  Payment->>Payment: Verify HMAC signature
  Payment->>DB: Mark PAID/CONFIRMED and decrease stock
  Payment->>Redis: Invalidate shoes:* cache
  Payment->>Mail: Send payment-confirmed email
```

## 4. Stripe Payment

```mermaid
sequenceDiagram
  actor Customer
  participant FE as Checkout/Payment
  participant Payment as Payment API
  participant Stripe
  participant DB as MongoDB
  participant Redis as Redis Cache

  Customer->>FE: Choose Stripe
  FE->>Payment: POST /payments/stripe/create-intent
  Payment->>Stripe: Create PaymentIntent
  Stripe-->>Payment: client_secret
  Payment->>DB: Create Bill provider=stripe
  Payment-->>FE: client_secret
  FE->>Stripe: Confirm card payment
  Stripe-->>FE: PaymentIntent status
  FE->>Payment: POST /payments/stripe/confirm
  Payment->>Stripe: Retrieve PaymentIntent
  Payment->>DB: Verify amount, mark paid, decrease stock
  Payment->>Redis: Invalidate shoes:* cache
```

## 5. Admin Fulfillment Update

```mermaid
sequenceDiagram
  actor Admin
  participant FE as Admin Purchases
  participant Payment as Payment API
  participant DB as MongoDB
  participant Mail as Gmail SMTP

  Admin->>FE: Change fulfillment status
  FE->>Payment: PATCH /payments/orders/:orderCode/fulfillment
  Payment->>DB: Load Bill
  Payment->>Payment: Validate status transition
  Payment->>DB: Update fulfillmentStatus and statusHistory
  alt delivered
    Payment->>DB: Set deliveredAt
  end
  Payment-->>FE: Updated order
```

## 6. Cancel and Refund Order

```mermaid
sequenceDiagram
  actor Customer
  participant FE as My Orders
  participant Payment as Payment API
  participant Stripe
  participant DB as MongoDB
  participant Redis as Redis Cache
  participant Mail as Gmail SMTP

  Customer->>FE: Request cancellation/refund
  FE->>Payment: POST /payments/orders/:orderCode/cancel-refund
  Payment->>DB: Load Bill
  Payment->>Payment: Verify email/user ownership
  Payment->>Payment: Check cancellation eligibility
  alt Stripe order
    Payment->>Stripe: Create refund
    Stripe-->>Payment: Refund accepted
  end
  Payment->>DB: Update status and fulfillment
  Payment->>DB: Restore stock if needed
  Payment->>Redis: Invalidate shoes:* cache if stock changed
  Payment->>Mail: Send cancellation email
  Payment-->>FE: Updated order/refund result
```

## 7. Customer Support Chat

```mermaid
sequenceDiagram
  actor Customer
  participant Widget as Chat Widget
  participant Chat as Chat API
  participant DB as MongoDB
  actor Manager
  participant Admin as Admin Chat

  Customer->>Widget: Open chat
  Widget->>Chat: POST /chat/conversations
  Chat->>DB: Find or create conversation
  Chat-->>Widget: Conversation
  Customer->>Widget: Send message
  Widget->>Chat: POST /chat/conversations/:id/messages
  Chat->>DB: Append message and update unread counters
  Chat-->>Widget: Updated conversation
  Admin->>Chat: GET /chat/conversations
  Chat-->>Admin: Queue
  Manager->>Admin: Reply
  Admin->>Chat: POST /chat/conversations/:id/messages
  Chat->>DB: Append manager message
```
