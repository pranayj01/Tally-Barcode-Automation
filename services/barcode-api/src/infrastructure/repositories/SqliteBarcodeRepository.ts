import type { BarcodeRecord, CreateBarcodeInput } from "../../domain/entities/BarcodeRecord";
import { AppError } from "../../domain/errors/AppError";
import type { BarcodeRepository } from "../../domain/ports/BarcodeRepository";
import { getDb, withTransaction } from "../db/sqlite";

interface BarcodeRow {
  id: number;
  barcode: string;
  stock_item_name: string | null;
  manufacturer_barcode: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  colour: string | null;
  hsn: string | null;
  gst_rate: number | null;
  purchase_rate: number | null;
  mrp: number | null;
  selling_rate: number | null;
  source: "internal" | "manufacturer" | "manual";
  status: "active" | "retired";
  voucher_number: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
  retired_at: string | null;
}

function mapRow(row: BarcodeRow): BarcodeRecord {
  return {
    id: row.id,
    barcode: row.barcode,
    stockItemName: row.stock_item_name,
    manufacturerBarcode: row.manufacturer_barcode,
    brand: row.brand,
    category: row.category,
    size: row.size,
    colour: row.colour,
    hsn: row.hsn,
    gstRate: row.gst_rate,
    purchaseRate: row.purchase_rate,
    mrp: row.mrp,
    sellingRate: row.selling_rate,
    source: row.source,
    status: row.status,
    voucherNumber: row.voucher_number,
    companyName: row.company_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    retiredAt: row.retired_at,
  };
}

export class SqliteBarcodeRepository implements BarcodeRepository {
  async findByBarcode(barcode: string): Promise<BarcodeRecord | null> {
    const row = getDb()
      .prepare("SELECT * FROM barcodes WHERE barcode = ?")
      .get(barcode) as BarcodeRow | undefined;
    return row ? mapRow(row) : null;
  }

  async findByManufacturerBarcode(manufacturerBarcode: string): Promise<BarcodeRecord | null> {
    const row = getDb()
      .prepare(
        `SELECT * FROM barcodes
         WHERE manufacturer_barcode = ? AND status = 'active'
         LIMIT 1`,
      )
      .get(manufacturerBarcode) as BarcodeRow | undefined;
    return row ? mapRow(row) : null;
  }

  async findByStockItemName(stockItemName: string): Promise<BarcodeRecord | null> {
    const row = getDb()
      .prepare(
        `SELECT * FROM barcodes
         WHERE stock_item_name = ? AND status = 'active'
         ORDER BY id DESC
         LIMIT 1`,
      )
      .get(stockItemName) as BarcodeRow | undefined;
    return row ? mapRow(row) : null;
  }

  async search(query: string, limit = 50): Promise<BarcodeRecord[]> {
    const like = `%${query}%`;
    const rows = getDb()
      .prepare(
        `SELECT * FROM barcodes
         WHERE barcode LIKE ?
            OR manufacturer_barcode LIKE ?
            OR IFNULL(stock_item_name, '') LIKE ?
            OR IFNULL(brand, '') LIKE ?
         ORDER BY id DESC
         LIMIT ?`,
      )
      .all(like, like, like, like, limit) as BarcodeRow[];
    return rows.map(mapRow);
  }

