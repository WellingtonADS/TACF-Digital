import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { userCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

type PreparedWindow = {
  fakeToday: Date;
  blockedDate: string;
  allowedDate: string;
  sundayDate: string;
  createdSessionIds: string[];
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function loginAsUser(page: Page) {
  const loginPage = new LoginPage(page);
  await page.goto("/login");
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
  await expect(loginPage.emailInput).toBeVisible({ timeout: 60000 });
  await loginPage.login(userCredentials.email, userCredentials.password);
  await expect(page).toHaveURL(/\/app(\/)?$/, { timeout: 60000 });
  await waitForPageReady(page);
}

async function freezeBrowserDate(page: Page, fakeToday: Date) {
  await page.addInitScript(
    ({ isoNow }) => {
      const fixedTime = new Date(isoNow).valueOf();
      const RealDate = Date;

      class MockDate extends RealDate {
        constructor(...args: ConstructorParameters<typeof Date>) {
          if (args.length === 0) {
            super(fixedTime);
            return;
          }
          super(...args);
        }

        static now() {
          return fixedTime;
        }
      }

      MockDate.parse = RealDate.parse;
      MockDate.UTC = RealDate.UTC;
      MockDate.prototype = RealDate.prototype;

      // @ts-expect-error browser Date override for deterministic E2E
      window.Date = MockDate;
    },
    { isoNow: `${toDateKey(fakeToday)}T12:00:00.000Z` },
  );
}

async function prepareSchedulingWindow(): Promise<PreparedWindow> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definido para o teste E2E.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const userRes = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM auth.users
      WHERE email = $1
      LIMIT 1
      `,
      [userCredentials.email],
    );

    const userId = userRes.rows[0]?.id;
    if (!userId) {
      throw new Error("Usuário seed do E2E não encontrado em auth.users.");
    }

    for (let offset = 1; offset <= 90; offset += 1) {
      const candidateMonday = addDays(new Date(), offset);
      if (candidateMonday.getDay() !== 1) continue;

      const blocked = addDays(candidateMonday, 1);
      const allowed = addDays(candidateMonday, 2);
      const sunday = addDays(candidateMonday, 6);

      if (
        blocked.getMonth() !== candidateMonday.getMonth() ||
        allowed.getMonth() !== candidateMonday.getMonth() ||
        sunday.getMonth() !== candidateMonday.getMonth()
      ) {
        continue;
      }

      const blockedKey = toDateKey(blocked);
      const allowedKey = toDateKey(allowed);

      const conflictRes = await client.query<{ total: number }>(
        `
        SELECT count(*)::int AS total
        FROM public.sessions
        WHERE (date = $1::date OR date = $2::date)
          AND period = 'manha'::session_period
        `,
        [blockedKey, allowedKey],
      );

      if ((conflictRes.rows[0]?.total ?? 0) > 0) {
        continue;
      }

      const metadataTag = `e2e-scheduling-rules-${blockedKey}`;
      const insertBlocked = await client.query<{ id: string }>(
        `
        INSERT INTO public.sessions (
          date,
          period,
          max_capacity,
          status,
          applicators,
          metadata
        )
        VALUES (
          $1::date,
          'manha'::session_period,
          21,
          'open'::session_status,
          ARRAY[]::text[],
          jsonb_build_object('source', $2::text)
        )
        RETURNING id::text AS id
        `,
        [blockedKey, metadataTag],
      );

      const insertAllowed = await client.query<{ id: string }>(
        `
        INSERT INTO public.sessions (
          date,
          period,
          max_capacity,
          status,
          applicators,
          metadata
        )
        VALUES (
          $1::date,
          'manha'::session_period,
          21,
          'open'::session_status,
          ARRAY[]::text[],
          jsonb_build_object('source', $2::text)
        )
        RETURNING id::text AS id
        `,
        [allowedKey, metadataTag],
      );

      const createdSessionIds = [
        insertBlocked.rows[0]?.id,
        insertAllowed.rows[0]?.id,
      ].filter(Boolean) as string[];

      if (createdSessionIds.length !== 2) {
        throw new Error("Falha ao criar sessões controladas para o teste.");
      }

      await client.query(
        `
        DELETE FROM public.bookings
        WHERE user_id = $1::uuid
          AND session_id = ANY($2::uuid[])
        `,
        [userId, createdSessionIds],
      );

      return {
        fakeToday: candidateMonday,
        blockedDate: blockedKey,
        allowedDate: allowedKey,
        sundayDate: toDateKey(sunday),
        createdSessionIds,
      };
    }

    throw new Error(
      "Não foi possível encontrar uma janela livre para validar D-1 e D-2.",
    );
  } catch (error) {
    await client.end();
    throw error;
  }
}

async function cleanupSchedulingWindow(createdSessionIds: string[]) {
  if (createdSessionIds.length === 0) return;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(
      `
      DELETE FROM public.bookings
      WHERE session_id = ANY($1::uuid[])
      `,
      [createdSessionIds],
    );
    await client.query(
      `
      DELETE FROM public.sessions
      WHERE id = ANY($1::uuid[])
      `,
      [createdSessionIds],
    );
  } finally {
    await client.end();
  }
}

test.describe("Visual E2E: regras de agendamento do militar", () => {
  test.setTimeout(120000);
  let prepared: PreparedWindow | null = null;

  test.beforeAll(async () => {
    prepared = await prepareSchedulingWindow();
  });

  test.afterAll(async () => {
    await cleanupSchedulingWindow(prepared?.createdSessionIds ?? []);
  });

  test("militar vê D-1 bloqueado, D-2 disponível e domingo indisponível", async ({
    page,
  }) => {
    if (!prepared) {
      throw new Error("Janela de teste não preparada.");
    }

    await loginAsUser(page);

    await freezeBrowserDate(page, prepared.fakeToday);
    await page.goto("/app/agendamentos");
    await waitForPageReady(page);

    await expect(page.getByTestId("scheduling-page")).toBeVisible({
      timeout: 15000,
    });

    const blockedDay = page.getByTestId(`calendar-day-${prepared.blockedDate}`);
    const allowedDay = page.getByTestId(`calendar-day-${prepared.allowedDate}`);
    const sundayDay = page.getByTestId(`calendar-day-${prepared.sundayDate}`);

    await expect(blockedDay).toHaveAttribute("data-state", "blocked");
    await expect(allowedDay).toHaveAttribute("data-state", /available|selected/);
    await expect(sundayDay).toHaveAttribute("data-state", "blocked");

    await page.screenshot({
      path: "test-results/user-scheduling-rules-visual.png",
      fullPage: true,
    });
  });
});
