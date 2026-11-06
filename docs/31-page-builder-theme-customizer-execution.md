# 31 — Page Builder + Theme Customizer — Execution Lock

**Status:** LOCKED · 2026-11-05  
**Next step:** `PB-53`  
**Company:** Unityteck — KSA multi-store SaaS  
**Concept:** `docs/09-visual-theme-builder.md` (requirements). This file is the only execution order.  
**Rule:** `.cursor/rules/page-builder-theme-customizer.mdc`  
**Also:** `docs/30-coffee-store-theme-settings-execution.md` · coffee UI lock · zero-mock · `store_id` isolation · no language mix · lean SEO

---

## 0. AI protocol (no skip, no bugs left behind)

1. Read this file. Find the single row marked `NEXT`.
2. Inspect the files named on that row. Reuse them. Do not rebuild the editor or the storefront.
3. Implement **only** that step.
4. Run that step’s **Test** column. Also run the **Global gate** (section 2) for every step that touches UI, API, or DB.
5. TypeScript and the touched API path must be clean. If anything fails, fix it inside the same step. Do not open the next id.
6. Change that row from `NEXT` to `DONE` and set the following `PENDING` row to `NEXT`.
7. Stop. Report **Ho gaya** / **Baqi** with the next id.
8. Never mark `DONE` on a code path that still reads another store, `localStorage` as source of truth, or fake commerce data.

**Coffee lock:** HiBrew (`store-coffee` / `src/themes/coffeeRoasters/**`) layout, spacing, colors, typography, and section chrome stay as they are. This plan wires content, visibility, order, SEO, and **new** pages. It does not restyle Home, Header, Hero, Footer, Shop, Product, Cart, or Checkout. Do not paint `colors.*` as the page background on `.hibrew-theme-root`. Do not bring back C-BAN (`settings.banners`, builder type `banners`).

**Two layers, one pipeline**

| Layer | Job | Must not |
|---|---|---|
| Theme Customizer | Global tokens, header, footer, product card, shop/checkout field switches, SEO defaults | Invent a new visual shell |
| Page Builder | Per-page sections → columns → widgets, drag, hide, duplicate, reorder, page switch | Ignore published JSON on the storefront |

---

## 1. Baseline (already in repo — extend, do not replace)

| Piece | Where | Truth today |
|---|---|---|
| Customizer UI | `src/components/store/themeCustomizer/WordPressThemeCustomizer.tsx` | Forms write `store_themes.settings` via `PUT /api/stores/{storeId}/theme-settings` |
| Builder UI | `src/components/store/visualBuilder/VisualThemeBuilder.tsx` | One block list. Home canvas only. Undo/redo is session memory |
| Builder API | `StoreThemeController::saveBuilderLayout` | `settings.builder.draft_blocks` + `published_blocks` on the one `store_themes` row |
| Public read | `GET /api/storefront/theme` | Published layout only. Unknown store → 404. No first-store fallback |
| Builder hydrate | `loadBuilderDraftFromApi` in `liveThemeSyncService.ts` | Builder open reads MySQL draft for that `store_id`, then writes localStorage |
| Custom pages | `hydrateStorePages` → `theme_pages` | Empty store stays empty. Edited rows for that `store_id` only |
| Coffee storefront | `CoffeeRoastersThemeView` | Fixed routes. Does not render builder blocks — **PB-48 binds locked sections; PB-49 renders custom pages** |
| Schema | `theme_pages`, `theme_revisions`, `theme_global_styles`, `store_themes` | Pages and revisions exist. Global tokens only in `theme_global_styles` |

---

## 2. Global gate (every step)

Pass all of these before `DONE`:

