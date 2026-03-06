import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../../../src/layout/Sidebar";

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    profile: { role: "user" },
    loading: false,
    signOut: vi.fn(),
  }),
}));

function renderSidebar(path = "/app") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar — navegação user", () => {
  it("exibe os itens de navegação do usuário, incluindo bilhete digital", () => {
    renderSidebar();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Agendamentos/i)).toBeInTheDocument();
    expect(screen.getByText(/Documentos/i)).toBeInTheDocument();
    expect(screen.getByText("Bilhete Digital")).toBeInTheDocument();
    expect(screen.getByText("Histórico")).toBeInTheDocument();
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
  });

  it("não exibe itens exclusivos de admin para role=user", () => {
    renderSidebar();
    expect(screen.queryByText("Nova Turma")).not.toBeInTheDocument();
    expect(screen.queryByText("Efetivo")).not.toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    expect(screen.queryByText("Logs de Auditoria")).not.toBeInTheDocument();
  });

  it("link Dashboard aponta para /app", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/app");
  });

  it("link Agendamentos aponta para /app/agendamentos", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /agendamento/i });
    expect(link).toHaveAttribute("href", "/app/agendamentos");
  });

  it("link Documentos aponta para /app/documentos", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /documento/i });
    expect(link).toHaveAttribute("href", "/app/documentos");
  });

  it("link Bilhete Digital aponta para /app/ticket", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /bilhete digital/i });
    expect(link).toHaveAttribute("href", "/app/ticket");
  });

  it("link Histórico aponta para /app/resultados", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /histórico/i });
    expect(link).toHaveAttribute("href", "/app/resultados");
  });

  it("link Meu Perfil aponta para /app/perfil", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /meu perfil/i });
    expect(link).toHaveAttribute("href", "/app/perfil");
  });
});
