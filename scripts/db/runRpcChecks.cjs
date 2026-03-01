#!/usr/bin/env node
/*
  runRpcChecks.cjs (CommonJS)
  - valida RPCs principais contra o banco usando a conexão do .env
  - executa `get_locations` (leitura) e tenta `create_location` dentro de uma transaction e faz ROLLBACK
*/

const { Client } = require("pg");
require("dotenv").config();

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.env.PGHOST) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || 5432;
    const user = process.env.PGUSER || process.env.USER || "";
    const password = process.env.PGPASSWORD || "";
    const database = process.env.PGDATABASE || "";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  return null;
}

async function main() {
  const conn = getConnectionString();
  if (!conn) {
    console.error(
      "Não encontrou string de conexão. Verifique seu .env (DATABASE_URL ou SUPABASE_DB_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE).",
    );
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log("Conectado ao banco.");

    // Aplicar (ou atualizar) RPCs locais em supabase/rpc/ para garantir que existam
    try {
      const fs = require("fs");
      const path = require("path");
      const rpcDir = path.resolve(__dirname, "../../supabase/rpc");
      if (fs.existsSync(rpcDir)) {
        const files = fs.readdirSync(rpcDir).filter((f) => f.endsWith(".sql"));
        if (files.length) {
          console.log("\nAplicando/atualizando RPCs em supabase/rpc/");
          for (const f of files.sort()) {
            const full = path.join(rpcDir, f);
            const sql = fs.readFileSync(full, "utf8");
            try {
              await client.query(sql);
              console.log(`OK RPC: ${f}`);
            } catch (err) {
              console.error(`ERRO ao aplicar RPC ${f}:`, err.message || err);
            }
          }
        }
      }
    } catch (err) {
      console.warn(
        "Não foi possível aplicar RPCs automaticamente:",
        err.message || err,
      );
    }

    console.log("\n1) Executando get_locations(NULL,NULL,10,0)");
    const res1 = await client.query(
      "SELECT * FROM public.get_locations($1::text,$2::text,$3::int,$4::int)",
      [null, null, 10, 0],
    );
    console.log(`get_locations retornou ${res1.rows.length} linhas.`);

    console.log(
      "\n2) Teste de criação via create_location (executado em transaction + rollback)",
    );
    try {
      await client.query("BEGIN");
      const res2 = await client.query(
        `SELECT * FROM create_location($1,$2,$3,$4,$5)`,
        ["RPC Test Unit", "Endereço de teste", 1, "active", ["Teste"]],
      );
      console.log("create_location retornou:", res2.rows[0]);
      await client.query("ROLLBACK");
      console.log("Rollback executado; criação de teste não foi persistida.");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(
        "Erro ao executar create_location (rollback aplicado):",
        err.message || err,
      );
    }

    console.log("\nValidação de RPCs finalizada.");
  } catch (err) {
    console.error("Erro geral:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
