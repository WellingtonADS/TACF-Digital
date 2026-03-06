import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfilesManagement from "../../../src/pages/UserProfilesManagement";

// 1. Mock do Hook centralizado (O segredo do sucesso pós-refatoração)
const usePersonnelMock = vi.fn();
vi.mock("@/hooks/usePersonnel", () => ({
  usePersonnel: () => usePersonnelMock(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "user-1", email: "ten.silva@fab.mil.br" },
    profile: { role: "user" },
    loading: false,
  }),
}));

// Dados padronizados com o novo alias 'Profile'
const mockProfile = {
  id: "user-1",
  full_name: "Tenente Silva",
  war_name: "TEN SILVA",
  saram: "1234567",
  rank: "Ten",
  physical_group: "A",
  inspsau_valid_until: "2027-01-01", // Vigente
};

describe("UserProfilesManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configuramos o retorno do hook para cada teste
    usePersonnelMock.mockReturnValue({
      profile: mockProfile,
      loading: false,
      updateProfile: vi.fn().mockResolvedValue({ error: null }),
      refreshProfile: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );

  it("renderiza o título e os dados do perfil via Hook", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/gerenciamento de perfil/i)).toBeInTheDocument();
      // Verifica se o Input (atômico) renderizou o valor correto
      expect(screen.getByDisplayValue("1234567")).toBeInTheDocument();
    });
  });

  it("exibe status APTO via Badge centralizado", async () => {
    renderComponent();

    await waitFor(() => {
      // O texto agora deve estar dentro do novo componente Badge
      expect(screen.getByText(/apto para o tacf/i)).toBeInTheDocument();
    });
  });

  it("chama updateProfile do hook ao submeter o formulário", async () => {
    const { updateProfile } = usePersonnelMock();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("1234567")).toBeInTheDocument();
    });

    const form = screen.getByRole("form") || document.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled();
    });
  });
});