| Gate | Pass |
|---|---|
| Isolation | Store A save never appears on store B. Unknown store → 404 or genuine empty. No `store-1` / first-store fallback |
| Dynamic | Merchant text, images, headings, SEO come from that store’s API/DB. Platform chrome uses `isAr` / `t()` only |
| AR / EN | English UI strings are English only. Arabic UI strings are Arabic only. Fields stay `*_en` and `*_ar` |
| Responsive | Desktop 1280, tablet 768, mobile 390. No overlap, no horizontal scroll, no clipped control, columns stack |
| Live image | Upload returns versioned URL (`?v={updated_at}`). Open preview swaps immediately. No full reload |
| Draft / live | Draft is not public. Publish updates storefront for that `store_id` only and bumps cache |
| Empty | No rows → “No records found” / Waiting for Data. No fake products, reviews, clicks, or SEO scores |
| Commerce | Products, orders, customers, login email stay untouched |
| Build | Touched TypeScript and PHP path have no new errors |
| SEO (when the step has meta) | One H1, title, description, canonical, hreflang `en`+`ar`, sitemap only if indexable |

---

## 3. Target data (created in PB-01, used after)

All tenant tables include `store_id`.

**`theme_pages`:** `id`, `store_id`, `slug`, `type` (`home` `shop` `product` `cart` `checkout` `thankyou` `faq` `reviews` `about` `contact` `custom` `404`), `title_en`, `title_ar`, `draft_layout` JSON, `published_layout` JSON, `seo` JSON, `header_mode` (`global`|`custom`), `footer_mode`, `status` (`draft`|`published`), `published_at`, `updated_by`, timestamps. Unique (`store_id`, `slug`).

**Layout JSON:** `sections[] → columns[] → widgets[]`. Widget: `id`, `type`, `visible`, `visibleDesktop`, `visibleTablet`, `visibleMobile`, `settings` (EN/AR copy, links, query), `style.desktop|tablet|mobile` (padding, margin, gap, fontSize, align, color).

**`theme_revisions`:** `id`, `store_id`, `page_id` nullable, `snapshot` JSON, `created_by`, `created_at`. Restore never deletes products, orders, customers, or product SEO rows.

**`theme_global_styles`:** one row per `store_id`. This is the only home for global design tokens. Do not also write them to `store_themes.settings.globalStyles`.

Header and footer are global parts. A new page starts with `header_mode=global`, `footer_mode=global`, empty sections.

**SEO JSON:** `seo_title_en`, `seo_title_ar`, `seo_description_en`, `seo_description_ar`, `canonical`, `robots`, `og_title_en`, `og_title_ar`, `og_description_en`, `og_description_ar`, `og_image`, `twitter_card`, `hreflang`.

---

## 4. Steps

Status values: `NEXT` · `PENDING` · `DONE`. Only one `NEXT`.

### A. Database and API

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-01 | DONE | Migration: `theme_pages`, `theme_revisions`, `theme_global_styles` (only place for global tokens). FK `store_id` → `stores.id`. Hostinger twin `database/hostinger/03_theme_pages.sql` + `01_schema.sql`. No commerce table edits | Migrate runs. Unique (`store_id`,`slug`) | `ThemePagesSchemaTest` — store A read misses store B. Same slug allowed on the other store |
| PB-02 | DONE | Models `ThemePage`, `ThemeRevision`, `ThemeGlobalStyle` with `store_id` scope. `ThemePageController` list/create/update reads store id from middleware + URL only, never the body. Foreign URL → 403 | Create/list/update page refuses a foreign id | `ThemePageIsolationTest` — store B token on store A → 403. Body `store_id` ignored |
| PB-03 | DONE | Auth page show, publish, revisions, restore. Public `GET /api/storefront/theme?store_id=&slug=` returns `published_layout` only. Client wrappers in `src/api/tenantApi.ts` | Draft GET is auth-only. Public route returns published only | `ThemePagePublishTest` |
| PB-04 | DONE | `storefrontTheme` no longer uses `Store::query()->first()`. Unknown id/host → 404 | No first-store theme leak | Same test: `missing-store` and store B without that page → 404 |
| PB-05 | DONE | `loadBuilderDraftFromApi` on builder open. MySQL draft for the active `store_id` replaces the canvas. localStorage is written only after that read. Empty API draft clears this store's cache | Second browser sees the same draft | `ThemeBuilderDraftTest` — store A draft reloads from API. Store B and the public theme do not receive it |
| PB-06 | DONE | `POST /api/stores/{storeId}/media` reuses `MediaController`. URL must match the member store. File path is `stores/{store_id}/media`. Response URL ends with `?v={updated_at}`. Body `store_id` is ignored | Upload does not write another store’s folder | `ThemeMediaUploadTest` — store B → store A is 403. Store A file stays in `stores/store-a/media` |
| PB-07 | DONE | Publish copies `draft_layout` → `published_layout`, sets `published_at`, writes a revision, and forgets only `store:{id}:theme` plus `store:{id}:theme-page:{slug}` | Public GET changes. Other store unchanged | `ThemePageCacheTest` — A becomes `two`, B stays `bee`, B cache keys remain |
| PB-08 | DONE | Content pages load from `theme_pages` for that `store_id`. Untouched master legal seed is not written onto an empty store. One-time import only for this browser's edited rows. Delete route included | FAQ/about/privacy survive a new browser | `ThemeContentPagesTest` — empty store A stays `[]`. Store B privacy is not in store A |

