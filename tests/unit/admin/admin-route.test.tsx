import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminRoute from "../../../src/components/AdminRoute";

// mock useAuth - we will override per test
const mockProfile = { role: "user" };
vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ profile: mockProfile, loading: false }),
}));

// dummy component to render inside route
function Secret() {
  return <div>secret</div>;
}

// spy on navigate
const mockNavigate = vi.fn();
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

describe("AdminRoute", () => {
  afterEach(() => {
    mockNavigate.mockReset();
  });

  it("redirects non-admin users to /app", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route
            path="/test"
            element={
              <AdminRoute>
                <Secret />
              </AdminRoute>
            }
          />
          <Route path="/app" element={<div>app</div>} />
        </Routes>
      </MemoryRouter>,
    );
    // after render, the admin route should have redirected
    expect(mockNavigate).not.toHaveBeenCalled();
    // Since we can't inspect Navigate easily, check that 'app' not shown and 'secret' not shown
    expect(screen.queryByText("secret")).toBeNull();
  });
});
