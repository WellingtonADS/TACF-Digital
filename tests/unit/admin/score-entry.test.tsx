import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScoreEntry from "../../../src/pages/ScoreEntry";

const { mockNavigate, fromMock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: { role: "admin" } }),
}));

vi.mock("@/services/supabase", () => {
  fromMock.mockImplementation((table: string) => {
    if (table === "sessions") {
      return {
        select: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: [{ id: "s1", date: "2026-02-25", period: "morning" }],
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "bookings") {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                { id: "b1", session_id: "s1", user_id: "u1", score: null },
              ],
              error: null,
            }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: () =>
          Promise.resolve({
            data: [
              {
                id: "u1",
                full_name: "Test User",
                war_name: null,
                saram: "123",
                rank: null,
              },
            ],
            error: null,
          }),
      };
    }
    return { select: () => Promise.resolve({ data: [], error: null }) };
  });
  return {
    __esModule: true,
    default: { from: fromMock },
  };
});

describe("ScoreEntry page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    fromMock.mockClear();
  });

  it("initializes with session from route state", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/app/lancamento-indices", state: { sessionId: "s1" } },
        ]}
      >
        <Routes>
          <Route path="/app/lancamento-indices" element={<ScoreEntry />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("s1");
    });
  });
});
