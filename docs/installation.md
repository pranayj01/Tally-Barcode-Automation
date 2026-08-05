# Native installation (no Node.js)

## Requirements

- TallyPrime (Windows)
- This add-on’s `tdl\` folder
- Font: **Libre Barcode 128** (see `fonts\README.md`)
- Optional: Windows driver for your thermal printer (TSC / Zebra / XPrinter / TVS)

## Steps

1. **Install font**  
   Download and install `LibreBarcode128-Regular.ttf`, restart TallyPrime.

2. **Load TDL**  
   Gateway of Tally → **F1** → **TDL & Add-Ons** → select:

   `...\tallyprime-barcode-addon\tdl\BarcodeAddon.txt`

   This is a **single bundled file** (required). Do not load the `.tdl` fragments separately.

3. **Confirm menu**  
   Gateway should show **JG Barcode Tools**.

4. **Stock Item**  
   Open any item — you should see Barcode, Manufacturer Barcode, MRP, Selling Rate, Brand, etc.

5. **Configure printer paper** (Windows)  
   Add a form/paper size **50 mm × 25 mm** for your label printer, or pick the closest size at print time.

6. **Test purchase**  
   - Set MRP + Selling Rate on the item  
   - Optional: Manufacturer Barcode  
   - Create Purchase → Accept  
   - Answer **Yes** to print labels  
   - Stick labels and scan with **Alt+B** on Sales  

## Sequence / never-reuse

Company UDFs store:

- `JGNextSeq` — next number to issue  
- `JGHighestIssued` — audit high-water mark  

Numbers only increase. Deleting a stock item does **not** free its barcode.

## Troubleshooting

| Issue | Fix |
|---|---|
| No “JG Barcode Tools” | TDL path wrong / not loaded for this company |
| Bars look like weird text | Font not installed or name mismatch in `Config.tdl` |
| Printer wrong size | Set 50×25 mm paper in Windows printer preferences |
| Scan finds nothing | Confirm barcode saved on Stock Item; try Tools → Search |
| TDL syntax error on load | Load `BarcodeAddon.txt` only (not individual files twice) |

## Uninstall

Remove the TDL path from TallyPrime Add-Ons. Stock Item UDF values remain in company data until you clear them.
