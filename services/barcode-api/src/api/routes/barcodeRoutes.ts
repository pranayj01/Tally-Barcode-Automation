import { Router } from "express";
import type { GenerateBarcodeUseCase } from "../../application/GenerateBarcodeUseCase";
import type { SearchBarcodeUseCase, RetireBarcodeUseCase } from "../../application/SearchBarcodeUseCase";
import { AppError } from "../../domain/errors/AppError";
import { generateBarcodeSchema, registerManufacturerSchema } from "../schemas/requestSchemas";

export function createBarcodeRoutes(deps: {
  generateBarcode: GenerateBarcodeUseCase;
  searchBarcode: SearchBarcodeUseCase;
  retireBarcode: RetireBarcodeUseCase;
}): Router {
  const router = Router();

  router.post("/generateBarcode", async (req, res, next) => {
    try {
      const parsed = generateBarcodeSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid generateBarcode payload", {
          details: parsed.error.flatten(),
        });
      }

      const result = await deps.generateBarcode.execute(parsed.data);
      res.status(201).json({
        barcode: result.barcode,
        manufacturerBarcode: result.manufacturerBarcode,
        source: result.source,
        mrp: result.mrp,
        sellingRate: result.sellingRate,
        stockItemName: result.stockItemName,
        record: result.record,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * When a manufacturer barcode exists on the invoice line, persist it
   * and still allocate a permanent internal JG barcode for label/scan use.
   */
  router.post("/registerManufacturerBarcode", async (req, res, next) => {
    try {
      const parsed = registerManufacturerSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid registerManufacturerBarcode payload", {
          details: parsed.error.flatten(),
        });
      }

      const result = await deps.generateBarcode.execute({
        ...parsed.data,
        preferManufacturerAsPrimary: false,
      });

      res.status(201).json({
        barcode: result.barcode,
        manufacturerBarcode: result.manufacturerBarcode,
        source: result.source,
        mrp: result.mrp,
        sellingRate: result.sellingRate,
        stockItemName: result.stockItemName,
        record: result.record,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/barcodes/search", async (req, res, next) => {
    try {
      const q = String(req.query.q ?? "");
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const rows = await deps.searchBarcode.search(q, limit);
      res.json({ success: true, count: rows.length, items: rows });
    } catch (error) {
      next(error);
    }
  });

  router.get("/barcodes/:code", async (req, res, next) => {
    try {
      const record = await deps.searchBarcode.byCode(req.params.code);
      res.json({ success: true, item: record });
    } catch (error) {
      next(error);
    }
  });

  router.post("/barcodes/:code/retire", async (req, res, next) => {
    try {
      const record = await deps.retireBarcode.execute(req.params.code);
      res.json({
        success: true,
        message: "Barcode retired permanently and will never be reused",
        item: record,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
