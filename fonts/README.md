# Barcode fonts

Labels use **Libre Barcode 39** (Code39). Start/stop = `*`.

1. Double-click `LibreBarcode39-Regular.ttf` in this folder → **Install**
2. Restart **TallyPrime**
3. Print a label — bars should appear above Alias + Name

Alternate: install **IDAutomationHC39S**, then set Style Font in `07_label_report.tdl` and change wrappers from `*…*` to `(…)`.

## Printers

Use the normal Windows driver for your label printer. Pick a paper size that matches your sticker (or closest) at print time.
