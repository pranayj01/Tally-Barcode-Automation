declare module "bwip-js" {
  interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    paddingwidth?: number;
    paddingheight?: number;
  }

  function toBuffer(options: BwipOptions): Promise<Buffer>;

  const bwipjs: {
    toBuffer: typeof toBuffer;
  };

  export default bwipjs;
}