### B. Theme Customizer (global)

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-09 | DONE | Customizer save writes **draft** global settings. Publish promotes them. Auth theme-settings overlays the draft for the preview. Public storefront omits `settings.draft` | Accidental field edit is not on the public home | `ThemeSettingsDraftTest` — public stays `LIVE SENTENCE` until `publish=true`; store B stays `OTHER SENTENCE` |
| PB-10 | DONE | Left section list, center live preview, right fields. Preview iframe is the public storefront (`preview=1`) so coffee uses `CoffeeRoastersThemeView` | No second preview skin | Desktop 1280: three panels, no overlap. Iframe `.hibrew-theme-root` + `theme-coffee`. Below 1280 the field form stays in the start panel |
| PB-11 | DONE | Merchant strings are separate `*_en` / `*_ar` inputs. A partial Arabic save deep-merges and keeps the English sibling. Locale switch does not copy one language into the other | AR save keeps EN | `ThemeSettingsBilingualTest` — `titleAr` becomes `جديد`, `titleEn` stays `HELLO` after reload and publish. Store B stays `OTHER` |
| PB-12 | DONE | Customizer shell, identity, header, and media chrome use `isAr`. Arabic mode has no English chrome words. English mode has no Arabic chrome | Spot-check both locales | Arabic labels have no Latin words. English labels have no Arabic words. Language buttons read إنجليزي/عربي or English/Arabic |
| PB-13 | DONE | Global tokens live only in `theme_global_styles`. Draft until publish. `paintPageBackground` stays false. Coffee root keeps `bg-white` and ignores `colors.background`. Button token sets `--theme-button` on `.hibrew-inherit-btn` | Token change updates the button variable. HiBrew page stays light | `ThemeGlobalStylesTest` — draft `#222222` / `#111111` absent from public until publish. Store B tokens stay empty. `globalStyles` is stripped from `store_themes.settings` |
| PB-14 | DONE | Header logo, search, cart, account, WhatsApp, and announcement stay on the locked HiBrew bar. Desktop links and mobile links are separate editors. Empty lists keep the locked menu. A custom logo word applies only after `applyTitle`. An uploaded logo shows only in image-only mode | Text, logo, and links save per store. A mobile-only save keeps the desktop link | `ThemeHeaderSettingsTest` — draft `DeskLink` / `MobLink` stay off the public theme. A later mobile save keeps `DeskLink` and replaces the mobile row with `MobOnly`. Store B stays `OTHER DESK`. At 390px the open menu panel is left 0, right 390, and the page does not scroll sideways |
| PB-15 | DONE | Footer columns, links, contact, newsletter title, payment label, and copyright stay separate `*_en` / `*_ar`. A partial Arabic address save keeps the English address. Publish attaches that footer to every page whose `footer_mode` is `global`, and clears that store’s page cache. `hidden` pages omit it | Global pages show the published footer. Store B stays unchanged | `ThemeFooterSettingsTest` — draft `DRAFT FOOT` is absent until publish. Home (`global`) then has `DRAFT FOOT`, `جدة`, and `Riyadh`. The `hidden` page footer is null. Store B stays `OTHER FOOT` |
| PB-16 | DONE | Product card switches: image, title, price, badge, rating, stock, add-to-cart. Defaults stay on so the locked card chrome is unchanged. Hide price removes only the price. Cards read the store catalog. An empty catalog does not fall back to the coffee seed list | Hide price hides price. Empty catalog shows an empty state | `ThemeProductCardSettingsTest` — draft `showPrice: false` stays off the public theme until publish, while `showTitle` stays true. A later stock switch keeps the hidden price. Store B stays `showPrice: true`. Public theme has no invented `products` list |
| PB-17 | DONE | Shop controls: columns desktop/tablet/mobile, sort, per page, filters on/off. Defaults stay 2 / 3 / 4 so the locked grid is unchanged. `showFilters: false` hides only the secondary filter bar | Column classes follow the saved counts | `ThemeCatalogControlsTest` — draft mobile column `1` stays off the public theme and keeps desktop `4`. Store B stays `2` |
| PB-18 | DONE | Checkout / cart field switches: guest, coupon, order note, shipping block. Coupon hides only when `showCoupon` is false. Shipping city, district, and street hide together. Order note appears only when turned on. Guest checkout stays on unless the merchant turns it off | Toggle coupon removes only that block | `ThemeCatalogControlsTest` — draft `showCoupon: false` stays public `true` until publish, and `showShipping` stays true. Place-order name and phone remain |
| PB-19 | DONE | Direct image upload calls the store media API when it is on, then the preview `src` swaps to the returned URL. A failed upload keeps the local preview. Existing media picker still applies the library URL immediately | Preview updates on success | `ThemeMediaUploadTest` — upload stays in that store folder and the URL contains `?v=` |
| PB-20 | DONE | SEO defaults: title and description EN+AR plus OG image, saved on theme settings only. Product name, description, and product SEO columns stay unchanged | Template does not write product rows | `ThemeCatalogControlsTest` — after publish, product `seo_title` stays `Product SEO title` and `seo_description` stays `Product SEO description`. Store B has no SEO defaults |

