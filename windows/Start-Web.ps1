param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
Push-Location $appRoot
try {
    $null = Get-Command node -ErrorAction Stop
    $null = Get-Command npm.cmd -ErrorAction Stop
    & node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Node.js 22 이상이 필요합니다."); process.exit(1); }'
    if ($LASTEXITCODE -ne 0) { throw 'Node.js 22 이상을 설치해 주세요.' }
    if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'node_modules/electron/cli.js'))) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci 실패' }
    }
    & npm.cmd run java:build
    if ($LASTEXITCODE -ne 0) { throw 'Java 빌드 실패' }
} finally { Pop-Location }
$appPort = if ($env:HDEV_JAVA_PORT) { [int]$env:HDEV_JAVA_PORT } else { 4174 }
if ($appPort -lt 1 -or $appPort -gt 65535) { throw 'HDEV_JAVA_PORT는 1~65535 정수여야 합니다.' }
$appUrl = "http://127.0.0.1:$appPort"
$appReady = $false
try {
    $appStatus = Invoke-RestMethod -Uri "$appUrl/api/bootstrap" -TimeoutSec 3
    $appReady = ($appStatus.storageBackend.backend -eq 'java')
} catch { }

if (-not $appReady) {
    $appNode = Get-Command node -ErrorAction Stop
    $appLogs = Join-Path $appRoot '.runtime'
    New-Item -ItemType Directory -Path $appLogs -Force | Out-Null
    $appScript = Join-Path $appRoot 'scripts\server.mjs'
    Start-Process -FilePath $appNode.Source -ArgumentList @("`"$appScript`"") -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $appLogs 'server.log') -RedirectStandardError (Join-Path $appLogs 'server-error.log') | Out-Null
    for ($appAttempt = 0; $appAttempt -lt 20; $appAttempt++) {
        Start-Sleep -Milliseconds 500
        try {
            $appStatus = Invoke-RestMethod -Uri "$appUrl/api/bootstrap" -TimeoutSec 3
            if ($appStatus.storageBackend.backend -eq 'java') { $appReady = $true; break }
        } catch { }
    }
}

if (-not $appReady) { throw '앱을 시작하지 못했습니다. .runtime/server-error.log를 확인해 주세요.' }
if (-not $NoBrowser) { Start-Process $appUrl }
Write-Output "H.Dev Studio Java: $appUrl"
