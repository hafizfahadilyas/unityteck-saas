# Phase 1 — Foundation (Schema · API · Wire) — LOCKED

**Date:** 2026-09-29  
**Rule:** No UI rebuild. Inspect → connect MySQL/Laravel → wire SPA.  
**Related:** [`docs/01-phases-and-golden-rules.md`](01-phases-and-golden-rules.md) · [`docs/05-requirements-gap-matrix.md`](05-requirements-gap-matrix.md)

---

## What shipped

| Slice | Status | Artifact |
|-------|--------|----------|
| **1.1** Schema (`store_id`, plans free/paid/pro/custom, categories, variations, media, …) | Done | `apps/api/database/migrations/` · `database/hostinger/01_schema.sql` · `src/utils/hostingerMysql.ts` |
| **1.2** Laravel 11 API scaffold (Sanctum-ready) | Done | `apps/api/` |
| **1.3** Tenant / `store_id` enforcement | Done | API models + middleware / scopes |
| **1.4** Admin SPA API client · `TenantContext` → API | Done | `src/api/*` · Vite proxy → `:8010` |
| **1.5** Cache tags / `updated_at` hooks | Done | `src/api/cacheTags.ts` + API timestamps / invalidation hooks |
| **1.6** phpMyAdmin Hostinger SQL + seed | Done | `database/hostinger/01_schema.sql` · `02_seed.sql` · `README.md` |

**UI:** Master Admin / Store Dashboard / Storefront preview **unchanged** (no rebuild).

---

## How to run local (SQLite OK)

```bash
# API
cd apps/api
cp .env.example .env   # or keep sqlite: DB_CONNECTION=sqlite
php artisan key:generate
php artisan migrate --seed
# serve on 8010 (matches Vite proxy / root .env.example)
php artisan serve --host=127.0.0.1 --port=8010

# Admin SPA (repo root)
npm install
# VITE_USE_API=true · VITE_API_URL=/api  (see root .env.example)
npm run dev
```

Local SQLite is fine for Phase 1 development. Hostinger MySQL is the production target.

Demo seed: `master@unityteck.com` / `password` · store `store-1` · products `prod-1`..`prod-4`.

---

## Point at Hostinger MySQL

1. phpMyAdmin → import **`database/hostinger/01_schema.sql`** then **`02_seed.sql`** (see that folder’s README).
2. Set `apps/api/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=srv1422.hstgr.io
DB_PORT=3306
DB_DATABASE=u948210332_unityteck_shop
DB_USERNAME=u948210332_dbadmin
DB_PASSWORD=your_hostinger_db_password_here
APP_URL=http://127.0.0.1:8010
```

3. Run `php artisan migrate --pretend` (expect nothing pending if SQL imported), **or skip migrate** if schema already applied.

---

## Golden rules (still apply)

- Lean · Speed · SEO · no full refresh / zero stale — `.cursor/rules/lean-speed-seo.mdc`
- Design same-to-same — packs in `designs/`
- `store_id` server-side — frontend hide ≠ security
- **NO VPS** — Hostinger PHP/MySQL + Vite static + Next later (`docs/02`)
- Plans: **free / paid / pro / custom** (not starter/enterprise)

---

## Exit criteria status

| Criterion | Status |
|-----------|--------|
| Refresh ke baad data persist (API + DB) | Met for wired paths (local sqlite or Hostinger MySQL) |
| Ek store ka data dusre store mein na dikhe | Met via `store_id` scopes / tenant middleware |
| Admin UI same (no rebuild) | Met |

---

## Next action

**Phase 2** — Auth · Roles · Onboarding · Plans (login Holst same-to-same, Sanctum sessions, server permissions).
