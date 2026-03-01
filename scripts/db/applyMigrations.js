#!/usr/bin/env node
/*
  applyMigrations.js
  - aplica os arquivos SQL em `supabase/migrations/` em ordem alfabética
  - aceita opção `--seed` para também aplicar arquivos de seed (contendo "seed" no nome)
  - usa as variáveis de ambiente padrão (DATABASE_URL ou PG*), carregadas via .env
*/

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  // fallback to building from PG_* vars
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

async function runFiles(dir, filterFn) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
  files.sort();
  const selected = filterFn ? files.filter(filterFn) : files;
  for (const file of selected) {
    const filePath = path.join(dir, file);
    console.log(`\n--- Executando: ${file}`);
    const sql = fs.readFileSync(filePath, "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`OK: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`ERRO ao executar ${file}:`, err.message || err);
      throw err;
    }
  }
}

async function main() {
  const conn = getConnectionString();
  if (!conn) {
    console.error(
      "Não encontrou string de conexão. Verifique seu .env (DATABASE_URL ou SUPABASE_DB_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE).",
    );
    process.exit(2);
  }

  global.client = new Client({ connectionString: conn });
  try {
    await client.connect();
  } catch (err) {
    console.error("Falha ao conectar ao banco:", err.message || err);
    process.exit(2);
  }

  const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.error("Diretório de migrations não encontrado:", migrationsDir);
    process.exit(2);
  }

  const args = process.argv.slice(2);
  const doSeed = args.includes("--seed");

  try {
    console.log("Aplicando migrations...");
    await runFiles(
      migrationsDir,
      (name) => !name.toLowerCase().includes("seed"),
    );

    if (doSeed) {
      console.log("\nAplicando seeds...");
      await runFiles(migrationsDir, (name) =>
        name.toLowerCase().includes("seed"),
      );
    }

    console.log(
      "\nTodas as migrations (e seeds se aplicadas) foram executadas com sucesso.",
    );
  } catch (err) {
    console.error("Execução interrompida devido a erro.");
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
