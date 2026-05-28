# Entity Relationship Diagram

MongoDB stores data as collections, with several embedded arrays for product variants, customer addresses, order items, status history, and chat messages.

```mermaid
erDiagram
  ROLE ||--o{ USER : assigned_to
  USER ||--o{ BILL : places
  USER ||--o{ WISHLIST : saves
  USER ||--o{ REVIEW : writes
  USER ||--o{ RETURN_REQUEST : requests
  SHOE ||--|| SHOE_DETAIL : has_detail
  SHOE_DETAIL ||--o{ REVIEW : receives
  SHOE_DETAIL ||--o{ STOCK_MOVEMENT : changes_stock
  BILL ||--o{ REVIEW : verifies_purchase
  BILL ||--o{ RETURN_REQUEST : return_for
  COUPON ||--o{ BILL : applied_to

  ROLE {
    ObjectId _id
    string name
    string description
    string[] permissions
    boolean active
    date createdAt
  }

  USER {
    ObjectId _id
    string username
    string password
    string email
    ObjectId roleId
    number age
    string phone
    string fullName
    Address addresses
    boolean isVerified
    string verificationToken
    date verificationTokenExpires
    boolean active
    date createdAt
  }

  SHOE {
    ObjectId _id
    string productId
    string name
    string category
    string productType
    string collection
    number price
    string color
    string thumbnail
  }

  SHOE_DETAIL {
    ObjectId _id
    string productId
    string name
    string category
    string productType
    string collection
    number price
    ColorVariant colors
  }

  BILL {
    ObjectId _id
    string orderId
    number orderCode
    string paymentLinkId
    string paymentProvider
    string stripePaymentIntentId
    number amount
    number subtotal
    number deliveryFee
    string couponCode
    number discountAmount
    ObjectId userId
    string customerEmail
    CustomerInfo customerInfo
    OrderItem items
    string status
    string fulfillmentStatus
    string carrier
    string trackingCode
    StatusHistory statusHistory
    mixed transactionData
    date createdAt
    date paidAt
    date deliveredAt
  }

  COUPON {
    ObjectId _id
    string code
    string type
    number value
    number minOrder
    number maxDiscount
    number usageLimit
    number usedCount
    date startsAt
    date endsAt
    boolean active
  }

  REVIEW {
    ObjectId _id
    string productId
    number orderCode
    string userId
    string username
    string colorName
    string size
    number rating
    string comment
    string[] images
    string status
  }

  RETURN_REQUEST {
    ObjectId _id
    number orderCode
    ObjectId userId
    string customerEmail
    string productId
    string productName
    string colorName
    string size
    number quantity
    string type
    string reason
    string note
    string[] images
    string status
    string adminNote
  }

  WISHLIST {
    ObjectId _id
    string userId
    string productId
    string colorName
    string size
    boolean notifyOnRestock
  }

  STOCK_MOVEMENT {
    ObjectId _id
    string productId
    string productName
    string colorName
    string size
    string type
    number quantity
    number beforeStock
    number afterStock
    string note
    string createdBy
  }

  CHAT_CONVERSATION {
    ObjectId _id
    string userId
    string guestId
    string customerName
    string customerEmail
    string status
    string assignedTo
    string lastMessage
    number unreadForManager
    number unreadForCustomer
    Message messages
  }

  CATEGORY {
    string _id
    string title
    string[] sections
  }

  COUNTER {
    string _id
    number sequence_value
  }
```

## Collection Notes

| Collection | Primary Access Pattern | Important Indexes |
| --- | --- | --- |
| `role` | Find role by name during registration and guards | `name` unique |
| `users` | Login by username, lookup profile by id | `roleId` reference; add unique indexes for `username` and `email` in production |
| `shoes` | Product listing and admin listing | `productId` unique |
| `shoesDetail` | Product detail and nested stock mutation | Add `productId` unique/indexed in production |
| `bills` | Order lookup by order code, user order history, guest email history | `orderCode` unique, `paymentProvider`, `stripePaymentIntentId`, `status`, `fulfillmentStatus`, `createdAt`, `{userId, createdAt}`, `{customerEmail, createdAt}` |
| `coupons` | Validate coupon by code | `code` unique |
| `reviews` | List product reviews and enforce one verified review per order item | `productId`, `userId`, `status`, compound unique `{productId, orderCode, userId, colorName, size}` |
| `returnRequests` | Admin filter by status, user order history | `orderCode`, `userId`, `status` |
| `wishlist` | User wishlist and duplicate prevention | `userId`, `productId`, compound unique `{userId, productId, colorName, size}` |
| `stockMovements` | Audit stock history by product | `productId`, timestamps |
| `chatConversations` | Manager queue and user/guest active conversation | `{userId, status, updatedAt}`, `{guestId, status, updatedAt}`, `{status, updatedAt}` |

## Embedded Structures

| Parent | Embedded Structure | Purpose |
| --- | --- | --- |
| `users` | `addresses[]` | Shipping address book |
| `shoesDetail` | `colors[]`, `colors[].sizes[]` | Variant media, metadata, and stock by color/size |
| `bills` | `customerInfo`, `items[]`, `statusHistory[]` | Denormalized immutable checkout snapshot and fulfillment audit |
| `chatConversations` | `messages[]` | Conversation message timeline |

## Integrity Rules

1. `Bill.items[].productId` references `Shoe.productId` / `ShoeDetail.productId`.
2. `Bill.userId` may be `null` for guest checkout.
3. Reviews should be created only after a matching paid order item is found.
4. Return requests should reference an existing paid or delivered order.
5. Stock changes should update `shoesDetail.colors[].sizes[].stock` and append a `stockMovements` audit record when manually adjusted.