### C. Builder shell

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-21 | DONE | Full-screen builder stays a separate lazy chunk. The public storefront does not preload it. Closing the builder returns the store tab to the dashboard | Public coffee theme file has no builder import. Exit writes the dashboard tab | Public path skips `preloadVisualThemeBuilder`. `CoffeeRoastersThemeView` and `DynamicThemeRenderer` do not import the editor |
| PB-22 | DONE | Top bar: page switch, device, undo, redo, save draft, preview, publish, history. Labels follow locale | All actions call the APIs from PB-03 | Keyboard undo restores the previous block tree |
| PB-23 | DONE | Add page creates `type=custom` with global header/footer and zero sections. A pasted layout is discarded. The same slug can exist on another store | New page is not a copy of another store | `ThemeCustomPageTest` — store A `offers` stays empty and `store-a`. A second `offers` on A is 422. Store B can use `offers` and cannot read store A |
| PB-24 | DONE | Device frame widths 1280 / 768 / 390. Style read from `style.desktop\|tablet\|mobile` | Mobile frame does not show desktop-only widgets | No horizontal scroll inside the frame |
| PB-25 | DONE | Canvas renders real theme components (`CoffeeBuilderBlocks` for coffee). Empty canvas is a compact empty state | No black slab, no fake products | Coffee canvas = storefront components |
| PB-26 | DONE | Select widget → outline + right inspector. Switching widget keeps unsaved fields in draft state until debounce save (~500ms) | No API call per mousemove | Rapid typing = one PUT |

