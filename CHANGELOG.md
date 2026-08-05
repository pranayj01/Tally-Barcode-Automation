# Changelog

## Architecture change — Alias-only barcode (FINAL)

**Date:** 2026-08-04  
**Files Changed:** `tdl/01_udf.tdl`, `tdl/02_functions.tdl`, `tdl/03_stockitem.tdl` (removed), `tdl/09_diagnostics.tdl`  
**Reason:** Single barcode per item = native Stock Item **Alias**. No custom barcode UDFs, no manufacturer barcode, no Barcode Details UI.

**Rules:**
- Purchase scan existing → save into Alias
- No barcode → generate `{Initials}{YY}{7-digit}` → store in Alias
- Sales search by Alias
- Print Alias as Code 128
- Never more than one barcode per item

**Result:** Foundation redesigned — pending reload test

---

## Module 01 — UDF Definitions (revised)

**Date:** 2026-08-04  
**Files Changed:** `tdl/01_udf.tdl`  
**Reason:** Company sequence UDFs only. Removed `JGBarcode` / `JGManufacturerBarcode`.

| Name | Type | Index | Purpose |
|------|------|-------|---------|
| `JGNextSeq` | Number | 21100 | Next sequence for Alias generation |
| `JGHighestIssued` | Number | 21101 | Audit / never-reuse |
| `JGSequenceYear` | Number | 21102 | Year-scoped counter |

**Tests Performed:** Pending reload after Alias-only redesign  

**Result:** PENDING

---

## Module 02 — Functions (revised)

**Date:** 2026-08-04  
**Files Changed:** `tdl/02_functions.tdl`  
**Reason:** Generation only; returns string for Alias. Company UDFs moved to Module 01. No UI.

**Depends on:** `01_udf.tdl`  

**Result:** PENDING (with Module 01 reload)

---

## Module 03 — Stock Item fields

**Status:** CANCELLED  
**Reason:** Alias is native; no custom Barcode Details section or Stock Item barcode UDFs.  
**Files:** `tdl/03_stockitem.tdl` deleted

---

## Module 09 — Diagnostics

**Date:** 2026-08-04  
**Files Changed:** `tdl/09_diagnostics.tdl`  
**Reason:** Peek/Allocate test generation only; messages clarify Alias is not written here.

**Result:** PENDING (with foundation reload)

---

## Foundation reload — Alias-only

**Date:** 2026-08-04  
**Tests Performed:** User confirmed MODULE PASSED after Alias-only redesign (`01`, `02`, `09`; `03` cancelled)  
**Result:** PASSED

---

## Module 04 — Purchase → Alias

**Date:** 2026-08-04  
**Files Changed:** `tdl/04_purchase.tdl`  
**Reason:** On Purchase save, ensure each inventory Stock Item has Alias. Keep existing Alias; if empty generate and write. Never overwrite. No printing.

**Depends on:** `01_udf.tdl`, `02_functions.tdl`  

**Follow-up fix (same module):** Removed invented `$$Call:` (manual p.278 → `$$FunctionName`). Alias via documented `$FirstAlias` / `Set Value : FirstAlias`. FilterValue to documented 4-part form (p.85). Also updated `02_functions.tdl` / `09_diagnostics.tdl` `$$Call` sites so Allocate chain works.

**Tests Performed:** Pending user Purchase retest after `$$Call` fix  

**Result:** PENDING
