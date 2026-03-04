import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DigitalTicket from "../../../src/pages/DigitalTicket";

// mock navigate to verify link clicks
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

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

  it("tenta exibir skeleton quando não há bookingId nem prop ticket (ou mostra fallback)", async () => {
    render(
      <MemoryRouter initialEntries={["/app/ticket"]}>
        <Routes>
          <Route path="/app/ticket" element={<DigitalTicket />} />
        </Routes>
      </MemoryRouter>,
    );
    // Dados de amostra falsos NÃO devem aparecer
    expect(screen.queryByText("1T SILVA")).not.toBeInTheDocument();

    // É aceitável que o esqueleto apareça brevemente ou o próprio fallback de
    // "sem agendamento" já esteja presente – o importante é não renderizar
    // informações reais.
    const skeleton = await screen
      .findByTestId("page-skeleton")
      .catch(() => null);
    const fallback = await screen
      .findByText(/Sem agendamento encontrado/i)
      .catch(() => null);
    expect(skeleton || fallback).toBeTruthy();
  });

  it("fallback mostra mensagem sem agendamento com botão voltar e breadcrumbs", async () => {
    render(
      <MemoryRouter initialEntries={["/app/ticket"]}>
        <Routes>
          <Route path="/app/ticket" element={<DigitalTicket />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Sem agendamento encontrado/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Meus Agendamentos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Agendamentos")).toBeInTheDocument();
    // breadcrumb + sidebar both include this label; at least one should exist
    expect(screen.getAllByText("Bilhete Digital").length).toBeGreaterThan(0);
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

    // navigation improvements (breadcrumbs + sidebar)
    expect(screen.getAllByText("Agendamentos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bilhete Digital").length).toBeGreaterThan(0);

    const backButton = screen.getByRole("button", {
      name: /Meus Agendamentos/i,
    });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith("/app/agendamentos");

    // buttons should be hidden in print media
    const printBtn = screen.getByRole("button", { name: /IMPRIMIR/i });
    expect(printBtn).toHaveClass("print:hidden");
    const pdfBtn = screen.getByRole("button", { name: /SALVAR COMO PDF/i });
    expect(pdfBtn).toHaveClass("print:hidden");

    // support text should also not appear in print
    expect(screen.getByText(/Dúvidas ou problemas/i)).toHaveClass(
      "print:hidden",
    );

    const btnContainer = printBtn.parentElement;
    expect(btnContainer).toHaveClass("print:hidden");
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
