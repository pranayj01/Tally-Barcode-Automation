import fs from "node:fs";
import { createApp } from "./app";
import { env } from "./config/env";
import { getDb, closeDb } from "./infrastructure/db/sqlite";
import { logger } from "./infrastructure/logging/logger";
import { SqliteSequenceRepository } from "./infrastructure/repositories/SqliteSequenceRepository";

async function bootstrap(): Promise<void> {
  fs.mkdirSync(env.OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(env.TEMP_DIR, { recursive: true });

  getDb();
  const sequences = new SqliteSequenceRepository();
  await sequences.ensureInitialized(env.BARCODE_START_SEQUENCE);

  const app = createApp();
  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        host: env.HOST,
        port: env.PORT,
        prefix: env.BARCODE_PREFIX,
        printMode: env.DEFAULT_PRINT_MODE,
      },
      "JG Barcode API listening",
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "Failed to start barcode API");
  process.exit(1);
});
