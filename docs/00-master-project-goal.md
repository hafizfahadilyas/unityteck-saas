# MASTER PROJECT GOAL (LOCKED)

**Source:** Client brief — CURSOR AI — MASTER PROJECT GOAL  
**Status:** Canonical · **full prompt covered** (§1–§15 + FINAL = 1:1)  
**Always-on Cursor rule:** `.cursor/rules/master-project-goal.mdc`  
**Related:** `docs/01` · `docs/02` · `docs/03` · `docs/04` · `docs/07` · `docs/08` · `docs/09`

---

## Coverage check (client prompt → this doc)

| Client § | Topic | Status |
|----------|--------|--------|
| CRITICAL | Do not rebuild Master / Store / Storefront UI | **Locked** |
| 1 | Multi-tenant SaaS · `store_id` per store | **Locked** · Phase 1 schema Done |
| 2 | Master Admin central modules | **Locked** · wire by phase · UI preserve |
| 3 | Onboarding link → form → `store_id` | **Locked** · Phase **2.5** |
| 4 | Central MySQL · shared · server-side isolation | **Locked** · Phase 1 Done |
| 5 | Future separate DB/hosting (don’t block) | **Locked** · `docs/03` · Phase **6.2–6.3** |
| 6 | Shared hosting optimize · NO VPS now | **Locked** · `docs/02` |
| 7 | Subdomain · custom domain · future client host | **Locked** · Phase **6.1** |
| 8 | Plans Free/Paid/Pro/Custom · API enforce | **Locked** · Phase **2.6–2.7** |
| 9 | Store-specific public SEO mandatory | **Locked** · Phase **4.4** |
| 10 | GA / GTM / Search Console · no fake indexing | **Locked** · Phase **4.7** |
| 11 | Full e-commerce (plan-gated) | **Locked** · Phase **3** · detail `docs/08` |
| 12 | No refresh · invalidate · no listener spam | **Locked** · every phase · `docs/02` |
| 13 | Existing UI preserve · no invent | **Locked** · `docs/04` · designs/ |
| 14 | Short modular code · no duplicates | **Locked** · `code-organize-optimize.mdc` |
| 15 | 10-step pre-change checklist | **Locked** below |
| FINAL | Transform, don’t discard AI Studio project | **Locked** |

**Not a separate phase** — this is the north star. Phases 0–6 implement it slice-by-slice.

---

## CRITICAL — DO NOT REBUILD

Google AI Studio ne pehle se banaya hai:

- Master Admin Dashboard  
- Store Dashboard  
- Public Store Theme / Storefront  
- Existing UI/UX, pages, components  

**Inko rebuild / replace / discard mat karo.**

Cursor AI ka primary goal:

> Existing project **inspect** karke, **usi architecture + UI/UX preserve** karte hue, real multi-tenant SaaS ke liye database, APIs, permissions, SEO, domains, hosting, store management **implement / connect / optimize** karna.

**Order (har change pe):**  
Inspect → Understand → Identify components → Check DB/API → Preserve → Required changes only → No duplicates → Test related pages → Mobile/Desktop → Realtime/cache behavior.

---

## 1. Business model

Centralized **Multi-Tenant SaaS E-commerce Platform**.

```
Platform
 └─ Master Admin
     ├─ Store A
     ├─ Store B
     ├─ Store C
     ├─ Store D
     └─ Future stores…
```

Har store ka apna: `store_id`, business info, products, categories, orders, customers, settings, theme, SEO, analytics, domain, subscription/plan, team, permissions.

Initial: **central MySQL** + shared hosting.  
Isolation: har row/query pe **`store_id`** — Store A data Store B ko kabhi access nahi (server-side enforce).

---

## 2. Master Admin — central control

Preserve existing Master Dashboard UI. Modules integrate karo (invent layout mat):

