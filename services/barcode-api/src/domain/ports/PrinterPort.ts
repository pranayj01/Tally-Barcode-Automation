import type { LabelItem, PrintMode, PrintRequest, PrintResult } from "../entities/LabelItem";

export interface PrinterPort {
  readonly mode: PrintMode;
  isAvailable(): Promise<boolean>;
  print(request: PrintRequest): Promise<PrintResult>;
}

export interface LabelRenderer {
  renderPdf(items: LabelItem[], outputPath: string): Promise<string>;
  renderZpl(items: LabelItem[]): Promise<string>;
  renderTspl(items: LabelItem[]): Promise<string>;
}
