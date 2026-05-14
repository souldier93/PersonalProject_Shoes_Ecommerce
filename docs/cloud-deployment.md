# Cloud Deployment Guide

This project is now prepared for container deployment.

## Local Docker Run

1. Copy environment files:

```powershell
Copy-Item nike-store-nest-js\.env.example nike-store-nest-js\.env
Copy-Item tailwind4-vue3-nikeStore\.env.example tailwind4-vue3-nikeStore\.env
```

2. Fill real values in `nike-store-nest-js/.env`:

- `JWT_SECRET`
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_PUBLIC_URL`

3. Run the stack:

```powershell
docker compose up --build
```

4. Open:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- MongoDB: `mongodb://localhost:27017/nike-store`

## AWS Target Architecture

- Frontend container or static build: S3 + CloudFront, or Amplify Hosting.
- Backend container: ECS Fargate service.
- Database: MongoDB Atlas on AWS, or Amazon DocumentDB after compatibility testing.
- Media: keep Cloudflare R2 or move to S3.
- Secrets: AWS Secrets Manager.
- CI/CD: GitHub Actions builds Docker images, pushes to ECR, deploys ECS service.

Recommended first AWS path:

1. Create ECR repositories:
   - `shoes-backend`
   - `shoes-frontend`
2. Push Docker images to ECR.
3. Create ECS Fargate cluster.
4. Create backend service with environment variables from Secrets Manager.
5. Put backend behind an Application Load Balancer.
6. Deploy frontend to S3 + CloudFront or as a container behind the same ALB.
7. Set `VITE_API_BASE_URL` to the backend public URL, or use `/api` when frontend proxy is used.

## Azure Target Architecture

- Frontend: Azure Static Web Apps, Azure Blob static website, or the Nginx container.
- Backend: Azure Container Apps.
- Database: MongoDB Atlas on Azure.
- Media: keep Cloudflare R2 or move to Azure Blob Storage.
- Secrets: Azure Key Vault or Container App secrets.
- CI/CD: GitHub Actions builds Docker images, pushes to Azure Container Registry, deploys Container Apps.

Recommended first Azure path:

1. Create Azure Container Registry.
2. Push backend and frontend images.
3. Create an Azure Container Apps environment.
4. Create backend Container App with `MONGO_URI`, R2, PayOS, JWT secrets.
5. Create frontend Container App with `VITE_API_BASE_URL=/api`, or deploy Vue build to Azure Static Web Apps.
6. Add custom domain and HTTPS after smoke tests pass.

## Smoke Tests

After any deployment:

```powershell
Invoke-RestMethod http://<backend-url>/shoes
Invoke-RestMethod -Method Post http://<backend-url>/chat/conversations -ContentType 'application/json' -Body '{"guestId":"smoke","customerName":"Smoke Test"}'
```

Frontend checks:

- Home page loads products.
- Product detail loads colors/images from R2.
- Bag is scoped per account.
- Checkout creates payment.
- Admin pages load dashboard, products, purchases, inventory, chat.
