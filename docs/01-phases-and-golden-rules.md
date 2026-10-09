# Unityteck Multi-Store SaaS — Phases + Golden Rules

**Canonical goal:** [`docs/00-master-project-goal.md`](00-master-project-goal.md) · UI/audit: [`docs/04-uiux-audit-dashboard-rules.md`](04-uiux-audit-dashboard-rules.md)  
**Project:** Multi-Tenant E-Commerce SaaS  
**Rule:** DO NOT REBUILD — Inspect → Understand → Reuse → Extend → Optimize → Test  
**Design packs:** `designs/Login_UIUX/` · `designs/Master_Admin_UIUX/` · `designs/Theme_Settings_UIUX/`  
**Cursor rules (always on):** `.cursor/rules/lean-speed-seo.mdc` · `design-pixel-golden.mdc` · `code-organize-optimize.mdc` · `multistore-ops-backup-plans.mdc` · `master-project-goal.mdc` · `uiux-audit-dashboard.mdc`

---

## 0. GOLDEN RULES (har phase mein apply)

### 0.1 Lean · Speed · Ultra-fast (no refresh)
- Product / price / stock / image / category / theme / order change → related UI **bina full page refresh** update.
- Optimistic UI + query invalidation / cache bust (`updated_at`, image version, cache tags).
- Realtime sirf jahan zaroori (orders, stock, theme publish) — har page pe listener nahi.
- Soft SPA nav · toast feedback (~3–4s) · button `aria-busy` · no `alert()` / no full-page freeze.

### 0.2 Public web SEO (full, per-store)
- Har store ka SEO alag: meta title/description, slug, canonical, OG, Twitter, JSON-LD, sitemap, robots, hreflang, alt text.
- Public storefront production pe SSR/prerender (Next.js) — client-only meta enough nahi.
- Keyword stuffing / fake backlinks / ranking guarantee = **mana**.
- Unknown traffic source ko galat attribute mat karo.

### 0.3 Design same-to-same
- UI invent **mat** karo. Screenshots / packs follow karo.
- Jo existing UI pehle se sahi hai → **change mat** karo.
- Holst tokens dono portals pe same (`designs/Login_UIUX/00_palettes/portal-tokens.css`).
- Brand = **Unityteck** only (ConfoStudy / AI Studio watermark UI se hatao).

### 0.4 Code organize · optimize
- Short · modular · reusable · maintainable.
- Duplicate components/functions/APIs/queries/listeners/dead code = **nahi**.
- Existing working feature preserve; extend karo, rewrite mat.
- `store_id` isolation **server + client** — frontend hide ≠ security.
- Plan/feature limits backend pe enforce.

### 0.5 Architecture (locked — **NO VPS**)
Full tech + zero-stale cache rules: **`docs/02-tech-stack-no-vps.md`**

```
Admin Vite SPA     → Hostinger Static
Next.js Storefront → Vercel (SSR/ISR SEO)
Laravel 11 API     → Hostinger PHP + MySQL store_id
Media              → Cloudflare R2 + CDN (versioned URLs)
```
- **VPS nahi** — shared/managed only.
- Ultra-fast: TanStack Query + ISR `revalidateTag` — **bina full refresh**, **purana cache data kahin nahi**.
- Future-ready: dedicated DB / client hosting later.

### 0.6 Multi-store ops (LOCKED — see `docs/03-multistore-media-backup-plans.md`)
- Har store **600+ images** manage (CDN path per `store_id`, quotas by plan).
- Master Dashboard = single control plane (stores, plans, features, hosting, backup, migrate, restore).
- Per-store **all-in-one ZIP**: database rows + all files/media + config → backup / restore / migration.
- Future: har store alag hosting/DB pe ja sakta hai — export/import Master se; abhi shared.
- Free / Paid / Pro / Custom: features + updates + limits **apne plan ke hisaab se**; API enforce + Master grants.

---

