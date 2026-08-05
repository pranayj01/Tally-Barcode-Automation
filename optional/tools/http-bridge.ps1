<#
.SYNOPSIS
  HTTP bridge between TallyPrime TDL and the JG Barcode Node.js API.

.DESCRIPTION
  Tally executes this script via Exec Command. Supports:
    - GET/POST JSON to the local API
    - APPLY mode: convert processPurchaseLines JSON into item|barcode|mfr lines

.EXAMPLES
  .\http-bridge.ps1 -Method GET -Url http://127.0.0.1:3100/health -OutFile response.json
  .\http-bridge.ps1 -Method POST -Url http://127.0.0.1:3100/generateBarcode -InFile request.json -OutFile response.json
  .\http-bridge.ps1 -Method APPLY -InFile response.json -OutFile apply-barcodes.txt
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("GET", "POST", "APPLY")]
  [string]$Method,

  [string]$Url = "",
  [string]$InFile = "",
  [Parameter(Mandatory = $true)]
  [string]$OutFile,
  [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Stop"

function Write-ErrorResponse {
  param([string]$Message, [string]$Code = "NETWORK_UNAVAILABLE")
  $payload = @{
    success = $false
    error = @{
      code = $Code
      message = $Message
      retriable = $true
    }
  } | ConvertTo-Json -Compress
  $dir = Split-Path -Parent $OutFile
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Set-Content -Path $OutFile -Value $payload -Encoding UTF8
}

try {
  if ($Method -eq "APPLY") {
    if (-not (Test-Path $InFile)) {
      Write-ErrorResponse -Message "APPLY input file missing" -Code "INTERNAL_ERROR"
      exit 2
    }

    $raw = Get-Content -Path $InFile -Raw -Encoding UTF8
    $json = $raw | ConvertFrom-Json
    $lines = @()

    if ($null -ne $json.items) {
      foreach ($item in $json.items) {
        $name = [string]$item.stockItemName
        $code = [string]$item.barcode
        $mfr = [string]$item.manufacturerBarcode
        if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($code)) {
          continue
        }
        $lines += ("{0}|{1}|{2}" -f $name, $code, $mfr)
      }
    }

    $dir = Split-Path -Parent $OutFile
    if ($dir -and -not (Test-Path $dir)) {
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    Set-Content -Path $OutFile -Value ($lines -join "`n") -Encoding UTF8
    exit 0
  }

  if ([string]::IsNullOrWhiteSpace($Url)) {
    Write-ErrorResponse -Message "URL is required for GET/POST"
    exit 2
  }

  $headers = @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
  }

  if ($Method -eq "GET") {
    $response = Invoke-RestMethod -Method GET -Uri $Url -Headers $headers -TimeoutSec $TimeoutSec
  }
  else {
    if (-not (Test-Path $InFile)) {
      Write-ErrorResponse -Message "Request body file not found: $InFile"
      exit 2
    }
    $body = Get-Content -Path $InFile -Raw -Encoding UTF8
    $response = Invoke-RestMethod -Method POST -Uri $Url -Headers $headers -Body $body -TimeoutSec $TimeoutSec
  }

  $dir = Split-Path -Parent $OutFile
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }

  ($response | ConvertTo-Json -Depth 12 -Compress) | Set-Content -Path $OutFile -Encoding UTF8
  exit 0
}
catch {
  $message = $_.Exception.Message
  $code = "NETWORK_UNAVAILABLE"
  if ($message -match "refused" -or $message -match "Unable to connect") {
    $code = "NETWORK_UNAVAILABLE"
  }
  elseif ($message -match "timed out") {
    $code = "NETWORK_UNAVAILABLE"
  }
  Write-ErrorResponse -Message $message -Code $code
  exit 1
}
