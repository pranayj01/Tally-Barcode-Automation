# TallyPrime Barcode Add-on

Native TDL only — barcode = Stock Item **Alias**. Labels print with **Libre Barcode 39**.

## What it does

- Purchase save → ensure each item has an Alias (keep existing / generate if empty)
- Print barcode labels (Alias + name + MRP + rate)
- Sales: scan Alias natively in Tally, or **Ctrl+Alt+I** Fast Item Entry
- Fast Item Entry (Ctrl+Alt+I): scan/select + Enter, same item adds qty; Ctrl+A posts all lines

## Install

1. Install font: `fonts/LibreBarcode39-Regular.ttf` → restart TallyPrime  
2. F1 → TDL & Add-Ons → load these files (in order):

```
tdl/01_udf.tdl
tdl/02_functions.tdl
tdl/04_purchase.tdl
tdl/06_print_engine.tdl
tdl/07_label_report.tdl
tdl/08_templates.tdl
tdl/09_diagnostics.tdl
tdl/10_fast_item_entry.tdl
```

## Layout

```
tdl/
  01_udf.tdl           Company sequence UDFs
  02_functions.tdl     Alias generation
  04_purchase.tdl      Purchase → Alias + print prompt
  06_print_engine.tdl  Print queue / payload
  07_label_report.tdl  Single label layout (Code39)
  08_templates.tdl     Sheet / templates
  09_diagnostics.tdl   Peek / allocate tests
  10_fast_item_entry.tdl Fast scan/pick on Purchase & Sales
fonts/                 Libre Barcode 39
docs/                  Guides
```

## Docs

- [Installation](docs/installation.md)
- [TDL guide](docs/tdl-guide.md)
- [Architecture](docs/architecture.md)

