$ErrorActionPreference = "Stop"

$repo = "C:\Users\Admin\Downloads\zenith-catalog-glow-main (1)\zenith-catalog-glow-main"
$playwrightRunner = "C:\Users\Admin\.agents\skills\playwright\run.js"
$smokeDir = Join-Path $repo ".tmp\e2e"
$seedPath = Join-Path $smokeDir "seed-result.json"
$playwrightScript = Join-Path $smokeDir "playwright-smoke.js"

New-Item -ItemType Directory -Force $smokeDir | Out-Null
Set-Location $repo

$backend = Start-Process -FilePath "java" -ArgumentList "-jar", "backend/target/catalog-backend-0.0.1-SNAPSHOT.jar" -WorkingDirectory $repo -PassThru

try {
  $healthy = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/health" -UseBasicParsing -TimeoutSec 3
      if ($health.status -eq "UP") {
        $healthy = $true
        break
      }
    } catch {
    }
  }

  if (-not $healthy) {
    throw "Backend did not become healthy on http://127.0.0.1:8081/api/health"
  }

  $loginBody = @{ email = "admin@gadget69.com"; password = "Admin@123" } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/login" -Method Post -ContentType "application/json" -Body $loginBody
  $token = $login.token
  if (-not $token) {
    throw "Admin login did not return a token"
  }

  $headers = @{ Authorization = "Bearer $token" }
  $sections = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/sections" -Headers $headers -Method Get
  if (-not $sections -or $sections.Count -eq 0) {
    throw "No admin sections were returned"
  }

  $sectionId = $sections[0].id
  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $productName = "Codex Smoke Demo Headphones $stamp"
  $slug = "codex-smoke-demo-headphones-$stamp"
  $redPrice = 2499
  $bluePrice = 2599
  $videoUrl = "https://res.cloudinary.com/demo/video/upload/dog.mp4"
  $mainImage = "http://127.0.0.1:8080/placeholder.svg"
  $sideImage = "http://127.0.0.1:8080/favicon.svg"

  $productPayload = @{
    name = $productName
    description = "Codex smoke test product with seeded image, video, variants, and order coverage."
    price = 2499
    stockQuantity = 12
    sectionId = $sectionId
    offer = $true
    offerPrice = 2199
    offerStartDate = "2026-04-01"
    offerEndDate = "2026-05-31"
    slug = $slug
    model_number = "CDX-SMOKE-01"
    short_description = "Smoke-test ready demo headphones"
    mrp = 2999
    display_order = 999
    is_new_launch = $true
    is_best_seller = $false
    is_featured = $true
    is_hero_featured = $false
    status = "ACTIVE"
    default_thumbnail_url = $mainImage
    galleryImages = @($sideImage)
    specifications = @{
      Connectivity = "Bluetooth 5.3"
      Battery = "40 Hours"
      Warranty = "1 Year"
    }
    media = @(
      @{ mediaUrl = $mainImage; mediaType = "IMAGE"; mediaRole = "MAIN"; displayOrder = 0; isPrimary = $true },
      @{ mediaUrl = $sideImage; mediaType = "IMAGE"; mediaRole = "SIDE"; displayOrder = 1; isPrimary = $false },
      @{ mediaUrl = $videoUrl; mediaType = "VIDEO"; mediaRole = "ADDITIONAL"; displayOrder = 2; isPrimary = $false }
    )
  } | ConvertTo-Json -Depth 8

  $product = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/products" -Headers $headers -Method Post -ContentType "application/json" -Body $productPayload
  if (-not $product.id) {
    throw "Product creation failed"
  }

  $redVariantBody = @{
    colorName = "Crimson Red"
    hexCode = "#c1121f"
    size = ""
    price = $redPrice
    priceAdjustment = 0
    stock = 7
    sku = "CDX-RED-$stamp"
    isDefault = $true
    displayOrder = 0
  } | ConvertTo-Json
  $blueVariantBody = @{
    colorName = "Ocean Blue"
    hexCode = "#1d4ed8"
    size = ""
    price = $bluePrice
    priceAdjustment = 0
    stock = 5
    sku = "CDX-BLUE-$stamp"
    isDefault = $false
    displayOrder = 1
  } | ConvertTo-Json

  $redVariant = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/products/$($product.id)/variants" -Headers $headers -Method Post -ContentType "application/json" -Body $redVariantBody
  $blueVariant = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/products/$($product.id)/variants" -Headers $headers -Method Post -ContentType "application/json" -Body $blueVariantBody

  $redImageBody = @{ mediaUrl = $mainImage; mediaType = "IMAGE"; mediaRole = "MAIN"; displayOrder = 0; isPrimary = $true } | ConvertTo-Json
  $redVideoBody = @{ mediaUrl = $videoUrl; mediaType = "VIDEO"; mediaRole = "ADDITIONAL"; displayOrder = 1; isPrimary = $false } | ConvertTo-Json
  $blueImageBody = @{ mediaUrl = $sideImage; mediaType = "IMAGE"; mediaRole = "MAIN"; displayOrder = 0; isPrimary = $true } | ConvertTo-Json

  Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/variants/$($redVariant.id)/media" -Headers $headers -Method Post -ContentType "application/json" -Body $redImageBody | Out-Null
  Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/variants/$($redVariant.id)/media" -Headers $headers -Method Post -ContentType "application/json" -Body $redVideoBody | Out-Null
  Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/admin/variants/$($blueVariant.id)/media" -Headers $headers -Method Post -ContentType "application/json" -Body $blueImageBody | Out-Null

  $orderCustomer = "Codex QA $stamp"
  $orderPayload = @{
    customerName = $orderCustomer
    phone = "9876543210"
    email = "codex.qa@example.com"
    address = "12 Smoke Test Street, Chennai"
    pincode = "600001"
    items = @(
      @{
        productId = $product.id
        productName = $product.name
        variantId = $blueVariant.id
        variantColor = "Ocean Blue"
        variantSize = $null
        quantity = 1
        price = $bluePrice
      }
    )
  } | ConvertTo-Json -Depth 6

  Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/orders" -Method Post -ContentType "application/json" -Body $orderPayload | Out-Null

  @{
    productId = $product.id
    productName = $product.name
    blueVariantName = "Ocean Blue"
    bluePriceText = "Rs. 2,599"
    orderCustomer = $orderCustomer
    shopPhone = "9361586278"
    supportEmail = "natrajganesh2000@gmail.com"
  } | ConvertTo-Json -Depth 5 | Set-Content -Path $seedPath -Encoding UTF8

  $env:TARGET_URL = "http://127.0.0.1:8080"
  $env:SEED_PATH = $seedPath
  $env:SCREENSHOT_DIR = $smokeDir
  node $playwrightRunner $playwrightScript
} finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
  }
}
