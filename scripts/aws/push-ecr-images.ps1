param(
  [Parameter(Mandatory = $true)]
  [string]$AccountId,

  [string]$Region = "ap-southeast-1",
  [string]$BackendRepository = "shoes-backend",
  [string]$FrontendRepository = "shoes-frontend",
  [string]$ImageTag = "latest",
  [string]$FrontendApiBaseUrl
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name is not installed or is not in PATH."
  }
}

Assert-Command aws
Assert-Command docker

if (-not $FrontendApiBaseUrl) {
  $FrontendApiBaseUrl = "https://replace-with-backend-url"
}

$registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$backendImage = "$registry/${BackendRepository}:$ImageTag"
$frontendImage = "$registry/${FrontendRepository}:$ImageTag"

Write-Host "Ensuring ECR repositories exist..." -ForegroundColor Cyan
aws ecr describe-repositories --repository-names $BackendRepository --region $Region *> $null
if ($LASTEXITCODE -ne 0) {
  aws ecr create-repository --repository-name $BackendRepository --region $Region | Out-Null
}

aws ecr describe-repositories --repository-names $FrontendRepository --region $Region *> $null
if ($LASTEXITCODE -ne 0) {
  aws ecr create-repository --repository-name $FrontendRepository --region $Region | Out-Null
}

Write-Host "Logging Docker into ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin $registry

Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -t $backendImage .\nike-store-nest-js

Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build `
  --build-arg "VITE_API_BASE_URL=$FrontendApiBaseUrl" `
  -t $frontendImage `
  .\tailwind4-vue3-nikeStore

Write-Host "Pushing images..." -ForegroundColor Cyan
docker push $backendImage
docker push $frontendImage

Write-Host "Images pushed." -ForegroundColor Green
Write-Host "Backend image:  $backendImage"
Write-Host "Frontend image: $frontendImage"
