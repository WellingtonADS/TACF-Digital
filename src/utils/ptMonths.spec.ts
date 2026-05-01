import { describe, expect, it } from "vitest";
import { PT_MONTHS } from "./ptMonths";

describe("PT_MONTHS", () => {
  it("contém 12 meses", () => {
    expect(PT_MONTHS).toHaveLength(12);
  });

  it("começa em Janeiro", () => {
    expect(PT_MONTHS[0]).toBe("Janeiro");
  });

  it("termina em Dezembro", () => {
    expect(PT_MONTHS[11]).toBe("Dezembro");
  });

  it("possui os meses na ordem correta", () => {
    expect(PT_MONTHS).toEqual([
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]);
  });

  it("todos os meses são strings não-vazias", () => {
    for (const m of PT_MONTHS) {
      expect(typeof m).toBe("string");
      expect(m.length).toBeGreaterThan(0);
    }
  });
});
