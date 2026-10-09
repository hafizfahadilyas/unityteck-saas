# Phase 0 — Requirements Gap Matrix (LOCKED)

**Date:** 2026-09-29  
**Rule:** Inspect only — existing Master / Store / Storefront UI **preserve**. Do not rebuild.  
**Sources:** `docs/00`–`04` · live `src/` · `designs/` · `.cursor/rules/`

---

## 1. Current reality (inspect)

| Layer | Today | Target (locked) |
|-------|--------|-----------------|
| Admin app | Single Vite React 19 SPA (`src/App.tsx` tab state) | Vite SPA → Hostinger static (`docs/02`) |
| Routing | No React Router — `mode` + `masterTab` / `storeTab` | Soft SPA routes later (Phase 2+) — **no UI rewrite now** |
| Data | `TenantContext` + API client (Phase 1 wire); mock fallback | MySQL + Laravel API + `store_id` |
| Schema helper | Migrations + `database/hostinger/*.sql` + updated `hostingerMysql.ts` | **Done (Phase 1)** — live migrate/seed |
| Auth | Phase **2.1–2.7 complete** (login → plans → subscriptions) | Phase 3 commerce wire |

| Storefront | In-app `StoreFrontPreview` | Next.js 15 on Vercel (Phase 4) — single/cart/checkout/thank-you |
| API / Laravel | **Phase 1 scaffolded** (`apps/api`) | Laravel 11 on Hostinger |
| Cache / Query | Cache tags hooks (1.5); SPA still partial Query | TanStack Query tags + ISR revalidate |
| Media | Mock URLs | R2 + CDN versioned paths |
| Holst tokens | Wired for login (2.1); deepen dark/light chrome | All admin surfaces via CSS vars |
| Locale / money | Onboarding fields planned (lang · RTL · currency) | Per-store language · RTL/LTR · multi-currency (2.5 · 3.12 · 4.3b) |
| Brand UI | Unityteck in chrome | Keep; scrub AI Studio README scaffolding later |

**Preserve paths:** `src/components/master/*`, `src/components/store/*`, `src/components/storefront/*`, `src/context/TenantContext.tsx`.

---

## 2. Design packs audit

| Pack | Path | Status |
|------|------|--------|
| Login + Holst | `designs/Login_UIUX/` | **2.1 done** — deepen dark/light on all chrome |
| Master Admin | `designs/Master_Admin_UIUX/` | Pack present; app menus **fatter** than lean locked menu |
| Theme Settings (18) | `designs/Theme_Settings_UIUX/` | Folder stubs `01`–`18`; build only when Phase 5 unlocks |

**Lean Master menu (design-locked until unlock):** Overview · Orders · Stores & plans · Accounts · Settings · Log out.  
**App MasterSidebar today:** many extra items (Marketplace, Knowledge Base, …) — **do not invent more**; Phase 2+ trim/align only when prompt unlocks.

---

## 3. Schema gap (Phase 1 update)

**SoT:** `apps/api/database/migrations/` · `database/hostinger/01_schema.sql` · `src/utils/hostingerMysql.ts`

| Needed (goal / Phase 1+) | Status |
|--------------------------|--------|
| `store_id` on commerce tables | **Done** |
| categories / subcategories | **Done** (`categories` + `parent_id`) |
| product_variations | **Done** |
| plans / subscriptions | **Done** (`free`/`paid`/`pro`/`custom`; feature_flags deeper = Phase 2) |
| media / media_usage | **Done** |
| team / roles / permissions | Partial (`store_users` + user `role`; full matrix = Phase 2) |
| themes / theme_settings | **Done** (`themes_catalog` / `store_themes`; Theme Settings 18 = Phase 5) |
| audit_logs | **Done** |
| backups / hosting_mode | **Done** (ZIP pipeline = Phase 6) |
| inventory_movements | Missing (Phase 3) |
| reviews | Missing (later) |

---

## 4. Feature gap by phase

