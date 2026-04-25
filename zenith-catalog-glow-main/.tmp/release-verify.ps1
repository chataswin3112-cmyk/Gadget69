$ErrorActionPreference = "Stop"

$repoRoot = "c:\Users\Admin\Downloads\zenith-catalog-glow-main (1)\zenith-catalog-glow-main"
$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backendOut = Join-Path $repoRoot ".tmp\release-backend-$runStamp.out.log"
$backendErr = Join-Path $repoRoot ".tmp\release-backend-$runStamp.err.log"
$frontendOut = Join-Path $repoRoot ".tmp\release-frontend-$runStamp.out.log"
$frontendErr = Join-Path $repoRoot ".tmp\release-frontend-$runStamp.err.log"
$apiBaselinePath = Join-Path $repoRoot ".tmp\release-api-baseline.json"
$browserReportPath = Join-Path $repoRoot ".tmp\release-browser-report.json"
$artifactDir = Join-Path $repoRoot ".tmp\release-browser-artifacts"

New-Item -ItemType Directory -Force -Path (Join-Path $repoRoot ".tmp") | Out-Null
foreach ($file in @($apiBaselinePath, $browserReportPath)) {
  if (Test-Path $file) {
    Remove-Item -LiteralPath $file -Force
  }
}

function Wait-ForUrl {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$Attempts = 40,
    [int]$DelayMs = 1500
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
      return $response
    } catch {
      Start-Sleep -Milliseconds $DelayMs
    }
  }

  throw "Timed out waiting for $Url"
}

$backend = $null
$frontend = $null
$verifyDataDir = Join-Path $repoRoot "backend\verifydata"
$backendPort = 8086
$backendOrigin = "http://127.0.0.1:$backendPort"

try {
  if (Test-Path $verifyDataDir) {
    Remove-Item -LiteralPath $verifyDataDir -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $verifyDataDir | Out-Null

  Write-Output "Starting backend on $backendPort with isolated verification data"
  $backend = Start-Process -FilePath powershell.exe `
    -ArgumentList @(
      "-NoLogo",
      "-NoProfile",
      "-Command",
      "`$env:APP_DATA_DIR='$repoRoot\backend\verifydata'; `$env:APP_UPLOAD_DIR='$repoRoot\backend\uploads'; Set-Location '$repoRoot'; java -jar backend\target\catalog-backend-0.0.1-SNAPSHOT.jar --server.port=$backendPort"
    ) `
    -RedirectStandardOutput $backendOut `
    -RedirectStandardError $backendErr `
    -PassThru

  Write-Output "Starting production-style frontend proxy on 4173"
  $frontend = Start-Process -FilePath node `
    -ArgumentList @("scripts\serve-dist-with-proxy.mjs", "--port", "4173", "--backend", $backendOrigin) `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $frontendOut `
    -RedirectStandardError $frontendErr `
    -PassThru

  $health = Wait-ForUrl -Url "$backendOrigin/api/health"
  $homeResponse = Wait-ForUrl -Url "http://127.0.0.1:4173/"
  $bootstrap = Invoke-RestMethod -Uri "$backendOrigin/api/storefront/bootstrap" -TimeoutSec 12
  $community = Invoke-RestMethod -Uri "$backendOrigin/api/community-media" -TimeoutSec 12
  $reviews = Invoke-RestMethod -Uri "$backendOrigin/api/reviews" -TimeoutSec 12

  $apiBaseline = [ordered]@{
    checkedAt = (Get-Date).ToString("o")
    healthStatus = $health.Content
    homeStatusCode = $homeResponse.StatusCode
    sectionCount = @($bootstrap.sections).Count
    productCount = @($bootstrap.products).Count
    bannerCount = @($bootstrap.banners).Count
    communityCount = @($community).Count
    reviewCount = @($reviews).Count
  }
  $apiBaseline | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $apiBaselinePath

  Write-Output "Running browser smoke verification"
  $env:TARGET_URL = "http://127.0.0.1:4173"
  $env:SMOKE_REPO_ROOT = $repoRoot
  $env:SMOKE_OUTPUT = $browserReportPath
  $env:SMOKE_ARTIFACT_DIR = $artifactDir
  node .tmp\release-browser-smoke.cjs
  if ($LASTEXITCODE -ne 0) {
    throw "Browser smoke verification failed"
  }

  Write-Output "Verification completed successfully"
} finally {
  foreach ($proc in @($frontend, $backend)) {
    if ($null -ne $proc) {
      try {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      } catch {
        # Ignore teardown failures.
      }
    }
  }
}
