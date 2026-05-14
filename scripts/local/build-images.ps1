param(
  [string]$FrontendApiBaseUrl = "/api"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Set-Location $root

Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -t shoes-backend:latest .\nike-store-nest-js

Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build `
  --build-arg "VITE_API_BASE_URL=$FrontendApiBaseUrl" `
  -t shoes-frontend:latest `
  .\tailwind4-vue3-nikeStore

Write-Host "Done. Built shoes-backend:latest and shoes-frontend:latest" -ForegroundColor Green
