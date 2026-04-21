$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"

Set-Location $backendDir

java -cp "target\classes;.tmp_exploded_runtime\BOOT-INF\lib\*" com.gadget69.catalog.CatalogApplication
