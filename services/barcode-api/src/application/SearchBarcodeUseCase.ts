import type { BarcodeRecord } from "../domain/entities/BarcodeRecord";
import { AppError } from "../domain/errors/AppError";
import type { BarcodeRepository } from "../domain/ports/BarcodeRepository";

export class SearchBarcodeUseCase {
  constructor(private readonly barcodes: BarcodeRepository) {}

  async byCode(barcode: string): Promise<BarcodeRecord> {
    const record = await this.barcodes.findByBarcode(barcode.trim());
    if (!record) {
      const byMfr = await this.barcodes.findByManufacturerBarcode(barcode.trim());
      if (byMfr) {
        return byMfr;
      }
      throw new AppError("BARCODE_NOT_FOUND", `No barcode found for ${barcode}`);
    }
    return record;
  }

  async search(query: string, limit = 50): Promise<BarcodeRecord[]> {
    if (!query.trim()) {
      throw new AppError("VALIDATION_ERROR", "Search query is required");
    }
    return this.barcodes.search(query.trim(), limit);
  }
}

export class RetireBarcodeUseCase {
  constructor(private readonly barcodes: BarcodeRepository) {}

  async execute(barcode: string): Promise<BarcodeRecord> {
    /** Retire keeps the code permanently reserved — never reused. */
    return this.barcodes.retire(barcode.trim());
  }
}
