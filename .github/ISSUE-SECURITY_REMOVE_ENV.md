# Issue: Security — Remove .env from history and rotate credentials

**Resumo**
- Data: 2026-02-16
- Ação já tomada: arquivos `.env*` foram removidos do histórico do Git usando `git-filter-repo` em um mirror e todas as branches/tags foram force-pushadas para o remoto.

**Credenciais potencialmente expostas (ROTACIONAR IMEDIATAMENTE)**
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- VITE_GOOG_API_KEY
- SEED_ADMIN_PASSWORD

**Comandos executados (resumo)**
```
# local:
git clone --mirror <repo-url> ../tacf-digital-mirror.git
cd ../tacf-digital-mirror.git
# remoção de arquivos .env do histórico
git filter-repo --invert-paths --path-glob '.env' --path-glob '.env.*' --path-glob '**/.env' --path-glob '**/.env*'
# limpeza
git reflog expire --expire=now --all && git gc --prune=now --aggressive
# forçar push das branches/tags atualizadas
git push --force --tags origin 'refs/heads/*'
```

**Checklist de ação**
- [ ] Revogar/gerar novos `SUPABASE` keys (anon + service role)
- [ ] Rotacionar credenciais do banco e atualizar `DATABASE_URL`
- [ ] Revogar/regenerar `VITE_GOOG_API_KEY` e quaisquer chaves de terceiros
- [ ] Atualizar CI/CD e segredos no host (Vercel, GitHub Actions, etc.)
- [ ] Comunicar a equipe e pedir re-clone: `git fetch && git reset --hard origin/main`
- [ ] Registrar quais sistemas foram atualizados e confirmar rollout

**Links**
- Relatório em repo: `/.github/SECURITY_REMOVE_ENV_INCIDENT.md`

Por favor, preencha os responsáveis e confirme quando as chaves estiverem rotacionadas.