### D. Rows and interactions

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-27 | DONE | Add row presets: 1, 2, 3, 4, 25/25/50. Persist as sections → columns | JSON matches the tree | Reload keeps columns |
| PB-28 | DONE | Drag section, column, widget. Invalid drop snaps back. Gap token between columns. Overlap off unless the widget explicitly sets it | Drop in column nests the widget | 390px columns stack, no overlap |
| PB-29 | DONE | Hide / show (`visible` + per-device flags), duplicate (new id), delete, move up, move down | Hidden widget absent on preview and on published storefront | Duplicate does not share id |
| PB-30 | DONE | Undo/redo for the session tree, then explicit Save Draft. Publish disabled while the draft request is in flight (`aria-busy`) | Double-click publish cannot double-write | Failed save toast, draft kept |
| PB-31 | DONE | Two editors: if `updated_at` mismatches, block save and ask reload or overwrite | Lost update cannot silent-clobber | Parallel PUT returns 409 |

### E. Widgets

Each widget: EN + AR fields, link picker (page, product, category, WhatsApp, external), spacing per breakpoint, hide per device. Coffee locked sections bind these settings. They do not get a new skin.

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-32 | DONE | Heading widget, tag H1–H6. Warn on publish if the page has 0 or 2+ H1 | Tag renders the real element | SEO gate |
| PB-33 | DONE | Rich text widget. Allowlist sanitize (no script). Separate EN and AR documents | Script stripped server-side | XSS payload stored harmless |
| PB-34 | DONE | Image widget: upload, alt EN/AR, link, radius, optional mobile image, `max-width:100%` | Live swap + alt saved | Broken URL shows empty state, not a fake photo |
| PB-35 | DONE | Button: label EN/AR, link picker, icon | Internal slug stays inside the store | External link has safe `rel` |
| PB-36 | DONE | Slider / hero slides: add, remove, reorder, image, mobile image, heading, text, button, overlay, autoplay | Coffee hero component reads the same `heroBanners` key | Empty slides → compact empty, not a tall dark block |
| PB-37 | DONE | Banner + offer banner: image, heading, CTA, real `endsAt`. Past date hides the banner | No countdown with an invented date | Expired banner absent on storefront |
| PB-38 | DONE | Products widget: featured / category / latest / on-sale / manual ids. Limit. Columns 4/2/1 by breakpoint. Query the products API for this `store_id` | Prices match the product table | Other store’s products never listed |
| PB-39 | DONE | Categories widget from this store’s categories | Count matches API | Empty categories → empty state |
| PB-40 | DONE | FAQ items EN/AR accordion. JSON-LD only from published items | Hide item removes it from schema | Empty FAQ → no fake questions |
| PB-41 | DONE | Reviews widget reads `customer_reviews` for this store only | Stars match stored reviews | Zero reviews → no dummy stars |
| PB-42 | DONE | Spacer, divider, icon, video, newsletter, contact. Empty video URL hides the widget | Newsletter posts to this store’s list | No placeholder video |
| PB-43 | DONE | Custom HTML, Pro plan only, sanitized, wrapper-scoped. Free plan: API 403 | Master can turn the flag off per store | Free token cannot save HTML |
| PB-44 | DONE | Map coffee canonical sections (announcement, hero, categories, products, image banners, carousel, features, benefits, newsletter, footer) onto the widgets above. C-BAN stays absent | Home order can change only if the merchant reorders those real sections. Visual CSS of each section stays | Compare HiBrew before/after on a fresh theme with default order |

