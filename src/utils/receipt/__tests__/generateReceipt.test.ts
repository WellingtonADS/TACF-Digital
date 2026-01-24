import jsPDF from "jspdf";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateReceipt } from "../generateReceipt";

// Mock qrcode module to avoid redefining properties across test runs
vi.mock("qrcode", () => ({
  toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,iVBORw0KG"),
}));

// Mock jsPDF so tests don't rely on real implementation
vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      setFontSize: vi.fn(),
      text: vi.fn(),
      addImage: vi.fn(),
      save: vi.fn(),
      output: vi.fn().mockReturnValue(new Blob()),
    })),
  };
});

describe("generateReceipt", () => {
  beforeEach(() => {
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
