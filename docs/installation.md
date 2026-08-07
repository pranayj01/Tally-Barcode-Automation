# Native installation

## Requirements

- TallyPrime (Windows)
- This add-on’s `tdl\` modules
- Font: **Libre Barcode 39** (`fonts\LibreBarcode39-Regular.ttf`)

## Steps

1. **Install font** — double-click `LibreBarcode39-Regular.ttf` → Install → restart TallyPrime.

2. **Load TDL** — Gateway → **F1** → **TDL & Add-Ons** → add each file:

   - `tdl\01_udf.tdl`
   - `tdl\02_functions.tdl`
   - `tdl\04_purchase.tdl`
   - `tdl\06_print_engine.tdl`
   - `tdl\07_label_report.tdl`
   - `tdl\08_templates.tdl`
   - `tdl\09_diagnostics.tdl`

3. **Purchase** — accept a Purchase voucher; empty Alias items get a generated Alias. Answer **Yes** to print labels if prompted.

4. **Sales** — scan the Alias into the item field (native Tally). No separate SalesScan TDL.

## Sequence

Company UDFs:

- `JGNextSeq` — next number to issue  
- `JGHighestIssued` — audit high-water mark  
- `JGSequenceYear` — year-scoped counter  

## Troubleshooting

| Issue | Fix |
|---|---|
| Bars look like text | Install Libre Barcode 39 and restart Tally |
| No print after Purchase | Confirm modules `04` + `06`–`08` are loaded |
| TDL load error | Load only the numbered modules above |
