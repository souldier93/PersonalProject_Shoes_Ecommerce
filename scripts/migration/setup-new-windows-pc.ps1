[CmdletBinding()]
param(
    [string]$ProjectPath = (Join-Path $HOME 'source\nikeStore'),
    [string]$RepositoryUrl = 'https://github.com/souldier93/PersonalProject_Shoes_Ecommerce.git',
    [string]$PrivateArchive,
    [switch]$InstallPrerequisites,
    [switch]$StartServices,
    [switch]$RestoreData,
    [switch]$SkipPrivateFiles,
    [switch]$SkipDependencies,
    [switch]$SkipBuild,
    [switch]$SkipOpen,
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
$ProjectPath = [System.IO.Path]::GetFullPath($ProjectPath)

function Refresh-ToolPath {
    $paths = @(
        (Join-Path $env:ProgramFiles 'Git\cmd'),
        (Join-Path $env:ProgramFiles 'nodejs'),
        (Join-Path $env:ProgramFiles 'Microsoft VS Code\bin'),
        (Join-Path $env:ProgramFiles '7-Zip'),
        (Join-Path $env:ProgramFiles 'Docker\Docker\resources\bin'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\bin'),
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin')
    )
    foreach ($path in $paths) {
        if ((Test-Path -LiteralPath $path) -and (($env:PATH -split ';') -notcontains $path)) {
            $env:PATH = "$path;$env:PATH"
        }
    }
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [Parameter(Mandatory = $true)][string]$DisplayName
    )
    Write-Host "Installing $DisplayName..." -ForegroundColor Cyan
    & winget install --id $Id --exact --source winget --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -ne 0) { throw "winget could not install $DisplayName (exit code $LASTEXITCODE)." }
    Refresh-ToolPath
}

function Ensure-Tool {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string]$PackageId,
        [Parameter(Mandatory = $true)][string]$DisplayName
    )
    if (Get-Command $Command -ErrorAction SilentlyContinue) { return }
    if (-not $InstallPrerequisites) {
        throw "$DisplayName is missing. Run this script again with -InstallPrerequisites."
    }
    if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
        throw 'winget is missing. Install Microsoft App Installer, then run this script again.'
    }
    Install-WingetPackage -Id $PackageId -DisplayName $DisplayName
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "$DisplayName was installed, but '$Command' is not available yet. Open a new PowerShell window and rerun this script."
    }
}

function Find-SevenZip {
    $command = Get-Command 7z.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidate = Join-Path $env:ProgramFiles '7-Zip\7z.exe'
    if (Test-Path -LiteralPath $candidate) { return $candidate }
    return $null
}

function Invoke-InDirectory {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )
    Push-Location $Path
    try { & $Command } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw "Command failed in $Path (exit code $LASTEXITCODE)." }
}

function Read-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )
    $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match ("^\s*{0}\s*=" -f [regex]::Escape($Name)) } | Select-Object -Last 1
    if (-not $line) { return $null }
    return ($line -replace '^[^=]+=', '').Trim()
}

Refresh-ToolPath
Ensure-Tool -Command 'git.exe' -PackageId 'Git.Git' -DisplayName 'Git'
Ensure-Tool -Command 'npm.cmd' -PackageId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'
Ensure-Tool -Command 'code.cmd' -PackageId 'Microsoft.VisualStudioCode' -DisplayName 'Visual Studio Code'

if ($InstallPrerequisites) {
    if (-not (Find-SevenZip)) { Install-WingetPackage -Id '7zip.7zip' -DisplayName '7-Zip' }
    if (-not (Get-Command gh.exe -ErrorAction SilentlyContinue)) { Install-WingetPackage -Id 'GitHub.cli' -DisplayName 'GitHub CLI' }
    if (-not (Get-Command docker.exe -ErrorAction SilentlyContinue)) { Install-WingetPackage -Id 'Docker.DockerDesktop' -DisplayName 'Docker Desktop' }
}

