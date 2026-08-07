# TDL modules

Load the numbered files under `tdl\`. Do not load removed legacy files (`BarcodeAddon.txt`, `SalesScan.tdl`, `Code128.tdl`, etc.).

## `01_udf.tdl`

Company sequence UDFs for Alias generation.

## `02_functions.tdl`

Generate Alias strings (`{Initials}{YY}{7-digit}`). No UI.

## `04_purchase.tdl`

On Purchase accept: keep existing Alias, or generate and write `FirstAlias` if empty. Optional print prompt.

## `06_print_engine.tdl`

Build print queue / payload (item, Alias, MRP, rate, copies).

## `07_label_report.tdl`

Single-label report. Bars via **Libre Barcode 39** (`*Alias*`).

## `08_templates.tdl`

Label sheet / print templates used by the print engine.

## `09_diagnostics.tdl`

Peek / allocate test helpers (does not write Alias by itself).
