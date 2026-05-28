# Data Flow Diagram

## DFD Level 0

```mermaid
flowchart LR
  Customer[Customer] -->|Browse, cart, checkout, chat| System[Shoes Ecommerce System]
  Admin[Admin/Manager] -->|Operate catalog, inventory, orders| System
  System -->|Product/order/user data| Mongo[(MongoDB)]
  System -->|Catalog cache read/write| Redis[(Redis)]
  System -->|Payment creation and status| PayOS[PayOS]
  System -->|Payment intent, webhook, refund| Stripe[Stripe]
  System -->|Media list and URLs| R2[Cloudflare R2]
  System -->|Verification and order emails| Gmail[Gmail SMTP]
```

## DFD Level 1

```mermaid
flowchart TB
  Customer --> FE[Vue SPA]
  Admin --> FE
  FE --> Auth[Auth Process]
  FE --> Catalog[Catalog Process]
  FE --> Checkout[Checkout Process]
  FE --> Engagement[Wishlist, Reviews, Chat]
  FE --> AdminOps[Admin Operations]

  Auth --> Users[(users, role)]
  Catalog --> Products[(shoes, shoesDetail, categories)]
  Catalog --> Cache[(Redis shoes:* cache)]
  Checkout --> Orders[(bills)]
  Checkout --> Products
  Checkout --> Cache
  Checkout --> Coupons[(coupons)]
  Checkout --> PayOS
  Checkout --> Stripe
  Checkout --> Gmail
  Engagement --> Reviews[(reviews)]
  Engagement --> Wishlist[(wishlist)]
  Engagement --> Chat[(chatConversations)]
  AdminOps --> Inventory[(stockMovements)]
  AdminOps --> Orders
  AdminOps --> Products
  AdminOps -->|Invalidate product cache| Cache
  AdminOps --> R2
```

## DFD Level 2: Checkout

```mermaid
flowchart TB
  Cart[Cart in localStorage] --> StockCheck[Batch stock check]
  StockCheck --> ProductStore[(shoesDetail stock)]
  StockCheck --> CouponValidate[Coupon validation]
  CouponValidate --> CouponStore[(coupons)]
  CouponValidate --> CreatePayment[Create payment]
  CreatePayment --> BillStore[(bills)]
  CreatePayment --> Provider{Provider}
  Provider --> PayOS[PayOS payment link]
  Provider --> Stripe[Stripe PaymentIntent]
  PayOS --> Webhook[Verified webhook]
  Stripe --> Webhook
  Webhook --> Settle[Settle order]
  Settle --> BillStore
  Settle --> DecreaseStock[Decrease nested stock]
  DecreaseStock --> ProductStore
  DecreaseStock --> InvalidateCache[Invalidate shoes:* cache]
  InvalidateCache --> Cache[(Redis)]
  Settle --> Email[Order email]
```

## DFD Level 2: Admin Product and Media

```mermaid
flowchart TB
  Admin[Admin Product Form] --> MediaBrowse[R2 folder/media browser]
  MediaBrowse --> R2[(Cloudflare R2)]
  R2 --> MediaURLs[Public media URLs]
  Admin --> ProductPayload[Product payload]
  MediaURLs --> ProductPayload
  ProductPayload --> ProductAPI[POST /shoes/product or PUT /shoes/:productId]
  ProductAPI --> Shoes[(shoes)]
  ProductAPI --> Details[(shoesDetail)]
  ProductAPI --> CacheInvalidation[Invalidate shoes:* cache]
  CacheInvalidation --> Cache[(Redis)]
```

## DFD Level 2: Chat Support

```mermaid
flowchart TB
  Customer[Customer widget] --> Conversation[Create or load conversation]
  Conversation --> ChatDB[(chatConversations)]
  Customer --> Message[Add customer message]
  Message --> Bot[Simple bot/product answer]
  Bot --> ProductDB[(shoesDetail)]
  Message --> ChatDB
  Manager[Admin chat] --> Queue[List conversations]
  Queue --> ChatDB
  Manager --> Reply[Add manager message]
  Reply --> ChatDB
```

## Data Classification

| Data | Examples | Storage | Sensitivity |
| --- | --- | --- | --- |
| Account data | username, email, phone, address | MongoDB `users` | High |
| Auth secrets | password hashes, JWT secret | MongoDB/env | High |
| Payment metadata | provider ids, order amount, transaction payload | MongoDB `bills` | High |
| Product data | name, price, stock, media URLs | MongoDB/R2 | Medium |
| Product cache | derived product list/detail responses | Redis `shoes:*` keys | Low/Medium |
| Chat/review content | free text, images | MongoDB/R2 URLs | Medium |
| Analytics | revenue totals, order counts | Aggregated from MongoDB | Medium |

## Data Retention Suggestions

1. Keep order records for accounting/legal retention requirements.
2. Keep stock movement audit logs indefinitely or archive yearly.
3. Expire email verification tokens after 24 hours and clear used tokens.
4. Consider retention policy for chat conversations and uploaded review/return images.
5. Keep Redis product cache short-lived, default 300 seconds, because MongoDB remains the source of truth.
