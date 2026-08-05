from pypdf import PdfReader
from pathlib import Path
pdf = Path(r"C:\Users\prana\Projects\tallyprime-barcode-addon\docs\TDL_Reference_Manual.pdf")
out = Path(r"C:\Users\prana\Projects\tallyprime-barcode-addon\docs\_debug_manual.txt")
r = PdfReader(str(pdf))
pages_needed = list(range(75, 95)) + list(range(210, 220)) + list(range(228, 235)) + list(range(254, 290)) + list(range(500, 510))
terms = ["WALK COLLECTION", "Walk Collection", "NEW OBJECT", "SET VALUE", "ACCEPT ALTER", "Form Accept", "FirstAlias", "Calling a Function", "FactorialOf", "ALTER OBJECT", "Inventory Entries", "StockItemName", "$$LastResult"]
with out.open("w", encoding="utf-8") as f:
    f.write(f"TOTAL_PAGES={len(r.pages)}\n")
    for i in pages_needed:
        if 0 <= i-1 < len(r.pages):
            t = r.pages[i-1].extract_text() or ""
            f.write(f"\n===== PAGE {i} =====\n{t}\n")
    f.write("\n===== TERM INDEX =====\n")
    for i, page in enumerate(r.pages):
        t = page.extract_text() or ""
        for term in terms:
            if term in t:
                f.write(f"p{i+1}: {term}\n")
print("ok", len(r.pages))
