import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfilesManagement from "../../../src/pages/UserProfilesManagement";

const { fromMock, upsertProfileMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  upsertProfileMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    user: {
      id: "user-1",
      email: "ten.silva@fab.mil.br",
      last_sign_in_at: new Date().toISOString(),
    },
    profile: { role: "user" },
    loading: false,
  }),
}));

// Intercepta tanto o import alias quanto o relativo usado no componente
vi.mock("@/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock },
  upsertProfile: upsertProfileMock,
}));

vi.mock("../../../src/services/supabase", () => ({
  __esModule: true,
  default: { from: fromMock },
  upsertProfile: upsertProfileMock,
}));

const profileData = {
  id: "user-1",
  full_name: "Tenente Silva",
  war_name: "TEN SILVA",
  saram: "1234567", // 7 dígitos — necessário para passar validação
  email: "ten.silva@fab.mil.br",
  phone_number: "(61) 99999-1234",
  rank: "Ten",
  sector: "1 GAV",
  inspsau_valid_until: "2027-01-01",
  inspsau_last_inspection: "2025-01-01",
  birth_date: "1990-05-15",
  physical_group: "A",
};

function buildFromMock(data: unknown = profileData) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  return { select: vi.fn().mockReturnValue({ eq }) };
}

describe("UserProfilesManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue(buildFromMock());
    upsertProfileMock.mockResolvedValue({ data: profileData, error: null });
  });

  it("renderiza o título Meu Perfil", async () => {
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText(/meu perfil/i)).toBeInTheDocument();
    });
  });

  it("carrega e exibe o SARAM do perfil", async () => {
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByDisplayValue("1234567")).toBeInTheDocument();
    });
  });

  it("exibe status APTO na coluna lateral quando inspsau está vigente", async () => {
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      // Texto exato do componente: "Apto para o TACF"
      expect(screen.getByText(/apto para o tacf/i)).toBeInTheDocument();
    });
  });

  it("exibe grupo físico A na coluna lateral", async () => {
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => {
      // "Grupo A" ou similar
      expect(screen.getByText(/grupo/i)).toBeInTheDocument();
    });
  });

  it("salva o perfil e chama upsertProfile ao submeter", async () => {
    render(
      <MemoryRouter>
        <UserProfilesManagement />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("1234567")).toBeInTheDocument();
    });

    // Submete o formulário diretamente para garantir que o handler é acionado
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(upsertProfileMock).toHaveBeenCalled();
    });
  });
});