$nodeVersionText = (& node.exe --version).TrimStart('v')
$nodeMajor = [int]($nodeVersionText.Split('.')[0])
if ($nodeMajor -lt 22) { throw "Node.js 22 or newer is required; found $nodeVersionText." }

Write-Host ("Git:      {0}" -f (& git.exe --version))
Write-Host ("Node.js:  {0}" -f (& node.exe --version))
Write-Host ("npm:      {0}" -f (& npm.cmd --version))

if ($ValidateOnly) {
    Write-Host 'Prerequisite validation passed.' -ForegroundColor Green
    exit 0
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath '.git'))) {
    $parent = Split-Path $ProjectPath -Parent
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    & git.exe clone $RepositoryUrl $ProjectPath
    if ($LASTEXITCODE -ne 0) { throw 'git clone failed.' }
} else {
    Write-Host "Using existing Git repository: $ProjectPath"
}

if (-not $SkipPrivateFiles) {
    if ([string]::IsNullOrWhiteSpace($PrivateArchive)) {
        $PrivateArchive = Get-ChildItem -LiteralPath $PSScriptRoot -Filter 'nikeStore-private-*.7z' -File -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1 -ExpandProperty FullName
    }
    if (-not [string]::IsNullOrWhiteSpace($PrivateArchive)) {
        $PrivateArchive = [System.IO.Path]::GetFullPath($PrivateArchive)
        if (-not (Test-Path -LiteralPath $PrivateArchive -PathType Leaf)) { throw "Private archive not found: $PrivateArchive" }
        $sevenZip = Find-SevenZip
        if (-not $sevenZip) { throw '7-Zip is required to extract the private bundle. Rerun with -InstallPrerequisites.' }

        $securePassword = Read-Host 'Password for the encrypted private bundle' -AsSecureString
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try {
            $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
            & $sevenZip x $PrivateArchive ("-o{0}" -f $ProjectPath) ("-p{0}" -f $plainPassword) -aoa
            if ($LASTEXITCODE -ne 0) { throw 'Private bundle extraction failed. Check the password and archive integrity.' }
        } finally {
            if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
            $plainPassword = $null
            $securePassword = $null
        }
    } else {
        Write-Warning 'No encrypted private bundle was found. Example .env files will be used.'
    }
}

$environmentPairs = @(
    @((Join-Path $ProjectPath 'nike-store-nest-js\.env.example'), (Join-Path $ProjectPath 'nike-store-nest-js\.env')),
    @((Join-Path $ProjectPath 'tailwind4-vue3-nikeStore\.env.example'), (Join-Path $ProjectPath 'tailwind4-vue3-nikeStore\.env'))
)
foreach ($pair in $environmentPairs) {
    if (-not (Test-Path -LiteralPath $pair[1])) {
        Copy-Item -LiteralPath $pair[0] -Destination $pair[1]
        Write-Warning "Created $($pair[1]) from an example file. Replace placeholder values before using external services."
    }
}

if (-not $SkipDependencies) {
    Invoke-InDirectory -Path (Join-Path $ProjectPath 'nike-store-nest-js') -Command { & npm.cmd ci --no-fund --no-audit }
    Invoke-InDirectory -Path (Join-Path $ProjectPath 'tailwind4-vue3-nikeStore') -Command { & npm.cmd ci --no-fund --no-audit }
}

if (-not $SkipBuild) {
    Invoke-InDirectory -Path (Join-Path $ProjectPath 'nike-store-nest-js') -Command { & npm.cmd run build }
    Invoke-InDirectory -Path (Join-Path $ProjectPath 'nike-store-nest-js') -Command { & npm.cmd test -- --runInBand }
    Invoke-InDirectory -Path (Join-Path $ProjectPath 'tailwind4-vue3-nikeStore') -Command { & npm.cmd run build }
}

