# 38 — Common Themes · Steps · Stores · Domains (Owner guide)

**Audience:** Product owner + Master Admin + agents  
**Parent:** `docs/36` · Settings schema: `docs/37` · Rule: `.cursor/rules/souq-common-theme-subscription-lock.mdc`  
**Language:** Roman Urdu + EN (ops). Store UI chrome stays AR/EN via locale.

---

## 0) Pehle yeh samajh lo (LOCKED)

| # | Store | `store_id` | Apna theme (flagship) | Hosting + Domain (LOCKED) |
|---|--------|------------|------------------------|-------------|
| 1 | Flowers / Hadaya | `store-1` | Flora / Makkah Royal (`theme-flora-luxe` / related) | **Alag Hostinger** · `giftshop-sa.com` (central migrate **cancelled** — `docs/33` superseded) |
| 2 | Coffee / HiBrew | `store-coffee` | Coffee Artisan (`theme-coffee-artisan`) — **look locked** | **Central** · `mieraf-ksa.com` |
| 3 | Car / Bleco | `store-bleco` | Saudia Transport (`theme-saudia-transport`) | **Central** · domain mapping on central |
| * | **Har naya store** | new `store_id` | Common Souq theme | **Central only** · `{slug}.mieraf-ksa.com` + optional custom domain |

**In 3 ke baad** har naya merchant store:

- Default theme = **`theme-souq-common-retail`** (common pack)
- Plan Starter **100** / Pro **300** / Premium **500** SAR → included themes us tier ke hisaab se
- Extra theme chahiye → **marketplace se kharido** (ya Master grant) — products/orders **delete nahi** hote

Flagship 3 ko common pack se **force-migrate mat karo** jab tak Master explicit na kahe.

### Platform template store (LOCKED for new owners)

| Field | Value |
|-------|--------|
| `store_id` | **`store-souq-default`** |
| Name | **متجر سوق الافتراضي** / Souq Default Store |
| Plan | **Premium 500** (Pro features included) |
| Theme | `theme-souq-common-retail` + all common entitlements |
| Domain | `souq-default.mieraf-ksa.com` on **central** Hostinger |
| Hostinger DNS | hPanel → Subdomains → create **`souq-default`** · folder `public_html/souq-default` (bridge via `scripts/ensure-souq-default-subdomain-ftp.js`) · until DNS exists browser = fail / parking |
| Settings | docs/37 + `ثيمات المتجر.docx` (`docs/_incoming/store-themes-doc.txt`) |
| Page Builder | lean common home blocks (not flora/coffee/car) |
| Starter catalog | 4 EN/AR replaceable products + 2 categories |
| SEO | `seo_configs` row (sitemap on; Google = Not Connected until real) |
| Payment | COD enabled (card gateways Not Connected until keys) |
| Shipping | KSA zones + standard/express methods (couriers Not Connected) |

**Provision path:** `POST /api/stores` → `ProvisionNewStoreService::bootstrap`  
**Ensure script:** `php apps/api/scripts/ensure-souq-default-store.php`  
Theme switch = `theme_id` + `settings.by_theme` only — **products / orders / customers never wiped**.

---

## 1) Domains — kahan kya chalta hai

| Surface | Domain | Kaun use kare |
|---------|--------|----------------|
| **Souq marketing / pricing / themes pitch** | `https://souq.mieraf-ksa.com` | Public visitors — plans 100/300/500, add-ons, Hostinger offer |
| **Master Admin (platform)** | `https://mieraf-ksa.com/master` | SuperAdmin only — stores, plans, theme grants, hosting slots |
| **Central storefront + coffee + APIs** | `https://mieraf-ksa.com` | Coffee storefront, shared API, future common-tenant preview |
| **Flowers storefront** | `https://giftshop-sa.com` | Flagship flowers only (Master **banned** on this host) |
| **Naya merchant store** | Prefer: **custom domain** (Premium / buy hosting) **ya** Master-issued subdomain on Souq/central | Har store ka apna `domain` / `slug` row — `store_id` isolation |

**Naye store ke liye domain flow (recommended):**

1. Master → Onboarding invite (plan = starter/pro/premium).
2. Merchant register → naya `store_id` (kabhi flowers/coffee/bleco copy nahi).
3. Default theme assign = `theme-souq-common-retail`.
4. Domain options:
   - **A)** Master sets temporary subdomain / path on central (`mieraf-ksa.com` resolve-domain → that `store_id`)
   - **B)** Merchant buys Hostinger+domain from Souq (dashboard Plans & Add-ons / hosting SKU) → Master fulfills DNS → custom domain bind
   - **C)** Premium first **20** stores: Hostinger+domain **free** (Master approve + `free_hosting_slots`)
