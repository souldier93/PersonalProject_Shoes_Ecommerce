param(
  [string]$ResourceGroup = "shoes-rg",
  [string]$Location = "southeastasia",
  [string]$RegistryName = "shoesregistry$((Get-Random -Maximum 99999))",
  [string]$EnvironmentName = "shoes-env",
  [string]$BackendAppName = "shoes-backend",
  [string]$FrontendAppName = "shoes-frontend",
  [string]$BackendEnvPath = ".\nike-store-nest-js\.env"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name is not installed or is not in PATH."
  }
}

function Read-EnvFile($path) {
  $values = @{}
  if (-not (Test-Path $path)) {
    throw "Missing env file: $path"
  }

  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }
    $key, $value = $line.Split("=", 2)
    $values[$key.Trim()] = $value.Trim().Trim('"').Trim("'")
  }
  return $values
}

function Require-Env($values, $key) {
  if (-not $values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($values[$key])) {
    throw "Missing required backend env value: $key"
  }
  return $values[$key]
}

Assert-Command az
Assert-Command docker

$envValues = Read-EnvFile $BackendEnvPath
$requiredKeys = @(
  "MONGO_URI",
  "JWT_SECRET",
  "PAYOS_CLIENT_ID",
  "PAYOS_API_KEY",
  "PAYOS_CHECKSUM_KEY",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY",
  "R2_SECRET_KEY",
  "R2_PUBLIC_URL"
)
$requiredKeys | ForEach-Object { Require-Env $envValues $_ | Out-Null }

Write-Host "Creating Azure resource group..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "Creating Azure Container Registry..." -ForegroundColor Cyan
az acr create `
  --resource-group $ResourceGroup `
  --name $RegistryName `
  --sku Basic `
  --admin-enabled true | Out-Null

Write-Host "Logging Docker into ACR..." -ForegroundColor Cyan
az acr login --name $RegistryName | Out-Null
$registryServer = "$RegistryName.azurecr.io"

Write-Host "Building and pushing backend image..." -ForegroundColor Cyan
docker build -t "$registryServer/shoes-backend:latest" .\nike-store-nest-js
docker push "$registryServer/shoes-backend:latest"

Write-Host "Creating Container Apps environment..." -ForegroundColor Cyan
az containerapp env create `
  --name $EnvironmentName `
  --resource-group $ResourceGroup `
  --location $Location | Out-Null

$acrPassword = az acr credential show `
  --name $RegistryName `
  --query "passwords[0].value" `
  --output tsv

Write-Host "Creating/updating backend Container App..." -ForegroundColor Cyan
$backendExists = az containerapp show `
  --name $BackendAppName `
  --resource-group $ResourceGroup `
  --query "name" `
  --output tsv 2>$null

$secretArgs = @(
  "mongo-uri=$($envValues["MONGO_URI"])",
  "jwt-secret=$($envValues["JWT_SECRET"])",
  "payos-client-id=$($envValues["PAYOS_CLIENT_ID"])",
  "payos-api-key=$($envValues["PAYOS_API_KEY"])",
  "payos-checksum-key=$($envValues["PAYOS_CHECKSUM_KEY"])",
  "r2-endpoint=$($envValues["R2_ENDPOINT"])",
  "r2-access-key=$($envValues["R2_ACCESS_KEY"])",
  "r2-secret-key=$($envValues["R2_SECRET_KEY"])",
  "r2-public-url=$($envValues["R2_PUBLIC_URL"])"
)

$envArgs = @(
  "NODE_ENV=production",
  "PORT=3000",
  "MONGO_URI=secretref:mongo-uri",
  "JWT_SECRET=secretref:jwt-secret",
  "PAYOS_CLIENT_ID=secretref:payos-client-id",
  "PAYOS_API_KEY=secretref:payos-api-key",
  "PAYOS_CHECKSUM_KEY=secretref:payos-checksum-key",
  "R2_ENDPOINT=secretref:r2-endpoint",
  "R2_ACCESS_KEY=secretref:r2-access-key",
  "R2_SECRET_KEY=secretref:r2-secret-key",
  "R2_PUBLIC_URL=secretref:r2-public-url"
)

if ($backendExists) {
  az containerapp secret set `
    --name $BackendAppName `
    --resource-group $ResourceGroup `
    --secrets $secretArgs | Out-Null

  az containerapp update `
    --name $BackendAppName `
    --resource-group $ResourceGroup `
    --image "$registryServer/shoes-backend:latest" `
    --set-env-vars $envArgs | Out-Null
} else {
  az containerapp create `
    --name $BackendAppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image "$registryServer/shoes-backend:latest" `
    --target-port 3000 `
    --ingress external `
    --registry-server $registryServer `
    --registry-username $RegistryName `
    --registry-password $acrPassword `
    --secrets $secretArgs `
    --env-vars $envArgs | Out-Null
}

$backendFqdn = az containerapp show `
  --name $BackendAppName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" `
  --output tsv
$backendUrl = "https://$backendFqdn"

Write-Host "Building and pushing frontend image for $backendUrl ..." -ForegroundColor Cyan
docker build `
  --build-arg "VITE_API_BASE_URL=$backendUrl" `
  -t "$registryServer/shoes-frontend:latest" `
  .\tailwind4-vue3-nikeStore
docker push "$registryServer/shoes-frontend:latest"

Write-Host "Creating/updating frontend Container App..." -ForegroundColor Cyan
$frontendExists = az containerapp show `
  --name $FrontendAppName `
  --resource-group $ResourceGroup `
  --query "name" `
  --output tsv 2>$null

if ($frontendExists) {
  az containerapp update `
    --name $FrontendAppName `
    --resource-group $ResourceGroup `
    --image "$registryServer/shoes-frontend:latest" | Out-Null
} else {
  az containerapp create `
    --name $FrontendAppName `
    --resource-group $ResourceGroup `
    --environment $EnvironmentName `
    --image "$registryServer/shoes-frontend:latest" `
    --target-port 80 `
    --ingress external `
    --registry-server $registryServer `
    --registry-username $RegistryName `
    --registry-password $acrPassword | Out-Null
}

$frontendFqdn = az containerapp show `
  --name $FrontendAppName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" `
  --output tsv

Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "Backend:  $backendUrl"
Write-Host "Frontend: https://$frontendFqdn"
