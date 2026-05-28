# Database Schema

## 1. Database

| Property | Value |
| --- | --- |
| Engine | MongoDB |
| ODM | Mongoose |
| Default DB name | `nike-store` |
| Local URI | `mongodb://localhost:27017/nike-store` |
| Docker URI | `mongodb://mongo:27017/nike-store` |

Redis is used as a non-authoritative cache only. MongoDB remains the source of truth for product, stock, order, user, and engagement data.

| Cache Area | Keys | Source of Truth | Notes |
| --- | --- | --- | --- |
| Product catalog | `shoes:*` | MongoDB `shoes`, `shoesDetail`, `categories` | JSON responses with `REDIS_PRODUCTS_TTL_SECONDS` TTL; invalidated by product, inventory, and payment stock writes |

## 2. Collections

### `role`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Unique, examples: `admin`, `user`, `manager` |
| `description` | string | no | Human-readable role purpose |
| `permissions` | string[] | no | Fine-grained permission labels |
| `active` | boolean | no | Default `true` |
| `createdAt` | date | no | Default current date |

### `users`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `username` | string | yes | Login username |
| `password` | string | yes | bcrypt hash |
| `email` | string | yes | User email |
| `roleId` | ObjectId ref `Role` | yes | Role reference |
| `age` | number | no | Optional profile field |
| `phone` | string | no | Default empty string |
| `fullName` | string | no | Default empty string |
| `addresses` | Address[] | no | Embedded address book |
| `isVerified` | boolean | no | Default `false` |
| `verificationToken` | string | no | Email verification token |
| `verificationTokenExpires` | date | no | Token expiry |
| `active` | boolean | no | Default `true` |
| `createdAt` | date | no | Default current date |

Address fields: `label`, `firstName`, `lastName`, `phone`, `address`, `addressLine1`, `addressLine2`, `city`, `postalCode`, `isDefault`.

### `shoes`

Listing-optimized collection.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | string | yes | Unique product id |
| `name` | string | yes | Product name |
| `category` | string | yes | Example: men, women, kids |
| `productType` | string | no | Product type |
| `collection` | string | no | Collection label |
| `price` | number | yes | VND price |
| `color` | string | yes | Listing color |
| `thumbnail` | string | no | Listing image URL |

### `shoesDetail`

Detail and stock collection.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | string | yes | Product id matching `shoes.productId` |
| `name` | string | yes | Product name |
| `category` | string | yes | Product category |
| `productType` | string | no | Product type |
| `collection` | string | no | Collection label |
| `price` | number | yes | Base price |
| `colors` | ColorVariant[] | no | Embedded variants |

Color variant fields: `colorName`, `hex`, `thumbnail`, `images[]`, `sizes[]`, `styleCode`, `category`, `productType`, `collection`, `createdAt`, `description`, `materialNote`, `origin`, `rating`, `reviewCount`, `updatedAt`, `price`.

Size fields: `size`, `stock`.

### `categories`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | string | yes | Example: `men`, `women`, `kids` |
| `title` | string | yes | Display title |
| `sections` | string[] | no | Menu sections |

### `counters`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | string | yes | Counter name |
| `sequence_value` | number | yes | Last generated sequence |

### `bills`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderId` | string | yes | Internal order id |
| `orderCode` | number | yes | Unique customer-facing code |
| `paymentLinkId` | string | yes | PayOS link id or Stripe-compatible marker |
| `paymentProvider` | `payos` or `stripe` | no | Default `payos`, indexed |
| `stripePaymentIntentId` | string | no | Indexed |
| `amount` | number | yes | Final amount |
| `subtotal` | number | no | Before discount/delivery |
| `deliveryFee` | number | no | Delivery fee |
| `couponCode` | string | no | Applied coupon |
| `discountAmount` | number | no | Discount amount |
| `description` | string | no | Payment description |
| `userId` | ObjectId ref `User` or null | no | Null for guest checkout |
| `customerEmail` | string | yes | Indexed |
| `customerInfo` | object | yes | Shipping contact |
| `items` | OrderItem[] | yes | Immutable item snapshot |
| `status` | enum | no | Payment status |
| `fulfillmentStatus` | enum | no | Fulfillment status |
| `carrier` | string | no | Shipping carrier |
| `trackingCode` | string | no | Tracking code |
| `statusHistory` | StatusHistory[] | no | Audit timeline |
| `transactionData` | mixed | no | Provider payload |
| `createdAt` | date | no | Indexed |
| `paidAt` | date | no | Settlement timestamp |
| `deliveredAt` | date | no | Delivery timestamp |

Payment status enum: `PENDING`, `PAID`, `FAILED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`.

