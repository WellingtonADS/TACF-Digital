import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DigitalTicket from "../../../src/pages/DigitalTicket";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ user: { id: "user-1" }, profile: {}, loading: false }),
}));

vi.mock("../../../src/components/PageSkeleton", () => ({
  default: () => <div data-testid="page-skeleton" />,
}));

vi.mock("react-qr-code", () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <div data-testid="qrcode">{value}</div>
  ),
}));

vi.mock("qrcode", () => ({
  __esModule: true,
  toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

const sampleTicket = {
  name: "TEN COSTA",
  saram: "999888",
  location: "CEAR — Pista de Atletismo",
  date: "2026-03-01",
  time: "08:00",
  code: "A87-X29-KB1",
  confirmed: true,
};

function buildFakeQuery(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({
    maybeSingle,
    eq: vi.fn().mockReturnValue({ maybeSingle }),
  });
  return { select: vi.fn().mockReturnValue({ eq }) };
}

describe("DigitalTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue(buildFakeQuery(null));
  });

  it("exibe skeleton quando não há bookingId nem prop ticket", () => {
    render(
      <MemoryRouter initialEntries={["/app/ticket"]}>
        <Routes>
          <Route path="/app/ticket" element={<DigitalTicket />} />
        </Routes>
      </MemoryRouter>,
    );
    // Dados de amostra falsos NÃO devem aparecer
    expect(screen.queryByText("1T SILVA")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("renderiza dados do ticket quando prop ticket é passada", async () => {
    render(
      <MemoryRouter initialEntries={["/app/ticket"]}>
        <Routes>
          <Route
            path="/app/ticket"
            element={<DigitalTicket ticket={sampleTicket} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("TEN COSTA")).toBeInTheDocument();
    });
    expect(screen.getByText("999888")).toBeInTheDocument();
    // código pode aparecer em mais de um lugar (display + QR)
    expect(screen.getAllByText("A87-X29-KB1").length).toBeGreaterThan(0);
  });

  it("carrega dados do banco quando bookingId é passado via state", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "bookings") {
        return buildFakeQuery({
          id: "booking-1",
          user_id: "user-1",
          session_id: "sess-1",
          order_number: "B12-C34",
          status: "confirmed",
        });
      }
      if (table === "sessions") {
        return buildFakeQuery({
          id: "sess-1",
          date: "2026-03-01",
          period: "MANHÃ",
        });
      }
      if (table === "profiles") {
        return buildFakeQuery({
          id: "user-1",
          war_name: "TEN OLIVEIRA",
          saram: "1112223",
        });
      }
      return buildFakeQuery(null);
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/app/ticket",
            state: { bookingId: "booking-1", orderNumber: "B12-C34" },
          },
        ]}
      >
        <Routes>
          <Route path="/app/ticket" element={<DigitalTicket />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("TEN OLIVEIRA")).toBeInTheDocument();
    });
    expect(screen.getByText("1112223")).toBeInTheDocument();
  });
});
