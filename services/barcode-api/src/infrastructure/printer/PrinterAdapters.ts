import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PrintMode, PrintRequest, PrintResult } from "../../domain/entities/LabelItem";
import type { LabelRenderer, PrinterPort } from "../../domain/ports/PrinterPort";
import { AppError } from "../../domain/errors/AppError";
import { env } from "../../config/env";
import { logger } from "../logging/logger";

const execFileAsync = promisify(execFile);

function makeJobId(): string {
  return `JOB-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function sendRawTcp(host: string, port: number, payload: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write(payload, "utf8", () => {
        socket.end();
      });
    });
    socket.setTimeout(8000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new AppError("PRINTER_OFFLINE", `Printer timeout at ${host}:${port}`, { retriable: true }));
    });
    socket.on("error", (error) => {
      reject(
        new AppError("PRINTER_OFFLINE", `Printer unreachable at ${host}:${port}`, {
          retriable: true,
          cause: error,
        }),
      );
    });
    socket.on("close", () => resolve());
  });
}

export class PdfPrinterAdapter implements PrinterPort {
  readonly mode: PrintMode = "pdf";

  constructor(private readonly renderer: LabelRenderer) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    const jobId = makeJobId();
    const pdfPath = path.join(env.OUTPUT_DIR, `${jobId}.pdf`);
    await this.renderer.renderPdf(request.items, pdfPath);
    const printedCount = request.items.reduce((sum, item) => sum + Math.max(1, item.copies ?? 1), 0);
    return {
      success: true,
      mode: "pdf",
      printedCount,
      pdfPath,
      jobId,
      message: `PDF labels generated at ${pdfPath}`,
    };
  }
}

export class WindowsPrinterAdapter implements PrinterPort {
  readonly mode: PrintMode = "windows";

  constructor(private readonly renderer: LabelRenderer) {}

  async isAvailable(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }
    try {
      await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-Command",
        "Get-Printer | Select-Object -First 1 | Out-Null",
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    if (process.platform !== "win32") {
      throw new AppError("PRINTER_ERROR", "Windows printer adapter requires Windows");
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new AppError("PRINTER_OFFLINE", "Windows print subsystem is unavailable", { retriable: true });
    }

    const jobId = makeJobId();
    const pdfPath = path.join(env.OUTPUT_DIR, `${jobId}.pdf`);
    await this.renderer.renderPdf(request.items, pdfPath);

    const printerName = request.printerName || env.DEFAULT_PRINTER_NAME;
    const script = `
$ErrorActionPreference = 'Stop'
$pdf = '${pdfPath.replace(/'/g, "''")}'
$printer = '${(printerName || "").replace(/'/g, "''")}'
Add-Type -AssemblyName System.Drawing
if ([string]::IsNullOrWhiteSpace($printer)) {
  Start-Process -FilePath $pdf -Verb Print -WindowStyle Hidden -Wait
} else {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $pdf
  $psi.Verb = 'PrintTo'
  $psi.Arguments = '"' + $printer + '"'
  $psi.CreateNoWindow = $true
  $psi.WindowStyle = 'Hidden'
  $p = [System.Diagnostics.Process]::Start($psi)
  if ($null -ne $p) { $p.WaitForExit(30000) | Out-Null }
}
`;

    const scriptPath = path.join(env.TEMP_DIR, `${jobId}.ps1`);
    fs.mkdirSync(env.TEMP_DIR, { recursive: true });
    fs.writeFileSync(scriptPath, script, "utf8");

    try {
      await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
        { timeout: 60000 },
      );
    } catch (error) {
      throw new AppError("PRINTER_ERROR", "Failed to send job to Windows printer", {
        cause: error,
        retriable: true,
      });
    } finally {
      try {
        fs.unlinkSync(scriptPath);
      } catch {
        /* ignore */
      }
    }

    const printedCount = request.items.reduce((sum, item) => sum + Math.max(1, item.copies ?? 1), 0);
    return {
      success: true,
      mode: "windows",
      printedCount,
      pdfPath,
      jobId,
      message: printerName
        ? `Sent ${printedCount} label(s) to Windows printer '${printerName}'`
        : `Sent ${printedCount} label(s) to default Windows printer`,
    };
  }
}

export class ZebraPrinterAdapter implements PrinterPort {
  readonly mode: PrintMode = "zebra";

  constructor(private readonly renderer: LabelRenderer) {}

  async isAvailable(): Promise<boolean> {
    const host = env.PRINTER_HOST;
    if (!host) {
      return false;
    }
    return await canConnect(host, env.PRINTER_PORT);
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    const host = request.printerHost || env.PRINTER_HOST;
    const port = request.printerPort || env.PRINTER_PORT;
    if (!host) {
      throw new AppError("PRINTER_ERROR", "Zebra printer host is not configured");
    }

    const zpl = await this.renderer.renderZpl(request.items);
    await sendRawTcp(host, port, zpl);

    const jobId = makeJobId();
    const printedCount = request.items.reduce((sum, item) => sum + Math.max(1, item.copies ?? 1), 0);
    return {
      success: true,
      mode: "zebra",
      printedCount,
      jobId,
      message: `Sent ZPL for ${printedCount} label(s) to ${host}:${port}`,
    };
  }
}

export class TscPrinterAdapter implements PrinterPort {
  readonly mode: PrintMode = "tsc";

  constructor(private readonly renderer: LabelRenderer) {}

  async isAvailable(): Promise<boolean> {
    const host = env.PRINTER_HOST;
    if (!host) {
      return false;
    }
    return await canConnect(host, env.PRINTER_PORT);
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    const host = request.printerHost || env.PRINTER_HOST;
    const port = request.printerPort || env.PRINTER_PORT;
    if (!host) {
      throw new AppError("PRINTER_ERROR", "TSC printer host is not configured");
    }

    const tspl = await this.renderer.renderTspl(request.items);
    await sendRawTcp(host, port, tspl);

    const jobId = makeJobId();
    const printedCount = request.items.reduce((sum, item) => sum + Math.max(1, item.copies ?? 1), 0);
    return {
      success: true,
      mode: "tsc",
      printedCount,
      jobId,
      message: `Sent TSPL for ${printedCount} label(s) to ${host}:${port}`,
    };
  }
}

/** XPrinter and TVS typically accept TSPL or Windows spooler paths. */
export class XPrinterAdapter extends TscPrinterAdapter {
  override readonly mode: PrintMode = "xprinter";
}

export class TvsPrinterAdapter extends TscPrinterAdapter {
  override readonly mode: PrintMode = "tvs";
}

export class AutoPrinterAdapter implements PrinterPort {
  readonly mode: PrintMode = "auto";

  constructor(private readonly adapters: PrinterPort[]) {}

  async isAvailable(): Promise<boolean> {
    for (const adapter of this.adapters) {
      if (await adapter.isAvailable()) {
        return true;
      }
    }
    return true;
  }

  async print(request: PrintRequest): Promise<PrintResult> {
    const errors: string[] = [];
    for (const adapter of this.adapters) {
      try {
        const available = await adapter.isAvailable();
        if (!available && adapter.mode !== "pdf") {
          errors.push(`${adapter.mode}: unavailable`);
          continue;
        }
        const result = await adapter.print(request);
        logger.info({ mode: adapter.mode, jobId: result.jobId }, "Auto printer selected adapter");
        return { ...result, mode: "auto", message: `${result.message} (auto→${adapter.mode})` };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${adapter.mode}: ${message}`);
      }
    }

    throw new AppError("PRINTER_ERROR", "All printer adapters failed", {
      details: { errors },
      retriable: true,
    });
  }
}

async function canConnect(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(2000);
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}
