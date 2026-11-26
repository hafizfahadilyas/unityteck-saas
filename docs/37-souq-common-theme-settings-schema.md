# 37 — Souq Common Theme Settings Schema (ALL common themes)

**Source doc:** `D:\sueman\ثيمات المتجر.docx`  
**Text:** `docs/_incoming/store-themes-doc.txt`  
**UI/UX images:** `designs/Common_Theme_Settings_UIUX/` (40 numbered refs) + full `docs/_incoming/store-themes-media/` (111)  
**Parent:** `docs/36-souq-common-theme-subscription-marketplace.md`  
**Rule:** `.cursor/rules/souq-common-theme-subscription-lock.mdc`

One **shared** settings tree for every `theme-souq-common-*`. Theme packs only change default colors / section order / presets — **not** a second panel model.

## Customize Themes · Page Builder (same for all common themes)

| Merchant action | UI | Persist |
|-----------------|-----|---------|
| **Customize Themes** | `WordPressThemeCustomizer` — panels from `DEFAULT_PAGE_SECTIONS` / flowers-style chrome for souq-common | `PUT /theme-settings` → `store_themes.settings` |
| **Page Builder** | `VisualThemeBuilder` — sections order/enable | `builder.draft_blocks` → publish |
| **Theme switch** | Themes gallery (entitlement) | `theme_id` only — products/orders **kept**; settings archived in `by_theme` |

Family resolve: `theme-souq-common-*` → customizer family **`default`** (not coffee/flora lock).

Replace Salla attribution with **منصة سوق / Souq Platform** in implementation (`general.platformAttribution` → Souq, never “Made With Salla” on live).

---

## Panel map → `store_themes.settings` keys

| # | Doc section | Settings root key | Notes |
|---|-------------|-------------------|--------|
| 1 | General Settings | `general` | arabicNumerals, contentProtection, platformAttribution, breadcrumbs, autoAnimation, notifyMeOnCard |
| 2 | Product Card | `productCard` | equalHeights, imageHeightUnits, productsPerRow, border, imageFit, hoverZoom |
| 3 | Header | `header` | logo, nav, moreCategories, topBar, colors, cartIcon |
| 4 | Footer | `footer` | logo, bottomMenu, colors, alignment, linksLayout, social, contact, verification |
| 5 | Product Page Display | `productPage` | tags, shortDesc, fullDesc + position |
| 6 | WhatsApp Button | `whatsapp` | enabled, number, message, positionRight |
| 7 | Store Background | `background` | imageEnabled, imageUrl |
| 8 | Typography & Brand | `branding` | font, primaryColor |
| 9 | Colors & Dark Mode | `colors` | light + dark tokens (bg, text, header, footer, card, promo) |
| 10 | Header & Slider Integration | `chrome` | mergeHeaderHero, darkTransparentOverlay |
| 11–13 | Advanced / homepage modules | `modules` + builder blocks | Hero slider, categories, products grids — Page Builder owns layout |

Bilingual merchant fields: `*_en` / `*_ar` (or `label` / `labelAr`). Chrome labels via `isAr` / `t()` only.

---

## Default palette (from doc light mode)

```json
{
  "colors": {
    "light": {
      "background": "#ffffff",
      "backgroundSecondary": "#ffffff",
      "text": "#111827",
      "textSecondary": "#4b5563",
      "headerBg": "#ffffff",
      "headerText": "#272a32",
      "productCardBg": "#ffffff",
      "promoLabelBg": "#ef4444",
      "footerBg": "#f3f4f6",
      "footerText": "#374151"
    },
    "dark": {
      "background": "#1d1f1f",
      "backgroundSecondary": "#0e0f0f",
      "text": "#ffffff",
      "textSecondary": "#cccccc",
      "headerBg": "#0e0f0f",
      "headerText": "#ffffff"
    }
  },
  "branding": { "primaryColor": "#0f766e" },
  "productCard": { "productsPerRow": 4, "imageHeightUnits": 17 },
  "general": { "platformAttribution": false, "breadcrumbs": true }
}
```

---

## Common theme IDs (catalog)

| theme_id | Included tiers | price_sar (else) |
|----------|----------------|------------------|
| `theme-souq-common-retail` | starter, pro, premium, custom | 0 |
| `theme-souq-common-catalog` | pro, premium, custom | 0 (starter: buy 79) |
| `theme-souq-common-services` | pro, premium, custom | 0 (starter: buy 79) |
| `theme-souq-common-boutique` | premium, custom | 149 |

Flagship IDs (`theme-flora-luxe`, coffee, transport) stay **excluded** from common included_in unless Master grant.

---

## Apply path

Customize Themes / Page Builder → `PUT theme-settings` / builder → **publish** → storefront cache bust per `store_id`.  
Theme buy/switch: catalog + orders **unchanged**; only `theme_id` + layout/settings swap (`by_theme` archive already in controller).
