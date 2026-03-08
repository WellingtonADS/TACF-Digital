import { expect, test, type Page } from "@playwright/test";

type AdminRouteCase = {
  route: string;
  rationale: string;
};

const ADMIN_CONTEXT_ROUTES: AdminRouteCase[] = [
  { route: "/app/admin", rationale: "dashboard administrativo" },
  { route: "/app/turmas", rationale: "gestao de turmas" },
  { route: "/app/turmas/nova", rationale: "criacao de turma" },
  {
    route: "/app/turmas/00000000-0000-0000-0000-000000000001/editar",
    rationale: "edicao de turma por sessionId",
  },
  {
    route: "/app/turmas/00000000-0000-0000-0000-000000000001/agendamentos",
    rationale: "agendamentos da turma por sessionId",
  },
  { route: "/app/lancamento-indices", rationale: "lancamento de resultados" },
  { route: "/app/efetivo", rationale: "consulta de efetivo" },
  {
    route: "/app/efetivo/00000000-0000-0000-0000-000000000002/editar",
    rationale: "edicao de militar por userId",
  },
  { route: "/app/reagendamentos", rationale: "analise de reagendamentos" },
  {
    route: "/app/reagendamentos/notificacao",
    rationale: "notificacao de reagendamentos",
  },
  { route: "/app/analytics", rationale: "indicadores consolidados" },
  { route: "/app/configuracoes", rationale: "parametros globais" },
  {
    route: "/app/configuracoes/perfis",
    rationale: "gestao de perfis e permissoes",
  },
  { route: "/app/auditoria", rationale: "trilha de auditoria" },
  { route: "/app/om-locations", rationale: "gestao de OMs e locais" },
  {
    route: "/app/om/00000000-0000-0000-0000-000000000003",
    rationale: "detalhe da OM por id",
  },
  {
    route: "/app/om/00000000-0000-0000-0000-000000000003/schedules",
    rationale: "horarios por OM",
  },
];

type AdminRouteGroup = {
  name: string;
  routes: AdminRouteCase[];
};

const ADMIN_ROUTE_GROUPS: AdminRouteGroup[] = [
  {
    name: "dashboard",
    routes: [{ route: "/app/admin", rationale: "dashboard administrativo" }],
  },
  {
    name: "turmas",
    routes: [
      { route: "/app/turmas", rationale: "gestao de turmas" },
      { route: "/app/turmas/nova", rationale: "criacao de turma" },
      {
        route: "/app/turmas/00000000-0000-0000-0000-000000000001/editar",
        rationale: "edicao de turma por sessionId",
      },
      {
        route: "/app/turmas/00000000-0000-0000-0000-000000000001/agendamentos",
        rationale: "agendamentos da turma por sessionId",
      },
      {
        route: "/app/lancamento-indices",
        rationale: "lancamento de resultados",
      },
    ],
  },
  {
    name: "efetivo",
    routes: [
      { route: "/app/efetivo", rationale: "consulta de efetivo" },
      {
        route: "/app/efetivo/00000000-0000-0000-0000-000000000002/editar",
        rationale: "edicao de militar por userId",
      },
    ],
  },
  {
    name: "governanca",
    routes: [
      {
        route: "/app/reagendamentos",
        rationale: "analise de reagendamentos",
      },
      {
        route: "/app/reagendamentos/notificacao",
        rationale: "notificacao de reagendamentos",
      },
      { route: "/app/analytics", rationale: "indicadores consolidados" },
      { route: "/app/configuracoes", rationale: "parametros globais" },
      {
        route: "/app/configuracoes/perfis",
        rationale: "gestao de perfis e permissoes",
      },
      { route: "/app/auditoria", rationale: "trilha de auditoria" },
    ],
  },
  {
    name: "infra-om",
    routes: [
      { route: "/app/om-locations", rationale: "gestao de OMs e locais" },
      {
        route: "/app/om/00000000-0000-0000-0000-000000000003",
        rationale: "detalhe da OM por id",
      },
      {
        route: "/app/om/00000000-0000-0000-0000-000000000003/schedules",
        rationale: "horarios por OM",
      },
    ],
  },
];

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

async function loginAsAdmin(page: Page) {
  const email = getRequiredEnv("SEED_ADMIN_EMAIL");
  const password = getRequiredEnv("SEED_ADMIN_PASSWORD");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto("/login");
    await page.getByPlaceholder("Ex.: joao.silva@fab.mil.br").fill(email);
    await page.getByPlaceholder("Digite sua senha").fill(password);
    await page.getByRole("button", { name: "ENTRAR" }).click();

    try {
      await expect(page).toHaveURL(/\/app(\/admin)?$/, { timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        throw lastError;
      }
    }
  }
}

async function assertAdminCanAccessRoute(
  page: Page,
  routeCase: AdminRouteCase,
) {
  await page.goto(routeCase.route);

  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText("Acesso negado")).toHaveCount(0);
  await expect(page.getByText("Area administrativa restrita")).toHaveCount(0);

  test.info().annotations.push({
    type: "contexto-admin-auth",
    description: `${routeCase.route} - ${routeCase.rationale}`,
  });
}

test.describe("Contexto de rotas admin - guardas de acesso", () => {
  test.describe.configure({ mode: "serial" });

  test("/login deve permanecer acessivel para visitante", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();
  });

  for (const routeCase of ADMIN_CONTEXT_ROUTES) {
    test(`${routeCase.route} redireciona para /login sem autenticacao`, async ({
      page,
    }) => {
      await page.goto(routeCase.route);

      // Todas as rotas /app/* exigem autenticacao pelos guards.
      await expect(page).toHaveURL(/\/login$/);
      await expect(
        page.getByPlaceholder("Ex.: joao.silva@fab.mil.br"),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();

      test.info().annotations.push({
        type: "contexto-admin",
        description: routeCase.rationale,
      });
    });
  }
});

test.describe("Contexto de rotas admin - acesso autenticado sem mock", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const group of ADMIN_ROUTE_GROUPS) {
    test(`grupo ${group.name}: admin autenticado acessa rotas sem bloqueio`, async ({
      page,
    }) => {
      for (const routeCase of group.routes) {
        await assertAdminCanAccessRoute(page, routeCase);
      }
    });
  }

  test("smoke autenticado: cobertura completa do contexto admin", async ({
    page,
  }) => {
    for (const routeCase of ADMIN_CONTEXT_ROUTES) {
      await assertAdminCanAccessRoute(page, routeCase);
    }
  });
});
