import { describe, expect, it, vi } from "vitest";
import { generateReceipt } from "../generateReceipt";

// Mock qrcode module to avoid redefining properties across test runs
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,iVBORw0KG"),
  },
}));

// Mock jsPDF so tests don't rely on real implementation
vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        setFontSize: vi.fn(),
        text: vi.fn(),
        addImage: vi.fn(),
        save: vi.fn(),
        output: vi.fn().mockReturnValue(new Blob()),
      };
    }),
  };
});

describe("generateReceipt", () => {
  // jsPDF is mocked above; no prototype spy required for current jspdf version

  it("generates a PDF without throwing", async () => {
    const booking = {
      booking_id: "b1",
      order_number: "2026-1-0001",
      full_name: "Fulano",
      rank: "Sgt",
      date: "2026-02-15",
      period: "Manhã" as const,
    };

    await expect(generateReceipt(booking)).resolves.toBeUndefined();
  });
});
