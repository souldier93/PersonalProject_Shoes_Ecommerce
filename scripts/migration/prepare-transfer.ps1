[CmdletBinding()]
param(
    [string]$Destination,
    [switch]$SkipDatabase
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if ([string]::IsNullOrWhiteSpace($Destination)) {
    $parent = Split-Path $projectRoot -Parent
    $Destination = Join-Path $parent ("nikeStore-transfer-{0}" -f (Get-Date -Format 'yyyy-MM-dd-HHmm'))
}

$Destination = [System.IO.Path]::GetFullPath($Destination)
if ($Destination.StartsWith($projectRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The transfer directory must be outside the Git repository.'
}

function Find-SevenZip {
    $command = Get-Command 7z.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $candidates = @(
        (Join-Path $env:ProgramFiles '7-Zip\7z.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\7zr.exe')
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    throw '7-Zip was not found. Install 7-Zip or Docker Desktop, then run this script again.'
}

function New-ArchivePassword {
    $bytes = New-Object byte[] 24
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_'))
}

function Copy-RelativeFile {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][string]$StagingRoot
    )
    $source = Join-Path $projectRoot $RelativePath
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { return $false }

    $target = Join-Path $StagingRoot $RelativePath
    $targetDirectory = Split-Path $target -Parent
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    return $true
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )
    $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match ("^\s*{0}\s*=" -f [regex]::Escape($Name)) } | Select-Object -Last 1
    if (-not $line) { return $null }
    return ($line -replace '^[^=]+=', '').Trim()
}

$sevenZip = Find-SevenZip
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
$Destination = (Resolve-Path -LiteralPath $Destination).Path

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$gitBundle = Join-Path $Destination 'nikeStore-repository.bundle'
$privateArchive = Join-Path $Destination ("nikeStore-private-{0}.7z" -f $timestamp)
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("nikeStore-transfer-{0}" -f [guid]::NewGuid().ToString('N'))
$archivePassword = New-ArchivePassword
$databaseCoverage = 'No database snapshot was requested.'
$copiedPrivateFiles = New-Object System.Collections.Generic.List[string]

