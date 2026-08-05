import { Router } from "express";
import type { PrintLabelsUseCase } from "../../application/PrintLabelsUseCase";
import { AppError } from "../../domain/errors/AppError";
import { printLabelsSchema, reprintSchema } from "../schemas/requestSchemas";

export function createPrintRoutes(deps: { printLabels: PrintLabelsUseCase }): Router {
  const router = Router();

  router.post("/printLabels", async (req, res, next) => {
    try {
      const body = Array.isArray(req.body) ? { items: req.body } : req.body;
      const parsed = printLabelsSchema.safeParse(body ?? {});
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid printLabels payload", {
          details: parsed.error.flatten(),
        });
      }

      const result = await deps.printLabels.execute(parsed.data);
      res.status(200).json({
        success: result.success,
        mode: result.mode,
        printedCount: result.printedCount,
        pdfPath: result.pdfPath ?? null,
        jobId: result.jobId ?? null,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/reprintLabels", async (req, res, next) => {
    try {
      const parsed = reprintSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", "Invalid reprintLabels payload", {
          details: parsed.error.flatten(),
        });
      }

      const result = await deps.printLabels.reprintByBarcodes(parsed.data.barcodes, {
        mode: parsed.data.mode,
        printerName: parsed.data.printerName,
        printerHost: parsed.data.printerHost,
        printerPort: parsed.data.printerPort,
      });

      res.status(200).json({
        success: result.success,
        mode: result.mode,
        printedCount: result.printedCount,
        pdfPath: result.pdfPath ?? null,
        jobId: result.jobId ?? null,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
