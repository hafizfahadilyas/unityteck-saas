# Dashboard Zero-Mock Fix Plan (LOCKED)

**Status:** Active execution guide  
**Date:** 2026-10-24  
**Scope:** Store Admin + Master Admin only — **fix broken data / i18n / isolation**.  
**Related:** `docs/00` · `docs/04` · `docs/10` · `docs/24` · audit 2026-10-24

---

## CRITICAL — DO NOT REBUILD

- **Preserve** existing Master Admin, Store Dashboard, Holst chrome, Lucide icons, card layouts, tab structure.
- **Do not** redesign screens that already match `designs/` / reference images.
- **Do not** invent new SEO/Analytics layouts — same UI, real data (or genuine empty).
- **Inspect → reuse → extend → fix** only the listed masle. No parallel systems.

---

## Golden rules (every PR / slice)

| # | Rule | Meaning |
|---|------|---------|
| 1 | **Zero Mock / Dummy Data** | No fake arrays, invented KPIs, Instant Google tokens, or `INITIAL_*` on live API path. Empty → **No records found** / Not Connected / Waiting for Data. |
| 2 | **Strict Multi-Tenant Isolation** | Every read/write scoped by `store_id`. No `\|\| store-1`, no flower default for other niches, no cross-store payment/theme fallback. |
| 3 | **100% Pixel-Perfect UI/UX** | Keep colors, spacing, borders, cards, Lucide icons. Change only data binding + empty/error states. |
| 4 | **Dual Theme + Dual Direction** | Dark + Light via tokens. EN = LTR full English chrome; AR = RTL full Arabic chrome. Content fields: `*_en` / `*_ar` where store content is bilingual. |

**Also locked:** Real Hostinger MySQL + Laravel API only · optimistic UI + invalidate (no full page reload) · Master controls all stores · each store owns its themes/data.

---

## What was checked (audit summary)

| Surface | Finding |
|---------|---------|
| Architecture | One Holst dashboard · Master control plane · maps keyed by `storeId` — **shape OK** |
| Core commerce (products/orders/customers) | Mostly API when live — **~85%+ real** |
| SEO / Google Site Kit | Fake connect, IDs, clicks, PSI, deep-audit list — **~15–25% real** |
| Analytics / Reports / Channels / Funnel | Invent multipliers (`×15/×20/×22`), growth %, fake campaigns/devices — **~25–35% real** |
| Brands / Invoices / Theme defaults | Niche hardcode + `store-1` / Flora / giftshop fallbacks |
| Payments / Shipping chrome | EN+AR mixed in one title string |
| Master DB / Control Center | Fake MySQL ping · auto fake GTM/GA4 |
| Overall | **~45–55%** trustworthy real data; **not** 100% yet |

---

## Priority waves — pehle kya fix

Execute **in order**. One wave = one focused PR/slice. Ship only when that wave’s acceptance passes.

### Wave 1 — Kill fake “Real Data” (highest impact)

| Step | Fix | Files (primary) | Acceptance |
|------|-----|-----------------|------------|
| 1.1 | Remove Instant Google + `store-1` auto-seed fake token/IDs/PSI | `src/utils/googleRealAuth.ts` | No connected state without real OAuth/API |
| 1.2 | Stop inventing GA4/GTM/verification on Connect | `StoreSEO.tsx`, `GoogleConnectModal.tsx` | Empty IDs until merchant/Master sets real ones |
| 1.3 | Live path never hydrates `INITIAL_SEO_CONFIGS` | `TenantContext.tsx`, `mockData.ts` (leave mock file for offline only) | SEO empty → zeros + Not Connected |
| 1.4 | Deep audit: no fabricated broken-link list | `ksaAutomationEngine.ts` / SEO deep tab | Empty or real crawl only |
| 1.5 | Hub/GSC cards: drop false “Real Data” badge when source ≠ GSC sync | `StoreSEO.tsx` | Badge only after Laravel Google sync |

### Wave 2 — Analytics / Reports / Funnel invent formulas

| Step | Fix | Files (primary) | Acceptance |
|------|-----|-----------------|------------|
| 2.1 | Remove `orders × 15/20/22` visit invent | `CustomerJourneyFunnel.tsx`, `StoreChannelPerformance.tsx`, `StoreReports.tsx`, `ReportsOverview.tsx` | Missing visits → `0` + empty |
| 2.2 | Remove hardcoded growth % (`↑ 12.8%`, etc.) | Reports\* components | No comparison → hide or “—” |
| 2.3 | Remove fake device split / cities / campaign invent | `StoreAnalytics.tsx`, `ReportsCampaigns.tsx` | Empty states when GA/API missing |
| 2.4 | Dashboard profit: no `revenue × 0.35` unless real COGS | `StoreDashboard.tsx` | Show revenue only or real margin field |
| 2.5 | Channel add-to-cart invent (`orders × 1.5`) | `StoreChannelPerformance.tsx` | Real channel map or empty |

