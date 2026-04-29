# Servicos e Hooks

## Servicos da aplicacao (`src/services`)

Servicos mapeados na branch:

- `bookings.ts`
- `evaluationTables.ts`
- `locations.ts`
- `notifications.ts`
- `personnel.ts`
- `results.ts`
- `sessions.ts`
- `supabase.ts`
- `systemSettings.ts`

Padrao observado:

- encapsulamento de chamadas ao backend por dominio;
- consumo em hooks/paginas para manter separacao entre acesso a dados e interface.

## Hooks principais

### `useAuth`

- bootstrap de sessao com timeout defensivo;
- sincronizacao por `onAuthStateChange`;
- cache de perfil em `sessionStorage`;
- tratamento para refresh token invalido.

### `useSessions`

- leitura de sessoes por intervalo de datas;
- agregacao de bookings para calcular ocupacao;
- mapeamento para estrutura de disponibilidade consumida pela UI.

## Recomendacoes de evolucao

- manter hooks pequenos e orientados a um caso de uso.
- mover regras de negocio criticas para RPC quando houver risco de desvio por cliente.
- centralizar tipagem em `src/types` para reduzir divergencia de contratos.