### F. Pages

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-45 | DONE | Builder page list: Home, Shop, Product, Cart, Checkout, Thank you, FAQ, Reviews, About, Contact, 404, Custom | Switching page does not wipe another page’s draft | Deep link `?page=faq` reloads FAQ |
| PB-46 | DONE | Shop, product, cart, checkout, thank-you keep their current components. Builder only feeds the switches from PB-16–PB-18 plus SEO | Checkout still completes | Thank-you shows the real order id, not sample text |
| PB-47 | DONE | Learn-more stays the hero/product CTA (`learnMoreEn/Ar/Url`) unless the merchant creates a custom page and points the CTA at it | Default coffee CTA behavior unchanged | Custom URL is store-scoped |
| PB-48 | DONE | Customer account / CRM stays the real account page. Remove the dead builder `crm` canvas that renders nothing. Do not invent CRM metrics | Menu either opens the real page or is hidden | No blank canvas |
| PB-49 | DONE | Custom page route on the storefront renders `published_layout` between global header and footer | New page visible only after publish | Draft slug 404 on the public site |
| PB-50 | DONE | 404 page uses the store’s `404` layout when published. Otherwise the existing simple 404 | No other store’s 404 art | Unknown URL |

### G. Responsive and glitch

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-51 | DONE | Per-widget padding, margin, gap, max-width, align, font size for three breakpoints | Values persist in `style.*` | Reload each device |
| PB-52 | DONE | Visibility checkboxes: desktop, tablet, mobile | Hidden device does not reserve a gap | Mobile hide removes the node |
| PB-53 | NEXT | RTL for Arabic, LTR for English. Icons flip with direction. Long words wrap | No overlap on AR headings | Both locales at 390 and 1280 |
| PB-54 | PENDING | Sticky header + announcement height shared by canvas and storefront. Content starts below that height | No covered H1 | Scroll both |
| PB-55 | PENDING | Slider aspect-ratio locked so images do not jump the layout | No CLS on slide change | Slow image still holds box |
| PB-56 | PENDING | z-index only for header, menu, modal. Sections do not stack on each other | Overlap audit screenshot | Mobile menu closes on navigation |

### H. SEO

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-57 | PENDING | Per-page SEO form, all keys in section 3. Save on the page row | Public `<title>` and meta match published SEO | View source EN and AR |
| PB-58 | PENDING | Canonical + hreflang `en` and `ar` for that store’s host | No cross-store canonical | Two locales |
| PB-59 | PENDING | `robots` index/noindex. Sitemap includes only published indexable pages. `robots.txt` is per store | Draft pages absent from sitemap | noindex page absent |
| PB-60 | PENDING | Single H1 check (PB-32) blocks nothing but lists warnings before publish | Warning lists the widget ids | Page with two H1 shows both ids |
| PB-61 | PENDING | Missing alt text listed on publish. Merchant can still publish | List is per store | Image with alt omitted from the warning |
| PB-62 | PENDING | FAQ and review JSON-LD from published content only | Schema matches visible text | Empty page emits no FAQ schema |
| PB-63 | PENDING | Product and category SEO remain on their own tables. Theme restore does not write those rows | Restore test | Product title in DB identical after restore |

### I. AI (suggest only)

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-64 | PENDING | `POST /api/stores/{storeId}/ai/seo` reads **this page’s saved text** and returns title + description EN and AR. Nothing is saved until Apply | Apply writes only the chosen fields | Empty page → no invented FAQ or products |
| PB-65 | PENDING | Heading rewrite suggestion for H1–H6. Previous value stays until Apply | Cancel leaves the field | Other locale untouched |
| PB-66 | PENDING | Alt suggestion from file name + nearest heading. No invented product facts | Suggestion is editable | No network call to another store’s media |
| PB-67 | PENDING | Translate EN→AR and AR→EN into the opposite field after the merchant confirms | Source field unchanged | Mixed-language chrome still absent |
| PB-68 | PENDING | AI context is this `store_id` only. No flowers/coffee copy injected for the other tenant | Log/prompt has no foreign store body | Store B prompt lacks store A names |
| PB-69 | PENDING | Plan gate: Free receives 403 for AI routes. Pro/Master grant allowed. Server-side | UI hide is not the only check | Free token curl → 403 |

