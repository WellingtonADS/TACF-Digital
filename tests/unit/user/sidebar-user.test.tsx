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
  it("exibe os 5 itens de navegação do usuário", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Agendamentos")).toBeInTheDocument();
    expect(screen.getByText("Documentos")).toBeInTheDocument();
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
