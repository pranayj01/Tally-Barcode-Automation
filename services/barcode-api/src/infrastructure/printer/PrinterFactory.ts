import type { PrintMode } from "../../domain/entities/LabelItem";
import type { LabelRenderer, PrinterPort } from "../../domain/ports/PrinterPort";
import type { Code128Generator } from "../../domain/ports/Code128Generator";
import { PdfLabelRenderer } from "./PdfLabelRenderer";
import {
  AutoPrinterAdapter,
  PdfPrinterAdapter,
  TscPrinterAdapter,
  TvsPrinterAdapter,
  WindowsPrinterAdapter,
  XPrinterAdapter,
  ZebraPrinterAdapter,
} from "./PrinterAdapters";
import { env } from "../../config/env";

export interface PrinterServices {
  renderer: LabelRenderer;
  getPrinter(mode?: PrintMode): PrinterPort;
}

export function createPrinterServices(barcodeGenerator: Code128Generator): PrinterServices {
  const renderer = new PdfLabelRenderer(barcodeGenerator);
  const pdf = new PdfPrinterAdapter(renderer);
  const windows = new WindowsPrinterAdapter(renderer);
  const zebra = new ZebraPrinterAdapter(renderer);
  const tsc = new TscPrinterAdapter(renderer);
  const xprinter = new XPrinterAdapter(renderer);
  const tvs = new TvsPrinterAdapter(renderer);
  const auto = new AutoPrinterAdapter([windows, zebra, tsc, xprinter, tvs, pdf]);

  const map: Record<Exclude<PrintMode, "auto">, PrinterPort> = {
    pdf,
    windows,
    zebra,
    tsc,
    xprinter,
    tvs,
  };

  return {
    renderer,
    getPrinter(mode?: PrintMode): PrinterPort {
      const selected = mode ?? env.DEFAULT_PRINT_MODE;
      if (selected === "auto") {
        return auto;
      }
      return map[selected];
    },
  };
}
