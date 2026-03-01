import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppealRequest from "../../../src/pages/AppealRequest";

const { toastErrorMock, toastInfoMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1" },
    profile: { role: "user" },
    loading: false,
  }),
}));

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/app/recurso${search}`]}>
      <Routes>
        <Route path="/app/recurso" element={<AppealRequest />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppealRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o título Solicitação de Revisão de Resultado", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        name: /solicitação de revisão de resultado/i,
      }),
    ).toBeInTheDocument();
  });

  it("exibe os motivos disponíveis no select", () => {
    renderPage();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // ao menos 5 opções disponíveis (+ 1 opção vazia padrão)
    expect(select.querySelectorAll("option").length).toBeGreaterThanOrEqual(5);
  });

  it("exibe toast.error quando motivo não é selecionado", async () => {
    renderPage();
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(/motivo/i),
      );
    });
  });

  it("exibe toast.error quando justificativa tem menos de 30 caracteres", async () => {
    renderPage();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, {
      target: { value: "Erro no registro do resultado" },
    });
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Texto curto" } });

    const form = document.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringMatching(/30 caracteres/i),
      );
    });
  });

  it("exibe tela de sucesso após submissão válida", async () => {
    renderPage("?result=resultado-1");

    const select = screen.getByRole("combobox");
    fireEvent.change(select, {
      target: { value: "Erro no registro do resultado" },
    });
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: {
        value:
          "Esta justificativa tem mais de trinta caracteres para passar na validação.",
      },
    });

    const form = document.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/solicitação registrada/i)).toBeInTheDocument();
    });
  });

  it("toast.info é chamado na submissão (funcionalidade em desenvolvimento)", async () => {
    renderPage();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, {
      target: { value: "Erro no registro do resultado" },
    });
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: {
        value: "Esta justificativa tem mais de trinta caracteres para passar.",
      },
    });

    const form = document.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalled();
    });
  });
});
