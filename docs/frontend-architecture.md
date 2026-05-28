# Frontend Architecture

## 1. Overview

The frontend is a Vue 3 single-page application built with Vite and styled with Tailwind CSS. It serves customer storefront pages and admin operations from the same app.

## 2. Routing

Routes are defined in `tailwind4-vue3-nikeStore/src/router/index.js`.

| Route | Component | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/products` | AllShoes | Public |
| `/shoes/:id` | ShoesDetail | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/bag` | Bag | Public |
| `/checkout` | GuestCheckout | Public |
| `/payment` | Payment | Public |
| `/my-orders` | MyOrders | Public/member with guest lookup |
| `/wishlist` | Wishlist | Requires local user |
| `/profile` | Profile | Requires local user |
| `/admin/*` | Admin views | Requires local `admin` or `manager` role |

Frontend guards are for UX only. Backend authorization must enforce real access control.

## 3. Component Areas

| Area | Files |
| --- | --- |
| Home | `src/components/home` |
| Catalog listing | `src/components/home/allShoes/AllShoes.vue` |
| Product detail | `src/components/shoesDetail/ShoesDetail.vue` |
| Header/account/cart | `src/components/header` |
| Checkout/payment | `src/components/header/bag` |
| Chat widget | `src/components/chat/ChatWidget.vue` |
| Admin dashboard | `src/views/admin/Dashboard.vue` |
| Admin products | `src/views/admin/Products.vue`, `src/views/admin/crud/AddProductForm.vue` |
| Admin orders/returns | `src/views/admin/Purchases.vue` |
| Admin inventory | `src/views/admin/Inventory.vue` |
| Admin users | `src/views/admin/Users.vue` |
| Admin chat | `src/views/admin/ChatSupport.vue` |
| Admin analytics | `src/views/admin/Analytics.vue` |
| Admin coupons/settings | `src/views/admin/Settings.vue` |

## 4. API Layer

| File | Purpose |
| --- | --- |
| `src/utils/apiBase.js` | Reads `VITE_API_BASE_URL`, fallback `http://localhost:3000` |
| `src/utils/axios.js` | Axios instance with bearer token interceptor and 401 handling |

Some components use raw `axios` or `fetch` directly. Recommended improvement: centralize all backend calls through the shared Axios instance.

## 5. Local State

| State | Storage |
| --- | --- |
| Auth token and user | `localStorage` |
| Cart/bag | `localStorage` through bag utilities |
| Wishlist update events | Browser custom event utilities |
| Chat guest identity | `localStorage` via chat identity utility |

## 6. Build and Serve

Development:

```powershell
cd tailwind4-vue3-nikeStore
npm run dev
```

Production build:

```powershell
npm run build
```

Container runtime uses Nginx with SPA fallback:

```nginx
try_files $uri $uri/ /index.html;
```

## 7. Frontend Improvement Backlog

1. Use one API client everywhere.
2. Move token storage from localStorage to secure cookie flow when backend supports it.
3. Add E2E tests for checkout, product CRUD, and admin order management.
4. Add route-level loading/error boundaries.
5. Add accessibility checks for forms, dialogs, and admin tables.