  async create(input: CreateBarcodeInput): Promise<BarcodeRecord> {
    const now = new Date().toISOString();
    try {
      return withTransaction(() => {
        const existing = getDb()
          .prepare("SELECT barcode, status FROM barcodes WHERE barcode = ?")
          .get(input.barcode) as { barcode: string; status: string } | undefined;

        if (existing) {
          throw new AppError("DUPLICATE_BARCODE", `Barcode already exists and cannot be reused: ${input.barcode}`, {
            details: { barcode: input.barcode, status: existing.status },
          });
        }

        if (input.manufacturerBarcode) {
          const mfr = getDb()
            .prepare(
              `SELECT barcode FROM barcodes
               WHERE manufacturer_barcode = ? AND status = 'active'`,
            )
            .get(input.manufacturerBarcode) as { barcode: string } | undefined;
          if (mfr) {
            throw new AppError(
              "DUPLICATE_BARCODE",
              `Manufacturer barcode already linked to ${mfr.barcode}`,
              { details: { manufacturerBarcode: input.manufacturerBarcode, existing: mfr.barcode } },
            );
          }
        }

        const result = getDb()
          .prepare(
            `INSERT INTO barcodes (
              barcode, stock_item_name, manufacturer_barcode, brand, category, size, colour, hsn,
              gst_rate, purchase_rate, mrp, selling_rate, source, status, voucher_number, company_name,
              created_at, updated_at, retired_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, NULL)`,
          )
          .run(
            input.barcode,
            input.stockItemName ?? null,
            input.manufacturerBarcode ?? null,
            input.brand ?? null,
            input.category ?? null,
            input.size ?? null,
            input.colour ?? null,
            input.hsn ?? null,
            input.gstRate ?? null,
            input.purchaseRate ?? null,
            input.mrp ?? null,
            input.sellingRate ?? null,
            input.source,
            input.voucherNumber ?? null,
            input.companyName ?? null,
            now,
            now,
          );

        const insertedId = Number(result.lastInsertRowid);
        const row = getDb()
          .prepare("SELECT * FROM barcodes WHERE id = ?")
          .get(insertedId) as BarcodeRow;
        return mapRow(row);
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNIQUE") || message.includes("unique")) {
        throw new AppError("DUPLICATE_BARCODE", `Duplicate barcode rejected: ${input.barcode}`, {
          cause: error,
        });
      }
      throw new AppError("INTERNAL_ERROR", "Failed to persist barcode", { cause: error });
    }
  }

  async updateStockItemFields(
    barcode: string,
    fields: Partial<
      Pick<
        CreateBarcodeInput,
        | "stockItemName"
        | "manufacturerBarcode"
        | "brand"
        | "category"
        | "size"
        | "colour"
        | "hsn"
        | "gstRate"
        | "purchaseRate"
        | "mrp"
        | "sellingRate"
        | "voucherNumber"
        | "companyName"
      >
    >,
  ): Promise<BarcodeRecord> {
    const existing = await this.findByBarcode(barcode);
    if (!existing || existing.status !== "active") {
      throw new AppError("BARCODE_NOT_FOUND", `Active barcode not found: ${barcode}`);
    }

    const now = new Date().toISOString();
    getDb()
      .prepare(
        `UPDATE barcodes SET
          stock_item_name = COALESCE(?, stock_item_name),
          manufacturer_barcode = COALESCE(?, manufacturer_barcode),
          brand = COALESCE(?, brand),
          category = COALESCE(?, category),
          size = COALESCE(?, size),
          colour = COALESCE(?, colour),
          hsn = COALESCE(?, hsn),
          gst_rate = COALESCE(?, gst_rate),
          purchase_rate = COALESCE(?, purchase_rate),
          mrp = COALESCE(?, mrp),
          selling_rate = COALESCE(?, selling_rate),
          voucher_number = COALESCE(?, voucher_number),
          company_name = COALESCE(?, company_name),
          updated_at = ?
         WHERE barcode = ? AND status = 'active'`,
      )
      .run(
        fields.stockItemName ?? null,
        fields.manufacturerBarcode ?? null,
        fields.brand ?? null,
        fields.category ?? null,
        fields.size ?? null,
        fields.colour ?? null,
        fields.hsn ?? null,
        fields.gstRate ?? null,
        fields.purchaseRate ?? null,
        fields.mrp ?? null,
        fields.sellingRate ?? null,
        fields.voucherNumber ?? null,
        fields.companyName ?? null,
        now,
        barcode,
      );

    const updated = await this.findByBarcode(barcode);
    if (!updated) {
      throw new AppError("BARCODE_NOT_FOUND", `Barcode missing after update: ${barcode}`);
    }
    return updated;
  }

  async retire(barcode: string): Promise<BarcodeRecord> {
    const existing = await this.findByBarcode(barcode);
    if (!existing) {
      throw new AppError("BARCODE_NOT_FOUND", `Barcode not found: ${barcode}`);
    }
    if (existing.status === "retired") {
      return existing;
    }

    const now = new Date().toISOString();
    getDb()
      .prepare(
        `UPDATE barcodes
         SET status = 'retired', retired_at = ?, updated_at = ?
         WHERE barcode = ?`,
      )
      .run(now, now, barcode);

    const updated = await this.findByBarcode(barcode);
    if (!updated) {
      throw new AppError("ROLLBACK", `Failed to retire barcode: ${barcode}`);
    }
    return updated;
  }

  async listByVoucher(voucherNumber: string): Promise<BarcodeRecord[]> {
    const rows = getDb()
      .prepare(
        `SELECT * FROM barcodes
         WHERE voucher_number = ?
         ORDER BY id ASC`,
      )
      .all(voucherNumber) as BarcodeRow[];
    return rows.map(mapRow);
  }
}
