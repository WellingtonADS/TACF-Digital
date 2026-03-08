import { expect, test, type Page } from "@playwright/test";

type UserRouteCase = {
  route: string;
  rationale: string;
};

type UserRouteGroup = {
  name: string;
  routes: UserRouteCase[];
};

const USER_CONTEXT_ROUTES: UserRouteCase[] = [
  { route: "/app", rationale: "dashboard operacional" },
  {
    route: "/app/agendamentos",
    rationale: "selecao de local/data/horario",
  },
  {
    route: "/app/agendamentos/confirmacao",
    rationale: "revisao e confirmacao de agendamento",
  },
  { route: "/app/ticket", rationale: "comprovante digital" },
  { route: "/app/resultados", rationale: "historico de desempenho" },
  {
    route: "/app/documentos",
    rationale: "documentos normativos e apoio",
  },
  { route: "/app/recurso", rationale: "abertura de recurso" },
  { route: "/app/perfil", rationale: "manutencao de cadastro" },
];

const USER_ROUTE_GROUPS: UserRouteGroup[] = [
  {
    name: "dashboard",
    routes: [{ route: "/app", rationale: "dashboard operacional" }],
  },
  {
    name: "agendamentos",
    routes: [
      {
        route: "/app/agendamentos",
        rationale: "selecao de local/data/horario",
      },
      {
        route: "/app/agendamentos/confirmacao",
        rationale: "revisao e confirmacao de agendamento",
      },
      { route: "/app/ticket", rationale: "comprovante digital" },
    ],
  },
  {
    name: "historico-e-evidencias",
    routes: [
      { route: "/app/resultados", rationale: "historico de desempenho" },
      {
        route: "/app/documentos",
        rationale: "documentos normativos e apoio",
      },
      { route: "/app/recurso", rationale: "abertura de recurso" },
    ],
  },
  {
    name: "perfil",
    routes: [{ route: "/app/perfil", rationale: "manutencao de cadastro" }],
  },
];

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loginAsUser(page: Page) {
  const email = getRequiredEnv("SEED_USER_EMAIL");
  const password = getRequiredEnv("SEED_USER_PASSWORD");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto("/login");
    await page.getByPlaceholder("Ex.: joao.silva@fab.mil.br").fill(email);
    await page.getByPlaceholder("Digite sua senha").fill(password);
    await page.getByRole("button", { name: "ENTRAR" }).click();

    try {
      await expect(page).toHaveURL(/\/app$/, { timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        throw lastError;
      }
    }
  }
}

async function assertUserCanAccessRoute(page: Page, routeCase: UserRouteCase) {
  await page.goto(routeCase.route);

  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page).not.toHaveURL(/\/app\/admin$/);

  const routePattern = new RegExp(`${escapeRegex(routeCase.route)}$`);
  await expect(page).toHaveURL(routePattern);

  test.info().annotations.push({
    type: "contexto-user-auth",
    description: `${routeCase.route} - ${routeCase.rationale}`,
  });
}

test.describe("Contexto de rotas user - guardas de acesso", () => {
  test.describe.configure({ mode: "serial" });

  test("/login deve permanecer acessivel para visitante", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();
  });

  for (const routeCase of USER_CONTEXT_ROUTES) {
    test(`${routeCase.route} redireciona para /login sem autenticacao`, async ({
      page,
    }) => {
      await page.goto(routeCase.route);

      await expect(page).toHaveURL(/\/login$/);
      await expect(
        page.getByPlaceholder("Ex.: joao.silva@fab.mil.br"),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();

      test.info().annotations.push({
        type: "contexto-user",
        description: routeCase.rationale,
      });
    });
  }
});

test.describe("Contexto de rotas user - acesso autenticado sem mock", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  for (const group of USER_ROUTE_GROUPS) {
    test(`grupo ${group.name}: usuario autenticado acessa rotas sem bloqueio`, async ({
      page,
    }) => {
      for (const routeCase of group.routes) {
        await assertUserCanAccessRoute(page, routeCase);
      }
    });
  }

  test("usuario nao acessa rota administrativa", async ({ page }) => {
    await page.goto("/app/admin");

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText("Area administrativa restrita")).toBeVisible();
  });

  test("smoke autenticado: cobertura completa do contexto user", async ({
    page,
  }) => {
    for (const routeCase of USER_CONTEXT_ROUTES) {
      await assertUserCanAccessRoute(page, routeCase);
    }
  });
});
