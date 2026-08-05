# Barcode fonts (required for scannable label bars)

Tally draws barcodes using a Windows font + TDL `[Style]` on a Field
(official Tally FAQ / sample). Without the font installed, you only see plain text.

## Module 06 — Print Barcode (current)

Uses **Libre Barcode 39** (Code39). Start/stop characters are `*`.

1. Double-click `LibreBarcode39-Regular.ttf` in this folder → **Install**
2. Restart **TallyPrime**
3. Stock Item → **Print Barcode** — bars should appear above Alias + Name

Alternate (Tally sample font): install **IDAutomationHC39S**, then in
`06_barcode_print.tdl` set Style Font to `IDAutomationHC39S` and change
`Set As` wrappers from `*…*` to `(…)`.

## Optional — Code128 (batch labels / older modules)

1. Download **Libre Barcode 128** (Regular):
   - https://fonts.google.com/specimen/Libre+Barcode+128
   - or direct: https://github.com/google/fonts/raw/main/ofl/librebarcode128/LibreBarcode128-Regular.ttf
2. Double-click `LibreBarcode128-Regular.ttf` → **Install**
3. Restart **TallyPrime**
4. Confirm `tdl\Config.tdl` has:
   ```
   JGBarcodeFontName : "Libre Barcode 128"
   ```

## Printers

Install the normal **Windows printer driver** for TSC / Zebra / XPrinter / TVS / any generic printer.
In Windows, create a paper size **50 mm × 25 mm** (or closest label size) and select it when Tally prints.

## If bars do not scan

- Font not installed / wrong name in Config
- Label printer density too light — raise darkness in printer driver
- Test from **JG Barcode Tools → Reprint**
