# Shoes Ecommerce

Full-stack Nike-style shoe ecommerce application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (Composition API) + Vite 7 + TailwindCSS 4 |
| State | Pinia 3 |
| Backend | NestJS 11 (Node.js/TypeScript) |
| Database | MongoDB 7 + Mongoose 8 |
| Cache | Redis 7 + ioredis |
| Payments | PayOS (VN) + Stripe |
| Media | Cloudflare R2 (S3-compatible) |
| Email | Nodemailer (Gmail SMTP) |
| Containers | Docker + docker-compose |

## Features

### Storefront
- **Product browsing**: Home page with hero slider, featured products, shop-by-sport, color-of-season sections
- **Product listing**: Filter by category, color, price; virtual scrolling for large catalogs
- **Product detail**: Color/size selector, image gallery, real-time stock check, reviews
- **Shopping cart**: LocalStorage-based bag with server sync for logged-in users
- **Guest checkout**: Full checkout flow without registration — enter name, email, phone, address
- **Dual payment**: PayOS (Vietnamese bank transfer/QR) or Stripe (international cards)
- **Order tracking**: Lookup by email + order code (guest) or account history (logged-in)
- **Wishlist**: Save products with optional restock notifications
- **Product reviews**: Star rating, text, and image uploads (verified purchase)
- **Returns/exchanges**: Submit return, exchange, or refund requests with reasons and images
- **Live chat**: Floating chat widget for customer support

### Admin Panel
- **Dashboard**: Revenue, orders, and product overview
- **Product management**: Full CRUD with multi-color variants; R2 media browser integration
- **Order management**: View all orders, update fulfillment status (Confirmed → Packing → Shipping → Delivered)
- **Inventory**: Stock overview, manual adjustments with audit trail
- **Coupons**: Percentage or fixed-value promo codes with usage limits and validity periods
- **User management**: List users, assign roles
- **Live chat support**: View and reply to customer conversations
- **Analytics**: Sales metrics and reports

## Project Structure

```
Shoes-Ecommerce/
├── nike-store-nest-js/          # Backend (NestJS)
│   ├── src/
│   │   ├── auth/                # Users, roles, JWT auth, email verification
│   │   ├── shoes/               # Product catalog
│   │   ├── payment/             # Orders, PayOS/Stripe, fulfillment
│   │   ├── inventory/           # Stock movements
│   │   ├── coupons/             # Promo codes
│   │   ├── reviews/             # Product reviews
│   │   ├── returns/             # Return/exchange requests
│   │   ├── wishlist/            # User wishlist
│   │   ├── chat/                # Live chat support
│   │   ├── analytics/           # Dashboard metrics
│   │   └── r2/                  # Cloudflare R2 media API
│   ├── Dockerfile
│   └── package.json
│
├── tailwind4-vue3-nikeStore/    # Frontend (Vue 3)
│   ├── src/
│   │   ├── views/               # Page views (admin/)
│   │   ├── components/          # Reusable components
│   │   │   ├── home/            # Home, AllShoes, Slide, Featured
│   │   │   ├── header/          # Header, Login, Register, Bag, Checkout
│   │   │   ├── shoesDetail/     # Product detail page
│   │   │   ├── chat/            # Chat widget
│   │   │   └── footer/          # Footer
│   │   ├── router/              # Vue Router config
│   │   └── utils/               # Axios, cart, wishlist helpers
│   ├── Dockerfile
│   └── nginx.conf
│
├── docs/                        # Documentation
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── frontend-architecture.md
│   ├── features-guide.md
│   ├── microservices-roadmap.md
│   ├── cloud-deployment.md
│   ├── cicd-setup.md
│   ├── requirements/             # Business & user requirements
│   │   ├── brd.md
│   │   ├── srs.md
│   │   ├── user-stories.md
│   │   ├── acceptance-criteria.md
│   │   └── use-case-model.md
│   ├── design/                   # System architecture & design
│   │   ├── hld.md
│   │   ├── lld.md
│   │   ├── erd.md
│   │   ├── architecture-diagram.md
│   │   ├── sequence-diagrams.md
│   │   └── api-design.md
│   ├── technical/                # Technical specifications
│   │   ├── tech-stack.md
│   │   ├── data-flow.md
│   │   ├── deployment-architecture.md
│   │   ├── security-design.md
│   │   └── integration-doc.md
│   └── operations/               # Operations & testing
│       ├── runbook.md
│       ├── test-plan.md
│       └── changelog.md
│
├── services/                    # Microservice extraction scaffold
│   ├── api-gateway/
│   └── catalog-service/
│
├── scripts/                     # Build & deployment scripts
├── infra/                       # IaC templates (AWS/Azure)
├── .github/workflows/           # CI/CD pipelines
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js 22+

### 1. Clone and set up environment

```powershell
Copy-Item nike-store-nest-js\.env.example nike-store-nest-js\.env
Copy-Item tailwind4-vue3-nikeStore\.env.example tailwind4-vue3-nikeStore\.env
```

### 2. Configure backend (.env)

Edit `nike-store-nest-js\.env` with your values:

```env
JWT_SECRET=your-random-secret
MONGO_URI=mongodb://mongo:27017/nike-store
REDIS_URL=redis://redis:6379/0
REDIS_PRODUCTS_TTL_SECONDS=300
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
R2_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY=your-r2-access-key
R2_SECRET_KEY=your-r2-secret-key
R2_PUBLIC_URL=your-r2-public-url
EMAIL_USER=your-gmail
EMAIL_PASSWORD=your-app-password
```

### 3. Run with Docker

```powershell
docker compose up --build
```

### 4. Access the application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017/nike-store
- **Redis**: redis://localhost:6379/0

### 5. Seed initial data

```powershell
# Seed admin user and roles
docker exec shoes-backend node dist/seed-initial-user.js