### Phase 0 — Inspect & Lock (LOCKED · 2026-09-29)
| Item | Status | Artifact |
|------|--------|----------|
| Existing AI Studio app inspect (Master / Store / Storefront preview) | Done | [`docs/06-phase0-inspect-lock.md`](06-phase0-inspect-lock.md) |
| Requirements gap matrix | Done | [`docs/05-requirements-gap-matrix.md`](05-requirements-gap-matrix.md) |
| Local `designs/` audit | Done | Login · Master · Theme packs present; Holst wired for login (2.1); deepen chrome later |
| Golden rules → `.cursor/rules/` | Done | 6 always-on `.mdc` rules |
| This phases doc | Done | §0 golden rules apply every phase |

**Preserve:** existing Master Admin, Store Dashboard, Storefront preview UI/routes/components.  
**Reality locked:** Vite SPA + in-memory `TenantContext` + SQL string helpers — no Laravel/Next/live MySQL yet.

---

### Phase 1 — Foundation: Schema + API + Wire (no UI rebuild) — DONE · 2026-09-29
**Goal:** Data memory se nikal kar MySQL pe; UI same rahe.  
**Lock note:** [`docs/07-phase1-foundation.md`](07-phase1-foundation.md)

| # | Kaam | Status |
|---|------|--------|
| 1.1 | Extend Hostinger MySQL schema (`hostingerMysql.ts` + migrations): stores, products, variations, categories, orders, customers, coupons, shipping, SEO, domains, plans, subscriptions, media, team, audit, settings… sab `store_id` | Done |
| 1.2 | Scaffold Laravel API on Hostinger (Sanctum-ready auth stubs) | Done |
| 1.3 | Tenant middleware: har query pe `store_id` enforce | Done |
| 1.4 | API client in admin SPA; `TenantContext` mock → API (screens same) | Done |
| 1.5 | Cache tags / `updated_at` hooks for products, theme, media | Done |
| 1.6 | Import existing schema generator seed for phpMyAdmin | Done — `database/hostinger/` |

**Exit criteria:** Refresh ke baad data persist; ek store ka data dusre store mein na dikhe; admin UI same. **Met.**

**Golden rules this phase:** code organize · `store_id` · no UI invent · invalidation hooks ready.

---

### Phase 2 — Auth · Roles · Onboarding · Plans
**Goal:** Real login + server permissions + store onboarding.

| # | Kaam | Status |
|---|------|--------|
| 2.1 | `/master/login` + `/store/login` — same-to-same `designs/Login_UIUX/` + Holst tokens | **Done** |
| 2.2 | Auth: session/token, password reset, email/OTP stubs, rate limit | **Done** · [`docs/11-phase2.2-auth-reset.md`](11-phase2.2-auth-reset.md) |
| 2.3 | Roles: Super Admin, Admin, Manager, Support, Sales, Marketing, SEO, Content, Developer | **Done** · [`docs/12-phase2.3-roles.md`](12-phase2.3-roles.md) |
| 2.4 | Module permissions — **API enforce** + UI gates | **Done** · [`docs/13-phase2.4-module-permissions.md`](13-phase2.4-module-permissions.md) |
| 2.5 | Master onboarding link → unique `store_id` + business/location/store/plan + **language · RTL/LTR · currency · timezone** | **Done** · [`docs/14-phase2.5-onboarding.md`](14-phase2.5-onboarding.md) |
| 2.6 | Plans: Free / Paid / Pro / Custom + add-ons; feature flags + usage limits (products, team, orders, storage, AI, SEO…) | **Done** · [`docs/15-phase2.6-plans.md`](15-phase2.6-plans.md) |
| 2.7 | Subscription lifecycle: trial, monthly/yearly, renewal, grace, expired, suspended | **Done** · [`docs/16-phase2.7-subscriptions.md`](16-phase2.7-subscriptions.md) |

**Exit criteria:** Wrong role se protected API fail; onboarding se naya isolated store. **Met for Phase 2 band.**

**Golden rules:** design same-to-same login · ultra-fast toast on auth · no full reload.

