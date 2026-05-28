# Tech Stack Doc

## 1. Summary

Shoes Ecommerce uses a JavaScript/TypeScript web stack optimized for fast local development, modular backend domains, and container-based deployment.

| Layer | Choice | Version Source | Why |
| --- | --- | --- | --- |
| Frontend framework | Vue | `vue ^3.5.24` | Lightweight SPA, simple component model, good Vite support |
| Frontend build | Vite | `vite ^7.2.2` | Fast dev server and production build |
| Styling | Tailwind CSS | `tailwindcss ^4.1.17` | Utility-first styling for ecommerce UI |
| Router | Vue Router | `vue-router ^4.6.3` | SPA routing and route guards |
| Client state | Pinia | `pinia ^3.0.4` | Vue-native state store; current app still uses local storage heavily |
| Backend framework | NestJS | `@nestjs/core ^11.0.1` | Modular backend architecture with DI, guards, pipes |
| Language | TypeScript | `typescript ^5.7.3` | Type safety for backend modules |
| Database ODM | Mongoose | `mongoose ^8.19.3` | MongoDB schema modeling and indexes |
| Database | MongoDB | Docker image `mongo:7` | Document model fits product variants and order snapshots |
| Cache | Redis | Docker image `redis:7-alpine`, `ioredis` | Low-latency product catalog cache with TTL and write invalidation |
| Auth | Passport JWT | `passport-jwt ^4.0.1`, `@nestjs/jwt ^11.0.1` | Bearer token authentication |
| Password hashing | bcrypt | `bcrypt ^6.0.0` | Password hashing |
| Payment | PayOS, Stripe | `stripe ^22.1.1` | Vietnam QR/bank transfer plus international card support |
| Object storage | Cloudflare R2 | AWS SDK S3 client `@aws-sdk/client-s3 ^3.937.0` | S3-compatible media storage |
| Email | Nodemailer | `nodemailer ^7.0.11` | Gmail SMTP order/verification emails |
| Containers | Docker Compose | `docker-compose.yml` | Reproducible local and container deployment |
| Gateway | Nginx | `nginx:1.27-alpine` in microservice compose | Static SPA serving and API routing |

## 2. Backend Dependencies

| Package | Purpose |
| --- | --- |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | NestJS runtime |
| `@nestjs/config` | Environment configuration |
| `@nestjs/mongoose` | MongoDB integration |
| `ioredis` | Redis client for product catalog cache |
| `@nestjs/passport`, `passport`, `passport-jwt` | JWT auth strategy |
| `@nestjs/jwt` | JWT signing |
| `class-validator`, `class-transformer` | DTO validation with global `ValidationPipe` |
| `@nestjs/axios`, `axios` | HTTP provider calls |
| `@aws-sdk/client-s3` | R2 object listing through S3 API |
| `stripe` | Stripe PaymentIntents, webhooks, refunds |
| `nodemailer` | Email delivery |
| `multer` | File upload support dependency, though current R2 APIs list existing media |

## 3. Frontend Dependencies

| Package | Purpose |
| --- | --- |
| `axios` | REST calls |
| `@stripe/stripe-js` | Stripe client payment confirmation |
| `qrcode`, `qrcode.vue` | PayOS QR display |
| `vue-virtual-scroller` | Large catalog list performance |
| `@tailwindcss/vite` | Tailwind 4 Vite integration |

## 4. Runtime Versions

| Runtime | Current Requirement |
| --- | --- |
| Node.js | README requires Node.js 22+ |
| MongoDB | Docker image `mongo:7` |
| Redis | Docker image `redis:7-alpine` |
| Nginx | Frontend Dockerfile and gateway use Nginx |

## 5. Environment Variables

Backend env file: `nike-store-nest-js/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Backend port, default `3000` |
| `NODE_ENV` | Yes | Runtime mode |
| `MONGO_URI` | Yes | Mongo connection string |
| `MONGO_DB_NAME` | Yes | Database name, default `nike-store` |
| `REDIS_ENABLED` | Optional | Set `false` to disable Redis cache |
| `REDIS_URL` | Optional | Redis connection string; compose uses `redis://redis:6379/0` |
| `REDIS_PRODUCTS_TTL_SECONDS` | Optional | Product cache TTL, default `300` seconds |
| `BACKEND_URL` | Yes for email | Public backend URL used in verification link |
| `FRONTEND_URL` | Yes for email/payment | Public frontend URL |
| `JWT_SECRET` | Yes | JWT signing secret |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Optional | Gmail SMTP credentials |
| `ORDER_NOTIFICATION_EMAIL` | Optional | BCC/store notification address |
| `EMAIL_VERIFICATION_REQUIRED` | Optional | Enables verification flow |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | Required for PayOS | Payment link and webhook verification |
| `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL` | Required for PayOS UX | Redirect URLs |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY` | Required for Stripe | Payment intent, webhook, and currency |
| `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | Required for R2 | Media browser and URL generation |
| `INIT_USER_*` | Required for seeding | Initial admin user |

Frontend env file: `tailwind4-vue3-nikeStore/.env`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe browser publishable key |

## 6. Rationale

| Decision | Reason |
| --- | --- |
| Vue SPA instead of SSR | Ecommerce UI is interactive and already client-heavy; static Nginx hosting is simple |
| NestJS modular monolith | Clear modules without distributed-system overhead |
| MongoDB | Product variants and order snapshots are nested document structures |
| Redis | Product listing/detail reads are frequent and safe to cache with short TTL plus invalidation on product, stock, and payment writes |
| R2 | Product media can be stored cheaply and served by public URLs |
| PayOS + Stripe | Supports local Vietnam payment behavior and card payment fallback |
| Docker Compose | One-command local stack with MongoDB and Redis |

## 7. Upgrade Guidance

1. Keep Node and npm lockfiles aligned with CI by using `npm ci`.
2. Run `npm audit` separately for backend and frontend before production release.
3. Test payment provider SDK upgrades in sandbox mode first.
4. Avoid changing Mongo schema field names without migration scripts.
5. If adding OpenAPI, prefer Nest Swagger decorators over hand-maintained endpoint docs.