Store Management · Onboarding · Plans · Subscriptions · Features · Permissions · Domains · Hosting · Products · Categories · Orders · Customers · Analytics · SEO · GA / GTM / Search Console · Marketing · Delivery · Payments · Themes · Notifications · Reports · Team · Audit Logs · Security · System Settings  

(+ pehle se locked: media 600+/store, backup ZIP, migrate/restore — `docs/03`)

---

## 3. New store onboarding

**Locked flow (Fahad):** Master sirf **account invite link** bhejta hai → client **khud** account create karta hai → usko **apna Store Dashboard** milta hai (Free / Paid / Pro / Custom features ke hisaab se) → seed **dummy store data + theme select** → phir **1 store** se branding / catalog / settings sab uske brand ke mutabiq.  

- **Basic features** = har store ke paas  
- **Advanced features** = har store ke apne — sirf jo **Master Admin allow / grant** kare  
- Public login pe open register **nahi** — invite token required  

Master → **Generate registration link** → Client multi-step form → Store create + auto **`store_id`**.

| Block | Fields |
|-------|--------|
| Business | Business Name, Brand Name, Owner, Email, Phone, Category, Description |
| Location | Country, Region, City, Area, Address |
| Store config | Currency, Language (AR/EN), RTL/LTR, Timezone, VAT/Tax |
| Plan | Free · Paid · Pro · Custom |

Future billing: Monthly · Yearly · Trial · Add-on.

**Phase:** **2.5**

---

## 4. Multi-tenant data (initial)

| Item | Value |
|------|--------|
| DB | MySQL |
| Host | Shared hosting (**NO VPS assume**) |
| Pattern | One DB, many stores, every key table has `store_id` |
| Enforce | Backend/API middleware — frontend filter alone = **not enough** |

Tables (examples): products, categories, orders, customers, settings, themes, seo, analytics, … → all `store_id`.

**Phase:** **1 Done** (schema + API tenant scopes)

---

## 5. Future separate DB / hosting

Abhi complicated mat banao. Architecture **block mat** karo:

- Store → central DB **or** later dedicated DB  
- Central hosting **or** later client-specific hosting  
- Flags / migration ZIP path ready (`docs/03`)

**Phase:** fields ready · pipeline **6.2–6.3**

---

## 6. Hosting constraints (shared)

Optimize for shared hosting:

Efficient PHP/API · indexed MySQL · pagination · caching + **invalidation** · lightweight frontend · image optimization · minimal background processes · Hostinger cron for queues.

Future VPS migration possible rehni chahiye — abhi VPS mat assume. Full stack: `docs/02`.

---

## 7. Domains (modular)

| Type | Concept |
|------|---------|
| A. Platform/demo subdomain | `store-name.platform-domain.com` |
| B. Custom domain | `clientdomain.com` |
| C. Future client hosting/domain | migration/config path |

SSL / DNS / domain status fields + status system. Modular — hard-wire mat.

**Phase:** **6.1** (+ resolve in public **4.2**)

---

## 8. Plans & features

Master decides per store: Free · Paid · Pro · Custom (+ Add-on / Disabled).

- UI hide **≠** security  
- **Server-side** permission + feature flags  
- Master dynamically map features to plan tiers  
- Free/Paid/Pro ko apne hisaab se updates + features (`docs/03`)

**Phase:** **2.6–2.7**

---

## 9. SEO

- Master: central SEO management tools  
- Public storefront: **store-specific SEO mandatory**  
- Per store: brand/product/category/local SEO, meta, keywords, slugs, canonical, alt, schema, OG, sitemap, robots, analytics, Search Console  
- Store A SEO ≠ Store B  
- Dashboard SEO optional; **public SEO required**

No keyword stuffing / fake backlinks / ranking guarantees.

**Phase:** admin fields early · public **4.4**

---

## 10. Google integrations

Plan-gated: GA · GTM · Search Console · sitemap/indexing hooks · UTM/campaigns.

