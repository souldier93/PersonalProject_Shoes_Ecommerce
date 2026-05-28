# API Reference

## 1. Overview

| Item | Value |
| --- | --- |
| Backend base URL | `http://localhost:3000` |
| Gateway base URL | `http://localhost:8081/api` |
| Auth type | JWT bearer token |
| Content type | `application/json` |

When using the gateway, remove the backend module prefix mapping difference:

```text
Backend: GET http://localhost:3000/shoes
Gateway: GET http://localhost:8081/api/shoes
```

## 2. Authentication Header

```http
Authorization: Bearer <accessToken>
```

## 3. Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | Backend hello response |
| GET | `/health` | Public | Health check |

Example response:

```json
{
  "status": "ok",
  "service": "shoes-backend",
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

## 4. Auth, Users, Roles

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/register` | Public | Create user |
| GET | `/auth/verify-email?token=...` | Public | Verify email token |
| POST | `/auth/resend-verification` | Public | Resend verification email |
| GET | `/auth/users/all` | Public in current code | List all users |
| GET | `/auth/users/:id/profile` | Public in current code | Get user profile |
| GET | `/auth/profile` | JWT | Current authenticated profile |
| GET | `/auth/users` | Admin | List users |
| GET | `/auth/users/:id` | Admin | Get user by id |
| PATCH | `/auth/users/:id/role` | Admin | Update user role |
| PATCH | `/auth/users/:id/profile` | Public in current code | Update profile |
| PATCH | `/auth/users/:id/password` | Public in current code | Change password |
| POST | `/auth/users/:id/addresses` | Public in current code | Add address |
| PATCH | `/auth/users/:id/addresses/:index` | Public in current code | Update address |
| DELETE | `/auth/users/:id/addresses/:index` | Public in current code | Delete address |
| GET | `/auth/roles/all` | Admin | List roles |
| POST | `/auth/roles` | Admin | Create role |

### Login Request

```json
{
  "username": "admin",
  "password": "change-this-password"
}
```

### Register Request

```json
{
  "username": "customer1",
  "password": "secret123",
  "email": "customer@example.com",
  "roleName": "user",
  "age": 25
}
```

### Role Request

```json
{
  "name": "manager",
  "description": "Store manager",
  "permissions": ["read:orders", "write:orders"]
}
```

## 5. Shoes / Catalog

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/shoes` | Public | List products; supports filter query |
| GET | `/shoes/product/:productId` | Public | Get product listing variants by product id |
| GET | `/shoes/detail/:productId` | Public | Get full product detail |
| GET | `/shoes/details?category=men` | Public | List detail documents, optionally by category |
| POST | `/shoes/product` | Public in current code | Create product |
| PUT | `/shoes/:styleCode` | Public in current code | Update product/detail |
| POST | `/shoes/soft-delete/:productId` | Public in current code | Set all stock to zero |
| GET | `/shoes/:productId/stock/:colorName/:size` | Public | Check variant stock |
| POST | `/shoes/check-stock-batch` | Public | Batch stock check |
| GET | `/shoes/stats/dashboard` | Public in current code | Dashboard product stats |

### List Query Example

```http
GET /shoes?category=men&color=black&sort=rating
```

Catalog read endpoints may be served from Redis using `shoes:*` keys. Response contracts stay the same; product writes, inventory adjustments, and payment stock changes invalidate the cache.

### Batch Stock Request

```json
[
  {
    "productId": "1001",
    "colorName": "Black",
    "size": "42",
    "quantity": 1
  }
]
```

### Create Product Request

```json
{
  "name": "Nike Air Example",
  "category": "men",
  "productType": "Shoes",
  "collection": "Running",
  "price": 2500000,
  "colors": [
    {
      "colorName": "Black",
      "hex": "#000000",
      "thumbnail": "https://example.com/black.jpg",
      "images": ["https://example.com/black-1.jpg"],
      "sizes": [
        { "size": "41", "stock": 10 },
        { "size": "42", "stock": 8 }
      ],
      "styleCode": "EX-001",
      "description": "Lightweight daily shoe"
    }
  ]
}
```

## 6. Payments and Orders

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/payments` | Public | Create PayOS payment |
| POST | `/payments/stripe/create-intent` | Public | Create Stripe PaymentIntent |
| POST | `/payments/stripe/confirm` | Public | Confirm/settle Stripe payment intent |
| POST | `/payments/stripe/webhook` | Stripe signature | Stripe webhook |
| POST | `/payments/webhook` | PayOS signature | PayOS webhook |
| GET | `/payments/check/:paymentLinkId` | Public | Check PayOS payment status by link id |
| GET | `/payments/orders` | Public in current code | List all orders |
| PATCH | `/payments/orders/:orderCode/fulfillment` | Public in current code | Update fulfillment |
| POST | `/payments/orders/:orderCode/cancel-refund` | Public with owner data | Cancel/refund order |
| GET | `/payments/check-order/:orderCode` | Public | Check order by order code |
| GET | `/payments/user/:userId/orders` | Public in current code | List member orders |
| POST | `/payments/guest/orders/lookup` | Public | Secure guest lookup by email + order code |
| GET | `/payments/guest/:email/orders` | Public in current code | List guest orders by email |

### Create Payment Request

