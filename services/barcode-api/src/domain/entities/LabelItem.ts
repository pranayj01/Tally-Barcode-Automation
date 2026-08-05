export interface LabelItem {
  barcode: string;
  name: string;
  mrp: number;
  sellingRate: number;
  brand?: string;
  copies?: number;
}

export type PrintMode = "pdf" | "windows" | "zebra" | "tsc" | "xprinter" | "tvs" | "auto";

export interface PrintRequest {
  items: LabelItem[];
  mode?: PrintMode;
  printerName?: string;
  printerHost?: string;
  printerPort?: number;
  savePdf?: boolean;
}

export interface PrintResult {
  success: boolean;
  mode: PrintMode;
  printedCount: number;
  pdfPath?: string;
  jobId?: string;
  message: string;
}
