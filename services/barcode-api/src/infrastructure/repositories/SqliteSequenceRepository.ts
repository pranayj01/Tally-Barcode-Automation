import type { SequenceRepository } from "../../domain/ports/SequenceRepository";
import { AppError } from "../../domain/errors/AppError";
import { getDb, withTransaction } from "../db/sqlite";
import { env } from "../../config/env";

export class SqliteSequenceRepository implements SequenceRepository {
  async ensureInitialized(startAt: number): Promise<void> {
    const row = getDb().prepare("SELECT next_value FROM barcode_sequence WHERE id = 1").get() as
      | { next_value: number }
      | undefined;

    if (!row) {
      const now = new Date().toISOString();
      getDb()
        .prepare(
          `INSERT INTO barcode_sequence (id, next_value, prefix, pad_length, updated_at)
           VALUES (1, ?, ?, ?, ?)`,
        )
        .run(startAt, env.BARCODE_PREFIX, env.BARCODE_PAD_LENGTH, now);
    }
  }

  async getCurrent(): Promise<number> {
    const row = getDb().prepare("SELECT next_value FROM barcode_sequence WHERE id = 1").get() as
      | { next_value: number }
      | undefined;
    if (!row) {
      throw new AppError("SEQUENCE_ERROR", "Barcode sequence is not initialized");
    }
    return row.next_value;
  }

  async allocateNext(): Promise<number> {
    try {
      return withTransaction(() => {
        const row = getDb()
          .prepare("SELECT next_value FROM barcode_sequence WHERE id = 1")
          .get() as { next_value: number } | undefined;

        if (!row) {
          throw new AppError("SEQUENCE_ERROR", "Barcode sequence is not initialized");
        }

        const allocated = row.next_value;
        const now = new Date().toISOString();
        getDb()
          .prepare("UPDATE barcode_sequence SET next_value = ?, updated_at = ? WHERE id = 1")
          .run(allocated + 1, now);

        return allocated;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("SEQUENCE_ERROR", "Failed to allocate barcode sequence", { cause: error });
    }
  }
}