5. Public SEO = us store ke origin pe `robots` / `sitemap` (dusre store ka URL leak na ho).

---

## 2) Common theme — “kaise banaye” (steps)

Common theme = **ek shared settings schema** + alag **presets** (colors / default section order). Code pack: `src/themes/souqCommon/`.

### 2.1 Platform pe pehle se (CT done)

| theme_id | Tier include | Buy price (agar include na ho) |
|----------|--------------|--------------------------------|
| `theme-souq-common-retail` | starter + pro + premium (+ free/paid map) | 0 |
| `theme-souq-common-catalog` | pro + premium | Starter pe ~79 SAR buy |
| `theme-souq-common-services` | pro + premium | Starter pe ~79 SAR buy |
| `theme-souq-common-boutique` | premium | ~149 SAR buy |

Catalog + entitlements: `themes_catalog` + `store_theme_entitlements`  
API: `GET /api/themes-catalog`, `GET /api/storefront/marketplace/themes`, purchase `POST /api/marketplace/themes/{id}/purchase`

### 2.2 Naya common theme pack add karna (dev / Master catalog)

1. **Doc sync:** `docs/37` panel map same rakho — naya panel invent mat karo.
2. **Code:** `src/themes/souqCommon/theme.config.ts` mein naya `buildCommonManifest(...)` + `registerTheme` in `registry.ts`.
3. **DB:** `themes_catalog` row (`id`, `name_ar`, `price_sar`, `included_in_tiers`, `is_active`). SQL pattern: `database/hostinger/15_souq_common_themes.sql`.
4. **Default:** sirf **ek** platform default = retail. Flagships apni `store_themes.theme_id` se chalte hain.
5. **Deploy:** API gateway/Laravel hotfiles + UI delta (user bole tab).
6. **Test:** marketplace themes list mein dikhe; locked store pe Buy; unlock ke baad switch → catalog intact.

### 2.3 Merchant store pe theme lagana (no code)

1. Login store `/admin` (apna login email only).
2. **Themes** / marketplace gallery → included theme **Activate** ya locked pe **Buy** (pending → Master payment confirm).
3. **Customize Themes** → logos, colors, hero text EN/AR, WhatsApp (`docs/37`).
4. **Page Builder** → sections order / enable → **Publish**.
5. Storefront open (us store ka domain) → foran update (`?v=` / cache bust).  
   Theme change = **products / orders / customers same**.

---

## 3) Subscription ↔ theme (short)

| Plan | SAR / mo | Themes |
|------|----------|--------|
| Starter | 100 | 1 included common (retail) + baqi buy |
| Pro | 300 | Starter+Pro common pack + builder |
| Premium | 500 | Full common included + first-20 free hosting |

Billing: **1 / 6 (−15%) / 12 (−25%)** months.  
Add-ons (AI / WhatsApp / social): **price pehle**, unlock payment + Master ke baad.  
Inactivity: 30 → warn · 60 → warn2 · 90 → Master terminate.

Dashboard: `StoreMarketplacePlans` · Public: `souq.mieraf-ksa.com/*/pricing`.

---

## 4) Testing checklist (har release)

```
GET https://mieraf-ksa.com/api/health                    → active_live_mysql
GET .../api/themes-catalog                               → common-4 + flagships; is_default ONLY retail
GET .../api/storefront/marketplace/plans                 → starter 100, periods 1/6/12
GET .../api/storefront/theme?store_id=store-coffee       → coffee id (not flora)
GET .../api/storefront/theme?store_id=store-1            → flowers id
GET .../api/storefront/theme?store_id=store-bleco        → transport id
GET .../api/marketplace/addons?store_id=<new>            → price-first locks
https://souq.mieraf-ksa.com/ar/pricing                   → 100/300/500 + add-ons copy
```

PHPUnit: `SouqBilling*` · `SouqMarketplace*` · `ThemeEntitlement*`.

---

## 5) Docs map (themes only)

| Doc | Role |
|-----|------|
| `docs/36-…marketplace.md` | Policy + tiers + AI add-ons |
| `docs/37-…settings-schema.md` | Shared Customize panels (ثيمات المتجر) |
| **`docs/38-…steps-stores-domains.md` (yeh file)** | Owner steps: flagship vs common, domain, kaise banaye |
| `docs/31-…page-builder…` | Builder execution steps |
| `docs/30-…coffee…` | Coffee flagship settings only |
| `docs/20-flowers-premium-theme.md` | Flowers flagship |
| `designs/Common_Theme_Settings_UIUX/` | Pixel refs |

Full project index: `docs/00-DOCS-INDEX.md`.
