# 34 — Coffee · 20 Homepage Elements · Widget Parity (Ref UI)

**Status:** CLOSED · CW-01–CW-16 **DONE**  
**Scope:** `store-coffee` / HiBrew storefront + Theme Customizer + Page Builder only  
**Rules:** zero-mock · `store_id` isolation · AR/EN no mix · HiBrew look **locked** · coffee UI lock  
**Prior:** `docs/33` DF CLOSED · `docs/32` CT CLOSED

---

## 0. Locked layout rule (user order)

| Zone | Elements | Page builder |
|------|-----------|--------------|
| **Fixed chrome** | (1) Promotional Announcements → `announcement_bar` · (2) Main Menu → inside `header` / `00_header_builder` · (7) Footer → `footer` | **Move NA** — sirf customize / save |
| **Movable widgets** | Doc items **3–6, 8–20** (body sections) | Drag reorder OK (`coffeeMovableWidgets.test.ts`) |

**Note:** Announcement + Main Menu + Footer **widgets list me duplicate blocks ke طور پر nahi** — wahi chrome panels se edit.

Reference screenshots: `docs/reference/coffee-widget-ui/` (merchant spec UI — implementation target).

---

## 1. AI protocol

1. Wave complete (CW-01–CW-16). Further polish = new ticket, not CW-NEXT.  
2. Match ref image layout (sidebar + live preview + edit modals) — Holst tokens admin chrome, HiBrew storefront preview.  
3. All fields → API / `themeSettingsStore` / builder `settings` per `store_id`. Empty → empty state, never decorate.  
4. Test step gate; mark DONE; no deploy without user ask.  
5. **Ho gaya** / **Baqi** (Roman Urdu).

---

## 2. Master parity matrix

Legend: **SF** storefront block · **CUS** Theme Customizer form · **BLD** builder inspector · **REF** ref PNG · **UI** admin matches ref screenshot · **DATA** wired + isolated