- Credentials secure (server)  
- Secrets **never** on frontend  
- Indexing **guarantee claim mat** karo  

**Phase:** **4.7**

---

## 11. E-commerce (plan-gated)

Products (CRUD list) · brands · categories/subs · variations · inventory · images · product SEO · orders · bulk order tools · customers / **user profile CRM** · cart · **add to cart** · **single product** · checkout · **thank-you page** · coupons · discounts · delivery · payments / **COD** / card stubs · reviews · **WhatsApp orders** · **multi-currency**.

Full locked surface list (header/footer · themes · RTL · dark/light · App Store · backup ZIP…): [`docs/08-client-scope-lock.md`](08-client-scope-lock.md).  
Visual Theme Builder: [`docs/09-visual-theme-builder.md`](09-visual-theme-builder.md).

**Phase:** **3** (core) · storefront pages **4** · theme **5**

---

## 12. Real-time / no refresh (extremely important)

Store Admin change → public/admin related UI **auto update**, jahan technically possible **manual refresh nahi**:

Product / image / price / stock / category / theme / banner / logo / color / settings → latest everywhere.

Use: state sync · selective realtime · cache + query invalidation · `updated_at` · version numbers.  
**Unnecessary realtime listeners mat lagao.**  
**Purana/stale cache data kahin nahi** (`docs/02`).

---

## 13. Existing UI/UX

Primary reference: `designs/` packs + existing AI Studio screens. Audit rules: `docs/04`.

Preserve: Dashboard, Product List/Add/Edit, Orders, Categories, Analytics, Team, Settings, Theme, Public Storefront.

- Functionality **connect** karo  
- Naya design invent mat — jab tak explicitly na kaha jaye  
- Jo UI pehle se sahi hai → mat chhedo  

---

## 14. Code golden rule

Short · reusable · modular · optimized queries.  

No: duplicate components/functions · unnecessary packages · unnecessary API calls · unnecessary listeners · dead code · unused imports.

Existing extend kar sakte ho to **naya parallel system mat banao**.

---

## 15. Pre-change checklist (10)

1. Existing code inspect  
2. Architecture samjho  
3. Related components identify  
4. DB/API check  
5. Existing functionality preserve  
6. Sirf required changes  
7. Duplicate system mat banao  
8. Related pages impact test  
9. Mobile + Desktop test  
10. Realtime / cache behavior test  

---

## FINAL GOAL (one line)

Existing AI Studio project ko **transform** karke connected platform:

**Master Admin → Multiple Stores → Store Dashboards → Public Storefronts → Central MySQL → store_id isolation → Plans/Features → Domains → Shared hosting now → Future separate host/DB → Full e-commerce → Store SEO → Google integrations → Real-time updates → Fast responsive UI**

```
Do not rebuild.
Do not destroy working features.
Do not create duplicate systems.
Inspect first → modify → extend → optimize → connect.
```

---

## Phase progress vs this goal (2026-09-29)

| Band | Status |
|------|--------|
| Phase 0 Inspect & Lock | **Done** |
| Phase 1 Foundation (MySQL/Laravel/`store_id`) | **Done** |
| Phase 2.1 Login Holst | **Done** |
| Phase 2.2 Auth reset · OTP stubs · rate limit | **Done** · `docs/11` |
| Phase 2.3 Roles catalog + API enforce | **Done** · `docs/12` |
| Phase 2.4 Module permissions UI + API | **Done** · `docs/13` |
| Phase 2.5 Onboarding · store_id · locale | **Done** · `docs/14` |
| Phase 2.6 Plans · feature limits API | **Done** · `docs/15` |
| Phase 2.7 Subscription lifecycle | **Done** · `docs/16` |
| Phase 3.1 Products CRUD · advanced table | **Done** · `docs/17` |
| Phase 3.2 Product variations | **Done** · `docs/18` |
| Phase 3.3 Categories / subcategories | **Done** · `docs/19` |
| Phase 3 Commerce (rest) | Pending · next **3.3b** brands |
| Phase 4 Public SEO / Next | Pending |
| Phase 5 Theme + Visual Builder | Pending (`docs/09`) |
| Phase 6 Domains · backup ZIP · security | Pending |
| Phase 7 Senior SQA · full quality/SEO gate | Pending (`docs/10`) |
| Phase 4 Public SEO / Next | Pending |
| Phase 5 Theme + Visual Builder | Pending (`docs/09`) |
| Phase 6 Domains · backup ZIP · security | Pending |
| Phase 7 Senior SQA · full quality/SEO gate | Pending (`docs/10`) |

