# TallyPrime Barcode Add-on (Native TDL)

**Direct Tally plugin — no Node.js, no API, no PowerShell bridge.**

Everything runs inside TallyPrime via TDL:

- Generate permanent internal barcodes `JG00000001` …
- Store manufacturer barcodes
- Print 50×25 mm labels (Name, Brand, Code128, MRP, Selling Rate)
- Scan on sales (**Alt+B**) → item + Qty 1

## Install (3 steps)

### 1. Install Code128 font (once)

See [`fonts/README.md`](fonts/README.md) — install **Libre Barcode 128**, then restart Tally.

### 2. Load the TDL

TallyPrime → **F1** → **TDL & Add-Ons** → load:

```
C:\Users\prana\Projects\tallyprime-barcode-addon\tdl\BarcodeAddon.txt
```

### 3. Use it

| Action | How |
|---|---|
| Stock fields | Stock Item → Barcode, Manufacturer Barcode, Brand, MRP, Selling Rate, … |
| Purchase | Accept Purchase voucher → barcodes auto-assign → **Print Barcode Labels?** |
| Sales scan | Sales voucher → **Alt+B** → scan → Qty 1 → Enter |
| Tools | Gateway → **JG Barcode Tools** |

## Workflow

```
Purchase Entry
    ↓
For each stock item:
    IF Manufacturer Barcode present → save it
    IF Barcode empty → allocate JG######## (never reused)
    ↓
"Print Barcode Labels?" → Yes
    ↓
Tally prints 50×25mm labels to Windows / thermal driver
    ↓
Sales: Alt+B scan → item selected → Qty 1 → invoice → stock reduces
```

## Project layout

```
tdl/                 ← LOAD THIS (native plugin)
  BarcodeAddon.txt   ← entry file
  Config.tdl
  Sequence.tdl
  Code128.tdl
  StockItemFields.tdl
  PurchaseEvents.tdl
  SalesScan.tdl
  LabelPrint.tdl
  ToolsMenu.tdl
fonts/               ← install Libre Barcode 128
docs/                ← guides
services/            ← old Node API (NOT required — ignore)
```

## Docs

- [Native installation](docs/installation.md)
- [TDL file guide](docs/tdl-guide.md)
- [Architecture](docs/architecture.md)

## Optional Node API

Folder `services\` is the old Node/PDF service. **Ignore it.** Day-to-day use is TDL-only.
