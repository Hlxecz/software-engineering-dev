param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$appRoot = $PSScriptRoot
Push-Location $appRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'node_modules/electron/cli.js'))) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci 실패' } }
    & npm.cmd run java:build
    if ($LASTEXITCODE -ne 0) { throw 'Java 빌드 실패' }
} finally { Pop-Location }
$appPort = if ($env:HDEV_JAVA_PORT) { [int]$env:HDEV_JAVA_PORT } else { 4174 }
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
Write-Output "H.Dev Studio: $appUrl"
