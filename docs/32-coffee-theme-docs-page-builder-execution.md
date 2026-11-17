# 32 — Coffee Theme Docs → Customizer + Page Builder (Execution)

**Status:** CLOSED · 2026-11-17  
**Next step:** — (CT-01–CT-08 complete)  
**Source docs (Downloads):** `ثيم متجر القهوة (3).docx` → extracted `docs/_incoming/coffee-theme-doc-1.txt`  
**Prior program:** `docs/31-page-builder-theme-customizer-execution.md` = CLOSED (PB-01–PB-88)  
**Rules:** coffee UI lock · zero-mock · `store_id` isolation · no language mix · page-builder-theme-customizer

---

## 0. AI protocol

1. Read this file. Do **only** the row marked `NEXT`.
2. Inspect → reuse `VisualThemeBuilder`, `WordPressThemeCustomizer`, `CoffeeBuilderBlocks`, coffee storefront components. Do **not** rebuild the editor or HiBrew skin.
3. Test that step. Global gate from docs/31 §2 still applies.
4. Mark row `DONE`, set next `PENDING` → `NEXT`. Stop. Report **Ho gaya** / **Baqi**.

**User lock (this wave):** Top bar (announcement) + Navbar/Header + Footer are **fixed chrome** — editable settings OK, **move / drag / reorder / delete / duplicate = banned**. All other homepage widgets stay movable.

**Language:** AR chrome = Arabic only. EN chrome = English only. Merchant fields stay `*_en` / `*_ar`.

---

## 1. Homepage elements from merchant doc (20)

| # | Element | Doc ID / type | Builder move? |
|---|---------|---------------|---------------|
| 1 | Promotional Announcements | `announcement` / top bar | **FIXED** |
| 2 | Main Menu | `header` / `navbar` / `main-menu` | **FIXED** |
| 3 | Hero Banners | `hero_banners` | movable |
| 4 | Featured Section Banners | `featured_section_banners` | movable |
| 5 | Featured Products | `featured_products` | movable |
| 6 | Image Banner Section | `image_banners` | movable |
| 7 | Footer Section | `footer` | **FIXED** |
| 8 | Feature Icons | `store_features_bar` / `features` | movable |
| 9 | Product Carousel | `product_carousel` | movable |
| 10 | Category Showcase | `featured_categories_products` | movable |
| 11 | Benefits | `exclusive_benefits` | movable |
| 12 | Events & Masterclasses | events section | movable |
| 13 | Features | features cards | movable |
| 14 | Model Comparison | comparison | movable |
| 15 | Customer Reviews | `reviews` | movable |
| 16 | FAQ | FAQ accordion | movable |
| 17 | Commercial Hero | commercial hero | movable |
| 18 | Product Slider | product slider | movable |
| 19 | Product Catalog | catalog controls | movable / page-bound |
| 20 | Product Collection | collection | movable |

---

## 2. Steps

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| CT-01 | DONE | Lock top bar + navbar/header + footer: no drag, move up/down, delete, or duplicate in layers + canvas. Inserts clamp between chrome. Helpers in `builderInteractions.ts` | Chrome stays pinned; body widgets still reorder | Unit: `applyChromeSafeDrop` rejects chrome; body drop accepted; insert clamp |
| CT-02 | DONE | Audit builder + customizer chrome labels for AR/EN mix on coffee theme panels (no Latin in AR strings) | Spot-check Top Bar / Menu / Footer inspectors | `coffeeChromeLanguage.test.ts` + scanner |
| CT-03 | DONE | Wire Promotional Announcements controls 1:1 from doc (action button, display width, height, colors) — settings only, chrome still fixed; storefront strip respects CTA; no invented empty text | Save draft per `store_id`; public after publish | Isolation + bilingual CTA helper |
| CT-04 | DONE | Main Menu panel: enable + compare + view-more EN/AR fields; storefront respects flags; chrome still fixed; AR mix cleaned on hub | Menu settings persist for that store via theme-settings | Inspector + Header wire |
| CT-05 | DONE | Footer panel per doc: appearance (colors/width/cols), contact+WhatsApp+tax/CR, social URLs only (no fake networks), column enable + device, bottom bar; storefront respects `enabled=false` | Footer save per `store_id` via theme-settings | `coffeeFooterControls.test.ts` |
| CT-06 | DONE | Movable widgets 3–6, 8–20 mapped in `CoffeeBuilderBlocks` + coffee widget library extras; events/FAQ empty states; comparison from live catalog only; chrome still fixed | No fake products; HiBrew look locked | `coffeeMovableWidgets.test.ts` |
| CT-07 | DONE | Isolation matrix coffee vs second store for chrome + widgets; fetchThemeSettingsApi store mismatch harden; `coffeeStoreIsolation` + `ThemeChromeIsolationTest` | Store A ≠ Store B | Client unit + PHP Feature (19 assertions) |
| CT-08 | DONE | Language pass + scanner harden + AR mix fixes (FeatureIcons, widget titles, chrome labels) + `npm run build` | No mixed chrome; build OK | `scan-ar-en-mix` = 0 + build exit 0 |

---

## 3. Out of scope

Popup builder, animations library, theme import from another store, restyling HiBrew Home/Header/Hero/Footer chrome, C-BAN banners return.
