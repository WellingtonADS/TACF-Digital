import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Documents from "../../../src/pages/Documents";

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1" },
    profile: { role: "user" },
    loading: false,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Documents />
    </MemoryRouter>,
  );
}

describe("Documents", () => {
  it("exibe o título Documentos e Normas", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /documentos e normas/i }),
    ).toBeInTheDocument();
  });

  it("lista os 4 manuais e normativos", () => {
    renderPage();
    expect(screen.getByText("ICA 54-2")).toBeInTheDocument();
    expect(screen.getByText("NSCA 54-1")).toBeInTheDocument();
    expect(screen.getByText(/Port\. n\.º 1\.000/i)).toBeInTheDocument();
    expect(screen.getByText("MCA 54-3")).toBeInTheDocument();
  });

  it("ICA 54-2 possui link externo com href da FAB", () => {
    renderPage();
    // Existem 2 links "Acessar" (ICA e NSCA têm href)
    const links = screen.getAllByRole("link", { name: /acessar/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    const fabLink = links.find((l) =>
      l.getAttribute("href")?.includes("fab.mil.br"),
    );
    expect(fabLink).toBeDefined();
    expect(fabLink).toHaveAttribute("target", "_blank");
  });

  it("exibe a seção Meus Certificados", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /meus certificados/i }),
    ).toBeInTheDocument();
  });

  it("cartão de certificados exibe Bilhete Digital e navega para /app/ticket ao clicar", () => {
    renderPage();
    expect(screen.getByText("Bilhete Digital")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Bilhete Digital"));
    expect(mockNavigate).toHaveBeenCalledWith("/app/ticket");
  });
});