# Seed Nike product catalog
docker exec shoes-backend node dist/seed-nike-products.js
```

### 6. Login as admin

- **Username**: `admin`
- **Password**: (set in `INIT_USER_PASSWORD` env var)

## Development (without Docker)

### Backend

```powershell
cd nike-store-nest-js
npm install
npm run start:dev
```

### Frontend

```powershell
cd tailwind4-vue3-nikeStore
npm install
npm run dev
```

## API Overview

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/auth` | login, register, profile, users, roles |
| Shoes | `/shoes` | product listing, detail, stock check |
| Payments | `/payments` | create payment, order tracking, webhooks |
| Chat | `/chat` | conversations, messages |
| Inventory | `/inventory` | stock overview, adjustments |
| Returns | `/returns` | create/list returns |
| Reviews | `/reviews` | product reviews |
| Wishlist | `/wishlist` | user wishlist CRUD |
| Coupons | `/coupons` | create/validate coupons |
| Analytics | `/analytics` | dashboard metrics |
| R2 | `/r2` | media folders and URLs |

Full API reference: [docs/api-reference.md](docs/api-reference.md)

## Documentation

### Requirements
- [BRD](docs/requirements/brd.md) — Business Requirements Document
- [SRS](docs/requirements/srs.md) — Software Requirements Specification (15 FR, 6 NFR)
- [User Stories](docs/requirements/user-stories.md) — 49 user stories, use cases, actor hierarchy
- [Acceptance Criteria](docs/requirements/acceptance-criteria.md) — Per-epic acceptance criteria

### Design
- [HLD](docs/design/hld.md) — High-Level Design, ADR, module graph, deployment topology
- [LLD](docs/design/lld.md) — Low-Level Design: class diagrams, function signatures, algorithms
- [ERD](docs/design/erd.md) — Entity Relationship Diagram (13 MongoDB collections)
- [Architecture Diagram](docs/design/architecture-diagram.md) — System architecture diagrams
- [Sequence Diagrams](docs/design/sequence-diagrams.md) — Key end-to-end flow diagrams
- [All UC Sequence Diagrams](docs/design/sequence-diagrams-all-uc.md) — Sequence diagrams for UC-01..UC-76
- [Class Diagrams](docs/design/class-diagrams.md) — Overall class diagram and class diagrams for UC-01..UC-76
- [Use Case Diagrams](docs/design/usecase-diagrams.md) — Master and per-category use case diagrams
- [API Design](docs/design/api-design.md) — API conventions, auth, validation, webhook security

### Technical
- [Tech Stack](docs/technical/tech-stack.md) — Complete technology stack with versions
- [Data Flow](docs/technical/data-flow.md) — DFD Level 0, 1, 2 for key processes
- [Deployment Architecture](docs/technical/deployment-architecture.md) — Docker, AWS, Azure setups
- [Security Design](docs/technical/security-design.md) — Auth, RBAC, webhook security, data protection
- [Integration Doc](docs/technical/integration-doc.md) — PayOS, Stripe, R2, Email, Counter integration

### Operations
- [Runbook](docs/operations/runbook.md) — Setup, deploy, incident response, backup, scaling
- [Test Plan](docs/operations/test-plan.md) — Unit/Integration/E2E test cases, NFR tests
- [Changelog](docs/operations/changelog.md) — Version history and release notes

### Existing Docs
- [API Reference](docs/api-reference.md) — Complete REST API documentation
- [Database Schema](docs/database-schema.md) — MongoDB models and relationships
- [Frontend Architecture](docs/frontend-architecture.md) — Vue.js components and routing
- [Features Guide](docs/features-guide.md) — End-user feature manual
- [Microservices Roadmap](docs/microservices-roadmap.md) — Future service extraction plan
- [Cloud Deployment](docs/cloud-deployment.md) — AWS and Azure deployment guides
- [CI/CD Setup](docs/cicd-setup.md) — GitHub Actions pipeline configuration

## License

MIT
