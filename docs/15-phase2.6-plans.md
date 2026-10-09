# Phase 2.6 — Plans Free/Paid/Pro/Custom + API limits (LOCKED)

**Date:** 2026-09-29  
**Rule:** Server enforce — hiding UI is not enough. Extend existing plan seeds; no UI invent.

## Catalog (effective)

| Code | Products | Team | Storage | Key features |
|------|----------|------|---------|--------------|
| **free** | 50 | 1 | 512 MB | catalog, orders, basic_seo, **themes_basic** |
| **paid** | 500 | 5 | 5 GB | + seo, coupons, shipping, analytics, **themes_basic** |
| **pro** | 5000 | 20 | 50 GB | + **themes** (full), backups, zatca, ai |
| **custom** | ∞ | ∞ | ∞ | `all` |

**Default theme:** every new store auto-gets `theme-commerce-starter` (Commerce Starter). Free/Paid = basic homepage pack; Pro/Custom = full styles + premium catalog. Branding editable later (Theme Settings Phase 5).

**Master grant:** `stores.master_granted_pro` upgrades Free/Paid **features/limits** to Pro (billed code unchanged).

## Shipped

| Item | Detail |
|------|--------|
| `App\Support\Plans` | Catalog · `forStore` · `hasFeature` · `assertCanAddProduct` |
| `App\Support\DefaultTheme` | Catalog seed + assign on `StoreController@store` |
| Middleware | `plan.feature:{name}` on coupons/shipping/seo/catalog/orders writes |
| Product create | 403 when `product_limit` reached |
| API | `GET /api/plans` · `GET /api/plans/current` |
| SPA | `src/auth/plans.ts` · `src/auth/defaultTheme.ts` · Store Themes basic/full UI |
| Seed | Free/Paid `themes_basic`; Pro `themes` + full catalog |

## Golden rules

- Code organize: one Plans source API + SPA mirror  
- Ultra-fast: toast on limit — no full reload  
- Design: products header shows plan usage (existing screen)  
- Multi-tenant: limits always scoped to `store_id`  

## Smoke QA

1. Free store (no Master grant) — coupons/shipping **hidden**; Themes tab shows **basic** Commerce Starter only.  
2. Add products until Free limit (50) → UI disable + API 403.  
3. Toggle `masterGrantedPro` → Pro features/limits + **full** themes.  
4. Pro store — coupons/shipping/full themes visible (role permitting).  
5. New store create → `store_themes` row with `theme-commerce-starter`.  
6. `GET /plans` returns 4 codes.

## Not in this slice

- Subscription lifecycle trial/grace/expired UI (**2.7**)  
- Billing/payment of plans  
- Storage upload quota hard-block (schema ready; media Phase 5)
