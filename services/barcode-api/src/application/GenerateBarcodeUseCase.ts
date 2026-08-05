import type { BarcodeRecord } from "../domain/entities/BarcodeRecord";
import { AppError } from "../domain/errors/AppError";
import type { BarcodeRepository } from "../domain/ports/BarcodeRepository";
import type { SequenceRepository } from "../domain/ports/SequenceRepository";
import { env } from "../config/env";

export interface GenerateBarcodeRequest {
  stockItemName?: string;
  manufacturerBarcode?: string;
  brand?: string;
  category?: string;
  size?: string;
  colour?: string;
  hsn?: string;
  gstRate?: number;
  purchaseRate?: number;
  mrp?: number;
  sellingRate?: number;
  voucherNumber?: string;
  companyName?: string;
  preferManufacturerAsPrimary?: boolean;
  forceNew?: boolean;
}

export interface GenerateBarcodeResponse {
  barcode: string;
  manufacturerBarcode: string | null;
  source: "internal" | "manufacturer" | "existing";
  mrp: number | null;
  sellingRate: number | null;
  stockItemName: string | null;
  record: BarcodeRecord;
}

export class GenerateBarcodeUseCase {
  constructor(
    private readonly barcodes: BarcodeRepository,
    private readonly sequences: SequenceRepository,
  ) {}

  async execute(input: GenerateBarcodeRequest): Promise<GenerateBarcodeResponse> {
    const manufacturerBarcode = normalizeOptional(input.manufacturerBarcode);
    const stockItemName = normalizeOptional(input.stockItemName);

    if (!input.forceNew && stockItemName) {
      const existing = await this.barcodes.findByStockItemName(stockItemName);
      if (existing) {
        return {
          barcode: existing.barcode,
          manufacturerBarcode: existing.manufacturerBarcode,
          source: "existing",
          mrp: existing.mrp,
          sellingRate: existing.sellingRate,
          stockItemName: existing.stockItemName,
          record: existing,
        };
      }
    }

    if (manufacturerBarcode) {
      const existingMfr = await this.barcodes.findByManufacturerBarcode(manufacturerBarcode);
      if (existingMfr) {
        throw new AppError(
          "DUPLICATE_BARCODE",
          `Manufacturer barcode already assigned to ${existingMfr.barcode}`,
          { details: { manufacturerBarcode, existingBarcode: existingMfr.barcode } },
        );
      }
    }

    const created = await this.allocateAndPersist(input, manufacturerBarcode, stockItemName);

    return {
      barcode: created.barcode,
      manufacturerBarcode: created.manufacturerBarcode,
      source: created.source === "manufacturer" ? "manufacturer" : "internal",
      mrp: created.mrp,
      sellingRate: created.sellingRate,
      stockItemName: created.stockItemName,
      record: created,
    };
  }

  private async allocateAndPersist(
    input: GenerateBarcodeRequest,
    manufacturerBarcode: string | null,
    stockItemName: string | null,
  ): Promise<BarcodeRecord> {
    const preferManufacturer =
      Boolean(input.preferManufacturerAsPrimary) && Boolean(manufacturerBarcode);

    let barcode: string;
    let source: "internal" | "manufacturer";

    if (preferManufacturer && manufacturerBarcode) {
      barcode = manufacturerBarcode;
      source = "manufacturer";
      const clash = await this.barcodes.findByBarcode(barcode);
      if (clash) {
        throw new AppError(
          "DUPLICATE_BARCODE",
          `Manufacturer barcode conflicts with existing code ${barcode}`,
        );
      }
    } else {
      const sequence = await this.sequences.allocateNext();
      barcode = formatInternalBarcode(sequence);
      source = "internal";
      const clash = await this.barcodes.findByBarcode(barcode);
      if (clash) {
        throw new AppError("DUPLICATE_BARCODE", `Generated barcode already exists: ${barcode}`, {
          details: { note: "Sequence collision — barcode numbers are never reused" },
        });
      }
    }

    try {
      return await this.barcodes.create({
        barcode,
        stockItemName,
        manufacturerBarcode,
        brand: normalizeOptional(input.brand),
        category: normalizeOptional(input.category),
        size: normalizeOptional(input.size),
        colour: normalizeOptional(input.colour),
        hsn: normalizeOptional(input.hsn),
        gstRate: input.gstRate ?? null,
        purchaseRate: input.purchaseRate ?? null,
        mrp: input.mrp ?? null,
        sellingRate: input.sellingRate ?? null,
        source,
        voucherNumber: normalizeOptional(input.voucherNumber),
        companyName: normalizeOptional(input.companyName),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("ROLLBACK", "Barcode persistence failed; no partial write retained", {
        cause: error,
      });
    }
  }
}

export function formatInternalBarcode(sequence: number): string {
  const padded = String(sequence).padStart(env.BARCODE_PAD_LENGTH, "0");
  return `${env.BARCODE_PREFIX}${padded}`;
}

function normalizeOptional(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
