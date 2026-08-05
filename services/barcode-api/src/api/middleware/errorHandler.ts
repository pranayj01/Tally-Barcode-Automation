import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../domain/errors/AppError";
import { logger } from "../../infrastructure/logging/logger";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, details: err.details, err }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
        retriable: err.retriable,
      },
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      details: null,
      retriable: false,
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: null,
      retriable: false,
    },
  });
}