if ($StartServices) {
    Ensure-Tool -Command 'docker.exe' -PackageId 'Docker.DockerDesktop' -DisplayName 'Docker Desktop'
    & docker.exe info *> $null
    if ($LASTEXITCODE -ne 0) {
        $dockerDesktop = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) { $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe' }
        if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Docker Desktop is installed but its launcher was not found.' }
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        Write-Host 'Waiting for Docker Desktop...'
        $ready = $false
        for ($i = 0; $i -lt 60; $i++) {
            Start-Sleep -Seconds 2
            & docker.exe info *> $null
            if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        }
        if (-not $ready) { throw 'Docker Desktop did not become ready. Restart Windows, open Docker Desktop once, then rerun with -StartServices.' }
    }

    Invoke-InDirectory -Path $ProjectPath -Command { & docker.exe compose up -d mongo redis }

    if ($RestoreData) {
        $backendEnv = Join-Path $ProjectPath 'nike-store-nest-js\.env'
        $databaseName = Read-EnvValue -Path $backendEnv -Name 'MONGO_DB_NAME'
        if ([string]::IsNullOrWhiteSpace($databaseName)) { $databaseName = 'nike-store' }
        if ($databaseName -notmatch '^[A-Za-z0-9_-]+$') { throw 'MONGO_DB_NAME contains unsupported characters.' }

        $collectionCount = (& docker.exe exec shoes-mongo mongosh --quiet --eval ("db.getSiblingDB('{0}').getCollectionNames().length" -f $databaseName) | Select-Object -Last 1)
        if ([int]$collectionCount -gt 0) {
            Write-Warning "Database '$databaseName' is not empty, so automatic restore was skipped to protect existing data."
        } else {
            $mongoArchive = Join-Path $ProjectPath 'migration-data\mongo\nikeStore-mongo.archive.gz'
            if (Test-Path -LiteralPath $mongoArchive -PathType Leaf) {
                & docker.exe cp $mongoArchive 'shoes-mongo:/tmp/nikeStore-mongo.archive.gz'
                & docker.exe exec shoes-mongo mongorestore --archive=/tmp/nikeStore-mongo.archive.gz --gzip
                if ($LASTEXITCODE -ne 0) { throw 'MongoDB restore failed.' }
                & docker.exe exec shoes-mongo rm -f /tmp/nikeStore-mongo.archive.gz *> $null
            } else {
                $catalogDirectory = Join-Path $ProjectPath 'migration-data\catalog'
                $catalogFiles = @(
                    @('atlas-shoes.ejson', 'shoes'),
                    @('atlas-shoesDetail.ejson', 'shoesDetail')
                )
                foreach ($catalogFile in $catalogFiles) {
                    $source = Join-Path $catalogDirectory $catalogFile[0]
                    if (Test-Path -LiteralPath $source -PathType Leaf) {
                        $containerPath = "/tmp/$($catalogFile[0])"
                        & docker.exe cp $source ("shoes-mongo:{0}" -f $containerPath)
                        & docker.exe exec shoes-mongo mongoimport --db $databaseName --collection $catalogFile[1] --file $containerPath --jsonArray --mode=upsert --upsertFields=_id
                        if ($LASTEXITCODE -ne 0) { throw "Catalog restore failed for $($catalogFile[1])." }
                        & docker.exe exec shoes-mongo rm -f $containerPath *> $null
                    }
                }
            }

            Invoke-InDirectory -Path (Join-Path $ProjectPath 'nike-store-nest-js') -Command { & npm.cmd run seed:initial-user }
            Write-Host 'Created the initial roles and verified admin account from the restored .env file.'
        }
    }
}

if (-not $SkipOpen) {
    Start-Process -FilePath 'code.cmd' -ArgumentList @($ProjectPath)
}

Write-Host ''
Write-Host 'NEW-PC SETUP COMPLETED' -ForegroundColor Green
Write-Host "Project: $ProjectPath"
Write-Host 'To push changes to GitHub on this computer, run: gh auth login'
Write-Host 'VS Code tasks: Nike: Start MongoDB and Redis, Nike: Backend, Nike: Frontend'
