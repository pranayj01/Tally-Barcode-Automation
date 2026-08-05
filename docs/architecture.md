# Architecture — Native Tally plugin

## Principle

All runtime logic lives in **TDL inside TallyPrime**.

No localhost server, no npm, no HTTP bridge.

```
┌─────────────────────────────────────────┐
│              TallyPrime                 │
│  Stock Item UDFs  │  Company sequence   │
│  Purchase events  │  Sales Alt+B scan   │
│  Code128 encode   │  50x25 label report │
└─────────────┬───────────────────────────┘
              │ Windows print spooler
              ▼
     TSC / Zebra / XPrinter / TVS / any printer
```

## Modules

| Concern | Module |
|---|---|
| Config | `Config.tdl` |
| Sequence / no-reuse | `Sequence.tdl` |
| Code128 | `Code128.tdl` |
| Master fields | `StockItemFields.tdl` |
| Purchase automation | `PurchaseEvents.tdl` |
| POS scan | `SalesScan.tdl` |
| Labels | `LabelPrint.tdl` |
| Operator tools | `ToolsMenu.tdl` |

## Data permanence

- Barcode stored on Stock Item (`JGBarcode`)
- Encoded print string stored (`JGBarcodeEncoded`)
- Sequence on Company (`JGNextSeq`, `JGHighestIssued`)
- Field becomes inactive after assignment

## Printing

Labels are a normal Tally **Print Report** using a Code128 **font**.  
Thermal printers are supported via their **Windows drivers** (same as printing invoices).

## Optional Node API

Deprecated for daily use. Archived under `optional/node-api` for sites that still want PDF generation over HTTP.
