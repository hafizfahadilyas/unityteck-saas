# Phase 3.3 — Categories / subcategories (LOCKED)

**Date:** 2026-09-29  
**Rule:** Extend Holst store chrome — reuse `AdvancedDataTable`. No invent layout. `store_id` on every row.

## Scope

| Item | Detail |
|------|--------|
| Hierarchy | Root + subcategory via `parent_id` |
| Fields | name · name_ar · slug · image · sort_order · meta_title · meta_description · is_active |
| UX | Store sidebar **Categories** (after Products) · CRUD modal |

## Shipped

| Layer | Detail |
|-------|--------|
| API | `GET/POST /categories` · `GET/PATCH/DELETE /categories/{id}` |
| Filters | `q` · `parent_id` / `roots` · `is_active` · `sort` · `dir` · pagination / `all` |
| Safety | Parent must be same store · no self-parent · no nest under own descendant · children promoted on delete |
| SPA | `StoreCategories` · AdvancedDataTable · mock seed fallback |
| Nav | Store tab gated by `products.read` + plan `catalog` |
| Seed | `cat-bouquets` · `cat-vases` · `cat-bouquets-roses` (sub) |

## Golden rules

- Design: same Holst table/modal language as Products  
- Ultra-fast: toast + list patch — no full reload  
- Security: `role.can:products.*` · `plan.feature:catalog` · `subscription.writable`  
- Code: one CategoryController · shared AdvancedDataTable  

## Smoke QA

1. Store → Categories — roots + Rose Boxes sub listed.  
2. Add subcategory under Bouquets · sort order · SEO fields.  
3. Edit image URL · toggle Active.  
4. Delete parent → children become roots.  
5. Support without write — Add disabled.  
6. Expired sub — mutate blocked.  

## Not in this slice

- Brands (3.3b)  
- Product form auto-bind `category_id` FK (text category still works)  
- Drag-and-drop reorder  
- Storefront category pages (4.3)  