| # | Element | Doc element ID | REF file | BLD type | CUS id / form | SF | UI | DATA | Gap vs full spec |
|---|---------|----------------|----------|----------|---------------|----|----|------|------------------|
| 1 | Promotional Announcements | — | `01-promotional-announcements.png` | `announcement_bar` (fixed) | `C-ANN` · `CoffeeAnnouncementsForm` | Header strip | **OK** | OK | CW-15: tabs + width/height + device visibility + Holst |
| 2 | Main Menu | `main-menu` | `02-main-menu.png` | — (in `header`) | `00_header_builder` · `HeaderElementsForm` | Header | **OK** | OK | CW-15: mega source/sort/max + tablet links + device columns |
| 3 | Hero Banners | `hero-banners-dual` | `03-hero-banners.png` | `hero_banners` | `C-HERO` · `HeroBannersForm` | HeroSlider3D | **OK** | OK | CW-14: tabs + tablet/mobile images + WhatsApp + Holst CTAs |
| 4 | Featured Section Banners | `featured-banners-dual` | `04-featured-section-banners.png` | `featured_section_banners` | `C-FSB` · `FeaturedSectionBannersForm` | Yes | **OK** | OK | CW-14: per-device heights + overlay opacity |
| 5 | Featured Products | `featured-products-dual` | `05-featured-products.png` | `featured_products` | `C-FP` · `FeaturedProductsForm` | Yes | **OK** | OK | CW-14: sort + buy-now toggle + tabs CRUD |
| 6 | Image Banner Section | `image-banner-dual` | `06-image-banner.png` | `image_banners` | `C-IMG` · `ImageBannersForm` | Yes | **OK** | OK | CW-14: 5 layouts + columns + tile overlay |
| 7 | Footer | — | `07-footer.png` | `footer` (fixed) | `C-FOOT` · `CoffeeFooterForm` | Footer | **OK** | OK | CW-14: content tab chrome + social/bottom controls |
| 8 | Feature Icons | `feature-icons-dual` | `08-feature-icons.png` | `store_features_bar` | `C-ICON` · `CoffeeFeatureIconsForm` | Yes | **OK** | OK | CW-01: Content/Templates/Style/Layout/Code/AI tabs, item edit modal, per-device rows, Holst tokens |
| 9 | Product Carousel | `product-carousel-dual` | `09-product-carousel.png` | `product_carousel` | `C-PC` · `ProductCarouselForm` | Yes | **OK** | OK | CW-02: tabs + layout/nav + catalog picker + edit product modal (prices, 3 CTAs); empty → catalog fallback |
| 10 | Category Showcase | `category-showcase-dual` | `10-category-showcase.png` | `featured_categories_products` | `C-FCP` · `FeaturedCategoriesProductsForm` | Yes | **OK** | OK | CW-03: banners top + catalog products + layout/carousel tabs |
| 11 | Benefits | `benefits-1` | `11-benefits-*.png` | `exclusive_benefits` | `C-BEN` · `ExclusiveBenefitsForm` | Yes | **OK** | OK | CW-04: Edit Benefit modal, dual buttons, unavailable faded cards |
| 12 | Events & Masterclasses | `events-masterclasses-dual` | `12-events-masterclasses.png` | `events_masterclasses` | `C-EVT` · `CoffeeEventsForm` | Yes | **OK** | OK | CW-05: `eventsMasterclasses` slice + form + SF/builder; empty → hide |
| 13 | Features Section | `features-1` | `13-features-section.png` | `features` / `featuresSection` | `C-FEAT` · `CoffeeFeaturesSectionForm` | Yes | **OK** | OK | CW-06: badge + cards; ≠ `C-ICON` / `enhancedFeatures`; empty → hide |
| 14 | Model Comparison | `comparison-1` | `14-model-comparison.png` | `model_comparison` / `modelComparison` | `C-CMP` · `CoffeeModelComparisonForm` | Yes | **OK** | OK | CW-07: models + spec rows + select-one + empty hide |
| 15 | Customer Reviews | `reviews-1` | `15-*.png`, `16b-reviews-admin.png` | `reviews` / `customerReviews` | `C-REV` · `CoffeeCustomerReviewsForm` | Yes | **OK** | OK | CW-08: chrome + form limits + API rows/moderation; empty → real empty |
| 16 | FAQ | `faq-1` | `16-faq.png` | `faq` | `C-FAQ` · `CoffeeFaqForm` | Yes | **OK** | OK | CW-09: bilingual Q/A accordion; empty → hide; form + SF/builder |
| 17 | Commercial Hero | `hero-1` | `17-commercial-hero.png` | `commercial_hero` | `C-COMM` · `CoffeeCommercialHeroForm` | Yes | **OK** | OK | CW-10: slides + CTAs + feature chips; ≠ FSB/`heroBanners`; empty → hide |
| 17b | Hero Banner (extended) | `hero-banner` | `17b-hero-banner-extended.png` | overlaps `hero_banners` | `C-HERO` tabs | — | **OK** | OK | CW-14 shared device/WhatsApp tabs on `C-HERO` |
| 18 | Product Slider | `product-slider-1` | `18-product-slider.png` | `product_slider` | `C-PSL` · `CoffeeProductSliderForm` | Yes | **OK** | OK | CW-11: source types + card CTAs; ≠ `productCarousel`; empty → hide |
| 19 | Product Catalog | `catalog-1` | `19-product-catalog.png` | `product_catalog` | `C-SHOP` · `CoffeeProductCatalogForm` | Yes | **OK** | OK | CW-12: filters/sort/card toggles + ProductsListPage + builder; ≠ slider/carousel |
| 20 | Product Collection | `collection-1` | `20-product-collection.png` | `product_collection` / `productCollection` | `C-COLL` · `CoffeeProductCollectionForm` | Yes | **OK** | OK | CW-13: promo + products + benefits; ≠ slider/PCB; empty → hide |

**Summary (this audit):** Customizer Word panels with **ref-level UI** ≈ **8–11 partial**, **9+ missing or stub**. Builder **block types** for 3–6, 8–11, 14–20 mostly exist; **inspector UI** mostly not ref parity. **Done in docs/33:** zero-mock, chrome fixed/movable tests, announcements/menu/footer baseline.

---

## 3. Execution steps (CW wave)

