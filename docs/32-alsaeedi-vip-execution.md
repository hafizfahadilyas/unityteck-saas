# Al-Saeedi VIP Automotive — Execution Plan (LOCKED)

**Store:** `store-bleco` · Storefront `/bleco` · Central `mieraf-ksa.com`  
**Rule:** Inspect → Reuse → Extend. Do **not** rebuild Souq platform modules.

## Status

| ID | Slice | Status |
|----|--------|--------|
| AS-01 | White / light / silver storefront theme | DONE |
| AS-02 | Automotive services catalog + appointment booking (API + storefront + admin) | DONE |
| AS-02b | Lean home: 2 product types + booking + brands + reviews only (no blog/FAQ dump) | DONE |
| AS-03 | Car vertical Excel/CSV import template (BulkProductUpload cars) | DONE (basic CSV; full xlsx modes still PENDING in AS-07) |
| AS-04 | Harden variations + custom fields on bleco products (reuse existing modules) | PENDING |
| AS-05 | Vehicle DB admin (brands/models/years) persisted per store_id | PENDING |
| AS-06 | Interactive customizer → cart/order snapshot audit | PENDING |
| AS-07 | Full Excel import modes (create/update/create+update) + validation report | PENDING |
| AS-08 | Page builder / theme customize bleco smoke | PENDING |
| AS-09 | Blog SEO (3 articles already in blecoStoreData) + live API wire | PENDING |
| AS-10 | E2E acceptance + trio + deploy (only when user asks) | PENDING |

## Reuse (do not duplicate)

- Products / variations / custom fields → `StoreProductEditorView`, `ProductController`, `ProductVariationController`
- Bulk CSV → `BulkProductUploadModal` (extend car vertical)
- Page builder → `VisualThemeBuilder` / `WordPressThemeCustomizer`
- Vehicle picker data → `blecoStoreData` `CAR_BRANDS` / `CAR_MODELS_MAP` (later persist)
- Blog UI → `AutomotiveBlogSection` + existing `BlogController`

## Isolation

Every row: `store_id` only. Never borrow flowers/coffee data for bleco.