try {
    New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

    Push-Location $projectRoot
    try {
        & git fetch origin --prune
        if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

        & git bundle create $gitBundle --all
        if ($LASTEXITCODE -ne 0) { throw 'git bundle creation failed.' }

        & git bundle verify $gitBundle | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'git bundle verification failed.' }

        $commit = (& git rev-parse HEAD).Trim()
        $remote = (& git remote get-url origin).Trim()
        $workingTreeStatus = @(& git status --porcelain)
    } finally {
        Pop-Location
    }

    $privatePaths = @(
        '.env',
        '.env.admin.local',
        '.env.restore.local',
        'nike-store-nest-js\.env',
        'tailwind4-vue3-nikeStore\.env'
    )
    foreach ($relativePath in $privatePaths) {
        if (Copy-RelativeFile -RelativePath $relativePath -StagingRoot $stagingRoot) {
            $copiedPrivateFiles.Add($relativePath)
        }
    }

    if (-not $SkipDatabase) {
        $dockerReady = $false
        try {
            & docker info --format '{{.ServerVersion}}' *> $null
            $dockerReady = ($LASTEXITCODE -eq 0)
        } catch {
            $dockerReady = $false
        }

        $backendEnv = Join-Path $projectRoot 'nike-store-nest-js\.env'
        $databaseName = Get-EnvValue -Path $backendEnv -Name 'MONGO_DB_NAME'
        if ([string]::IsNullOrWhiteSpace($databaseName)) { $databaseName = 'nike-store' }
        if ($databaseName -notmatch '^[A-Za-z0-9_-]+$') { throw 'MONGO_DB_NAME contains unsupported characters.' }

        $mongoContainer = $null
        if ($dockerReady) {
            $mongoContainer = (& docker ps --format '{{.Names}}' | Where-Object { $_ -eq 'shoes-mongo' } | Select-Object -First 1)
        }

        if ($mongoContainer) {
            $mongoDirectory = Join-Path $stagingRoot 'migration-data\mongo'
            New-Item -ItemType Directory -Path $mongoDirectory -Force | Out-Null
            $containerArchive = '/tmp/nikeStore-transfer.archive.gz'
            & docker exec shoes-mongo mongodump --db $databaseName --archive=$containerArchive --gzip
            if ($LASTEXITCODE -ne 0) { throw 'mongodump failed.' }
            try {
                & docker cp ("shoes-mongo:{0}" -f $containerArchive) (Join-Path $mongoDirectory 'nikeStore-mongo.archive.gz')
                if ($LASTEXITCODE -ne 0) { throw 'docker cp failed while copying the MongoDB archive.' }
            } finally {
                & docker exec shoes-mongo rm -f $containerArchive *> $null
            }
            Set-Content -LiteralPath (Join-Path $mongoDirectory 'database-name.txt') -Value $databaseName -Encoding UTF8
            $databaseCoverage = "Full MongoDB dump of '$databaseName'."
        } else {
            $latestRestoreManifest = Join-Path $env:LOCALAPPDATA 'nikeStore-dev\latest-atlas-restore.json'
            if (Test-Path -LiteralPath $latestRestoreManifest) {
                $restoreInfo = Get-Content -LiteralPath $latestRestoreManifest -Raw | ConvertFrom-Json
                $catalogSource = [string]$restoreInfo.backup
                if (Test-Path -LiteralPath $catalogSource -PathType Container) {
                    $catalogTarget = Join-Path $stagingRoot 'migration-data\catalog'
                    New-Item -ItemType Directory -Path $catalogTarget -Force | Out-Null
                    foreach ($name in @('atlas-shoes.ejson', 'atlas-shoesDetail.ejson', 'manifest.json')) {
                        $source = Join-Path $catalogSource $name
                        if (Test-Path -LiteralPath $source -PathType Leaf) {
                            Copy-Item -LiteralPath $source -Destination (Join-Path $catalogTarget $name) -Force
                        }
                    }
                    $databaseCoverage = 'Catalog fallback only (shoes and shoesDetail); local users and orders are not included because Docker was unavailable.'
                }
            }
        }
    }

    $privateReadme = @(
        'NIKESTORE PRIVATE TRANSFER BUNDLE',
        '',
        'This encrypted archive contains local environment files and possibly a database snapshot.',
        'Never commit its contents to Git or upload the archive to a public location.',
        '',
        "Database coverage: $databaseCoverage"
    )
    Set-Content -LiteralPath (Join-Path $stagingRoot 'PRIVATE-BUNDLE-CONTENTS.txt') -Value $privateReadme -Encoding UTF8

    Push-Location $stagingRoot
    try {
        & $sevenZip a -t7z $privateArchive '.\*' ("-p{0}" -f $archivePassword) -mhe=on -mx=9
        if ($LASTEXITCODE -ne 0) { throw 'Encrypted archive creation failed.' }
        & $sevenZip t $privateArchive ("-p{0}" -f $archivePassword) | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Encrypted archive verification failed.' }
    } finally {
        Pop-Location
    }

    Copy-Item -LiteralPath (Join-Path $projectRoot 'scripts\migration\setup-new-windows-pc.ps1') -Destination (Join-Path $Destination 'setup-new-windows-pc.ps1') -Force
    Copy-Item -LiteralPath (Join-Path $projectRoot 'MIGRATE_TO_NEW_PC.md') -Destination (Join-Path $Destination 'README-FIRST.md') -Force

    $manifest = [ordered]@{
        createdAt = (Get-Date).ToString('o')
        repository = $remote
        commit = $commit
        gitBundle = [System.IO.Path]::GetFileName($gitBundle)
        privateArchive = [System.IO.Path]::GetFileName($privateArchive)
        privateFiles = @($copiedPrivateFiles)
        databaseCoverage = $databaseCoverage
        workingTreeClean = ($workingTreeStatus.Count -eq 0)
    }
    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $Destination 'transfer-manifest.json') -Encoding UTF8

    $checksumFiles = Get-ChildItem -LiteralPath $Destination -File | Where-Object { $_.Name -ne 'CHECKSUMS-SHA256.txt' }
    $checksumLines = foreach ($file in $checksumFiles) {
        $hash = Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256
        '{0}  {1}' -f $hash.Hash.ToLowerInvariant(), $file.Name
    }
    Set-Content -LiteralPath (Join-Path $Destination 'CHECKSUMS-SHA256.txt') -Value $checksumLines -Encoding ASCII

    Write-Host ''
    Write-Host 'TRANSFER KIT READY' -ForegroundColor Green
    Write-Host ("Directory: {0}" -f $Destination)
    Write-Host ("Commit:   {0}" -f $commit)
    Write-Host ("Database: {0}" -f $databaseCoverage)
    if ($workingTreeStatus.Count -gt 0) {
        Write-Warning 'The working tree contains uncommitted files. They are not included in the Git bundle.'
    }
    Write-Host ''
    Write-Host 'SAVE THIS PASSWORD SEPARATELY. IT IS NOT WRITTEN TO DISK:' -ForegroundColor Yellow
    Write-Host $archivePassword -ForegroundColor Yellow
} finally {
    if (Test-Path -LiteralPath $stagingRoot) {
        $resolvedTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        $resolvedStaging = [System.IO.Path]::GetFullPath($stagingRoot)
        if ($resolvedStaging.StartsWith($resolvedTemp, [System.StringComparison]::OrdinalIgnoreCase) -and
            (Split-Path $resolvedStaging -Leaf) -like 'nikeStore-transfer-*') {
            Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
        }
    }
}