### Wave 3 — Isolation leaks (Master + Store)

| Step | Fix | Files (primary) | Acceptance |
|------|-----|-----------------|------------|
| 3.1 | MasterThemes: no fallback to `allStoreThemes['store-1']` | `MasterThemes.tsx` | Empty store → empty / default neutral, not Flora |
| 3.2 | Payment txs: no `\|\| paymentTransactionsMap['store-1']` | `TenantContext.tsx` | Other store → `[]` |
| 3.3 | New store default ≠ `theme-flora-luxe` / giftshop identity | `auth/defaultTheme.ts`, `StoreThemes.tsx`, `storeIdentity` | Neutral default + empty branding |
| 3.4 | Brands: no `INITIAL_BRANDS` flower when store omitted; no niche seed as “DB” | `StoreBrandsView.tsx` | New store → `[]` until API/local save |
| 3.5 | Invoices: non-coffee must not get flower suppliers | `invoiceService.ts` | Empty suppliers / purchases |
| 3.6 | Prod boot: never reinject `INITIAL_*` on API fail for logged-in live session | `TenantContext.tsx` | Error toast + empty, not demo catalog |

### Wave 4 — EN / AR chrome + content

| Step | Fix | Files (primary) | Acceptance |
|------|-----|-----------------|------------|
| 4.1 | Split mixed titles (`Cash on Delivery (الدفع…)`, `SPL (البريد…)`) → `titleEn` / `titleAr` | Payment + shipping seed/UI | EN locale shows EN only |
| 4.2 | SEO meta dual fields `meta_title_en/ar` (+ desc/keywords) | API `SeoConfig` + `StoreSEO` form | EN UI edits EN fields; AR edits AR |
| 4.3 | SEO KPI labels use `isAr` (today many EN-only) | `StoreSEO.tsx` | AR mode full Arabic chrome |
| 4.4 | Master Themes / Updates / Database full `isAr` | `MasterThemes`, `MasterUpdates`, `MasterDatabase` | AR Master consistent |
| 4.5 | Theme builder payment labels follow locale | Visual builder payment chips | EN mode English labels |

### Wave 5 — Master fake tooling

| Step | Fix | Files (primary) | Acceptance |
|------|-----|-----------------|------------|
| 5.1 | Database “Test connection” → real API/health ping | `MasterDatabase.tsx` + Laravel health | Fail shows real error |
| 5.2 | Control Center: no auto-fake `GTM-KSA…` / `G-KSA…` as connected | `MasterControlCenter.tsx` | Show only saved real IDs |
| 5.3 | Master marketing invent ROAS when spend=0 | `MasterGeneralView.tsx` | “—” / empty |
| 5.4 | Synthetic sparklines: only from real series or hide | `MasterDashboard.tsx` | No invented prior points |

### Wave 6 — Hardening + verify

| Step | Check |
|------|--------|
| 6.1 | Giftshop + second store side-by-side: no SEO/payment/theme bleed |
| 6.2 | EN UI: chrome English; AR UI: chrome Arabic; content fields locale-correct |
| 6.3 | Dark + Light: no washed text on fixed SEO/Analytics cards |
| 6.4 | Disconnect Google → all SEO metrics zero + empty queries |
| 6.5 | `npm run build` clean · no new mock imports on live path |

---

## Out of scope (this plan)

- Rebuilding Master/Store/storefront UI
- New SEO tab designs or extra menu modules
- Fake charts “to look busy”
- Changing Hostinger schema columns unless Wave 4.2 bilingual meta requires additive nullable columns (prefer `extra` JSON first if possible — **no breaking API**)

---

## Execution checklist (every wave)

1. Inspect current UI + data path (API vs mock).  
2. Remove fake source only — keep pixel layout.  
3. Wire real API / MySQL (`store_id`) or genuine empty.  
4. Confirm EN + AR + Dark + Light smoke.  
5. Confirm second store isolation.  
6. Build pass · no drive-by refactors.

---

## Status tracker

| Wave | Status |
|------|--------|
| 1 SEO / Google fake kill | **Done** (Instant connect killed, SEO seed off, PSI empty, KPI badges honest) |
| 2 Analytics invent kill | **Done** (devices/locations/GA invent, campaigns invent, loyalty/affiliate invent) |
| 3 Isolation leaks | **Done** (payment store-1, MasterThemes Flora, brands/invoice, identity defaults, theme default) |
| 4 EN/AR dual | **Partial** (SEO KPI bilingual + localeMixedLabel for shipping; dual meta fields still pending) |
| 5 Master fake tooling | **Done** (DB /health ping, Control Center no fake GTM/GA4, no invent ROAS 4.2) |
| 6 Verify | Pending manual QA |

**Next:** dual `meta_title_en/ar` (+ desc/keywords) · remaining mixed payment titles · Master Themes/Updates i18n.
`)
