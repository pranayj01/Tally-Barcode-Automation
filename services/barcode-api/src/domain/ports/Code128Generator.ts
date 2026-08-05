export interface Code128Generator {
  toPngBuffer(text: string, options?: { width?: number; height?: number; includetext?: boolean }): Promise<Buffer>;
  toBase64Png(text: string, options?: { width?: number; height?: number; includetext?: boolean }): Promise<string>;
}