**2.1 shipped:** Holst `portal-tokens.css` in `src/styles/` · `PortalLogin` · soft paths `/master/login` `/store/login` · Sanctum `POST /api/auth/master|store/login` · toast + `aria-busy` · demo users seeded.  
**2.2 shipped:** forgot/reset Holst paths · `POST /auth/forgot-password` · `/reset-password` · OTP stubs · `auth_otps` · throttles 8/min login · 5/min reset/OTP · mock fallback.  
**2.3 shipped:** role catalog · `role.can` middleware · abilities on login/`me` · support demo user · chrome role pill.  
**2.4 shipped:** module→ability map · sidebar filter · soft denied-tab redirect · products write gate · `usePermissions`.  
**2.5 shipped:** invite reserves unique `store_id` · lang/RTL/currency/timezone · register redeem · stores locale columns.  
**2.6 shipped:** Plans catalog · `plan.feature` middleware · product_limit API · SPA plan gates · Master Pro grant.  
**2.7 shipped:** subscription lifecycle resolve/renew · `subscription.writable` · grace 7d · SPA status badge.

---

### Phase 3 — Commerce Core (extend existing screens)
**Goal:** Products → Orders → Checkout real + connected.  
**Client lock detail:** [`docs/08-client-scope-lock.md`](08-client-scope-lock.md)

| # | Kaam |
|---|------|
| 3.1 | Products CRUD: list + insert/edit/delete/update · images, gallery, video, SKU, price/sale, stock, tags, SEO, hide/show · **advanced table** (search/sort/filter/pagination) per `docs/04` |
| 3.2 | Variations: size/color/weight/material/custom + per-variation price/image/SKU/stock |
| 3.3 | Categories / subcategories + image + SEO + sort |
| 3.3b | Brands (store-scoped) — same table/patterns as categories |
| 3.4 | Inventory: stock in/out, low-stock, history, variation stock |
| 3.5 | Orders workflow: Pending→Confirmed→Processing→Shipped→Delivered + Cancelled/Refund (list UX = products) |
| 3.5b | Bulk order actions (status / export) where existing design supports |
| 3.6 | Cart · Checkout · Buy Now · Add to cart · WhatsApp Order · customer order — store-configurable required fields |
| 3.6b | Thank-you / order confirmation page |
| 3.7 | Coupons wired to checkout (%, fixed, product/category/store-wide, dates, limits, free delivery…) |
| 3.8 | Shipping zones: country/region/city/area + charges / free / min order |
| 3.9 | Payments modular: **COD** + card (Mada/Apple Pay/Visa/MC) stubs; secrets never on frontend; test/live |
| 3.10 | Customers CRM + **user profile**: history, spend, group, block, notes |
| 3.11 | Invoices PDF + refund request/approve (full/partial) |
| 3.12 | Multi-currency display + store default currency (prices stay `store_id`-scoped) |

**Exit criteria:** Admin change → storefront/cart/order lists update **without** full refresh; coupons/shipping apply on checkout.

**Golden rules:** invalidate products/orders/cart/theme tags · advanced tables (search/filter/sort/bulk) where data pages exist · preserve matching UI.

---

### Phase 4 — Public Storefront + Full SEO (Next.js)
**Goal:** Public web production SEO + multi-store storefronts.

