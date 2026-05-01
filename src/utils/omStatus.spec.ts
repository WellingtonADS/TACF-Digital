import { describe, expect, it } from "vitest";
import { OM_STATUS, STATUS_OPTIONS } from "./omStatus";

describe("omStatus", () => {
  describe("STATUS_OPTIONS", () => {
    it("contém os quatro valores esperados", () => {
      expect(STATUS_OPTIONS).toEqual([
        "all",
        "active",
        "maintenance",
        "inactive",
      ]);
    });
  });

  describe("OM_STATUS", () => {
    it("possui chaves active, maintenance e inactive", () => {
      expect(Object.keys(OM_STATUS)).toEqual(
        expect.arrayContaining(["active", "maintenance", "inactive"]),
      );
    });

    it("cada status possui as propriedades obrigatórias", () => {
      const requiredKeys = [
        "label",
        "labelLong",
        "description",
        "bar",
        "badge",
        "accent",
        "editorAccent",
      ];
      for (const key of ["active", "maintenance", "inactive"] as const) {
        for (const prop of requiredKeys) {
          expect(OM_STATUS[key]).toHaveProperty(prop);
        }
      }
    });

    it("labels não são strings vazias", () => {
      for (const key of ["active", "maintenance", "inactive"] as const) {
        expect(OM_STATUS[key].label.length).toBeGreaterThan(0);
        expect(OM_STATUS[key].labelLong.length).toBeGreaterThan(0);
      }
    });
  });
});
