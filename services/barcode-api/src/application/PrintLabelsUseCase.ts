import type { LabelItem, PrintRequest, PrintResult } from "../domain/entities/LabelItem";
import { AppError } from "../domain/errors/AppError";
import type { BarcodeRepository } from "../domain/ports/BarcodeRepository";
import type { PrinterPort } from "../domain/ports/PrinterPort";
import { getDb } from "../infrastructure/db/sqlite";

export class PrintLabelsUseCase {
  constructor(
    private readonly getPrinter: (mode?: PrintRequest["mode"]) => PrinterPort,
    private readonly barcodes: BarcodeRepository,
  ) {}

  async execute(request: PrintRequest): Promise<PrintResult> {
    if (!request.items.length) {
      throw new AppError("VALIDATION_ERROR", "At least one label item is required");
    }

    for (const item of request.items) {
      assertLabelItem(item);
    }

    const printer = this.getPrinter(request.mode);
    try {
      const available = await printer.isAvailable();
      if (!available && request.mode && request.mode !== "pdf" && request.mode !== "auto") {
        throw new AppError("PRINTER_OFFLINE", `Printer mode '${request.mode}' is offline`, {
          retriable: true,
        });
      }

      const result = await printer.print(request);
      this.persistJob(result);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("PRINTER_ERROR", "Label print failed", { cause: error, retriable: true });
    }
  }

  async reprintByBarcodes(
    barcodes: string[],
    options?: Omit<PrintRequest, "items">,
  ): Promise<PrintResult> {
    const items: LabelItem[] = [];
    for (const code of barcodes) {
      const record = await this.barcodes.findByBarcode(code);
      if (!record || record.status !== "active") {
        throw new AppError("BARCODE_NOT_FOUND", `Cannot reprint missing barcode: ${code}`);
      }
      items.push({
        barcode: record.barcode,
        name: record.stockItemName ?? record.barcode,
        mrp: record.mrp ?? 0,
        sellingRate: record.sellingRate ?? 0,
        brand: record.brand ?? undefined,
        copies: 1,
      });
    }
    return this.execute({ ...options, items });
  }

  private persistJob(result: PrintResult): void {
    getDb()
      .prepare(
        `INSERT INTO print_jobs (job_id, mode, item_count, pdf_path, status, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        result.jobId ?? `JOB-${Date.now()}`,
        result.mode,
        result.printedCount,
        result.pdfPath ?? null,
        result.success ? "success" : "failed",
        result.message,
        new Date().toISOString(),
      );
  }
}

function assertLabelItem(item: LabelItem): void {
  if (!item.barcode?.trim()) {
    throw new AppError("VALIDATION_ERROR", "Label barcode is required");
  }
  if (!item.name?.trim()) {
    throw new AppError("VALIDATION_ERROR", "Label name is required");
  }
  if (typeof item.mrp !== "number" || Number.isNaN(item.mrp) || item.mrp < 0) {
    throw new AppError("VALIDATION_ERROR", `Invalid MRP for ${item.barcode}`);
  }
  if (typeof item.sellingRate !== "number" || Number.isNaN(item.sellingRate) || item.sellingRate < 0) {
    throw new AppError("VALIDATION_ERROR", `Invalid selling rate for ${item.barcode}`);
  }
}
