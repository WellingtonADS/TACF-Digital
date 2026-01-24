# Deployment Configuration

## Vercel Deployment

### Environment Variables

Set these in Vercel Project Settings → Environment Variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
  - Find at: https://app.supabase.com → Project Settings → API → Project URL

- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
  - Find at: https://app.supabase.com → Project Settings → API → anon key

### Deployment Steps

1. Connect your repository to Vercel (https://vercel.com/import)
2. Add environment variables in Project Settings
3. Deploy will automatically run:
   - `yarn install`
   - `yarn build` (TypeScript check + Vite build)
   - Deploy to CDN

### Preview & Production

- Preview: Auto-deployed on PR
- Production: Auto-deployed on main branch push

## Local Development

```bash
# Create .env.local from example
cp .env.local.example .env.local

# Edit with your Supabase credentials
nano .env.local

# Install and run
yarn install
yarn dev
```

## Database (Supabase)

- Region: us-east-1 (or your preferred)
- Type: PostgreSQL
- Auth enabled for user management
- RLS enabled for security
- See `docs/PLANEJAMENTO.md` for schema details

---

### Deploying DB migrations to Supabase (no Alembic) ⚙️

We provide a small TypeScript runner that executes SQL files in this repository in a safe, ordered way.

- Use a privileged Postgres connection string (from Supabase project → Database → Connection string) and set it as `DATABASE_URL` in a local `.env` file.
- Run a dry-run first to preview what will execute:

```bash
# dry-run: shows files that would be executed, but does not change the DB
yarn db:apply -- --dry-run
```

- To apply to the database:

```bash
# apply all files: schema.sql, supabase/migrations/*, supabase/rpc/*, supabase/policies/*
# Ensure DATABASE_URL is set in .env or as env var
yarn db:apply
```

- You can apply a single file using `--only=relative/path/to/file.sql`:

```bash
# apply only a single file
yarn db:apply -- --only=supabase/migrations/20260114_add_bookings_semester.sql
```

Security tips:

- Prefer running first against a staging DB or a dedicated migration environment.
- Use an admin/service role DB connection (not the client anon key). Store secrets in CI/CD secure vars when deploying.
- Review `supabase/policies/rls.sql` and `supabase/rpc/*.sql` for SECURITY DEFINER notes that require owner adjustments after deploy.

If you want, I can also add a CI job to run `yarn db:apply` against a staging DB when we push a release. ✅
