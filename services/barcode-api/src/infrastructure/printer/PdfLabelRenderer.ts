import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { LabelItem } from "../../domain/entities/LabelItem";
import type { LabelRenderer } from "../../domain/ports/PrinterPort";
import type { Code128Generator } from "../../domain/ports/Code128Generator";
import { env } from "../../config/env";
import { AppError } from "../../domain/errors/AppError";

const MM_TO_PT = 72 / 25.4;

function formatMoney(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncate(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, max - 1)}…`;
}

export class PdfLabelRenderer implements LabelRenderer {
  constructor(private readonly barcodeGenerator: Code128Generator) {}

  async renderPdf(items: LabelItem[], outputPath: string): Promise<string> {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const width = env.LABEL_WIDTH_MM * MM_TO_PT;
    const height = env.LABEL_HEIGHT_MM * MM_TO_PT;

    const expanded: LabelItem[] = [];
    for (const item of items) {
      const copies = Math.max(1, item.copies ?? 1);
      for (let i = 0; i < copies; i += 1) {
        expanded.push(item);
      }
    }

    if (expanded.length === 0) {
      throw new AppError("VALIDATION_ERROR", "No labels to render");
    }

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
        autoFirstPage: false,
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      stream.on("finish", () => resolve());
      stream.on("error", reject);
      doc.on("error", reject);

      void (async () => {
        try {
          for (const item of expanded) {
            doc.addPage({ size: [width, height], margin: 0 });
            await this.drawLabel(doc, item, width, height);
          }
          doc.end();
        } catch (error) {
          reject(error);
        }
      })();
    });

    return outputPath;
  }

  async renderZpl(items: LabelItem[]): Promise<string> {
    const dpi = env.LABEL_DPI;
    const widthDots = Math.round((env.LABEL_WIDTH_MM / 25.4) * dpi);
    const heightDots = Math.round((env.LABEL_HEIGHT_MM / 25.4) * dpi);
    const parts: string[] = [];

    for (const item of items) {
      const copies = Math.max(1, item.copies ?? 1);
      for (let i = 0; i < copies; i += 1) {
        parts.push(
          [
            "^XA",
            `^PW${widthDots}`,
            `^LL${heightDots}`,
            "^LH0,0",
            "^CF0,18",
            `^FO20,8^FD${sanitizeZpl(truncate(item.name, 28))}^FS`,
            `^FO20,28^FD${sanitizeZpl(truncate(item.brand ?? "", 24))}^FS`,
            `^FO20,48^BY2,2,40^BCN,40,Y,N,N^FD${sanitizeZpl(item.barcode)}^FS`,
            `^FO20,100^FDMRP: ${formatMoney(item.mrp)}^FS`,
            `^FO20,118^FDRate: ${formatMoney(item.sellingRate)}^FS`,
            "^XZ",
          ].join("\n"),
        );
      }
    }

    return parts.join("\n");
  }

  async renderTspl(items: LabelItem[]): Promise<string> {
    const parts: string[] = [];

    for (const item of items) {
      const copies = Math.max(1, item.copies ?? 1);
      parts.push(
        [
          `SIZE ${env.LABEL_WIDTH_MM} mm, ${env.LABEL_HEIGHT_MM} mm`,
          "GAP 2 mm, 0 mm",
          "DIRECTION 1",
          "REFERENCE 0,0",
          "CLS",
          `TEXT 16,8,"2",0,1,1,"${sanitizeTspl(truncate(item.name, 26))}"`,
          `TEXT 16,32,"1",0,1,1,"${sanitizeTspl(truncate(item.brand ?? "", 24))}"`,
          `BARCODE 16,52,"128",48,1,0,2,2,"${sanitizeTspl(item.barcode)}"`,
          `TEXT 16,112,"1",0,1,1,"MRP: ${formatMoney(item.mrp)}"`,
          `TEXT 16,132,"1",0,1,1,"Rate: ${formatMoney(item.sellingRate)}"`,
          `PRINT ${copies},1`,
        ].join("\n"),
      );
    }

    return parts.join("\n");
  }

  private async drawLabel(
    doc: PDFKit.PDFDocument,
    item: LabelItem,
    width: number,
    height: number,
  ): Promise<void> {
    const pad = 3;
    doc.rect(0.5, 0.5, width - 1, height - 1).stroke("#222222");

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("#111111")
      .text(truncate(item.name, 32), pad, 3, { width: width - pad * 2, height: 10, lineBreak: false });

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#333333")
      .text(truncate(item.brand ?? "", 28), pad, 12, { width: width - pad * 2, height: 8, lineBreak: false });

    const png = await this.barcodeGenerator.toPngBuffer(item.barcode, {
      width: 180,
      height: 36,
      includetext: false,
    });

    const barcodeWidth = width - pad * 2;
    const barcodeHeight = 22;
    doc.image(png, pad, 20, { width: barcodeWidth, height: barcodeHeight });

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#111111")
      .text(item.barcode, pad, 43, { width: width - pad * 2, align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(6)
      .text(`MRP: ${formatMoney(item.mrp)}`, pad, 52, { width: (width - pad * 2) / 2, lineBreak: false });

    doc
      .font("Helvetica-Bold")
      .fontSize(6)
      .text(`Rate: ${formatMoney(item.sellingRate)}`, pad + (width - pad * 2) / 2, 52, {
        width: (width - pad * 2) / 2,
        align: "right",
        lineBreak: false,
      });

    void height;
  }
}

function sanitizeZpl(value: string): string {
  return value.replace(/[\^~]/g, " ");
}

function sanitizeTspl(value: string): string {
  return value.replace(/"/g, "'");
}
