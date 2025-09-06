# Auth Production Minimal Plan

## 1) Current state (auth-related)
- Supabase client: `src/lib/supabaseClient.ts` (envs `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Auth UI flows: `src/routes/+page.svelte`, `src/routes/signup/+page.svelte`, `src/routes/forgot-password/+page.svelte`, `src/routes/magic-link/+page.svelte`, `src/routes/profile/+page.svelte`, `src/routes/dashboard/+page.svelte`, `src/routes/auth/callback/+page.svelte`
- API endpoints (local DB path): `src/routes/api/auth/{login,logout,register}/+server.ts`
- SQL helpers: `sql-files/supabase_profiles_setup.sql`, `sql-files/fix_profiles_trigger.sql`
- Docker: `Dockerfile.prod`, `docker-compose.prod.yml`, `.env` via `env.template`

Gaps vs production readiness (from task list): rate limiting, CSP/security headers, cookie flags & rotation, CSRF, server-side validation, audit logging, monitoring, CI/CD checks.

## 2) Target final state
- Single source of truth: Supabase for auth in prod. Local API endpoints guarded or disabled in prod to avoid conflicts.
- Strong security defaults: rate limit, secure cookies, CSP, HSTS, Referrer-Policy, X-Content-Type-Options.
- Robust error logging and audit trails for auth events.
- Clear environment separation and secrets management in Docker compose.
- Basic E2E tests for login/logout and OAuth callback.

## 3) Files to change (minimal edits)
- `src/lib/supabaseClient.ts`: enforce env presence; fail fast in prod; no fallbacks.
- `src/routes/api/auth/*/+server.ts`: gate behind `NODE_ENV !== 'production'` or remove from image for prod.
- `src/hooks.server.ts` (new): add security headers (CSP scaffold, HSTS, Referrer-Policy, X-Frame-Options, X-Content-Type-Options) and IP forwarded parsing.
- `src/lib/server/rate-limit.ts` (new): simple in-memory/token-bucket adapter; wire on auth endpoints (dev/test only) and reverse-proxy/edge in prod.
- `docker-compose.prod.yml`: ensure only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` injected; add healthchecks.
- `Dockerfile.prod`: confirm `NODE_ENV=production`; no dev deps; set `PORT`; non-root user.
- `env.template`: document prod vars; remove placeholders that could leak to prod.
- `playwright.config.ts` + `tests/auth/`: keep minimal happy-path e2e for login/logout.

## 4) Checklist
- [ ] Security hardening
  - [ ] Add `src/hooks.server.ts` with security headers (CSP placeholder, HSTS, Referrer-Policy, X-Frame-Options, X-Content-Type-Options)
  - [ ] Set cookie flags (Secure, HttpOnly, SameSite) anywhere cookies are used
  - [ ] Add rate limiting middleware for auth endpoints (dev/testing layer)
  - [ ] Disable local auth API routes in production (prefer Supabase)
- [ ] Validation & CSRF
  - [ ] Add server-side validation where auth endpoints remain (dev/test)
  - [ ] Add CSRF token for any form POSTs hitting local endpoints (dev/test)
- [ ] Logging & audit
  - [ ] Centralized error logging for auth flows
  - [ ] Audit log for login success/failure (to console/file for now)
- [ ] Docker/Env
  - [ ] Ensure `Dockerfile.prod` uses non-root, NODE_ENV=production
  - [ ] Ensure `docker-compose.prod.yml` passes only required env, add healthchecks
  - [ ] Fill `.env` from `env.template` with Supabase vars for prod
- [ ] Tests (minimal)
  - [ ] E2E: login/logout happy path using Supabase
  - [ ] E2E: OAuth callback happy path
- [ ] Docs
  - [ ] Update `README`/`VPS_DEPLOYMENT_GUIDE.md` with auth prod notes

Notes
- Keep changes minimal; defer advanced items (password history, session rotation, breach check) unless required.
