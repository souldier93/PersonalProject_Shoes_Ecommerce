param(
  [string]$ResourceGroup = "shoes-rg",
  [string[]]$Apps = @("shoes-backend", "shoes-frontend")
)

$ErrorActionPreference = "Stop"

function Resolve-AzCli {
  $az = Get-Command az -ErrorAction SilentlyContinue
  if ($az) {
    return @{
      Command = $az.Source
      Prefix = @()
    }
  }

  $defaultAzPython = "C:\Program Files\Microsoft SDKs\Azure\CLI2\python.exe"
  if (Test-Path $defaultAzPython) {
    return @{
      Command = $defaultAzPython
      Prefix = @("-IBm", "azure.cli")
    }
  }

  throw "Azure CLI is not installed or is not in PATH."
}

function Invoke-Az {
  & $script:AzCli.Command @($script:AzCli.Prefix + $args)
}

$script:AzCli = Resolve-AzCli

foreach ($app in $Apps) {
  Write-Host "Setting $app min replicas to 0..." -ForegroundColor Cyan
  Invoke-Az containerapp update `
    --name $app `
    --resource-group $ResourceGroup `
    --min-replicas 0 | Out-Null
}

Write-Host "Done. Container Apps can now scale to zero when idle." -ForegroundColor Green
