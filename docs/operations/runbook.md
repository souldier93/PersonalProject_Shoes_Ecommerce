# Runbook

## 1. Local Setup

### Prerequisites

- Docker Desktop
- Node.js 22+
- npm
- MongoDB and Redis locally, or Docker Compose services

### Environment Files

```powershell
Copy-Item nike-store-nest-js\.env.example nike-store-nest-js\.env
Copy-Item tailwind4-vue3-nikeStore\.env.example tailwind4-vue3-nikeStore\.env
```

Edit backend secrets in `nike-store-nest-js\.env`.

Minimum local backend values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/nike-store
MONGO_DB_NAME=nike-store
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change-me-to-a-long-random-secret
INIT_USER_USERNAME=admin
INIT_USER_PASSWORD=change-this-password
INIT_USER_EMAIL=admin@example.com
INIT_USER_ROLE=admin
```

## 2. Start Locally with Docker

```powershell
docker compose up --build
```

Check:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/shoes
docker exec shoes-redis redis-cli PING
```

URLs:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:8080` |
| Backend | `http://localhost:3000` |
| MongoDB | `mongodb://localhost:27017/nike-store` |
| Redis | `redis://localhost:6379/0` |

## 3. Start Locally Without Docker

Backend:

```powershell
cd nike-store-nest-js
npm install
npm run start:dev
```

Frontend:

```powershell
cd tailwind4-vue3-nikeStore
npm install
npm run dev
```

## 4. Seed Data

With Docker backend already built:

```powershell
docker exec shoes-backend node dist/seed-initial-user.js
docker exec shoes-backend node dist/seed-nike-products.js
```

Without Docker:

```powershell
cd nike-store-nest-js
npm run seed:initial-user
npm run seed:nike
```

Optional catalog/R2 scripts:

```powershell
npm run seed:nike:catalog
npm run seed:nike:r2
```

## 5. Smoke Test

```powershell
.\scripts\local\smoke-test.ps1 -BackendUrl http://localhost:3000 -FrontendUrl http://localhost:8080
```

The smoke test checks:

1. `GET /health`
2. `GET /shoes`
3. `POST /chat/conversations`
4. Frontend HTTP status

## 6. Deploy

### Docker Compose Host

```powershell
docker compose pull
docker compose up -d --build
docker compose logs -f backend
```

### Azure Container Apps

Use GitHub Actions workflow `Deploy Azure Container Apps`.

Dry run is enabled by default. To deploy, set:

```text
dry_run=false
confirm_cost=DEPLOY_AZURE
```

Required GitHub secrets include Azure credentials, ACR name, Mongo URI, Redis URL, JWT secret, PayOS secrets, and R2 secrets.

### AWS ECS

Use GitHub Actions workflow `Deploy AWS ECR and ECS`.

Required inputs:

```text
aws_region
ecs_cluster
backend_service
backend_container
frontend_api_base_url
```

Required GitHub secret:

```text
AWS_ROLE_TO_ASSUME
```

## 7. Rollback

| Platform | Rollback Steps |
| --- | --- |
| Docker Compose | Checkout previous commit/image tag, run `docker compose up -d --build` |
| Azure Container Apps | Revert to previous revision or update image to previous tag |
| AWS ECS | Re-deploy previous ECS task definition revision |
| MongoDB | Restore latest known-good backup |

## 8. Backup and Restore

Backup MongoDB:

```powershell
docker exec shoes-mongo mongodump --archive=/tmp/nike-store.archive --db=nike-store
docker cp shoes-mongo:/tmp/nike-store.archive .\backup\nike-store.archive
```

Restore MongoDB:

```powershell
docker cp .\backup\nike-store.archive shoes-mongo:/tmp/nike-store.archive
docker exec shoes-mongo mongorestore --drop --archive=/tmp/nike-store.archive
```

## 9. Incident Response

### Backend Down

1. Check container status: `docker compose ps`.
2. Check logs: `docker compose logs backend`.
3. Verify env file exists and `MONGO_URI` is reachable.
4. Verify `/health` after restart.

### MongoDB Down

1. Check `docker compose logs mongo`.
2. Confirm volume is mounted.
3. Restart Mongo container.
4. Restore from backup if data volume is corrupt.

### Redis Down or Stale Catalog Cache

1. Check `docker compose logs redis`.
2. Confirm Redis responds with `docker exec shoes-redis redis-cli PING`.
3. Restart Redis if needed: `docker compose restart redis`.
4. If local catalog data is stale after manual data changes, clear local cache with `docker exec shoes-redis redis-cli FLUSHDB`.
5. Redis failure should only degrade catalog performance; MongoDB remains the source of truth.

### Payment Webhook Failing

1. Check provider dashboard event logs.
2. Confirm public webhook URL.
3. Confirm `PAYOS_CHECKSUM_KEY` or `STRIPE_WEBHOOK_SECRET`.
4. Replay sandbox webhook if provider supports replay.
5. Check order status and stock mutation before manual correction.

### Stock Incorrect

1. Inspect `shoesDetail` nested stock for product/color/size.
2. Inspect `stockMovements` for manual adjustments.
3. Inspect related `bills.statusHistory`.
4. Apply correction through `POST /inventory/adjust` so an audit row is created.

### Email Not Sending

1. Confirm `EMAIL_USER` and `EMAIL_PASSWORD`.
2. Confirm Gmail app password, not account password.
3. Check backend logs for Nodemailer errors.
4. Email failures do not block order state updates.

## 10. Operational Checks

Daily:

- Check backend health.
- Check recent failed payment webhooks.
- Check Mongo disk usage/backups.
- Check Redis availability and cache error logs.
- Check new return requests.

Before release:

- Run backend tests.
- Build frontend.
- Build Docker images.
- Run smoke test.
- Verify payment sandbox flow.
- Verify admin login and product list.
