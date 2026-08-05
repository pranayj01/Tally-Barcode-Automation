import bwipjs from "bwip-js";
import type { Code128Generator } from "../../domain/ports/Code128Generator";
import { AppError } from "../../domain/errors/AppError";

export class BwipCode128Generator implements Code128Generator {
  async toPngBuffer(
    text: string,
    options?: { width?: number; height?: number; includetext?: boolean },
  ): Promise<Buffer> {
    try {
      return await bwipjs.toBuffer({
        bcid: "code128",
        text,
        scale: options?.width ? Math.max(1, Math.round(options.width / 50)) : 3,
        height: options?.height ? options.height / 3.78 : 12,
        includetext: options?.includetext ?? false,
        textxalign: "center",
        paddingwidth: 2,
        paddingheight: 2,
      });
    } catch (error) {
      throw new AppError("INTERNAL_ERROR", `Failed to render Code128 for ${text}`, { cause: error });
    }
  }

  async toBase64Png(
    text: string,
    options?: { width?: number; height?: number; includetext?: boolean },
  ): Promise<string> {
    const buffer = await this.toPngBuffer(text, options);
    return buffer.toString("base64");
  }
}
