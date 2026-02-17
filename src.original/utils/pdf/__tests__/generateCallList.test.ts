import { generateCallList } from "@/utils/pdf/generateCallList";
import { describe, expect, test } from "vitest";

describe("generateCallList", () => {
  test("returns blob when download=false", async () => {
    const session = {
      date: new Date().toISOString(),
      period: "Manhã" as const,
      applicators: ["Equipe A"],
    };

    const bookings = [
      { order_number: "001", full_name: "Fulano de Tal", rank: "Sgt" },
      { order_number: "002", full_name: "Beltrano", rank: "Cabo" },
    ];

    const blob = await generateCallList(session, bookings, false);
    // In jsdom environment blob should be provided (or a Uint8Array); assert it's truthy
    expect(blob).toBeTruthy();
  }, 20000);
});
