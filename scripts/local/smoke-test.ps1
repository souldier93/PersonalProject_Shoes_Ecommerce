param(
  [string]$BackendUrl = "http://localhost:3000",
  [string]$FrontendUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking backend health..." -ForegroundColor Cyan
$health = Invoke-RestMethod "$BackendUrl/health"
if ($health.status -ne "ok") {
  throw "Backend health check failed"
}

Write-Host "Checking product API..." -ForegroundColor Cyan
$products = Invoke-RestMethod "$BackendUrl/shoes"
if (-not $products -or $products.Count -lt 1) {
  throw "Product API returned no products"
}

Write-Host "Checking chat API..." -ForegroundColor Cyan
$conversation = Invoke-RestMethod `
  -Method Post `
  -Uri "$BackendUrl/chat/conversations" `
  -ContentType "application/json" `
  -Body '{"guestId":"smoke-test","customerName":"Smoke Test"}'

if (-not $conversation._id) {
  throw "Chat API did not return a conversation id"
}

Write-Host "Checking frontend..." -ForegroundColor Cyan
$frontend = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
if ($frontend.StatusCode -lt 200 -or $frontend.StatusCode -ge 400) {
  throw "Frontend returned HTTP $($frontend.StatusCode)"
}

Write-Host "Smoke tests passed." -ForegroundColor Green
