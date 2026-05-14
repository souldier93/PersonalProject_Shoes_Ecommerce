# No-Billing Cloud Plan

This project should not create or update paid cloud resources automatically.

## Safe Defaults

- GitHub Azure deploy workflow defaults to `dry_run: true`.
- Real Azure deployment requires both:
  - `dry_run: false`
  - `confirm_cost: DEPLOY_AZURE`
- Local scripts are templates. Run them only when you intentionally want to change cloud resources.
- Keep Azure Container Apps on the Consumption plan with `min-replicas=0` for low-traffic testing.
- Do not add private endpoints, dedicated workload profiles, always-on replicas, Service Bus, Key Vault, or Application Insights until you are ready to accept their billing model.

## Current Safe Path

1. Use local Docker for development:

```powershell
docker compose up --build
```

2. Use GitHub Actions `container-ci.yml` for build validation.
3. Use `Deploy Azure Container Apps` workflow only in dry-run mode unless you explicitly approve cloud changes.
4. Use MongoDB Atlas and Cloudflare R2 free/low-usage settings carefully and monitor usage in their dashboards.

## Cost Controls To Check Before Any Real Deploy

- Container Apps backend/frontend minimum replicas should be `0`.
- Avoid extra Azure resources unless needed.
- Remove unused revisions and old container images.
- Keep ACR Basic only while actively using it.
- Set Azure budget alerts in Cost Management before further cloud work.

## Stop Or Scale Down Existing Azure Apps

Use the helper script when you want to reduce running compute usage:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\azure\scale-container-apps-to-zero.ps1 -ResourceGroup shoes-rg
```

This updates existing Container Apps to allow scale-to-zero. It does not delete resources.