Fulfillment enum: `AWAITING_PAYMENT`, `CONFIRMED`, `PACKING`, `SHIPPING`, `DELIVERED`, `RETURN_REQUESTED`, `REFUNDED`, `CANCELLED`.

### `coupons`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `code` | string | yes | Unique, uppercase, trimmed |
| `type` | `PERCENT` or `FIXED` | yes | Discount type |
| `value` | number | yes | Percent or fixed value |
| `minOrder` | number | no | Minimum order amount |
| `maxDiscount` | number | no | Max discount for percent coupons |
| `usageLimit` | number | no | Zero means unlimited |
| `usedCount` | number | no | Usage counter |
| `startsAt` | date | no | Valid from |
| `endsAt` | date | no | Valid until |
| `active` | boolean | no | Default `true` |

### `stockMovements`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | string | yes | Indexed |
| `productName` | string | yes | Snapshot name |
| `colorName` | string | yes | Variant color |
| `size` | string | yes | Size |
| `type` | `IN`, `OUT`, `ADJUST` | yes | Movement type |
| `quantity` | number | yes | Quantity delta/adjustment |
| `beforeStock` | number | yes | Previous stock |
| `afterStock` | number | yes | New stock |
| `note` | string | no | Admin note |
| `createdBy` | string | no | Operator |

### `reviews`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `productId` | string | yes | Indexed |
| `orderCode` | number | yes | Verified purchase link |
| `userId` | string | yes | Indexed |
| `username` | string | yes | Display name snapshot |
| `colorName` | string | yes | Variant color |
| `size` | string | yes | Size |
| `rating` | number | yes | 1 to 5 |
| `comment` | string | no | Review body |
| `images` | string[] | no | Image URLs |
| `status` | `approved` or `hidden` | no | Indexed |

Unique compound index: `{ productId, orderCode, userId, colorName, size }`.

### `returnRequests`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `orderCode` | number | yes | Indexed |
| `userId` | ObjectId ref `User` or null | no | Indexed |
| `customerEmail` | string | yes | Guest/member lookup |
| `productId` | string | yes | Product id |
| `productName` | string | yes | Snapshot product name |
| `colorName` | string | yes | Variant color |
| `size` | string | yes | Size |
| `quantity` | number | yes | Quantity |
| `type` | `RETURN`, `EXCHANGE`, `REFUND` | yes | Request type |
| `reason` | string | yes | User reason |
| `note` | string | no | User note |
| `images` | string[] | no | Evidence URLs |
| `status` | enum | no | Indexed |
| `adminNote` | string | no | Admin note |

Status enum: `REQUESTED`, `APPROVED`, `REJECTED`, `RECEIVED`, `REFUNDED`, `EXCHANGED`.

### `wishlist`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `userId` | string | yes | Indexed |
| `productId` | string | yes | Indexed |
| `colorName` | string | no | Variant |
| `size` | string | no | Size |
| `notifyOnRestock` | boolean | no | Default `false` |

Unique compound index: `{ userId, productId, colorName, size }`.

### `chatConversations`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `userId` | string | no | Logged-in customer id |
| `guestId` | string | no | Guest browser identity |
| `customerName` | string | no | Default `Guest` |
| `customerEmail` | string | no | Optional |
| `status` | `open`, `pending_manager`, `resolved` | no | Conversation state |
| `assignedTo` | string | no | Manager |
| `lastMessage` | string | no | Queue preview |
| `unreadForManager` | number | no | Counter |
| `unreadForCustomer` | number | no | Counter |
| `messages` | Message[] | no | Embedded messages |

Message fields: `senderType`, `senderName`, `text`, `createdAt`, `meta`.

Indexes:

```text
{ userId: 1, status: 1, updatedAt: -1 }
{ guestId: 1, status: 1, updatedAt: -1 }
{ status: 1, updatedAt: -1 }
```

## 3. Relationship Rules

1. `users.roleId` references `role._id`.
2. `bills.userId` references `users._id` when the order belongs to a member.
3. `bills.items.productId`, `reviews.productId`, `wishlist.productId`, and `returnRequests.productId` reference product ids stored in `shoes` and `shoesDetail`.
4. `reviews.orderCode` and `returnRequests.orderCode` reference `bills.orderCode`.
5. Stock source of truth is `shoesDetail.colors[].sizes[].stock`.
6. `stockMovements` is an append-only audit log for manual stock changes.

## 4. Production Index Recommendations

Add or confirm these indexes before production:

```text
users.username unique
users.email unique
shoes.productId unique
shoesDetail.productId unique
bills.orderCode unique
bills.paymentLinkId
bills.stripePaymentIntentId
bills.status + createdAt
bills.fulfillmentStatus + createdAt
coupons.code unique
```
