# CI/CD Setup

## Workflows

- `container-ci.yml`: builds backend and frontend Docker images for validation.
- `deploy-azure-container-apps.yml`: manual Azure deployment with a cost guard.
- `deploy-aws-ecr-ecs.yml`: AWS template workflow, not enabled automatically.

## Azure Deploy Safety

The Azure workflow defaults to dry run. Dry run installs dependencies and builds both apps without changing Azure.

To deploy intentionally:

1. Open GitHub Actions.
2. Run `Deploy Azure Container Apps`.
3. Set `dry_run` to `false`.
4. Set `confirm_cost` to `DEPLOY_AZURE`.

Required GitHub secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_ACR_NAME`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET`
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_PUBLIC_URL`

## Recommended Environments

- `staging`: test cloud deployments.
- `production`: only promote after smoke tests pass.

Smoke tests:

```powershell
Invoke-RestMethod https://<backend-url>/health
Invoke-RestMethod https://<backend-url>/shoes
```
