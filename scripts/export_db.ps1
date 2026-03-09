# Exporta todas as tabelas para CSV e gera policies/functions em SQL
# Requer: psql (Postgres client) disponível no PATH

function Read-EnvOrPrompt($name, $prompt, $default) {
  $item = Get-Item -Path env:$name -ErrorAction SilentlyContinue
  if ($item) { return $item.Value }
  $val = Read-Host "$prompt ($default)"
  if ([string]::IsNullOrEmpty($val)) { return $default }
  return $val
}

$PGHOST = Read-EnvOrPrompt -name 'PGHOST' -prompt 'Host do Postgres' -default 'localhost'
$PGPORT = Read-EnvOrPrompt -name 'PGPORT' -prompt 'Porta' -default '5432'
$PGUSER = Read-EnvOrPrompt -name 'PGUSER' -prompt 'Usuário' -default 'postgres'
$PGPASSWORD = Read-EnvOrPrompt -name 'PGPASSWORD' -prompt 'Senha (vazia para usar .pgpass)' -default ''
$PGDATABASE = Read-EnvOrPrompt -name 'PGDATABASE' -prompt 'Database' -default 'postgres'

if ($PGPASSWORD -ne '') { $env:PGPASSWORD = $PGPASSWORD }

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$exportDir = Join-Path $scriptRoot '..\exports'
New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
$exportDir = (Resolve-Path $exportDir).Path
$tablesDir = Join-Path $exportDir 'tables'
New-Item -ItemType Directory -Path $tablesDir -Force | Out-Null

Write-Host "Exportando tabelas para: $tablesDir"

# Lista tabelas
$tablesRaw = & psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -At -c "SELECT table_schema || '.' || table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name;" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "Erro ao listar tabelas: $tablesRaw"; exit 1 }

$lines = $tablesRaw -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
foreach ($line in $lines) {
  $dot = $line.IndexOf('.')
  if ($dot -lt 0) { continue }
  $schema = $line.Substring(0,$dot)
  $table = $line.Substring($dot + 1)
  $schemaDir = Join-Path $tablesDir $schema
  New-Item -ItemType Directory -Path $schemaDir -Force | Out-Null
  $outFile = Join-Path $schemaDir "$schema.$table.csv"
  Write-Host ("Exportando {0}.{1} -> {2}" -f $schema, $table, $outFile)
  $copyCmd = '\copy "' + $schema + '"."' + $table + '" TO ''' + $outFile + ''' CSV HEADER'
  $result = & psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c $copyCmd 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning (("Falha exportando {0}.{1}: {2}") -f $schema, $table, ($result -join " `n "))
  }
}

# Exporta policies
$policiesFile = Join-Path $exportDir 'policies.sql'
Write-Host "Exportando policies para: $policiesFile"
$polQuery = "SELECT
  'CREATE POLICY ' || quote_ident(pol.polname) || ' ON ' || quote_ident(ns.nspname) || '.' || quote_ident(c.relname) ||
  ' FOR ' || (CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'u' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN 't' THEN 'TRUNCATE' END) ||
  ' TO ' || COALESCE(array_to_string(ARRAY(SELECT quote_ident(r::text) FROM unnest(pol.polroles) as r), ', '), 'PUBLIC') ||
  (CASE WHEN pg_get_expr(pol.polqual, pol.polrelid) IS NOT NULL THEN ' USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')' ELSE '' END) ||
  (CASE WHEN pg_get_expr(pol.polwithcheck, pol.polrelid) IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')' ELSE '' END) || ';'
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace ns ON ns.oid = c.relnamespace
ORDER BY ns.nspname, c.relname, pol.polname;"
& psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -At -c $polQuery > $policiesFile
if ($LASTEXITCODE -ne 0) { Write-Warning "Erro ao exportar policies" }

# Exporta funções/RPCs
$rpcFile = Join-Path $exportDir 'rpc_functions.sql'
Write-Host "Exportando funções/RPCs para: $rpcFile"
$rpcQuery = "SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY n.nspname,p.proname;"
& psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -At -c $rpcQuery > $rpcFile
if ($LASTEXITCODE -ne 0) { Write-Warning "Erro ao exportar funções/RPCs" }

Write-Host "Exportação concluída. Arquivos em: $exportDir"
