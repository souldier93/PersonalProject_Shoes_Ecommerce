# System Architecture Diagram

## Current Modular Monolith

```mermaid
flowchart TB
  subgraph Client["Client Layer"]
    Customer["Customer SPA"]
    Admin["Admin SPA"]
  end

  subgraph Frontend["Frontend Container"]
    Vue["Vue 3 + Vite build"]
    NginxStatic["Nginx static hosting"]
  end

  subgraph Backend["NestJS Monolith"]
    AppModule["AppModule"]
    Auth["AuthModule"]
    Shoes["ShoesModule"]
    Payments["PaymentModule"]
    Coupons["CouponsModule"]
    Inventory["InventoryModule"]
    Reviews["ReviewsModule"]
    Returns["ReturnsModule"]
    Wishlist["WishlistModule"]
    Chat["ChatModule"]
    Analytics["AnalyticsModule"]
    R2Module["R2Module"]
  end

  subgraph Data["Data and External Services"]
    Mongo[(MongoDB)]
    Redis[(Redis Cache)]
    R2[(Cloudflare R2)]
    PayOS["PayOS API"]
    Stripe["Stripe API"]
    Gmail["Gmail SMTP"]
  end

  Customer --> NginxStatic
  Admin --> NginxStatic
  NginxStatic --> Vue
  Vue -->|REST| AppModule
  AppModule --> Auth
  AppModule --> Shoes
  AppModule --> Payments
  AppModule --> Coupons
  AppModule --> Inventory
  AppModule --> Reviews
  AppModule --> Returns
  AppModule --> Wishlist
  AppModule --> Chat
  AppModule --> Analytics
  AppModule --> R2Module
  Auth --> Mongo
  Shoes --> Mongo
  Shoes --> Redis
  Payments --> Mongo
  Payments --> Redis
  Coupons --> Mongo
  Inventory --> Mongo
  Inventory --> Redis
  Reviews --> Mongo
  Returns --> Mongo
  Wishlist --> Mongo
  Chat --> Mongo
  Analytics --> Mongo
  R2Module --> R2
  Payments --> PayOS
  Payments --> Stripe
  Payments --> Gmail
  PayOS -->|Webhook| Payments
  Stripe -->|Webhook| Payments
```

## Docker Compose Architecture

```mermaid
flowchart LR
  Browser -->|http://localhost:8080| Frontend["shoes-frontend:80"]
  Browser -->|http://localhost:3000| Backend["shoes-backend:3000"]
  Backend --> Mongo["shoes-mongo:27017"]
  Backend --> Redis["shoes-redis:6379"]
  Backend --> Providers["PayOS / Stripe / R2 / Gmail"]
  Frontend -. API base can point to .-> Backend
```

## Microservice-Ready Gateway Architecture

The current `docker-compose.microservices.yml` keeps the backend as one service, but introduces a gateway that can later route modules to extracted services.

```mermaid
flowchart TB
  Browser --> Gateway["Nginx Gateway :8081"]
  Gateway -->|/| Frontend["frontend"]
  Gateway -->|/api/auth| AuthOrMonolith["backend monolith today, auth-service later"]
  Gateway -->|/api/shoes| CatalogOrMonolith["backend monolith today, catalog-service later"]
  Gateway -->|/api/payments| OrderOrMonolith["backend monolith today, order-service later"]
  Gateway -->|/api/inventory| InventoryOrMonolith["backend monolith today, inventory-service later"]
  Gateway -->|/api/chat| ChatOrMonolith["backend monolith today, chat-service later"]
  AuthOrMonolith --> Mongo[(MongoDB)]
  CatalogOrMonolith --> Mongo
  CatalogOrMonolith --> Redis[(Redis Cache)]
  OrderOrMonolith --> Mongo
  OrderOrMonolith --> Redis
  InventoryOrMonolith --> Mongo
  InventoryOrMonolith --> Redis
  ChatOrMonolith --> Mongo
```

## Recommended Future Service Split

| Service | Owns | Extract When |
| --- | --- | --- |
| Identity Service | Users, roles, JWT/session policy | Admin/user management needs independent scaling or stricter security boundary |
| Catalog Service | Shoes, categories, R2 media metadata | Product search/filter volume grows |
| Order Service | Bills, fulfillment, returns, reviews eligibility | Payment/order workflows need independent release cycle |
| Payment Service | PayOS/Stripe integration and webhook verification | Provider logic becomes complex or needs PCI-oriented isolation |
| Inventory Service | Stock and movements | Real-time stock reservations or warehouse integration appears |
| Support Service | Chat conversations | Chat moves to WebSocket or external support integration |
| Analytics Service | Aggregated metrics | Reporting workloads affect transactional APIs |