| Area | UI exists? | Wired to DB/API? | Phase |
|------|------------|------------------|-------|
| Master / Store dashboards | Yes (mock charts) | **In progress** (API wire Phase 1) | 1 wire · 3 real commerce |
| Stores / onboarding UI | Yes | **API in progress** | 1 done wire · 2 onboarding |
| Products / brands / categories / variants | Yes / partial | **3.1–3.3 Done** · brands next | 3.1–3.3b |
| Orders / bulk / customers CRM / profile | Yes | **API in progress** | 3.5 · 3.5b · 3.10 |
| Cart · checkout · thank-you · WhatsApp order | Preview / partial | Stub | 3.6 · 3.6b · 4 |
| Coupons / shipping / payments / COD | Yes | Stub / partial API | 3.7–3.9 |
| Language · RTL · multi-currency · dark/light | Partial fields | Not full | 2.5 · 3.12 · 4.3b · 5.1b |
| SEO admin screens | Yes | Schema + helper; public SSR later | 1 fields **done** · 4 public SSR |
| Analytics / reports / UTM / tracking | Yes (mock) | No | 5.4 |
| GA / GTM / Search Console / indexing | Stub | No | 4.7 |
| Themes / Theme Settings 18 / header-footer | Partial / preview | Tables ready; UI unlock Phase 5 | 5.1 |
| **Visual Theme Builder** (Edit Theme full-screen) | Theme **picker** only (`StoreThemes`) | No canvas/DnD/revisions yet | **5.V** · [`docs/09`](09-visual-theme-builder.md) |
| Dummy themes · App Store / marketplace | UI stub | No | 5.6 |
| Login Holst same-to-same | **Yes (2.1)** | Sanctum login | — |
| Password reset + OTP stubs | **Yes (2.2)** | forgot/reset + auth_otps | Real mailer 6.5 |
| Public SEO (meta/OG/JSON-LD/sitemap) | Preview only | No Next | 4 |
| Custom domain / hosting / backup ZIP / restore / migrate | UI stubs | Schema ready; ZIP later | 6.1–6.3 |
| Security · system settings | Partial | Partial | 6.4 · 6.8 |
| Plan limits server enforce | Plans seeded | Partial | 2 + API |
| Ultra-fast invalidate (no refresh) | Cache tags hooks (1.5) | Query/ISR deepen | 1.5 **done hooks** · 3–4 |

**Full client backlog:** [`docs/08-client-scope-lock.md`](08-client-scope-lock.md)

---

## 5. Golden rules checklist (Phase 0 lock)

| Rule | Cursor rule | Phase 0 |
|------|-------------|---------|
| Lean · Speed · SEO | `lean-speed-seo.mdc` | Locked — apply every later phase |
| Design same-to-same | `design-pixel-golden.mdc` | Locked — packs = SoT |
| Code organize · `store_id` | `code-organize-optimize.mdc` | Locked |
| NO VPS stack | `docs/02` + rules | Locked |
| Multi-store media / backup / plans | `multistore-ops-backup-plans.mdc` + `docs/03` | Locked (implement Phase 5–6) |
| Master goal no-rebuild | `master-project-goal.mdc` + `docs/00` | **Locked** · client prompt §1–15 covered · phase progress in `docs/00` |
| UI/UX audit | `uiux-audit-dashboard.mdc` + `docs/04` | **Locked** · client prompt §1–12 covered · phase map in `docs/04` §13 |

---

## 6. Explicit non-goals for Phase 0 / 1

- No UI rebuild / no menu invent  
- No Next extract yet (Phase 4)  
- No Theme Settings 01–18 build (Phase 5)  
- Phase 1 **did** ship Laravel + schema + Hostinger SQL (see `docs/07`)

---

## 7. Exit → next

Phase 0–1 **complete**. Phase **2 (2.1–2.7)** auth→subscriptions **complete**. Phase **3.1–3.3** products · variations · categories **complete**.

**Next slice:** Phase **3.3b** brands — user unlock.
Client scope locked in [`docs/08-client-scope-lock.md`](08-client-scope-lock.md).
