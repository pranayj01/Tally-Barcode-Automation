import type { BarcodeRecord, CreateBarcodeInput } from "../entities/BarcodeRecord";

export interface BarcodeRepository {
  findByBarcode(barcode: string): Promise<BarcodeRecord | null>;
  findByManufacturerBarcode(manufacturerBarcode: string): Promise<BarcodeRecord | null>;
  findByStockItemName(stockItemName: string): Promise<BarcodeRecord | null>;
  search(query: string, limit?: number): Promise<BarcodeRecord[]>;
  create(input: CreateBarcodeInput): Promise<BarcodeRecord>;
  updateStockItemFields(
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
  ): Promise<BarcodeRecord>;
  retire(barcode: string): Promise<BarcodeRecord>;
  listByVoucher(voucherNumber: string): Promise<BarcodeRecord[]>;
}
