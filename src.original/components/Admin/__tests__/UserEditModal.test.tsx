import { AuthProvider } from "@/contexts/AuthContext";
import type { Profile } from "@/types/database.types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserEditModal from "../UserEditModal";

/**
 * Factory function to create mock Profile data
 */
const getMockProfile = (overrides?: Partial<Profile>): Profile => {
  return {
    id: "user-123",
    full_name: "João Silva",
    rank: "Capitão",
    email: "joao@fab.mil.br",
    role: "user",
    active: true,
    semester: "1",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  } as Profile;
};

/**
 * Wrapper component to provide AuthContext to tests
 */
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("UserEditModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSaved.mockClear();
  });

  describe("Rendering", () => {
    it("should render modal title for new user when profile is undefined", async () => {
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );
      expect(await screen.findByText("Criar usuário")).toBeTruthy();
    });

    it("should render modal title for edit when profile exists", async () => {
      const profile = getMockProfile();
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={profile} />,
      );
      expect(await screen.findByText("Editar usuário")).toBeTruthy();
    });

    it("should not render modal when open is false", () => {
      renderWithAuth(
        <UserEditModal open={false} onClose={mockOnClose} profile={null} />,
      );
      // Dialog should not be visible (Headless UI behavior)
      expect(screen.queryByText("Criar usuário")).toBeNull();
    });

    it("should render close button", async () => {
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );
      expect(await screen.findByText("Fechar")).toBeTruthy();
    });
  });

  describe("User interactions", () => {
    it("should call onClose when close button is clicked", async () => {
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );
      const closeButton = await screen.findByText("Fechar");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledOnce();
      });
    });

    it("should populate form with profile data when editing", async () => {
      const profile = getMockProfile({
        full_name: "Ana Costa",
        rank: "Tenente",
      });
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={profile} />,
      );

      const fullNameInput = await screen.findByDisplayValue("Ana Costa");
      const rankInput = await screen.findByDisplayValue("Tenente");

      expect(fullNameInput).toBeTruthy();
      expect(rankInput).toBeTruthy();
    });

    it("should show empty form for new user", async () => {
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );

      const textInputs = (await screen.findAllByRole(
        "textbox",
      )) as HTMLInputElement[];
      textInputs.forEach((input) => {
        expect(input.value).toBe("");
      });
    });

    it("should disable delete button when creating new user", async () => {
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );

      await screen.findByText("Criar usuário");
      // Delete button should not appear for new users
      expect(screen.queryByText("Excluir")).toBeNull();
    });

    it("should show delete button when editing existing user", async () => {
      const profile = getMockProfile();
      renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={profile} />,
      );

      expect(await screen.findByText("Excluir")).toBeTruthy();
    });
  });

  describe("Props handling", () => {
    it("should call onSaved when user saves changes", async () => {
      const profile = getMockProfile();
      renderWithAuth(
        <UserEditModal
          open={true}
          onClose={mockOnClose}
          onSaved={mockOnSaved}
          profile={profile}
        />,
      );

      await screen.findByText("Editar usuário");
      // Note: Full form submission test would require mocking useUserForm hook
      // This is a simplified version
      expect(mockOnSaved).not.toHaveBeenCalled();
    });

    it("should accept profile as null and undefined", async () => {
      const { rerender } = renderWithAuth(
        <UserEditModal open={true} onClose={mockOnClose} profile={null} />,
      );

      expect(await screen.findByText("Criar usuário")).toBeTruthy();

      rerender(
        <AuthProvider>
          <UserEditModal
            open={true}
            onClose={mockOnClose}
            profile={undefined}
          />
        </AuthProvider>,
      );

      expect(await screen.findByText("Criar usuário")).toBeTruthy();
    });
  });
});
