# Architecture

## Principle

Runtime = **TDL inside TallyPrime** only. Barcode identity = Stock Item **Alias**.

```
TallyPrime
  ├── Alias generate / write (Purchase)
  ├── Print queue (06)
  └── Label report (07/08) → Libre Barcode 39 → Windows printer
```

## Modules

| Concern | File |
|---|---|
| Sequence UDFs | `01_udf.tdl` |
| Alias generation | `02_functions.tdl` |
| Purchase automation | `04_purchase.tdl` |
| Print engine | `06_print_engine.tdl` |
| Label layout | `07_label_report.tdl` |
| Templates | `08_templates.tdl` |
| Diagnostics | `09_diagnostics.tdl` |
| Fast item entry | `10_fast_item_entry.tdl` |

## Removed (legacy)

- `SalesScan.tdl` / Alt+B POS hooks  
- `Code128.tdl` / Libre Barcode 128 encoder  
- `BarcodeAddon.txt` and old fragment stack  
- Node `services/` API  

Sales scanning uses Tally’s native item field + Alias.
