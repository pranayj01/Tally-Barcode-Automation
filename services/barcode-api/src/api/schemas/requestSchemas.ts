import { z } from "zod";

export const generateBarcodeSchema = z.object({
  stockItemName: z.string().trim().min(1).max(255).optional(),
  manufacturerBarcode: z.string().trim().min(1).max(64).optional(),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  size: z.string().trim().max(60).optional(),
  colour: z.string().trim().max(60).optional(),
  hsn: z.string().trim().max(20).optional(),
  gstRate: z.number().min(0).max(100).optional(),
  purchaseRate: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  sellingRate: z.number().min(0).optional(),
  voucherNumber: z.string().trim().max(80).optional(),
  companyName: z.string().trim().max(200).optional(),
  preferManufacturerAsPrimary: z.boolean().optional().default(false),
  forceNew: z.boolean().optional().default(false),
});

export const labelItemSchema = z.object({
  barcode: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(255),
  mrp: z.number().min(0),
  sellingRate: z.number().min(0),
  brand: z.string().trim().max(120).optional(),
  copies: z.number().int().min(1).max(500).optional().default(1),
});

export const printLabelsSchema = z.object({
  items: z.array(labelItemSchema).min(1),
  mode: z.enum(["pdf", "windows", "zebra", "tsc", "xprinter", "tvs", "auto"]).optional(),
  printerName: z.string().trim().max(200).optional(),
  printerHost: z.string().trim().max(200).optional(),
  printerPort: z.number().int().positive().optional(),
  savePdf: z.boolean().optional(),
});

export const reprintSchema = z.object({
  barcodes: z.array(z.string().trim().min(1)).min(1),
  mode: z.enum(["pdf", "windows", "zebra", "tsc", "xprinter", "tvs", "auto"]).optional(),
  printerName: z.string().trim().max(200).optional(),
  printerHost: z.string().trim().max(200).optional(),
  printerPort: z.number().int().positive().optional(),
});

export const registerManufacturerSchema = z.object({
  stockItemName: z.string().trim().min(1).max(255),
  manufacturerBarcode: z.string().trim().min(1).max(64),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  size: z.string().trim().max(60).optional(),
  colour: z.string().trim().max(60).optional(),
  hsn: z.string().trim().max(20).optional(),
  gstRate: z.number().min(0).max(100).optional(),
  purchaseRate: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  sellingRate: z.number().min(0).optional(),
  voucherNumber: z.string().trim().max(80).optional(),
  companyName: z.string().trim().max(200).optional(),
});
