const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const E2E_SESSION_TITLE = "E2E Admin Smoke";

if (!connectionString) {
  console.error("DATABASE_URL não definido!");
  process.exit(1);
}

function getCurrentSemester(date) {
  return date.getMonth() < 6 ? "1" : "2";
}

async function setupTestData() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✓ Conectado ao banco");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const semester = getCurrentSemester(tomorrow);

    const existingSessionRes = await client.query(
      `
      SELECT id::text AS id
      FROM public.sessions
      WHERE title = $1
        AND date = $2::date
      LIMIT 1
      `,
      [E2E_SESSION_TITLE, tomorrowStr],
    );

    let sessionId = existingSessionRes.rows[0]?.id;

    if (!sessionId) {
      const sessionRes = await client.query(
        `
        INSERT INTO public.sessions (
          title,
          summary,
          date,
          period,
          max_capacity,
          status,
          applicators,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3::date,
          'manha'::session_period,
          21,
          'open'::session_status,
          ARRAY[]::text[],
          jsonb_build_object('source', 'e2e-admin-setup')
        )
        RETURNING id::text AS id
        `,
        [
          E2E_SESSION_TITLE,
          "Sessão criada automaticamente para smoke tests administrativos.",
          tomorrowStr,
        ],
      );

      sessionId = sessionRes.rows[0]?.id;
    }

    if (!sessionId) {
      console.error("Falha ao criar/buscar sessão de teste");
      process.exit(1);
    }

    console.log(`✓ Sessão preparada: ${sessionId} (${tomorrowStr})`);

    const usersRes = await client.query(
      `
      SELECT id::text AS id
      FROM public.profiles
      WHERE role = 'user'
        AND active = true
      ORDER BY created_at NULLS LAST, id
      LIMIT 3
      `,
    );

    if (usersRes.rows.length === 0) {
      console.error("Nenhum profile de usuário ativo encontrado no banco!");
      process.exit(1);
    }

    const userIds = usersRes.rows.map((row) => row.id);
    console.log(`✓ Usuários encontrados: ${userIds.length}`);

    for (const userId of userIds) {
      await client.query(
        `
        INSERT INTO public.bookings (
          session_id,
          user_id,
          status,
          semester,
          attendance_confirmed,
          result_details,
          metadata
        )
        SELECT
          $1::uuid,
          $2::uuid,
          'agendado'::booking_status,
          $3::semester_type,
          false,
          NULL,
          jsonb_build_object('source', 'e2e-admin-setup')
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.bookings
          WHERE session_id = $1::uuid
            AND user_id = $2::uuid
        )
        `,
        [sessionId, userId, semester],
      );
    }

    const validateRes = await client.query(
      `
      SELECT COUNT(*)::int AS total_pending
      FROM public.bookings
      WHERE session_id = $1::uuid
        AND status = 'agendado'::booking_status
        AND result_details IS NULL
      `,
      [sessionId],
    );

    const pendingCount = validateRes.rows[0]?.total_pending || 0;
    console.log(`✓ Total de bookings preparados na sessão: ${pendingCount}`);

    if (pendingCount === 0) {
      console.warn("Aviso: nenhum booking de teste foi criado.");
      process.exit(1);
    }

    console.log("\n✅ Dados de teste criados com sucesso!");
    console.log(`   Sessão: ${sessionId} | Data: ${tomorrowStr}`);
    console.log(
      `   Bookings preparados: ${pendingCount} | Semestre: ${semester}`,
    );
  } catch (error) {
    console.error("Erro ao preparar dados:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupTestData();
