# Security: Remove .env from history and rotate credentials

Resumo
- Data: 2026-02-16
- Ação tomada: removi todos os arquivos `.env*` do histórico do Git usando `git-filter-repo` num mirror do repositório e force-pushei todas as branches e tags.
- Branches atualizadas (force-push): todas as branches no repositório remoto foram atualizadas com histórico purgado.

Comandos executados (resumo):

```bash
# no host local de trabalho:
git clone --mirror <repo-url> ../tacf-digital-mirror.git
cd ../tacf-digital-mirror.git
# remoção de arquivos .env do histórico
git filter-repo --invert-paths --path-glob '.env' --path-glob '.env.*' --path-glob '**/.env' --path-glob '**/.env*'
# limpeza
git reflog expire --expire=now --all && git gc --prune=now --aggressive
# forçar push das branches/tags atualizadas
git push --force --tags origin 'refs/heads/*'
```

Credenciais potencialmente expostas (ROTACIONAR IMEDIATAMENTE):
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `VITE_GOOG_API_KEY`
- `SEED_ADMIN_PASSWORD`

Checklist de ação (Responsáveis: equipe de infra / devops / dono do projeto)
- [ ] Revogar/gerar novos `SUPABASE` keys (anon + service role)
- [ ] Rever configurações de banco e rotacionar `DATABASE_URL` (regenerar credenciais DB)
- [ ] Revogar/regenerar `VITE_GOOG_API_KEY` e quaisquer chaves de terceiros
- [ ] Atualizar CI/CD e segredos no host (Vercel, GitHub Actions, etc.) com novas credenciais
- [ ] Forçar o re-clone dos desenvolvedores: `git fetch && git reset --hard origin/main` ou re-clonar
- [ ] Comunicar toda a equipe sobre o evento e exigir mudar tokens locais expostos

Comandos para os desenvolvedores (após confirmar rotação):

```bash
# atualizar local para novo histórico reescrito
git fetch origin
git reset --hard origin/main
```

Notas
- A reescrita de histórico reescreve commits anteriores — instruções acima são necessárias para sincronizar locais.
- Remover o arquivo do histórico não invalida chaves: a rotação das credenciais é obrigatória.

Se quiser, eu posso também abrir uma Issue formal neste repositório com estas informações (como issue GitHub).