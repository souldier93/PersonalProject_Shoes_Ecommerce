# Catalog Service Extraction

This is the first recommended microservice extraction because product browsing and stock reads are high-traffic but lower-risk than checkout.

## Current Endpoints To Own

- `GET /shoes`
- `GET /shoes/product/:productId`
- `GET /shoes/detail/:productId`
- `GET /shoes/details`
- `GET /shoes/:productId/stock/:colorName/:size`
- `POST /shoes/check-stock-batch`
- `GET /inventory/overview`
- `POST /inventory/adjust`

## Phase 1: Gateway Without Splitting Code

Use `services/api-gateway/nginx.conf` to keep frontend paths stable while still routing everything to the existing backend.

## Phase 2: Extract Reads

Move product read models and stock check endpoints into `catalog-service`.

Keep writes in the monolith until order/payment consistency is protected.

## Phase 3: Events

When order checkout is stable, publish events:

- `OrderPaid`
- `StockReserved`
- `StockAdjusted`
- `ProductUpdated`

Do not add Azure Service Bus or Event Grid until billing is approved. For local development, use an in-process event log or Docker-only message broker.
