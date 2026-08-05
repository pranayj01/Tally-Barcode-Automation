import { Router } from "express";
import type { SequenceRepository } from "../../domain/ports/SequenceRepository";
import { env } from "../../config/env";
import { getDb } from "../../infrastructure/db/sqlite";

export function createHealthRoutes(deps: { sequences: SequenceRepository }): Router {
  const router = Router();

  router.get("/health", async (_req, res) => {
    let nextSequence: number | null = null;
    let dbOk = false;
    try {
      getDb().prepare("SELECT 1").get();
      dbOk = true;
      nextSequence = await deps.sequences.getCurrent();
    } catch {
      dbOk = false;
    }

    res.status(dbOk ? 200 : 503).json({
      success: dbOk,
      service: "jg-barcode-api",
      version: "1.0.0",
      prefix: env.BARCODE_PREFIX,
      nextSequence,
      printMode: env.DEFAULT_PRINT_MODE,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
