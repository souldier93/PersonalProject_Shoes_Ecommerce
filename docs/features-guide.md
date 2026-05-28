# Features Guide

## Customer Storefront

| Feature | Description |
| --- | --- |
| Home page | Hero slider, featured products, color/season, sport sections |
| Product listing | Browse products with filters and sorting |
| Product detail | View color variants, images, sizes, stock, reviews |
| Bag/cart | Local cart with quantity and variant selections |
| Guest checkout | Checkout with email, phone, and shipping address without account |
| Member checkout | Checkout with stored profile/address data |
| PayOS payment | Vietnam QR/bank transfer flow |
| Stripe payment | Card payment flow through Stripe |
| Order tracking | Member history or guest lookup by email + order code |
| Cancellation/refund | Customer can request cancellation/refund for eligible orders |
| Reviews | Verified-purchase reviews with rating, comment, and images |
| Returns/exchanges | Submit after-sales request for order items |
| Wishlist | Save products and optionally request restock notification |
| Chat | Customer support chat widget |

## Admin Panel

| Feature | Description |
| --- | --- |
| Dashboard | Product/order/revenue overview |
| Product management | Create, edit, soft-delete products and manage variants |
| R2 media browser | Browse Cloudflare R2 folders and use media URLs in products |
| Order management | List orders and update fulfillment |
| Return management | Review return/exchange/refund requests |
| Inventory | View stock and create manual adjustments |
| Coupon management | Create, update, activate/deactivate coupons |
| User management | List users and assign roles |
| Chat support | View and reply to customer conversations |
| Analytics | Revenue and sales reporting |

## Payment and Order Lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> PAID
  PENDING --> FAILED
  PENDING --> CANCELLED
  PAID --> REFUND_PENDING
  REFUND_PENDING --> REFUNDED
  PAID --> CANCELLED
```

```mermaid
stateDiagram-v2
  [*] --> AWAITING_PAYMENT
  AWAITING_PAYMENT --> CONFIRMED
  CONFIRMED --> PACKING
  PACKING --> SHIPPING
  SHIPPING --> DELIVERED
  DELIVERED --> RETURN_REQUESTED
  RETURN_REQUESTED --> REFUNDED
  CONFIRMED --> CANCELLED
  PACKING --> CANCELLED
```

## Feature Ownership

| Feature Area | Primary Module |
| --- | --- |
| Login/profile/roles | Auth |
| Catalog/product detail | Shoes |
| Checkout/order/payment | Payment |
| Coupons | Coupons |
| Inventory | Inventory |
| Reviews | Reviews |
| Returns | Returns |
| Wishlist | Wishlist |
| Chat | Chat |
| Analytics | Analytics |
| Media | R2 |
