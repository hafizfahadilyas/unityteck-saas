# Phase 3.2 — Product variations (LOCKED)

**Date:** 2026-09-29  
**Rule:** Extend existing product edit modal — no invent catalog page. `store_id` + product ownership on every write.

## Scope

| Item | Detail |
|------|--------|
| Options | `size` · `color` · `weight` · `material` · `custom` (+ free-form keys) |
| Per variant | price · image · SKU · stock · `is_active` |
| UX | Panel inside **Edit Product** modal only (save product first) |

## Shipped

| Layer | Detail |
|-------|--------|
| Schema | `product_variations.options` JSON (renamed from `attributes` — Eloquent-safe) |
| API | `GET/POST /products/{id}/variations` · `PATCH/DELETE …/variations/{id}` |
| Product show | Includes nested `variations` |
| Gates | Same as products write: `role.can` · `plan.feature:catalog` · `subscription.writable` |
| SPA | `ProductVariationsPanel` · tenantApi CRUD · mock fallback |
| Seed | 3 variants on `prod-1` |

## Golden rules

- Design: Holst modal fields style — nested panel, not new screen  
- Ultra-fast: toast + local list update — no full reload  
- Security: variation must belong to product **and** `store_id`  
- Code: one controller + one panel — reuse product permissions  

## Smoke QA

1. Edit `prod-1` → Variations lists seed rows (API) or empty (mock).  
2. Add size/color + SKU/price/stock → appears without page refresh.  
3. Edit variation price → saves.  
4. Delete — confirm toast then remove.  
5. Wrong store / support without write → 403 / disabled.  
6. SKU duplicate in same store → 422.  

## Not in this slice

- Inventory history / stock in-out (3.4)  
- Storefront PDP picker (4.3)  
- Matrix generator (all size×color combos)  
- Bulk variation import  
