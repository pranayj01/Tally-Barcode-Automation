import { z } from "zod";
import { Router } from "express";
import type { GenerateBarcodeUseCase } from "../../application/GenerateBarcodeUseCase";
import type { PrintLabelsUseCase } from "../../application/PrintLabelsUseCase";
import { AppError } from "../../domain/errors/AppError";
import { generateBarcodeSchema, printLabelsSchema } from "../schemas/requestSchemas";

const purchaseLineSchema = generateBarcodeSchema.extend({
  quantity: z.number().positive().optional().default(1),
  printCopies: z.number().int().min(0).max(500).optional(),
});

const processPurchaseSchema = z.object({
  voucherNumber: z.string().trim().max(80).optional(),
  companyName: z.string().trim().max(200).optional(),
  printAfter: z.boolean().optional().default(false),
  printMode: z.enum(["pdf", "windows", "zebra", "tsc", "xprinter", "tvs", "auto"]).optional(),
  lines: z.array(purchaseLineSchema).min(1),
});

export function createPurchaseRoutes(deps: {
  generateBarcode: GenerateBarcodeUseCase;
  printLabels: PrintLabelsUseCase;
}): Router {
  const router = Router();

  /**
   * Batch endpoint used by TDL after Purchase voucher save.
   * For each line:
   *  - if manufacturerBarcode present → store it + allocate internal JG barcode
   *  - else → allocate internal JG barcode
   * Optionally prints labels (MRP + Selling Rate included).
   */
  router.post("/processPurchaseLines", async (req, res, next) => {
    try {
      const parsed = processPurchaseSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid processPurchaseLines payload", {
          details: parsed.error.flatten(),
        });
      }

      const results = [];
      const labelItems = [];

      for (const line of parsed.data.lines) {
        const generated = await deps.generateBarcode.execute({
          ...line,
          voucherNumber: parsed.data.voucherNumber ?? line.voucherNumber,
          companyName: parsed.data.companyName ?? line.companyName,
          preferManufacturerAsPrimary: false,
        });

        results.push({
          stockItemName: generated.stockItemName,
          barcode: generated.barcode,
          manufacturerBarcode: generated.manufacturerBarcode,
          source: generated.source,
          mrp: generated.mrp,
          sellingRate: generated.sellingRate,
        });

        const copies =
          line.printCopies !== undefined
            ? line.printCopies
            : Math.max(1, Math.round(line.quantity ?? 1));

        if (copies > 0) {
          labelItems.push({
            barcode: generated.barcode,
            name: generated.stockItemName ?? generated.barcode,
            mrp: generated.mrp ?? line.mrp ?? 0,
            sellingRate: generated.sellingRate ?? line.sellingRate ?? 0,
            brand: line.brand,
            copies,
          });
        }
      }

      let printResult = null;
      if (parsed.data.printAfter && labelItems.length > 0) {
        const printParsed = printLabelsSchema.parse({
          items: labelItems,
          mode: parsed.data.printMode,
        });
        printResult = await deps.printLabels.execute(printParsed);
      }

      res.status(200).json({
        success: true,
        count: results.length,
        items: results,
        print: printResult,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
