import { describe, expect, it } from "vitest";

import {
  getBookingStatusLabel,
  isActiveBookingStatus,
} from "./booking";

describe("booking utils", () => {
  it("treats only agendado as active booking", () => {
    expect(isActiveBookingStatus("agendado")).toBe(true);
    expect(isActiveBookingStatus("remarcado")).toBe(false);
    expect(isActiveBookingStatus("cancelado")).toBe(false);
    expect(isActiveBookingStatus(null)).toBe(false);
  });

  it("returns explicit PT-BR labels for booking status", () => {
    expect(getBookingStatusLabel("agendado")).toBe("Agendado");
    expect(getBookingStatusLabel("remarcado")).toBe("Remarcado");
    expect(getBookingStatusLabel("cancelado")).toBe("Cancelado");
  });
});
