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

---

## Purchase label printing — broken call chain fixed + reprint button

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`, `tdl/06_print_engine.tdl`  
**Reason:** "Print Barcode Labels?" answered Yes did nothing.

**Root cause:** `JGLoadItemPrintPayload` read MRP with a remote bracketed path
`$$String:$MRPDetails[Last].MRPRateDetails[Last].MRPRate:StockItem:<name>`.
`$Method:ObjectType:Identifier` accepts a simple method only — a sub-collection
path cannot be attached to it. The step failed, the function never reached
`RETURN : Yes`, `$$LastResult` came back No, and `Print Report` was skipped for
every line. Nothing printed and nothing was reported.

**Fix:** Alias, MRP and Rate are now read inside `Walk Collection : JGStockItemByNameColl`,
i.e. in Stock Item object context — the same context the working Ctrl+Alt+B path uses.

**Added:** `JGPurcPrintLabelsButton` + `JGPurcPrintLabelsBtn` (Ctrl+Alt+B on
`[#Form: Voucher]`) reprints labels from a saved Purchase Voucher.
`JGPurcPrintLabelsFromQty` now counts lines and prints, and raises a message when
it would otherwise no-op silently.

**Unchanged:** `01_udf.tdl`, Stock Item Labels to Print field, Stock Item Ctrl+Alt+B
workflow, `07_label_report.tdl`, `08_templates.tdl`.

**Tests Performed:** Pending user retest  

**Result:** PARTIAL — first item printed with correct quantity, later items did not

---

## Purchase label printing — all items, no prompt, fewer screens

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`  
**Reason:** Three issues from the first retest.

**1. Only the first item printed.** `Print Report` ran inside
`Walk Collection : Inventory Entries`, and the interactive print screen ended the
walk on the first line. `JGPurcPrintLabelsFromQty` is now two-phase: the walk only
builds a `Item|Qty~` token string, and every print happens after `End Walk`.
Tokens are split with `FOR TOKEN` + `$$LoopIndex` (Rel 2.0, `_debug_manual` p.509),
avoiding `$$StringFind` index-base assumptions.

**2. Prompt after saving removed.** The `Query Box : "Print Barcode Labels?"` and
variable `JGPrintLabelsChoice` are gone from `JGPurcOnAccept`. Saving a Purchase
Voucher now only assigns Aliases. Printing is always explicit via Ctrl+Alt+B.

**3. Repeated Esc in the print screen.** Each label job opened Tally's print
configuration screen. `Print Report : JGLabelReport : Yes` suppresses it
(Rel 3.0 — second parameter is the suppress-configuration logical,
`_fnact_477` p.467), so a voucher with N items produces N jobs and no screens
to dismiss. Labels go straight to the printer configured in Tally; change the
trailing `Yes` to `No` in `JGPurcPrintOneToken` to bring the screen back.

**Unchanged:** `01_udf.tdl`, Stock Item Labels to Print field, Stock Item Ctrl+Alt+B
workflow, `07_label_report.tdl`, `08_templates.tdl`.

**Tests Performed:** User retest  

**Result:** FAILED — "No item in this voucher has a barcode alias yet"

---

## Purchase label printing — alias lookup outside the walk

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`, `tdl/06_print_engine.tdl`  
**Reason:** Every item failed the alias lookup. The message only fires after the
loop finishes, so the loop itself ran — the lookup returned empty.

**Root cause (most likely):** `JGLoadItemPrintPayload` walks `JGStockItemByNameColl`.
Until now that walk always ran nested inside `Walk Collection : Inventory Entries`,
where a Stock Item is already in context. Moving the print out of the walk made it
the first standalone use, and `$$Alias` came back empty.

**Fix:** Alias and Rate fall back to remote simple methods
(`$FirstAlias:StockItem:<name>`, `$StandardPrice:StockItem:<name>`) when the walk
yields nothing.

**Also removed:** `FOR TOKEN` from the print loop. It was unverified on this build
and was the second candidate for the failure. The queue is now fixed-width
(`<qty:4><name length:4><name>`), parsed with `$$StringPart` only.
`JGPurcStrOffset` probes whether `$$StringPart` is 0- or 1-based at runtime, since
the ERP 9 manual shows 0 (`_sp.txt`, `_linefn` p.645) while working code in
`02_functions.tdl` assumes 1.

**Diagnostics:** the failure message now reports how many lines were read and the
last item name parsed, so a mangled name would point at parsing rather than lookup.

**Tests Performed:** Pending user retest  

**Result:** PENDING

---

## Purchase print — one queue, one Print Report

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`, `tdl/06_print_engine.tdl`, `tdl/07_label_report.tdl`, `tdl/08_templates.tdl`  
**Reason:** `Print Report` inside the item loop is modal, so only the first
product printed and Esc had to be pressed repeatedly.

**New pipeline:**
1. `JGClearLabelQueue`
2. Walk inventory entries — enqueue each item `$BilledQty` times into compound
   list `JGLabelQueue` (no print)
3. `JGPackLabelRows` → rows of 3 in `JGLabelRows`
4. `Print Report : JGLabelReport` exactly once

Module 08 now `Repeat`s `JGSheetRowLine` over `JGLabelRowColl` (Data Source =
variable `JGLabelRows`). One preview / one print job for the whole voucher.
Stock Item Ctrl+Alt+B uses the same queue path (enqueue LabelsToPrint copies,
then print once).

**Unchanged behaviour:** quantity always from `$BilledQty` on Purchase; Stock
Item still uses `JGLabelsToPrint`; no post-save prompt; 60×40 mm / 3-col A4 sizes.

**Follow-up fix 1:** `Line: JGSheetRowLine` had only `Explode` and no `Fields`,
which TDL rejects ("No 'FIELDS' or 'LINES'") during preview generation.

**Follow-up fix 2 — columns rendered vertically.** Three sticker sub-Parts with
`Vertical : No` still stacked one below the other, so a row printed as three
rows. Reworked: the three stickers of a row are now FIELDS on shared Lines
(bars / alias / name / MRP / rate), each 60 mm wide. Fields on one Line are
always side by side, so the 3-column grid no longer depends on sub-Part
orientation. The bars fields live on `JGSheetRowLine` itself, which also removes
the empty anchor line added in fix 1.

**Follow-up fix 3 — empty trailing slots.** `Invisible : NOT $Show2/$Show3` did
not suppress unused slots, which printed `**` bars and bare "MRP :" / "Rate :".
Each slot now blanks itself via `if $$IsEmpty:$A<n> then "" else ...`.

**Confirmed working from the failed preview:** compound-list objects resolve
correctly through the repeat (`$A1`/`$A2`/`$N1` returned real aliases, names and
per-item counts), so only geometry needed fixing.

**Follow-up fix 4 — attempted, REVERTED.** To chase a 5-page preview, the
loop-delete clearing and the removal of `Form` `Width`/`Height` + `Scroll` were
tried. Dropping the fixed form size collapsed the layout to barcodes only (alias,
name, MRP and rate lines disappeared) and the page count stayed at 5, so both
edits were rolled back.

**Follow-up fix 5 — whole sheet repeated once per row.** User test matrix:

| Labels | Rows | Pages |
|---|---|---|
| 3 (1 item) | 1 | 1 |
| 4 (3+1) | 2 | 2 |
| 7 (3+4) | 3 | 3 |
| 50 (30+20) | 17 | 34 (2-page sheet × 17) |

Pages tracked row count exactly, i.e. the report was generated once per object.
Cause: `[Report: JGLabelReport]` carried `Collection : JGLabelRowColl`. A Report
bound to a collection renders once per object in it. The rows are already
consumed by `Repeat : JGSheetRowLine : JGLabelRowColl` on `JGSheetPart`, so the
Report-level `Collection` was removed.

**Tests Performed:** 3-column layout and blank trailing slots confirmed by user;
page count pending retest  

**Result:** PENDING

---

## Stock Item create — Alias auto-generation restored

**Date:** 2026-08-06  
**Files Changed:** `tdl/06_print_engine.tdl`  
**Reason:** Creating a Stock Item with an empty Alias no longer wrote a
zero-padded code (`000000456`). Alias assignment lived only on Purchase
Form Accept (`JGPurcSetAliasIfEmpty`); the Stock Item master had no
equivalent.

**Fix:** `On : Form Accept` on `[#Form: Stock Item]` calls
`JGSIEnsureAliasOnAccept`. If `$$Alias` is empty it issues the next code via
`JGPurcNextCode` (same 7-digit padded sequence Purchase uses) and attaches it
with `Insert Collection Object : Name` on the current object. A user-typed
Alias is never overwritten.

**Follow-up (still broken after first fix):** Root cause was call order.
`JGPurcNextCode` does `New Object : Company` + `Accept Alter`, which switches
object context away from the Stock Item form *before* Alias was inserted, so
steps 13–14 wrote nowhere useful. Rewrite: read `JGNextSeq` remotely, insert
Alias on the current Stock Item first, then bump the company counter.

**Follow-up 2 — sequence gaps 14–16, Alias still blank on Gateway Create:**
User confirmed Purchase-path create+print works; Gateway → Stock Item → Create
left Alias empty but `JGNextSeq` advanced (0000013 then 0000017). Cause:
`On : Form Accept : Call only` overrides default accept (manual p.535) and the
handler bumped Company **before** the master was saved — counter consumed,
Alias never persisted.

**Fix:** Official two-line hook:
`On : Form Accept : Yes : Form Accept` then
`On : Form Accept : Yes : Call : JGSIEnsureAliasOnAccept`.
Handler now delegates to `JGPurcSetAliasIfEmpty` (same `New Object : Stock Item`
path that works on Purchase save). Gaps 14–16 are spent numbers and will not
be reused (by design).

**Tests Performed:** Pending user retest  

**Result:** PENDING

---

## Label size hardcoded to 66.5 × 27.5 mm — 3×10 = 30 / A4

**Date:** 2026-08-06  
**Files Changed:** `tdl/08_templates.tdl`, `tdl/07_label_report.tdl`  
**Reason:** Physical sticker sheet is 66.5 × 27.5 mm, **3 columns × 10 rows
= 30 labels per A4 page** (not 3×8).

**Fit math:** 10 × 27.5 mm = 275 mm of label height → only 22 mm left on A4
for margins. Row `Height : 27.5 mm`, `Space Bottom : 0`, `Space Top : 11 mm`.
Widths 66.5 mm, column gutters 2.5 mm, left margin 5 mm. Barcode font height 12
so bars+text fit inside 27.5 mm. No config UI.

**Follow-up — parameterized only (layout logic unchanged):** dimensions moved to
`[System: Formula]` (`JGPageWidth/Height`, `JGLabelWidth/Height`,
`JGLeftMargin`, `JGTopMargin`, `JGGapX/Y`, `JGCols`, `JGRows`). Form/Part/Field
attributes use `@@… mm`. Physical sheet: margins 3.5/4 mm, gaps 1.5 mm,
3×10. If `JGGapY` overflows the last row, set it to 0.

**Follow-up — barcode/text white gap:** Bars lived on `JGSheetRowLine` while
Alias/Name/MRP/Rate were in an `Explode`d Part that also had `Height : 27.5 mm`,
so Tally reserved a full second cell and left a blank band. Bars moved into
`JGSheetRowPart` as `JGRowBarsLine` (first line); row Line keeps a zero-width
anchor + Explode only; Part Height removed. `JGLabelBarsStyle` Height set to 16
in `07_label_report.tdl`.

**Follow-up — labels too far apart:** Preview showed ~25 mm left margin and
~45 mm row pitch (not 3.5 / 29 mm). Cause: `Width : @@JGLabelWidth mm` was
ignored by Tally. Formulas now return full strings (`"66.5 mm"`) and attributes
use `Width : @@JGLabelWidth` with no trailing unit. Part Height restored to
label height; barcode style Height 12. Sheet: 3.5+66.5+1.5+66.5+1.5+66.5+3.5
= 210; 4+10×27.5+9×1.5+4 = 297.

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`  
**Reason:** For packed goods (1 BOX = 6 PC, voucher 60 PC = 10 BOX), labels
must be one per inner pack, not one per piece.

**Fix:** `JGPurcLabelCountFromLine` uses `$$String:$BilledQty:Secondary`
(Tally FAQ 6201 — qty in alternate units). Falls back to primary
`$$Number:$BilledQty` when the item has no alternate unit.
Stock Item "Labels to Print" / Ctrl+Alt+B unchanged.

**Date:** 2026-08-06  
**Files Changed:** `tdl/04_purchase.tdl`, `tdl/06_print_engine.tdl`  
**Reason:** User confirmed label Rate must be Stock Item selling price
(`$StandardPrice`), not Purchase voucher buying Rate. Temporary override
reverted; behaviour restored to pre-change.
