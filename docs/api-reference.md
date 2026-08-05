# API Reference (OPTIONAL Node service)

> The native Tally plugin does **not** use these endpoints.  
> Kept only for optional/advanced HTTP + PDF workflows under `optional/`.

Base URL when running the optional API: `http://127.0.0.1:3100`

See previous implementation in `optional/node-api-services/barcode-api`.

Primary endpoints:

- `GET /health`
- `POST /generateBarcode`
- `POST /processPurchaseLines`
- `POST /printLabels` (requires `mrp` + `sellingRate`)
- `POST /reprintLabels`
- `GET /barcodes/search`
- `GET /barcodes/:code`
- `POST /barcodes/:code/retire`
