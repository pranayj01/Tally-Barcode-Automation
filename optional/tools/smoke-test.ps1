# Manual API smoke tests (API must be running on :3100)

$base = "http://127.0.0.1:3100"

Invoke-RestMethod "$base/health"

Invoke-RestMethod -Method POST -Uri "$base/generateBarcode" -ContentType "application/json" -Body (@{
  stockItemName = "Sample Tee"
  brand = "JG"
  mrp = 999
  sellingRate = 849
} | ConvertTo-Json)

Invoke-RestMethod -Method POST -Uri "$base/printLabels" -ContentType "application/json" -Body (@{
  mode = "pdf"
  items = @(
    @{
      barcode = "JG00000001"
      name = "Sample Tee"
      mrp = 999
      sellingRate = 849
      brand = "JG"
      copies = 1
    }
  )
} | ConvertTo-Json -Depth 5)