| ID | Status | Work | Done when |
|----|--------|------|-----------|
| CW-00 | DONE | Ref PNGs in repo + this matrix | 23 files under `docs/reference/coffee-widget-ui/` |
| CW-01 | **DONE** | #8 Feature Icons — ref sidebar (Content/Style/Layout), item modal, 3 previews | UI matches `08-feature-icons.png` + `coffeeFeatureIconsControls.test.ts` |
| CW-02 | **DONE** | #9 Product Carousel — full edit product + layout panels | `09-product-carousel.png` + `coffeeProductCarouselControls.test.ts` |
| CW-03 | **DONE** | #10 Category Showcase — banners top + products + carousel opts | `10-category-showcase.png` + `coffeeCategoryShowcaseControls.test.ts` |
| CW-04 | **DONE** | #11 Benefits — Edit Benefit modal + disabled card state | `11-benefits-*.png` + `coffeeBenefitsControls.test.ts` |
| CW-05 | **DONE** | #12 Events — `eventsMasterclasses` settings + `C-EVT` form + SF block data | `12-events-masterclasses.png` + `coffeeEventsControls.test.ts` |
| CW-06 | **DONE** | #13 Features Section — `featuresSection` ≠ `enhancedFeatures` + `C-FEAT` form + SF/builder | `13-features-section.png` + `coffeeFeaturesSectionControls.test.ts` |
| CW-07 | **DONE** | #14 Model Comparison — `modelComparison` + `C-CMP` form + SF/builder | `14-model-comparison.png` + `coffeeModelComparisonControls.test.ts` |
| CW-08 | **DONE** | #15 Reviews — `customerReviews` + `C-REV` form + SF/builder + moderation | `15-*.png` + `coffeeCustomerReviewsControls.test.ts` |
| CW-09 | **DONE** | #16 FAQ — `faq` + `C-FAQ` form + SF/builder bilingual Q/A | `16-faq.png` + `coffeeFaqControls.test.ts` |
| CW-10 | **DONE** | #17 Commercial Hero — `commercialHero` + `C-COMM` form + SF/builder; 17b left on `C-HERO` | `17-*.png` + `coffeeCommercialHeroControls.test.ts` |
| CW-11 | **DONE** | #18 Product Slider — `productSlider` + `C-PSL` form + SF/builder source types | `18-product-slider.png` + `coffeeProductSliderControls.test.ts` |
| CW-12 | **DONE** | #19 Product Catalog — full catalog inspector | `19-product-catalog.png` + `coffeeProductCatalogControls.test.ts` |
| CW-13 | **DONE** | #20 Product Collection — `productCollection` + `C-COLL` form + SF/builder | `20-product-collection.png` + `coffeeProductCollectionControls.test.ts` |
| CW-14 | **DONE** | #3–7 + 17b polish — hero/FSB/FP/image/footer tabs + missing controls | `03`–`07`, `17b` + `coffeeCoreSectionsPolish.test.ts` |
| CW-15 | **DONE** | #1–2 chrome polish (announce + menu) — fixed, not widgets | `01`, `02` + `coffeeChromePolish.test.ts` |
| CW-16 | **DONE** | Full gate: parity + movable + zero-mock + `npm run build` | exit 0 · catalog `??`/`||` paren fix |

---

## 4. Implementation notes

- **Coffee-only:** Other store themes use generic builders; these 20 elements + refs apply **only** to coffee HiBrew pack.  
- **Reuse:** Extend `CoffeeWordSettingsShell`, `CoffeeBuilderBlocks` inspectors — no second storefront.  
- **#8 vs #13:** `enhancedFeatures` / `store_features_bar` = trust icons row (#8). `features` block = product spec cards with badge (#13) — **do not merge**.  
- **Hero:** `hero_banners` (carousel slides) vs `commercial_hero` (single flagship SKU row) vs extended `hero-banner` tabbed editor — map settings keys explicitly in CW-10/CW-14.  
- **Category showcase (#10):** Builder type `featured_categories_products` = doc “Category Showcase”.  
- **Product carousel + banner:** `C-PCB` / `product_carousel_banner` = extra coffee section (not in merchant list of 20 but keep).

---

## 5. Reference image index

| File | Doc item |
|------|----------|
| `01-promotional-announcements.png` | 1 |
| `02-main-menu.png` | 2 |
| `03-hero-banners.png` | 3 |
| `04-featured-section-banners.png` | 4 |
| `05-featured-products.png` | 5 |
| `06-image-banner.png` | 6 |
| `07-footer.png` | 7 |
| `08-feature-icons.png` | 8 |
| `09-product-carousel.png` | 9 |
| `10-category-showcase.png` | 10 |
| `11-benefits-editor.png` | 11 (admin) |
| `11-benefits-storefront.png` | 11 (storefront) |
| `12-events-masterclasses.png` | 12 |
| `13-features-section.png` | 13 |
| `14-model-comparison.png` | 14 |
| `15-customer-reviews.png` | 15 |
| `16-faq.png` | 16 |
| `16b-reviews-admin.png` | 15 (admin alt) |
| `17-commercial-hero.png` | 17 |
| `17b-hero-banner-extended.png` | 17b |
| `18-product-slider.png` | 18 |
| `19-product-catalog.png` | 19 |
| `20-product-collection.png` | 20 |

---

## 6. Cross-check: what was already done (not re-litigate)

From `docs/33` / CT wave: fake home data removed; announcement enable/height/dismiss; header menu toggles; footer empty legal links; events/compare/FAQ empty paths; builder movable vs fixed chrome tests.

**Not done:** Merchant **full control surfaces** (screenshots) for most rows — user-reported “sirf 2–3 detail” = accurate for **ref UI parity**, not for basic save fields..ve fields..