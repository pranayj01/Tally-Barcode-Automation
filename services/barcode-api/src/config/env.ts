import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3100),
  HOST: z.string().default("127.0.0.1"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  BARCODE_PREFIX: z.string().min(1).max(8).default("JG"),
  BARCODE_PAD_LENGTH: z.coerce.number().int().min(4).max(16).default(8),
  BARCODE_START_SEQUENCE: z.coerce.number().int().min(1).default(1),
  DATABASE_PATH: z.string().default("./data/barcodes.db"),
  OUTPUT_DIR: z.string().default("./output"),
  TEMP_DIR: z.string().default("./temp"),
  DEFAULT_PRINT_MODE: z
    .enum(["pdf", "windows", "zebra", "tsc", "xprinter", "tvs", "auto"])
    .default("pdf"),
  DEFAULT_PRINTER_NAME: z.string().optional().default(""),
  PRINTER_HOST: z.string().optional().default(""),
  PRINTER_PORT: z.coerce.number().int().positive().default(9100),
  LABEL_WIDTH_MM: z.coerce.number().positive().default(50),
  LABEL_HEIGHT_MM: z.coerce.number().positive().default(25),
  LABEL_DPI: z.coerce.number().int().positive().default(203),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  DATABASE_PATH: path.resolve(process.cwd(), raw.DATABASE_PATH),
  OUTPUT_DIR: path.resolve(process.cwd(), raw.OUTPUT_DIR),
  TEMP_DIR: path.resolve(process.cwd(), raw.TEMP_DIR),
};

export type AppEnv = typeof env;
