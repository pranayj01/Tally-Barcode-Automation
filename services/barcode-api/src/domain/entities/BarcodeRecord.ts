export type BarcodeStatus = "active" | "retired";

export interface BarcodeRecord {
  id: number;
  barcode: string;
  stockItemName: string | null;
  manufacturerBarcode: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
  colour: string | null;
  hsn: string | null;
  gstRate: number | null;
  purchaseRate: number | null;
  mrp: number | null;
  sellingRate: number | null;
  source: "internal" | "manufacturer" | "manual";
  status: BarcodeStatus;
  voucherNumber: string | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
  retiredAt: string | null;
}

export interface CreateBarcodeInput {
  barcode: string;
  stockItemName?: string | null;
  manufacturerBarcode?: string | null;
  brand?: string | null;
  category?: string | null;
  size?: string | null;
  colour?: string | null;
  hsn?: string | null;
  gstRate?: number | null;
  purchaseRate?: number | null;
  mrp?: number | null;
  sellingRate?: number | null;
  source: "internal" | "manufacturer" | "manual";
  voucherNumber?: string | null;
  companyName?: string | null;
}