```json
{
  "orderId": "cart-1710000000",
  "description": "PTT Style order",
  "amount": 2600000,
  "subtotal": 2500000,
  "deliveryFee": 100000,
  "couponCode": "WELCOME10",
  "discountAmount": 0,
  "userId": "665000000000000000000001",
  "customerEmail": "customer@example.com",
  "customerInfo": {
    "firstName": "Thanh",
    "lastName": "Nguyen",
    "phone": "0900000000",
    "address": "Ho Chi Minh City",
    "addressLine1": "123 Nguyen Trai",
    "city": "HCMC",
    "postalCode": "700000"
  },
  "items": [
    {
      "productId": "1001",
      "name": "Nike Air Example",
      "colorName": "Black",
      "size": "42",
      "quantity": 1,
      "price": 2500000
    }
  ]
}
```

### Stripe Confirm Request

```json
{
  "paymentIntentId": "pi_..."
}
```

### Fulfillment Update Request

```json
{
  "fulfillmentStatus": "SHIPPING",
  "carrier": "GHN",
  "trackingCode": "GHN123",
  "note": "Package handed to carrier"
}
```

### Guest Lookup Request

```json
{
  "email": "customer@example.com",
  "orderCode": "123456"
}
```

## 7. Coupons

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/coupons` | Public in current code | List coupons |
| POST | `/coupons` | Public in current code | Create coupon |
| PATCH | `/coupons/:id` | Public in current code | Update coupon |
| GET | `/coupons/validate?code=...&amount=...` | Public | Validate coupon |

### Coupon Request

```json
{
  "code": "WELCOME10",
  "type": "PERCENT",
  "value": 10,
  "minOrder": 500000,
  "maxDiscount": 200000,
  "usageLimit": 100,
  "startsAt": "2026-05-01T00:00:00.000Z",
  "endsAt": "2026-06-01T00:00:00.000Z",
  "active": true
}
```

## 8. Inventory

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/inventory/overview` | Public in current code | Stock overview |
| POST | `/inventory/adjust` | Public in current code | Adjust stock and create audit movement |

### Adjust Stock Request

```json
{
  "productId": "1001",
  "colorName": "Black",
  "size": "42",
  "stock": 15,
  "note": "Cycle count adjustment",
  "createdBy": "admin"
}
```

## 9. Reviews

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/reviews/product/:productId` | Public | List approved reviews and summary |
| POST | `/reviews` | Public in current code | Create verified-purchase review |
| PATCH | `/reviews/:id/status` | Public in current code | Update review status |

### Create Review Request

```json
{
  "productId": "1001",
  "orderCode": 123456,
  "userId": "665000000000000000000001",
  "username": "customer1",
  "colorName": "Black",
  "size": "42",
  "rating": 5,
  "comment": "Comfortable and true to size.",
  "images": []
}
```

## 10. Returns

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/returns` | Public in current code | Create return/exchange/refund request |
| GET | `/returns?status=REQUESTED` | Public in current code | List requests |
| GET | `/returns/user/:userId` | Public in current code | List requests by user |
| PATCH | `/returns/:id/status` | Public in current code | Admin status update |

### Create Return Request

```json
{
  "orderCode": 123456,
  "userId": "665000000000000000000001",
  "customerEmail": "customer@example.com",
  "productId": "1001",
  "productName": "Nike Air Example",
  "colorName": "Black",
  "size": "42",
  "quantity": 1,
  "type": "RETURN",
  "reason": "Wrong size",
  "note": "Need exchange if possible",
  "images": []
}
```

### Update Return Status Request

```json
{
  "status": "APPROVED",
  "adminNote": "Approved after inspection"
}
```

## 11. Wishlist

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/wishlist/user/:userId` | Public in current code | Get user wishlist |
| POST | `/wishlist` | Public in current code | Add wishlist item |
| DELETE | `/wishlist/:id` | Public in current code | Remove by wishlist id |
| DELETE | `/wishlist/user/:userId/product/:productId` | Public in current code | Remove by user/product |

### Add Wishlist Request

```json
{
  "userId": "665000000000000000000001",
  "productId": "1001",
  "colorName": "Black",
  "size": "42",
  "notifyOnRestock": true
}
```

## 12. Chat

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/chat/conversations` | Public | Create or get conversation |
| GET | `/chat/conversations` | Public in current code | List conversations |
| GET | `/chat/conversations/:id` | Public in current code | Get conversation |
| POST | `/chat/conversations/:id/messages` | Public in current code | Add message |
| PATCH | `/chat/conversations/:id/status` | Public in current code | Update conversation status |
| PATCH | `/chat/conversations/:id/read` | Public in current code | Mark read |

### Create Conversation Request

```json
{
  "userId": "",
  "guestId": "guest-browser-id",
  "customerName": "Guest",
  "customerEmail": ""
}
```

### Add Message Request

```json
{
  "senderType": "user",
  "senderName": "Guest",
  "text": "Do you have this shoe in size 42?"
}
```

## 13. Analytics

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/analytics/overview` | Public in current code | Revenue/order/product overview |

## 14. R2 Media

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/r2/folders` | Public in current code | List product folders |
| GET | `/r2/subfolders?folder=...` | Public in current code | List subfolders |
| GET | `/r2/media?folder=...&subfolder=...` | Public in current code | List images/videos |
| GET | `/r2/images?folder=...&subfolder=...` | Public in current code | List images |
| GET | `/r2/generate-urls?productSlug=...&styleCode=...&colorName=...&count=5` | Public in current code | Generate predictable public URLs |

## 15. Error Behavior

Nest returns standard error objects for thrown exceptions, for example:

```json
{
  "message": "User with ID \"...\" not found",
  "error": "Not Found",
  "statusCode": 404
}
```

Recommended future standard is documented in [design/api-design.md](design/api-design.md).
