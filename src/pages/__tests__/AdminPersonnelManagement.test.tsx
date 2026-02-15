import * as adminService from "@/services/admin";
import type { Profile } from "@/types/database.types";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPersonnelManagement from "../AdminPersonnelManagement";

vi.mock("@/services/admin", () => ({
  fetchProfiles: vi.fn(),
  updateProfile: vi.fn(),
}));

const fetchProfiles = vi.mocked(adminService.fetchProfiles);

const getMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: "user-1",
  updated_at: "2026-02-15",
  created_at: "2026-02-15",
  full_name: "Ana Costa",
  saram: "123456",
  rank: "Capitao",
  semester: "1",
  phone_number: null,
  email: "ana@fab.mil.br",
  role: "coordinator",
  active: true,
  war_name: null,
  sector: "HAAF",
  ...overrides,
});

describe("AdminPersonnelManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profiles and filters by search", async () => {
    fetchProfiles.mockResolvedValue([
      getMockProfile(),
      getMockProfile({
        id: "user-2",
        full_name: "Bruno Silva",
        saram: "654321",
        role: "user",
        sector: "GAP",
      }),
    ]);

    render(<AdminPersonnelManagement />);

    expect(await screen.findByText("Ana Costa")).toBeTruthy();
    expect(screen.getByText("Bruno Silva")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText(
      "Buscar por nome, SARAM ou posto",
    );
    fireEvent.change(searchInput, { target: { value: "ana" } });

    expect(screen.getByText("Ana Costa")).toBeTruthy();
    expect(screen.queryByText("Bruno Silva")).toBeNull();
  });

  it("filters by role", async () => {
    fetchProfiles.mockResolvedValue([
      getMockProfile({ role: "coordinator" }),
      getMockProfile({
        id: "user-3",
        full_name: "Carlos Lima",
        role: "admin",
      }),
    ]);

    render(<AdminPersonnelManagement />);

    expect(await screen.findByText("Carlos Lima")).toBeTruthy();

    const roleSelect = screen.getByDisplayValue("Todas as Funcoes");
    fireEvent.change(roleSelect, { target: { value: "admin" } });

    expect(screen.getByText("Carlos Lima")).toBeTruthy();
    expect(screen.queryByText("Ana Costa")).toBeNull();
  });
});
