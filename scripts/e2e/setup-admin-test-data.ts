import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL não definido!");
  process.exit(1);
}

async function setupTestData() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("✓ Conectado ao banco");

    // 1. Criar uma sessão para amanhã se não existir
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const sessionRes = await client.query(
      `
      INSERT INTO public.sessions (date, period, max_capacity, status, applicators)
      VALUES ($1::date, 'morning'::session_period, 30, 'open'::session_status, ARRAY[]::text[])
      ON CONFLICT DO UPDATE SET date = EXCLUDED.date
      RETURNING id::text AS id
      `,
      [tomorrowStr],
    );

    const sessionId = sessionRes.rows[0]?.id;
    if (!sessionId) {
      console.error("Falha ao criar/buscar sessão");
      process.exit(1);
    }

    console.log(`✓ Sessão criada/encontrada: ${sessionId} (${tomorrowStr})`);

    // 2. Buscar alguns usuários (profiles) para criar bookings
    const usersRes = await client.query(
      `SELECT id::text FROM public.profiles LIMIT 3`,
    );

    if (usersRes.rows.length === 0) {
      console.error("Nenhum profile encontrado no banco!");
      process.exit(1);
    }

    const userIds = usersRes.rows.map((r) => r.id);
    console.log(`✓ Usuários encontrados: ${userIds.length}`);

    // 3. Criar bookings Pendente (result_details IS NULL) para esses usuários
    for (const userId of userIds) {
      await client.query(
        `
        INSERT INTO public.bookings (session_id, user_id, status, result_details)
        SELECT $1::uuid, $2::uuid, 'confirmed'::booking_status, NULL
        WHERE NOT EXISTS (
          SELECT 1 FROM public.bookings
          WHERE session_id = $1::uuid AND user_id = $2::uuid
        )
        `,
        [sessionId, userId],
      );
    }

    console.log(`✓ Bookings Pendente criados para ${userIds.length} usuários`);

    // 4. Validar dados criados
    const validateRes = await client.query(
      `
      SELECT
        COUNT(*)::int as total_pending
      FROM public.bookings
      WHERE session_id = $1::uuid
        AND result_details IS NULL
      `,
      [sessionId],
    );

    const pendingCount = validateRes.rows[0]?.total_pending || 0;
    console.log(`✓ Total de bookings Pendente na sessão: ${pendingCount}`);

    if (pendingCount === 0) {
      console.warn("Aviso: nenhum booking Pendente agora no banco!");
      process.exit(1);
    }

    console.log("\n✅ Dados de teste criados com sucesso!");
    console.log(`   Sessão: ${sessionId} | Data: ${tomorrowStr}`);
    console.log(`   Bookings Pendente: ${pendingCount}`);
  } catch (error) {
    console.error("Erro ao preparar dados:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupTestData();
