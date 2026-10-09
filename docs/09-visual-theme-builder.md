# Advanced Visual Theme Builder — MASTER PROMPT LOCK

**Date:** 2026-09-29  
**Status:** LOCKED requirements · **NOT implemented yet**  
**Rule:** **DO NOT REBUILD** — Inspect → Understand → Reuse → Extend → Optimize → Secure → Test  
**Related:** `docs/00` · `docs/01` Phase 5 · `docs/08` · `designs/Theme_Settings_UIUX/` · `.cursor/rules/*`

**Inspiration:** Elementor / Elementor Pro *concept* (panels, widgets, live canvas).  
**Forbidden:** Elementor proprietary code/assets copy · invent parallel storefront · load editor JS on public site.

---

## 0. Inspect findings (current codebase — 2026-09-29)

| Area | Reality |
|------|---------|
| Store Themes UI | `src/components/store/StoreThemes.tsx` — theme **picker** + homepage style, **not** full visual editor |
| Master Themes | `src/components/master/MasterThemes.tsx` — catalog control |
| Storefront | `src/components/storefront/StoreFrontPreview.tsx` — in-SPA preview |
| Design SoT forms | `designs/Theme_Settings_UIUX/` pages **01–18** (identity, colors, slider, cards, banners…) |
| DB today | `themes_catalog` · `store_themes` (`settings` JSON) · `store_settings` — **no** pages/sections/widgets/revisions tables yet |
| i18n / dark | `src/i18n/PrefsContext.tsx` + Holst tokens — admin locale/theme; storefront EN/AR builder not full |

**Preserve:** Master Admin · Store Dashboard · Products · Categories · Orders · Customers · Settings · existing Theme Settings flow · Storefront preview.

**Extend path:** Appearance / Theme → **Edit Theme** opens full-screen editor route (code-split). Reuse storefront components as **widgets**. Form-based Theme Settings 01–18 remain valid (Global Styles / options); Visual Builder = advanced canvas layer on same presentation data.

---

## 1. Product goal

Store Dashboard: **Appearance / Theme → Edit Theme** → separate **full-screen visual editor**.

User edits website **visually** (no coding). Changes:

| Action | Effect |
|--------|--------|
| **Save Draft** | DB draft only — **not** public |
| **Publish** | Published version → Public Storefront + cache invalidate |
| Theme switch | Presentation only — **never** delete products/orders/customers/SEO |

Editor heavy code = **lazy + code-split**. Public storefront loads **renderer only**.

---

## 2. Editor chrome (3-panel + toolbar)

| Zone | Content |
|------|---------|
| **LEFT** | Elements / Widgets / Sections |
| **CENTER** | Live canvas / preview |
| **RIGHT** | Selected element settings |
| **TOP** | Save · Publish · Preview · Undo · Redo · Desktop/Tablet/Mobile · History · Revision · Exit |

Click any element (logo, heading, product card, header, footer…) → highlight + right panel + **live** update (no full page freeze).

---

## 3. Structure & interactions

- Tree: **Section → Row → Column → Widget**
- Drag · Drop · Move · Duplicate · Delete · Hide/Show · Copy · Paste · Reorder
- Undo/Redo = **local editor state**; controlled Save (no DB spam per pixel drag)
- Copy/Paste + **My Templates** (Hero, Product section, CTA, Footer, Promo…)

---

## 4. Widget registry (modular · reuse existing components)

Register existing React/storefront pieces as widgets — **no duplicate system**.

| Group | Widgets (summary) |
|-------|-------------------|
| **Basic** | Heading, Text, Rich Text, Image, Video, Icon, Divider, Spacer, Button, Link, HTML, Container, Section, Columns |
| **Store** | Product, Grid, Card, Slider, Featured/Related, Category(+grid/slider), Search, Cart, ATC, Buy Now, Wishlist, Qty, Price/Sale, Rating, Gallery, Variations, Stock |
| **Marketing** | Hero, Banner, Slider, Video Slider, Offers, Countdown, Coupon, Testimonials, Reviews, Newsletter, CTA, Social |
| **Content** | About, FAQ, Blog, Contact, Map, Gallery, Logo |
| **Nav** | Header, Menu, Mobile Menu, Breadcrumb, Footer |

### Specialized builders (same editor, scoped templates)

| Builder | Scope |
|---------|--------|
| **Product Card** | Image, title, price/sale, badge, rating, SKU, stock, category, ATC, Buy Now, Wishlist, Quick View + style controls |
| **Product Page** | Gallery, title, desc, price, variations, qty, ATC, Buy Now, WhatsApp, delivery, related, FBT — move/hide/reorder |
| **Category** | Image, name, count, button, shape, hover, grid/slider, type/colors |
| **Header** | Logo, nav, search, cart, wishlist, account, WA, social, announcement, CTA · presets · **Desktop ≠ Mobile** independent |
| **Footer** | Logo, desc, nav, cats, contact, social, newsletter, payments, copyright, columns |
| **Slider / Hero** | Multi-slide · image/video · text/buttons · overlay · autoplay · arrows/dots · desktop/mobile images |

---

## 5. Style · responsive · visibility · i18n

- **Advanced style:** layout, spacing, background, border, shadow, typography, effects/hover/animation
- **Responsive:** Desktop / Tablet / Mobile independent (font, size, margin, columns, visibility, order) — **does not** mutate product DB rows
- **Visibility:** Show Desktop / Tablet / Mobile (e.g. separate headers, same store data)
- **Rich text:** family, size, weight, line-height, spacing, align, color, transform, decoration
- **Language selector in editor:** English | العربية — **separate DB values** per field; never overwrite the other locale
- **RTL/LTR** auto from language; Arabic fonts + direction
- **Buttons:** EN/AR text, links (page/product/category/external/WhatsApp), icon, states, hover

