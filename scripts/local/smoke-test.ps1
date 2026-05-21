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
$productsResponse = Invoke-WebRequest -Uri "$BackendUrl/shoes" -UseBasicParsing
if ($productsResponse.StatusCode -lt 200 -or $productsResponse.StatusCode -ge 400) {
  throw "Product API returned HTTP $($productsResponse.StatusCode)"
}

try {
  $productsResponse.Content | ConvertFrom-Json | Out-Null
} catch {
  throw "Product API did not return valid JSON"
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

Write-Host "Checking frontend API proxy..." -ForegroundColor Cyan
$proxiedConversation = Invoke-RestMethod `
  -Method Post `
  -Uri "$FrontendUrl/api/chat/conversations" `
  -ContentType "application/json" `
  -Body '{"guestId":"smoke-test-proxy","customerName":"Smoke Test Proxy"}'

if (-not $proxiedConversation._id) {
  throw "Frontend API proxy did not return a conversation id"
}

Write-Host "Smoke tests passed." -ForegroundColor Green
