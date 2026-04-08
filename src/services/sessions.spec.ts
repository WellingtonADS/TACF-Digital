import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock("./supabase", () => ({
  default: {
    rpc: rpcMock,
  },
}));

import {
  closeSessionWithChecklist,
  fetchSessionClosureChecklist,
} from "./sessions";

describe("sessions service", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("fetchSessionClosureChecklist retorna o checklist da RPC em modo leitura", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: true,
          error: null,
          checklist: {
            bookings_total: 12,
            attendance_treated_count: 12,
            results_pending: 0,
            pending_swap_requests: 0,
            can_close: true,
            already_completed: false,
          },
          session_status: "open",
        },
      ],
      error: null,
    });

    const result = await fetchSessionClosureChecklist("session-1");

    expect(rpcMock).toHaveBeenCalledWith("close_session_with_checklist", {
      p_session_id: "session-1",
      p_apply: false,
    });
    expect(result).toEqual({
      bookings_total: 12,
      attendance_treated_count: 12,
      results_pending: 0,
      pending_swap_requests: 0,
      can_close: true,
      already_completed: false,
    });
  });

  it("closeSessionWithChecklist propaga erro de checklist incompleto", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          success: false,
          error: "checklist incompleto para encerramento",
          checklist: {
            bookings_total: 8,
            attendance_treated_count: 8,
            results_pending: 2,
            pending_swap_requests: 1,
            can_close: false,
            already_completed: false,
          },
          session_status: "open",
        },
      ],
      error: null,
    });

    await expect(closeSessionWithChecklist("session-2")).rejects.toThrow(
      "checklist incompleto para encerramento",
    );

    expect(rpcMock).toHaveBeenCalledWith("close_session_with_checklist", {
      p_session_id: "session-2",
      p_apply: true,
    });
  });

  it("fetchSessionClosureChecklist mapeia PGRST202 para mensagem orientativa", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message:
          "Could not find the function public.close_session_with_checklist(p_apply, p_session_id) in the schema cache",
      },
    });

    await expect(fetchSessionClosureChecklist("session-3")).rejects.toThrow(
      "RPC close_session_with_checklist indisponivel no ambiente atual",
    );
  });
});
