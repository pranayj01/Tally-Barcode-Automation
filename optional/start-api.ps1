# JG Barcode API launcher (Windows)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$api = Join-Path $root "services\barcode-api"
Set-Location $api

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "node_modules")) {
  npm install
}

npm run dev
