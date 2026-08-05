import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { GenerateBarcodeUseCase } from "./application/GenerateBarcodeUseCase";
import { PrintLabelsUseCase } from "./application/PrintLabelsUseCase";
import { RetireBarcodeUseCase, SearchBarcodeUseCase } from "./application/SearchBarcodeUseCase";
import { BwipCode128Generator } from "./infrastructure/barcode/Code128Generator";
import { logger } from "./infrastructure/logging/logger";
import { createPrinterServices } from "./infrastructure/printer/PrinterFactory";
import { SqliteBarcodeRepository } from "./infrastructure/repositories/SqliteBarcodeRepository";
import { SqliteSequenceRepository } from "./infrastructure/repositories/SqliteSequenceRepository";
import { createBarcodeRoutes } from "./api/routes/barcodeRoutes";
import { createHealthRoutes } from "./api/routes/healthRoutes";
import { createPrintRoutes } from "./api/routes/printRoutes";
import { createPurchaseRoutes } from "./api/routes/purchaseRoutes";
import { errorHandler, notFoundHandler } from "./api/middleware/errorHandler";

export function createApp() {
  const barcodes = new SqliteBarcodeRepository();
  const sequences = new SqliteSequenceRepository();
  const code128 = new BwipCode128Generator();
  const printers = createPrinterServices(code128);

  const generateBarcode = new GenerateBarcodeUseCase(barcodes, sequences);
  const printLabels = new PrintLabelsUseCase(printers.getPrinter, barcodes);
  const searchBarcode = new SearchBarcodeUseCase(barcodes);
  const retireBarcode = new RetireBarcodeUseCase(barcodes);

  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
    }),
  );

  app.use(createHealthRoutes({ sequences }));
  app.use(createBarcodeRoutes({ generateBarcode, searchBarcode, retireBarcode }));
  app.use(createPrintRoutes({ printLabels }));
  app.use(createPurchaseRoutes({ generateBarcode, printLabels }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