### J. Live update, history, plans, security

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-70 | PENDING | Media library list invalidates on upload. Preview, builder, and customizer share the versioned URL | Replacing an image does not show the old file | Hard-refresh storefront after publish shows the new file |
| PB-71 | PENDING | Save Draft toast + `aria-busy`. Publish toast. Errors stay on the form | No `alert()` / `confirm()` / full reload | Offline save shows error, keeps local draft until retry succeeds then API wins |
| PB-72 | PENDING | Revision list + restore with an explicit confirm UI (not `window.confirm`) | Restore brings layout back | Products count unchanged |
| PB-73 | PENDING | `updated_by` on page save and revision | DB column filled from the auth user | Anonymous cannot publish |
| PB-74 | PENDING | Display conditions (Pro): guest/logged-in, device, date range. API strips widgets the visitor must not see | Expired campaign widget hidden | Date in the past |
| PB-75 | PENDING | Master flag: builder on/off per store. Off → API rejects layout writes | Store UI shows not available | Direct PUT → 403 |
| PB-76 | PENDING | Custom CSS (Pro) sanitized and scoped to the store wrapper. Master kill switch | Free cannot save CSS | CSS cannot target another store root |
| PB-77 | PENDING | Login email remains Master-only. No theme field writes `ownerEmail` | Settings screen has no login-email input | PUT theme-settings cannot change login email |
| PB-78 | PENDING | Rich text and HTML allowlist on the server for every widget settings blob | Stored XSS does not execute | Payload test |

### K. Deep test pass (required before the program is closed)

Do these only after PB-01–PB-78 are `DONE`. Each row still follows the protocol: one id, fix failures, then next.

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| PB-79 | PENDING | Isolation matrix: coffee store vs a second store. Theme, pages, media, SEO, reviews, AI | Six resources differ | Written checklist in the PR/test note |
| PB-80 | PENDING | Interaction matrix on Home and on one custom page: drag, drop, hide, duplicate, up, down, undo, redo, page switch, reload | Draft identical after reload | ids unique |
| PB-81 | PENDING | Responsive pass 1280, 768, 390, AR and EN, customizer + builder + public custom page | No overlap, gap, or clipped button | Notes + viewports |
| PB-82 | PENDING | Image pass: upload, replace, preview instant, publish, public URL version matches | Old URL not used after publish | `?v=` changed |
| PB-83 | PENDING | SEO pass: view-source title, description, canonical, hreflang, one H1, sitemap, noindex, FAQ schema | Matches DB | Both locales |
| PB-84 | PENDING | Empty pass: new store with no products, reviews, FAQ, slides | Genuine empty states | No dummy numbers |
| PB-85 | PENDING | Commerce regression: add to cart, checkout, thank-you order id, customer account | Order row exists | Theme publish did not alter the order |
| PB-86 | PENDING | Language pass: admin EN and admin AR through customizer and builder chrome | No mixed chrome string | Content fields still bilingual |
| PB-87 | PENDING | Security pass: foreign `store_id`, Free plan HTML/AI/CSS, XSS payload, missing store public theme | All rejected | No first-store body |
| PB-88 | PENDING | `npm run build` and the API test or migrate command used in this repo. Fix every error before closing | Clean build | Record the command output in the step note under this table |

---

## 5. Out of scope until a later doc

Popup builder, animation library, A/B tests, scheduled publish, theme import from another store, custom JS on Free. Do not build these inside PB-01–PB-88. A theme import, if ever added, must be an explicit copy into the target `store_id`, never a silent fallback.

---

## 6. Close conditions

- Every row above is `DONE`.
- Coffee HiBrew default home still matches the locked layout when section order is the default.
- Public theme endpoint never returns another store.
- Draft and published differ in a test.
- Build is clean.

When PB-88 is `DONE`, set **Next step** at the top of this file to `CLOSED`.
