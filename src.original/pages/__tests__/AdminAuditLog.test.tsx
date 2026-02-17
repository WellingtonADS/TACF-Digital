import * as adminService from "@/services/admin";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAuditLog from "../AdminAuditLog";

vi.mock("@/services/admin", () => ({
  fetchAuditLogs: vi.fn(),
}));

const fetchAuditLogs = vi.mocked(adminService.fetchAuditLogs);

describe("AdminAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and filters audit logs", async () => {
    fetchAuditLogs.mockResolvedValue({
      data: [
        {
          id: "log-1",
          action: "update",
          entity: "booking",
          user_id: "user-1",
          user_name: "Ana Costa",
          created_at: "2026-02-15T10:00:00Z",
          details: "attendance_confirmed=true",
        },
        {
          id: "log-2",
          action: "create",
          entity: "session",
          user_id: "user-2",
          user_name: "Bruno Silva",
          created_at: "2026-02-14T10:00:00Z",
          details: "session created",
        },
      ],
      error: null,
    });

    render(<AdminAuditLog />);

    expect(await screen.findByText("Ana Costa")).toBeTruthy();
    expect(screen.getByText("Bruno Silva")).toBeTruthy();

    const userInput = screen.getByPlaceholderText("Buscar por usuario");
    fireEvent.change(userInput, { target: { value: "ana" } });

    expect(screen.getByText("Ana Costa")).toBeTruthy();
    expect(screen.queryByText("Bruno Silva")).toBeNull();

    const actionSelect = screen.getByDisplayValue("Todas as acoes");
    fireEvent.change(actionSelect, { target: { value: "update" } });

    expect(screen.getByText("Ana Costa")).toBeTruthy();
    expect(screen.queryByText("Bruno Silva")).toBeNull();
  });
});
