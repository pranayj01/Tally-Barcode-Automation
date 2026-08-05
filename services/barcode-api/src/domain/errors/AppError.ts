export type ErrorCode =
  | "VALIDATION_ERROR"
  | "DUPLICATE_BARCODE"
  | "BARCODE_NOT_FOUND"
  | "SEQUENCE_ERROR"
  | "PRINTER_OFFLINE"
  | "PRINTER_ERROR"
  | "NETWORK_UNAVAILABLE"
  | "TALLY_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "ROLLBACK";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly retriable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { statusCode?: number; details?: unknown; retriable?: boolean; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? defaultStatus(code);
    this.details = options?.details;
    this.retriable = options?.retriable ?? false;
  }
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "DUPLICATE_BARCODE":
      return 409;
    case "BARCODE_NOT_FOUND":
      return 404;
    case "PRINTER_OFFLINE":
    case "NETWORK_UNAVAILABLE":
    case "TALLY_UNAVAILABLE":
      return 503;
    case "ROLLBACK":
      return 500;
    default:
      return 500;
  }
}