| # | Kaam |
|---|------|
| 4.1 | Extract `StoreFrontPreview` → Next.js public app (reuse components where possible) |
| 4.2 | Tenant resolve: subdomain / **custom domain** → `store_id` |
| 4.3 | Shop + **single product page** + cart/checkout surfaces: search, filters, sort, pagination, grid/list, responsive |
| 4.3b | Language (AR/EN+) + **RTL/LTR** `dir` on public pages; hreflang |
| 4.4 | Full per-store SEO: meta, OG, JSON-LD, sitemap, robots, hreflang, local SEO |
| 4.5 | Theme/banner/logo/color/**header/footer** publish → ISR/tag revalidate (zero stale) |
| 4.6 | Image CDN URLs with version query (no stale cache) |
| 4.7 | Google integrations (plan-gated): **GA · GTM · Search Console · indexing hooks · UTM/campaigns** |

**Exit criteria:** View-source / crawler sees store-specific meta; publish product → homepage updates without manual rebuild hang.

**Golden rules:** SEO mandatory · ultra-fast revalidation · no design invent on public theme beyond packs · no fake indexing claims.

---

### Phase 5 — Theme Settings · Visual Theme Builder · Media · Marketing
**Goal:** Theme Settings pack + **Advanced Visual Theme Builder** + media + reports.  
**Visual Builder lock:** [`docs/09-visual-theme-builder.md`](09-visual-theme-builder.md) (Elementor-*concept* only — no proprietary copy · no rebuild).

| # | Kaam |
|---|------|
| 5.1 | Theme Settings pages **01→18** same-to-same `designs/Theme_Settings_UIUX/` (header/footer, colors, banners, product cards, options…) slice by slice |
| 5.1b | **Dark / Light** admin + store chrome via Holst CSS variables (already in portal tokens — wire everywhere) |
| **5.V0→V10** | **Advanced Visual Theme Builder** — full-screen Edit Theme · 3-panel · widgets · DnD · draft/publish · EN/AR · RTL · header/footer/product/category builders · revisions · custom CSS/JS plan-gated · Master flags — see `docs/09` slices |
| 5.2 | Media library scale: **600+ images/store**, R2 `stores/{store_id}/`, WebP/AVIF, alt, used-by, unused, plan quotas — see `docs/03` |
| 5.3 | Reviews: product + store, rating, approve, spam |
| 5.4 | Analytics / **reports** ranges + sources (Google/Ads/YT/FB/IG/WA/direct/referral/**UTM**) — order source ≠ traffic source |
| 5.5 | Abandoned cart / loyalty / automation = schema-ready stubs only (future) |
| 5.6 | **Dummy themes** + Store **App Store / theme marketplace** — extend existing Marketplace UI; plan-gated install; no invent |

**Exit criteria:** Theme save/publish → public updates instantly (zero stale); media replace shows new file; editor JS **not** on public bundle; commerce + SEO data never wiped by theme restore.

**Order note:** Prefer **5.1** forms + **5.V0** shell early; deep widgets (V3+) after Phase 3–4 commerce/SEO paths are stable. One slice per prompt.

---

### Phase 6 — Domains · Hosting · Backup · Security · Ops
**Goal:** Production hardening.

| # | Kaam |
|---|------|
| 6.1 | Domains: platform subdomain, **custom domain**, SSL/DNS/status UI + backend hooks |
| 6.2 | Hosting status (shared now; per-store future `dedicated` / `client` — Master managed) |
| 6.3 | Per-store **Hostinger all-in-one ZIP**: DB (`store_id` only) + media + config; **backup** history; **restore**; **database migration** export/import — `docs/03` |
| 6.3b | Plan-wise backup retention + ZIP download (Free/Paid/Pro); pre-restore safety snapshot |
| 6.4 | **Security**: sessions/devices, rate limit, audit logs, security alerts, 2FA-ready |
| 6.5 | Notifications: email/OTP, order/payment/delivery, low stock, subscription expiry |
| 6.6 | **AI-code audit pass** (`docs/04` §1): bugs, dupes, unused imports, console/API errors, permission/cache/tenant issues — fix only; no rewrite of working features |
| 6.7 | Remove unnecessary demo / AI Studio branding; keep required legal attributions only |
| 6.8 | Dashboard / **system settings** modular sections per `docs/04` §9 (branding, payments, SEO, Google, team, domain, hosting, custom code…) |

**Exit criteria:** Backup restore works; audit log for sensitive actions; tenant isolation verified under tests.

---

### Phase 7 — Senior SQA · Full Quality & SEO Audit Gate
**Goal:** Evidence-based end-to-end audit — Master · Store · Public · SEO · cache · security · then fix + retest.  
**Lock:** [`docs/10-sqa-quality-seo-auditor.md`](10-sqa-quality-seo-auditor.md)

| # | Kaam |
|---|------|
| 7.0 | Smoke baseline + test plan from `docs/10` (NOT TESTED / BLOCKED rules) |
| 7.1 | Master Admin full audit |
| 7.2 | Store Dashboard full audit (incl. Theme Builder when present) |
| 7.3 | Public Storefront journeys + e-commerce flow |
| 7.4 | **Mandatory:** image-change + multi-layer **cache** audit (zero stale) |
| 7.5 | Multi-tenant isolation + authZ + API/DB integrity |
| 7.6 | Technical SEO rendered audit (title/meta/H1/canonical/robots/sitemap/hreflang/schema/image SEO) |
| 7.7 | Performance · responsive · a11y · broken links · console/network |
| 7.8 | Security pass (XSS/IDOR/cross-tenant/upload…) |
| 7.9 | Bug triage (CRITICAL→LOW) · fixes · **regression** · Final report A–O → `docs/qa/phase7-report.md` |

**Exit criteria:** No open CRITICAL; image/cache pass; core journey pass or documented BLOCKED; report complete.

**Rule:** Smoke QA har pehle phase pe bhi — Phase 7 = formal gate, rebuild nahi.

---

## Phase checklist (har phase complete hone se pehle)

- [ ] Golden rules followed (speed · SEO · design · code)
- [ ] **UI/UX audit rules** (`docs/04`) — correct UI not redesigned; mistakes fixed only
- [ ] Existing correct UI **not** unnecessarily changed
- [ ] `store_id` isolation verified
- [ ] Mutations update UI without full refresh
- [ ] Public-facing change has SEO impact considered
- [ ] Data lists use advanced table pattern (search/filter/sort/pagination) when that slice wires lists
- [ ] Smoke QA for the slice (`docs/10` — at least critical path / no guess Pass)
- [ ] Code short / no new duplicates
- [ ] Smoke test Master + Store + (when ready) Public

---

## Prompt / slice rule

Ek waqt pe **ek phase slice** — e.g. “Phase 2.1 login only” ya “Phase 3.1 products CRUD”.  
Poora SaaS ek prompt mein rewrite = **forbidden**.

---

## Next action

**UI/UX same-to-same steps (Header → Sidebar → Overview → pages · Master then Store · then Themes)** — [`docs/21-uiux-same-to-same-steps.md`](21-uiux-same-to-same-steps.md). Chat: `docs/21 M0` → `M1` …  
**Phase 3.3 Done** — categories / subcategories · `docs/19`.  
**Master Project Goal** — [`docs/00-master-project-goal.md`](00-master-project-goal.md) (**already full** §1–15 · coverage + phase progress refreshed).  
**UI/UX + Audit + Dashboard rules** — [`docs/04-uiux-audit-dashboard-rules.md`](04-uiux-audit-dashboard-rules.md) (**already full** · always-on; phase map refreshed).  
**Client backlog locked** — [`docs/08-client-scope-lock.md`](08-client-scope-lock.md) (products→orders→themes→SEO→backup… all design + golden).  
**Visual Theme Builder locked** — [`docs/09-visual-theme-builder.md`](09-visual-theme-builder.md) (Phase **5.V** slices; do not start before inspect + commerce foundation stable).  
**SQA / Quality / SEO Auditor locked** — [`docs/10-sqa-quality-seo-auditor.md`](10-sqa-quality-seo-auditor.md) (smoke every slice · formal **Phase 7**).  
**Start Phase 3.3b** — brands (store-scoped · same patterns as categories) — parallel OK with UI/UX chrome slices.  
**Do not** start full Visual Builder rewrite in one prompt — only **5.V0** when unlocked.  
**Do not** run full Phase 7 gate until Phases 2–6 core paths exist enough to test.
