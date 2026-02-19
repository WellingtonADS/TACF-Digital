import ProtectedRoute from "@/components/ProtectedRoute";
import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

// Mock supabase module used by ProtectedRoute
const unsubscribeMock = vi.fn();

vi.mock("@/services/supabase", () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: unsubscribeMock } },
        })),
      },
    },
  };
});

describe("ProtectedRoute", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when not authenticated", async () => {
    const { supabase } = await import("@/services/supabase");
    (supabase.auth.getUser as any)?.mockResolvedValueOnce({
      data: { user: null },
    });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/protected"] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/protected",
            element: React.createElement(
              ProtectedRoute,
              null,
              React.createElement("div", null, "PROTECTED"),
            ),
          }),
          React.createElement(Route, {
            path: "/login",
            element: React.createElement("div", null, "LOGIN PAGE"),
          }),
        ),
      ),
    );

    await waitFor(() => expect(screen.getByText(/LOGIN PAGE/i)).toBeDefined());
  });

  it("renders children when authenticated", async () => {
    const { supabase } = await import("@/services/supabase");
    (supabase.auth.getUser as any)?.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
    });

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/protected"] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/protected",
            element: React.createElement(
              ProtectedRoute,
              null,
              React.createElement("div", null, "PROTECTED"),
            ),
          }),
          React.createElement(Route, {
            path: "/login",
            element: React.createElement("div", null, "LOGIN PAGE"),
          }),
        ),
      ),
    );

    await waitFor(() => expect(screen.getByText(/PROTECTED/i)).toBeDefined());
  });
});