---

## Doc index

| File | Content |
|------|---------|
| `docs/00-master-project-goal.md` | Overall SaaS goal — no rebuild (**this file**) |
| `docs/01-phases-and-golden-rules.md` | Phases 0–6 + golden rules |
| `docs/02-tech-stack-no-vps.md` | Tech · NO VPS · zero-stale cache |
| `docs/03-multistore-media-backup-plans.md` | 600+ images · ZIP backup/restore/migrate · plans |
| `docs/04-uiux-audit-dashboard-rules.md` | Code audit · branding · tables · analytics · settings |
| `docs/05-requirements-gap-matrix.md` | Phase 0 gap matrix (UI vs API/DB/SEO) |
| `docs/06-phase0-inspect-lock.md` | Phase 0 inspect report + lock decisions |
| `docs/07-phase1-foundation.md` | Phase 1 foundation lock (schema · API · wire · Hostinger SQL) |
| `docs/08-client-scope-lock.md` | Client backlog lock (commerce · storefront · i18n · SEO · ops) |
| `docs/09-visual-theme-builder.md` | Advanced Visual Theme Builder (Elementor-concept · no rebuild) |
| `docs/10-sqa-quality-seo-auditor.md` | Senior SQA · quality · SEO · cache · security audit (Phase 7) |
| `docs/11-phase2.2-auth-reset.md` | Phase 2.2 password reset · OTP stubs · rate limit |
| `docs/12-phase2.3-roles.md` | Phase 2.3 roles catalog · `role.can` API enforce |
| `docs/13-phase2.4-module-permissions.md` | Phase 2.4 module UI gates · `usePermissions` |
| `docs/14-phase2.5-onboarding.md` | Phase 2.5 onboarding invite · store_id · locale/RTL/currency/tz |
| `docs/15-phase2.6-plans.md` | Phase 2.6 Free/Paid/Pro/Custom · plan.feature + product limits |
| `docs/16-phase2.7-subscriptions.md` | Phase 2.7 trial/grace/expired/suspended · renew |
| `docs/17-phase3.1-products.md` | Phase 3.1 Products CRUD & advanced table |
| `docs/18-phase3.2-variations.md` | Phase 3.2 Product variations & pricing |
| `docs/19-phase3.3-categories.md` | Phase 3.3 Categories & subcategories hierarchy |
| `docs/20-flowers-premium-theme.md` | Flowers Premium Theme integration & layout |
| `docs/21-uiux-same-to-same-steps.md` | UI/UX same-to-same implementation roadmap |
| `docs/22-pixel-perfect-roadmap.md` | Pixel perfect visual matching roadmap |
| `docs/23-storefront-themes-elementor-customizer-guide.md` | Storefront themes & customizer guide |
| `docs/24-seo-architecture-and-store-instructions.md` | **Bilingual (EN / AR) SEO Architecture & Operations Manual** |
| `docs/25-marketing-hub-campaigns-and-promotions-guide.md` | **Bilingual (EN / AR) Marketing Hub, Campaigns & Promos Manual** |
| `docs/26-reporting-business-intelligence-and-analytics-guide.md` | **Bilingual (EN / AR) Reporting, BI & Analytics Manual** |

Aur requirements aayein to nayi docs add + is index update.
