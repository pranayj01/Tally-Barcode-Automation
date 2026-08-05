# Native TDL guide (no Node)

Load **`tdl/BarcodeAddon.txt`** only.

---

## `BarcodeAddon.txt`

Entry point. Includes all modules and adds **JG Barcode Tools** to Gateway.

---

## `Config.tdl`

| Setting | Meaning |
|---|---|
| `JGBarcodePrefix` | `JG` |
| `JGBarcodePadLength` | `8` → `JG00000001` |
| `JGBarcodeFontName` | Must match installed Windows font |
| `JGAskPrintOnPurchase` | Prompt after purchase save |

---

## `Sequence.tdl`

Company-level permanent counter.

| Function | Role |
|---|---|
| `JG Ensure Company Sequence` | Init next seq = 1 |
| `JG Allocate Next Barcode` | Issue next `JG########`, bump counter |
| `JG Peek Next Barcode` | Show next without consuming |
| `JG Pad Number` / `JG Format Internal Barcode` | Formatting |

**Never-reuse:** counter never decreases; retired/deleted item codes stay skipped forever.

---

## `Code128.tdl`

Pure TDL **Code 128 Subset B** encoder (not QR, not Code39).

| Function | Role |
|---|---|
| `JG Code128 Encode Safe` | Start B + data + mod-103 checksum + Stop |
| `JG Code128 Glyph From Value` | Map values to Libre Barcode 128 glyphs |
| `JG Mod103` | Checksum helper |

Encoded string is stored in Stock Item UDF `JGBarcodeEncoded` for printing.

---

## `StockItemFields.tdl`

Custom fields on Stock Item:

Barcode, Manufacturer Barcode, Brand, Category, Size, Colour, HSN, GST, Purchase Rate, **MRP**, **Selling Rate**, Opening Qty, Assigned On.

Internal barcode field locks after first assignment.

---

## `PurchaseEvents.tdl`

On Purchase voucher **Form Accept**:

1. Walk inventory lines  
2. Save manufacturer barcode if present  
3. If barcode empty → allocate JG code + encode Code128  
4. Queue labels (`Item|Qty~…`)  
5. Query **Print Barcode Labels?**  
6. Call native print  

---

## `LabelPrint.tdl`

Report `JG Barcode Label Report` — form **50 mm × 25 mm**:

- Item name  
- Brand  
- Code128 bars (font)  
- Barcode number  
- MRP + Selling Rate  

Prints through Tally’s normal Windows print dialog → works with TSC/Zebra/XPrinter/TVS **Windows drivers**.

Also: reprint / batch print helpers.

---

## `SalesScan.tdl`

**Alt+B** on Sales voucher:

1. Scan/type barcode  
2. Resolve internal or manufacturer code  
3. Insert inventory line, **Qty = 1**, selling rate if set  
4. Operator presses Enter → normal Tally stock posting  

---

## `ToolsMenu.tdl`

Gateway tools: next sequence, reprint, search, batch print, font help.
