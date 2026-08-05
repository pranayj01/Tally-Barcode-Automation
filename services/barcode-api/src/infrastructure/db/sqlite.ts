import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { env } from "../../config/env";
import { logger } from "../logging/logger";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(env.DATABASE_PATH), { recursive: true });
  db = new DatabaseSync(env.DATABASE_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  migrate(db);
  logger.info({ path: env.DATABASE_PATH }, "SQLite database ready (node:sqlite)");
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS barcode_sequence (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      next_value INTEGER NOT NULL,
      prefix TEXT NOT NULL,
      pad_length INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      stock_item_name TEXT,
      manufacturer_barcode TEXT,
      brand TEXT,
      category TEXT,
      size TEXT,
      colour TEXT,
      hsn TEXT,
      gst_rate REAL,
      purchase_rate REAL,
      mrp REAL,
      selling_rate REAL,
      source TEXT NOT NULL CHECK (source IN ('internal', 'manufacturer', 'manual')),
      status TEXT NOT NULL CHECK (status IN ('active', 'retired')) DEFAULT 'active',
      voucher_number TEXT,
      company_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      retired_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS ux_barcodes_barcode
      ON barcodes (barcode);

    CREATE UNIQUE INDEX IF NOT EXISTS ux_barcodes_manufacturer_active
      ON barcodes (manufacturer_barcode)
      WHERE manufacturer_barcode IS NOT NULL AND status = 'active';

    CREATE INDEX IF NOT EXISTS ix_barcodes_stock_item
      ON barcodes (stock_item_name);

    CREATE INDEX IF NOT EXISTS ix_barcodes_voucher
      ON barcodes (voucher_number);

    CREATE INDEX IF NOT EXISTS ix_barcodes_status
      ON barcodes (status);

    CREATE TABLE IF NOT EXISTS print_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      mode TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      pdf_path TEXT,
      status TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const row = database.prepare("SELECT id FROM barcode_sequence WHERE id = 1").get();
  if (!row) {
    const now = new Date().toISOString();
    database
      .prepare(
        `INSERT INTO barcode_sequence (id, next_value, prefix, pad_length, updated_at)
         VALUES (1, ?, ?, ?, ?)`,
      )
      .run(env.BARCODE_START_SEQUENCE, env.BARCODE_PREFIX, env.BARCODE_PAD_LENGTH, now);
  }
}

export function withTransaction<T>(fn: () => T): T {
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      /* ignore rollback errors */
    }
    throw error;
  }
}
