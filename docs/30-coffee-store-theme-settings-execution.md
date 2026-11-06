# Coffee Store Theme Settings — Execution Tracker (LOCKED)

**Source Word:** `D:\sueman\ثيم متجر القهوة.docx`  
**Copied:** `docs/coffee-store-theme-source.docx` · `designs/Coffee_Theme_Settings_UIUX/00_source/`  
**Refs (27 images):** `designs/Coffee_Theme_Settings_UIUX/refs/`  
**Scope:** **store-coffee / HiBrew KSA ONLY** — never leak flowers/cars content  
**Tenant:** `store_id` isolation · real API + MySQL `store_themes.settings` JSON  
**Forbidden:** dummy arrays · fake Unsplash filler · hardcoded cross-store text/images  
**i18n:** every merchant-facing string = **EN + AR** · RTL/LTR · Dark/Light Holst

---

## Golden rules (every step)

| Rule | Meaning |
|------|---------|
| Coffee-only | Defaults, copy, images from **this** Word doc / coffee assets |
| Real persist | `PUT /stores/{storeId}/theme-settings` → `store_themes.settings` |
| Zero mock | Empty → genuine empty state; no fake products/announcements as “live” data |
| Preview ≠ Publish | Editor draft preview; storefront after save/publish |
| One slice | C-ANN … C-REV **LIVE** · coffee Save → `PUT theme-settings` API · storefront isolated · Fahad review gate open. |
| Modular | Hero banners, featured section banners, and the banner section stay on separate keys. |

---

## Step map (Word order)

| Step | ID | Component (Word) | Persist key under `settings` | Status |
|------|-----|------------------|------------------------------|--------|
| 01 | `C-ANN` | Promotional Announcements | `announcementBar` | **LIVE** storefront rotate/stacked/single + form |
| 02 | `C-FCP` | Featured Categories & Products | `featuredCategoriesProducts` | **LIVE** home rail tabs/title from FCP (fallback C-FP / catalog) |
| 03 | `C-HERO` | Hero Banners | `heroBanners` (legacy `slider` kept in sync) | **LIVE** HeroSlider3D reads `heroBanners` first |
| 04 | `C-FSB` | Featured Section Banners | `featuredSectionBanners` | **LIVE** Flagship reads FSB (not C-BAN) + productId/align/overlay editors |
| 05 | `C-FP` | Featured Products Section | `featuredProducts` | **LIVE** home rail flags + tab enable + builder showPrice |
| 06 | `C-IMG` | Image Banner Section | `imageBanners` | **LIVE** via CoffeeHomeModules |
| 07 | `C-FOOT` | Footer Section | `footer` + `general.footerLayout` | **LIVE** columns / about / copyright / social from settings |
| 08 | `C-ICON` | Feature Icons Section | `enhancedFeatures` | **LIVE** CoffeeFeatureIconsBar |
| 09 | `C-BEN` | Exclusive Benefits Section | `exclusiveBenefits` | **LIVE** ExclusivePerksBar from settings |
| 10 | `C-PC` | Product Carousel Section | `productCarousel` | **LIVE** via CoffeeHomeModules |
| 11 | `C-BAN` | Banner Section | `banners` | **LIVE** via CoffeeHomeModules |
| 12 | `C-PCB` | Product Carousel + Banner | `productCarouselBanner` | **LIVE** via CoffeeHomeModules |
| 13 | `C-EDIT` | Edit Product (admin ↔ theme CTAs) | products API (`PATCH /products/{id}`) | **LIVE** products API edit form |
| 14 | `C-NEWS` | Newsletter & Discount Coupon Sign-up | `newsletter` | **LIVE** Footer newsletter from settings |
| 15 | `C-CPB` | Custom Product Builder | `customOrder` | **LIVE** CustomOrderPage title/WA/fields from settings |
| 16 | `C-REV` | Reviews management | reviews API (`GET/POST/PUT /stores/{id}/reviews`) | **LIVE** ReviewsPage fetch/submit · empty when none |

---

## Step 01 — Promotional Announcements (acceptance)

From Word: independent announcements · unique IDs · Active toggle · text **EN+AR** · per-item text/bg HEX · add/delete/reorder · display modes:

1. Automatically rotate between active  
2. Display all stacked  
3. Display only one by order (+ prev/next)

Also: live preview · save → API · storefront respects mode · hide if none eligible · responsive · no empty text on storefront.

**Coffee seed (only if DB empty — real store copy, not flowers):**

| Field | EN | AR | Colors |
|-------|----|----|--------|
| Msg 1 | Express delivery across KSA \| 2-Year Official Saudi Warranty | شحن سريع لجميع مدن المملكة \| ضمان سنتين معتمد | text `#FFFFFF` bg `#173B35` |
| Msg 2 | Free shipping on orders over SAR 200 | شحن مجاني للطلبات فوق 200 ريال | text `#FFFFFF` bg `#8B1E3F` |

---

## Admin / storefront URLs

- Themes: http://localhost:3010/admin?store=coffee&tab=themes  
- Storefront: http://localhost:3010/?store=coffee  
- API: http://127.0.0.1:8010 · `GET/PUT /api/stores/store-coffee/theme-settings`

---

## Review gate (collective — Fahad)

All Word steps C-ANN through C-REV are implemented. Review them together:

```
Coffee theme settings — ready for collective review:
http://localhost:3010/admin?store=coffee&tab=themes
http://localhost:3010/?store=coffee
API: http://127.0.0.1:8010/api/stores/store-coffee/theme-settings
Reviews API: http://127.0.0.1:8010/api/stores/store-coffee/reviews
Flowers (must stay unchanged): http://localhost:3010/?store=flowers
Cars (must stay unchanged): http://localhost:3010/?store=bleco
Checked: dark/light · EN/AR · API persist · coffee-isolated · no dummy · preview ≠ publish.
```

Admin hub lists the sections in Word order. Save on a section writes `PUT /stores/{storeId}/theme-settings` (or the products / reviews API for C-EDIT and C-REV). The in-editor preview is a draft until that save. Empty lists stay empty on the storefront; HiBrew copy is seeded only when a coffee section has no saved content. Hero images use `/hero_coffee_banner_white_*.jpg` only.