---

## 6. Dynamic data · conditions · globals

- Widgets bind to DB: latest / featured / sale / category / best sellers / related — price/stock/image live from source of truth
- **Display conditions** (plan-gated): page, product, category, logged-in/guest, device, in-stock, sale, date/campaign, store plan
- **Global styles:** colors, typography, radius, shadows, buttons — change cascades; widget override OK
- **Global Header/Footer** with **Global | Custom** per page

---

## 7. Templates · draft/publish · revisions

- Presets: Default, Basic, Modern, Luxury, Minimal, Eid, Valentine, Wedding, Sale, Seasonal (+ future custom)
- Versions: Current · Draft · Published · `updated_at` · `updated_by`
- **Revision history** + Restore (theme layer only)
- Preview modes: Desktop / Tablet / Mobile ≈ public render

---

## 8. Custom CSS / JS (secure · plan-gated)

| | CSS | JS |
|---|-----|-----|
| Scopes | Store-wide · page · widget · responsive · hover | Store-wide · page · handlers |
| Guard | Sanitize/validate; **no cross-store** | Server validation · permission · plan · safe exec architecture |
| Master | Can disable CSS/JS features | Can force-disable Custom JS |
| Free | Only if plan flags allow | Off unless plan/Master grant |

---

## 9. Master Admin · plans

DB-driven flags (not hard-coded lists). Examples:

| Tier (example) | Features |
|----------------|----------|
| Free | Basic theme editing |
| Paid | More widgets/layouts/styling |
| Pro | Custom CSS/JS · conditions · global styles · dynamic widgets · templates · animations · revisions |
| Custom | Master enable/disable per store |

Master controls: Theme Builder on/off · Custom CSS/JS · Advanced widgets · Conditions · Templates · Animations · Revisions · **store-wise override**.

---

## 10. Security (non-negotiable)

Prevent: cross-store CSS/JS · unauthorized theme/template/code · XSS · stored malicious scripts · unauthorized DB writes.  
Every query: **`store_id`**. Custom code runs **only** in that store’s storefront scope.

---

## 11. Target schema (extend — do not replace commerce tables)

Presentation layer only (all with `store_id` where tenant-owned):

| Table | Role |
|-------|------|
| `themes` / `themes_catalog` | Catalog presets (exists — extend) |
| `store_themes` | Active theme + settings (exists — extend draft/publish) |
| `theme_pages` | Home, product, category, cart, checkout, thank-you… |
| `theme_sections` | Section tree nodes |
| `theme_widgets` | Widget instances + props + i18n JSON |
| `theme_settings` | Page/options bridge to Theme Settings 01–18 |
| `theme_global_styles` | Global design tokens |
| `theme_revisions` | Version snapshots |
| `theme_custom_css` | Scoped CSS |
| `theme_custom_js` | Scoped JS (plan-gated) |

Theme change **must not** wipe SEO / products / orders / customers.

---

## 12. Performance · SEO · cache

- Editor ≠ public bundle (code-split / lazy)
- Publish → invalidate theme/header/footer/product-card tags (`updated_at` / ISR) — **zero stale**
- SEO fields stay intact: meta, canonical, schema, sitemap, robots, hreflang, product/category SEO

---

## 13. Implementation slices (Phase 5.V — one at a time)

Do **not** ship entire builder in one prompt.

| Slice | Deliverable |
|-------|-------------|
| **5.V0** | Inspect lock (this doc) + schema migration draft + editor shell route (empty 3-panel) — no public impact |
| **5.V1** | Canvas + select/highlight + right panel props for **Heading/Text/Image/Button** · draft save |
| **5.V2** | Section/Row/Column · DnD reorder · undo/redo local |
| **5.V3** | Store widgets: Product Grid/Card bind to API · publish + invalidate |
| **5.V4** | Header / Footer builders · Global vs Custom |
| **5.V5** | Product Card + Product Page + Category builders |
| **5.V6** | EN/AR fields + RTL preview |
| **5.V7** | Responsive + visibility toggles |
| **5.V8** | Revisions · My Templates · presets |
| **5.V9** | Custom CSS (sanitize) · plan gates |
| **5.V10** | Custom JS (Pro+) · conditions · Master feature flags |
| **5.1 parallel** | Theme Settings **01→18** same-to-same forms (can land before/alongside V0–V3) |

**Parallel rule:** Theme Settings form pack (`designs/Theme_Settings_UIUX`) stays SoT for structured options; Visual Builder owns freeform canvas. One shared publish pipeline.

---

## 14. Exit criteria (whole Phase 5.V)

- [ ] Edit Theme opens full-screen editor; Exit returns to Store Dashboard  
- [ ] Draft ≠ live; Publish updates storefront without full rebuild hang  
- [ ] `store_id` isolation verified (CSS/JS/theme)  
- [ ] Products/Orders/Customers/SEO untouched by theme restore  
- [ ] Public bundle excludes editor code  
- [ ] Plan + Master flags enforced **server-side**  
- [ ] AR/EN + RTL work without cross-locale overwrite  

---

## FINAL GOLDEN RULE

```
DO NOT REBUILD.
Inspect → Reuse existing components as widgets → Extend schema → Code-split editor → Secure store_id → Test commerce unbroken.
```
