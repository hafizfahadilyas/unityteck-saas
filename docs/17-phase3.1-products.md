# Phase 3.1 — Products CRUD (LOCKED)

**Date:** 2026-09-29  
**Rule:** Extend existing Store Products Holst screen — no invent layout. Shared advanced table. API enforce `store_id` + plan + subscription.

## Scope

| Item | Detail |
|------|--------|
| List | Search · status filter · sort · pagination · page size |
| CRUD | Create · edit · delete · toggle publish (hide/show via `is_active`) |
| Fields | Image · gallery · video · SKU · price · compare-at · stock · tags · description · SEO title/desc/keywords |
| Table | Shared `AdvancedDataTable` (reuse for orders/customers later) |

## Shipped

| Layer | Detail |
|-------|--------|
| Migration | `gallery_urls` · `video_url` · `tags` · `seo_*` |
| API | `GET /products` paginated (+ `?all=1`) · `GET /products/{id}` · `POST` · `PATCH` · `DELETE` · toggle-publish |
| Filters | `q` · `status` · `category` · `is_active` · `sort` · `dir` · `page` · `per_page` |
| SPA | `StoreProducts` wired · edit modal · double-click delete confirm · toast · soft invalidate |
| Shared UI | `src/components/common/AdvancedDataTable.tsx` |
| Hostinger SQL | products CREATE aligned with new columns |

## Golden rules

- Design: keep Products Catalog chrome + Zero Stale banner — extend only  
- Ultra-fast: optimistic map update · `bumpCacheTag(products)` · no full reload  
- Security: writes still behind `role.can` · `plan.feature:catalog` · `subscription.writable`  
- Code: one table component · extend ProductController/model — no duplicate catalog  

## Smoke QA

1. Store admin → Products — search / status / sort / page size work.  
2. Add Product with SEO + gallery → appears in list without refresh.  
3. Edit → compare-at + tags save · image `?v=` bust when URL changes (API `image_version`).  
4. Delete — first click warn toast · second confirms · row gone.  
5. Support role without `products.write` — Add/Edit/Delete disabled + toast.  
6. Expired subscription — mutate blocked (2.7 gate).  
7. Plan product limit — create 403 + toast.  

## Not in this slice

- Variations (3.2) · Categories/Brands CRUD UI (3.3/3.3b)  
- Media upload to R2 (use URL fields for now)  
- Server-driven SPA pagination (API ready; SPA filters loaded catalog)  
- Bulk delete/export  
