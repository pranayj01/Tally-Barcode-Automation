import assert from "node:assert/strict";
import test from "node:test";
import { formatInternalBarcode } from "./GenerateBarcodeUseCase";

test("formatInternalBarcode pads sequential values", () => {
  assert.equal(formatInternalBarcode(1), "JG00000001");
  assert.equal(formatInternalBarcode(125), "JG00000125");
  assert.equal(formatInternalBarcode(99999999), "JG99999999");
});
