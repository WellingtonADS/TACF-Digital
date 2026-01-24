import jsPDF from "jspdf";
import * as qr from "qrcode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateReceipt } from "../generateReceipt";

describe("generateReceipt", () => {
  beforeEach(() => {
    vi.spyOn(qr, "toDataURL").mockResolvedValue(
      "data:image/png;base64,iVBORw0KG",
    );
    vi.spyOn(jsPDF.prototype as any, "save").mockImplementation(() => {});
  });

  it("generates a PDF without throwing", async () => {
    const booking = {
      booking_id: "b1",
      saram: "12345",
      full_name: "Fulano",
      rank: "Sgt",
      date: "2026-02-15",
      period: "Manhã" as const,
    };

    await expect(generateReceipt(booking)).resolves.toBeUndefined();
  });
});
