import { describe, expect, it } from "vitest";
import { ADMIN_MODULE_PATHS } from "./adminModules";
import {
  canAccessAdminPath,
  getAllowedAdminModulePaths,
  getDefaultHomeByRole,
  isMilitaryProfileComplete,
} from "./routeAccess";

const coordinatorMetadataWithModules = {
  access_modules: ["/app/turmas", "/app/configuracoes/painel"],
};

const coordinatorMetadataWithoutModules = {
  access_modules: [],
};

describe("isMilitaryProfileComplete", () => {
  const completeProfile = {
    full_name: "Joao da Silva",
    email: "joao.silva@fab.mil.br",
    war_name: "Silva",
    saram: "1234567",
    rank: "3S",
    sector: "HACO",
  };

  it("retorna true quando todos os campos militares obrigatórios existem", () => {
    expect(isMilitaryProfileComplete(completeProfile)).toBe(true);
  });

  it("aceita SARAM formatado desde que tenha sete dígitos", () => {
    expect(
      isMilitaryProfileComplete({
        ...completeProfile,
        saram: "123-45-67",
      }),
    ).toBe(true);
  });

  it("retorna false quando SARAM não tem sete dígitos", () => {
    expect(
      isMilitaryProfileComplete({
        ...completeProfile,
        saram: "123456",
      }),
    ).toBe(false);
  });

  it("retorna false quando algum campo obrigatório está vazio", () => {
    expect(
      isMilitaryProfileComplete({
        ...completeProfile,
        sector: " ",
      }),
    ).toBe(false);
  });

  it("retorna false quando o perfil ainda não carregou", () => {
    expect(isMilitaryProfileComplete(null)).toBe(false);
  });
});

describe("getAllowedAdminModulePaths", () => {
  it("retorna todos os módulos para admin", () => {
    expect(getAllowedAdminModulePaths("admin", null)).toEqual(
      ADMIN_MODULE_PATHS,
    );
  });

  it("retorna vazio para usuário não administrativo", () => {
    expect(getAllowedAdminModulePaths("user", null)).toEqual([]);
  });

  it("normaliza módulos válidos para coordinator", () => {
    expect(
      getAllowedAdminModulePaths("coordinator", coordinatorMetadataWithModules),
    ).toEqual(["/app/turmas", "/app/configuracoes"]);
  });

  it("nega por padrão quando coordinator não tem access_modules válidos", () => {
    expect(getAllowedAdminModulePaths("coordinator", null)).toEqual([]);
    expect(
      getAllowedAdminModulePaths(
        "coordinator",
        coordinatorMetadataWithoutModules,
      ),
    ).toEqual([]);
    expect(
      getAllowedAdminModulePaths("coordinator", {
        access_modules: ["/app/invalido"],
      }),
    ).toEqual([]);
  });
});

describe("canAccessAdminPath", () => {
  it("permite qualquer rota admin para admin", () => {
    expect(canAccessAdminPath("admin", null, "/app/admin")).toBe(true);
    expect(
      canAccessAdminPath("admin", null, "/app/configuracoes/usuarios"),
    ).toBe(true);
  });

  it("nega acesso admin para user", () => {
    expect(canAccessAdminPath("user", null, "/app/admin")).toBe(false);
  });

  it("nega coordinator sem módulos permitidos", () => {
    expect(canAccessAdminPath("coordinator", null, "/app/admin")).toBe(false);
    expect(canAccessAdminPath("coordinator", null, "/app/turmas/2026")).toBe(
      false,
    );
  });

  it("permite apenas módulos explicitamente liberados para coordinator", () => {
    expect(
      canAccessAdminPath(
        "coordinator",
        coordinatorMetadataWithModules,
        "/app/configuracoes/tab/profiles",
      ),
    ).toBe(true);
    expect(
      canAccessAdminPath(
        "coordinator",
        coordinatorMetadataWithModules,
        "/app/admin",
      ),
    ).toBe(false);
  });
});

describe("getDefaultHomeByRole", () => {
  it("retorna /app para usuários não administrativos", () => {
    expect(getDefaultHomeByRole("user", null)).toBe("/app");
    expect(getDefaultHomeByRole(null, null)).toBe("/app");
  });

  it("retorna /app/admin para admin", () => {
    expect(getDefaultHomeByRole("admin", null)).toBe("/app/admin");
  });

  it("retorna primeiro módulo permitido para coordinator", () => {
    expect(
      getDefaultHomeByRole("coordinator", coordinatorMetadataWithModules),
    ).toBe("/app/turmas");
  });

  it("retorna /app para coordinator sem módulos válidos", () => {
    expect(getDefaultHomeByRole("coordinator", null)).toBe("/app");
  });
});
