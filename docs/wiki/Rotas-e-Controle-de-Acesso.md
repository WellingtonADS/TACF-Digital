# Rotas e Controle de Acesso

## Estrategia de rotas

O registro de rotas fica em `src/router/routeRegistry.ts` com metadados de:

- `path`
- `access` (`user`, `admin`, `authenticated`)
- exibicao em sidebar
- prioridade e prefetch
- lazy loader da pagina

## Guardas aplicados

- `ProtectedRoute`: exige usuario autenticado.
- `AdminRoute`: exige papel administrativo e validacao de modulo permitido.
- `UserRoute`: bloqueia perfis admin/coordinator e valida completude de perfil militar.

## Regras por papel

- `admin`: acesso administrativo completo.
- `coordinator`: acesso administrativo parcial conforme metadata `access_modules`.
- `user`: acesso a rotas de uso final (agendamento, historico, perfil).

## Completude de perfil

Para usuario comum, o acesso e condicionado a campos obrigatorios (nome, email, nome de guerra, saram, posto, setor). Quando incompleto:

- permite apenas caminhos de regularizacao (`/app/perfil`, `/app/documentos`);
- redireciona demais rotas para `/app/perfil`.

## Fallbacks

- Usuario sem sessao: redirecionamento para `/login`.
- Usuario com papel inadequado: redirecionamento para home apropriada por papel.
- Coordenador sem modulos validos: fallback para `/app`.
