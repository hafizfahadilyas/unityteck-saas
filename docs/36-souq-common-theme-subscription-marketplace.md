# 36 — Souq Common Themes · Subscription Tiers · Marketplace & AI Add-ons

**Document code:** `docs/36-souq-common-theme-subscription-marketplace.md`  
**Rule (LOCKED):** `.cursor/rules/souq-common-theme-subscription-lock.mdc`  
**Owner steps (domains / kaise banaye):** `docs/38-souq-common-themes-steps-stores-domains.md`  
**Settings schema:** `docs/37-souq-common-theme-settings-schema.md`  
**Docs index:** `docs/00-DOCS-INDEX.md`  
**Audience:** Product owner, Master Admin, developers, Cursor agents  
**Market:** Kingdom of Saudi Arabia (SAR, AR/EN, ZATCA-ready)  
**Scale target:** **50 active Saudi merchant stores** in phase 1, architecture ready for 100+

---

## 1. Khulaasa (executive summary)

Flowers, car (Bleco/Al-Saeedi), aur coffee (HiBrew) **flagship pilots** hain — unki visual lock alag rules mein hai.  
**Iske baad** jo bhi merchant aayega (100 / 300 / 500 SAR monthly subscription), use **common Souq theme pack** milega: subscription active hote hi dashboard mein **us tier ke included themes** dikhenge.  
Agar dusra premium/seasonal theme chahiye → **alag se kharidna** hoga (marketplace SKU).  

Har module — AI agent, image AI, AI fix/doctor, AI calling, WhatsApp automation, social media automation, credits — **pehle pricing dikhegi**, payment / plan unlock ke **baad** feature chalega.  
Master Admin platform fees, bundles, aur hidden charges control karega.  
Merchants **Souq ki public website** aur **apne dashboard** dono jagah same pricing / themes dekh kar khud verify kar sakenge.

**Ek hi common theme-settings guide** (aap ka theme doc) sab common themes par lagu — Page Builder + Customize Themes se branding foran apply; naya theme khareedne par **products / catalog / orders wahi rehte hain**.

---

## 2. Theme classes

### 2.1 Flagship (pilots — do not bulk-migrate)

| Tenant | Theme IDs (registry) | Lock |
|--------|----------------------|------|
| Flowers / Hadaya | `theme-flora-luxe`, `meccaGifts` | Existing premium floral UX |
| Coffee | `theme-coffee-artisan`, `coffeeRoasters` | `coffee-frontend-ui-lock.mdc` |
| Car / Bleco | `theme-saudia-transport` | VIP execution doc |

Naye common-theme code in tenants ko **override na kare** jab tak Master explicit migrate na kare.

### 2.2 Common Souq pack (all post-pilot stores)

- Canonical prefix: `theme-souq-common-*` (e.g. `theme-souq-common-retail`, `theme-souq-common-services`, `theme-souq-common-catalog`).
- **Same** underlying settings keys / builder blocks for every common theme — sirf preset colors, typography, and default section order differ.
- Merchant ka theme settings doc = **single source** for panel names, AR/EN fields, image slots, links (aligned with `docs/31-page-builder-theme-customizer-execution.md`).

---

## 3. Subscription ↔ theme entitlements

### 3.1 Monthly tiers (SAR) + billing periods

| Plan code | Monthly SAR | Included common themes | Notes |
|-----------|-------------|------------------------|-------|
| `starter` | **100** | 1 included (merchant picks once from Starter list) | Trial → paid per `docs/16-phase2.7-subscriptions.md` |
| `pro` | **300** | Starter pack + **Pro** common themes (full builder) | Aligns existing `Plans.php` `pro` @ 300 SAR |
| `premium` | **500** | **All** common themes in marketplace marked `included_in: premium` | **Hostinger + domain free for first 20** Premium stores (Master) |

**Billing periods (all paid plans + monthly add-ons):**  
1 month = list price · **6 months = −15%** · **12 months = −25%** (`SouqBilling::priceForPeriod`).

**Inactivity:** 30d → warning_1 · 60d → warning_2 · 90d → Master may **terminate** (`SouqBilling::inactivityForStore`).

**Hosting / domain:** sold by Souq (49/79 SAR tiers). Premium free-hosting slots = 20 platform-wide.

**Implementation note:** `starter` @ 100 SAR may extend `Plans::catalog()` — until then, Master can map trial stores via `custom` + feature flags; **never** fake included themes in UI.

### 3.2 Purchased themes (à la carte)

Each marketplace theme row:

- `theme_id`, `name_ar`, `name_en`, `price_sar`, `included_in_tiers[]`, `is_active`
- Purchase → `store_theme_entitlements` (`store_id`, `theme_id`, `source`: `subscription` | `purchase` | `master_grant`)

**Gating:** `GET /themes-catalog` filters by effective plan + entitlements. Locked themes show **price + Buy** (or Upgrade plan).

### 3.3 Theme switch without data loss

On activate purchased or included theme:

1. Update `stores.active_theme_id` (or theme assignment table).
2. Load default layout JSON for that theme **or** map existing builder layout where block types compatible.
3. **Do not** delete products, categories, orders, customers, shipping zones, payment configs.
4. Publish → invalidate theme cache for that `store_id` only.

---

## 4. Common settings · Page Builder · Customize (foran apply)

| Surface | Behavior |
|---------|----------|
| **Customize Themes** | 18-panel (or lean common subset) — logos, colors, hero, header/footer, WhatsApp, SEO snippets — all `store_id` scoped |
| **Page Builder** | Same block library for all common themes; drag order, enable/disable sections |
| **Publish** | Draft vs published; public storefront updates immediately after publish (versioned media URLs) |
| **New theme bought** | Reuse merchant content bindings where keys match; optional “import branding from current theme” |

Reference execution: `docs/31-page-builder-theme-customizer-execution.md`, coffee panels pattern in `docs/30-coffee-store-theme-settings-execution.md` — **logic shared, coffee look not copied** for common pack.

---

## 5. AI & automation catalog (price-first, unlock after pay)

Every row visible in **Plans & Add-ons** (dashboard) and **Souq marketing site** (public). Empty/disconnected = real empty until credentials + payment.

| Module | Typical model | Feature flags (examples) |
|--------|---------------|---------------------------|
| AI product copy / SKU generator | Credits or SAR pack | `ai`, `openai_mgmt` |
| AI image / studio | Credits | `media_studio`, image usage tables |
| AI store doctor / fix | SAR / month | Master-defined add-on SKU |
| AI WhatsApp sales agent | SAR / month | `whatsapp` + automation config |
| AI voice / calling | SAR / month | Gated add-on (no fake “live”) |
| Social designer + scheduler | SAR / month | `social` + `saudi-canva-social-real.mdc` |
| Prompt-to-widget (builder) | SAR / month | Pro+ preview; full unlock Premium or purchase |

**Starter / Pro / Premium** may **include** different monthly credit caps — show allowance in UI; overage = buy credits (see `docs/28-saas-scalable-architecture-master-blueprint.md` §5C).

Server enforcement: `Plans::effectiveFeatures()`, `StoreAiSuiteAccess`, subscription writable middleware.

---

## 6. Master Admin powers

Master **only**:

- Create / hide common themes in catalog
- Set `included_in_tiers` vs `price_sar`
- Platform **hidden fees** (e.g. payment processing markup) — stored server-side, applied at checkout invoice; **not** merchant-editable
- Grant theme or Pro without payment (`master_grant`)
- Bundle overrides (e.g. website + app 500 SAR) per store or campaign

UI: extend Master **Themes / marketplace / plans** — no second admin shell.

---

## 7. Souq public website ↔ merchant dashboard parity

| Channel | Purpose |
|---------|---------|
| **Public Souq frontend** (marketing) | Pricing tables, theme gallery screenshots, AI add-on SAR, CTA → onboarding |
| **Store dashboard → Plans / Themes** | Same numbers as public site (API-driven, zero mock) |
| **Post-login** | Included themes unlocked; others show lock + pay |

i18n: AR = Arabic only, EN = English only (`no-language-mix.mdc`).

---

## 8. Technical touchpoints (inspect → extend)

| Area | Path |
|------|------|
| Plan catalog | `apps/api/app/Support/Plans.php` |
| Subscriptions | `docs/16-phase2.7-subscriptions.md`, `subscription.writable` |
| Theme API | `StoreThemeController`, `/themes-catalog` |
| Registry | `src/themes/registry.ts` — register `souqCommon/*`; **change default fallback** for unknown stores to first entitled common theme, **not** `meccaGifts` |
| Dashboard UI | Store Themes tab, Plans & billing, AI suite screens |
| Master | Themes marketplace, plan grants, fee config |

---

## 9. Phased delivery (suggested)

| Step | Deliverable | Gate | Status |
|------|-------------|------|--------|
| **CT-1** | Doc + rule locked (this file) | Owner sign-off | **DONE** |
| **CT-2** | `starter` 100 SAR in `Plans.php` + SPA mirror + ENUM/seed | `/plans` returns starter @ 100 | **DONE** |
| **CT-3** | `store_theme_entitlements` + catalog annotate + switch gate | Isolation A ≠ B · `ThemeEntitlementCatalogTest` | **DONE** (code) — Hostinger SQL `14_starter_theme_entitlements.sql` pending deploy ask |
| **CT-4** | First `theme-souq-common-*` pack + schema from `ثيمات المتجر` | `docs/37` + registry default ≠ flora | **DONE** (code) |
| **CT-5** | Marketplace purchase / Master grant → entitlement | `POST /themes/{id}/purchase` | **DONE** (code; Master confirms pay) |
| **CT-6** | Public Souq pricing/themes pages = API | `/storefront/marketplace/*` | **DONE** (code) |
| **CT-7** | AI add-on matrix parity dashboard + public | `SouqAddOns` + `/marketplace/addons` | **DONE** (code) |

Do not skip **CT-3** before showing “included” badges.

---

## 10. Agent prompt (copy for new Cursor tasks)

```text
Read AGENTS.md and .cursor/rules/souq-common-theme-subscription-lock.mdc + docs/36-souq-common-theme-subscription-marketplace.md.

Context: Souq Platform KSA, 50-store target. Pilots flowers/coffee/car stay flagship-locked.
All NEW stores use theme-souq-common-* with ONE shared settings/page-builder schema (merchant theme doc).
Entitlements: 100 SAR starter = 1 common theme; 300 SAR pro = pro common pack + builder; 500 SAR premium = all included commons.
Extra themes = paid marketplace per store_id. Switching theme must NOT wipe products/orders.
AI/WhatsApp/social/voice modules: show SAR pricing everywhere; unlock only after plan/add-on payment (API enforce).
Master owns hidden fees and grants. Public Souq site and merchant dashboard must show same API prices (zero mock).
Inspect → reuse StoreThemeController, Plans.php, registry.ts, VisualThemeBuilder — no UI rebuild.
AR/EN chrome isolated. End Ho gaya/Baqi with live probe if commerce touched. Deploy only if user asks.
```

---

## 11. Related documents

- `docs/28-saas-scalable-architecture-master-blueprint.md` — monetization & AI credits  
- `docs/31-page-builder-theme-customizer-execution.md` — builder steps  
- `docs/16-phase2.7-subscriptions.md` — lifecycle  
- `docs/23-storefront-themes-elementor-customizer-guide.md` — merchant UX map  
- `.cursor/rules/page-builder-theme-customizer.mdc`  
- `.cursor/rules/multistore-ops-backup-plans.mdc`

---

## 12. Acceptance checklist (SQA)

- [ ] New test store on Pro sees only Pro-included + locked priced themes  
- [ ] Purchase theme → appears in gallery without catalog loss  
- [ ] Customize + publish updates live storefront < 1 min (cache bust)  
- [ ] AI module locked shows SAR; after grant/pay, same session sees unlock  
- [ ] Master hidden fee appears on platform invoice only, not merchant-forged  
- [ ] Public Souq page SAR matches `GET /plans` for same locale  
- [ ] `resolveStoreTheme` does not assign flora/coffee/car to random new `store_id`

**Status:** CT-1–CT-7 **DONE** in repo. Source theme settings doc: `docs/_incoming/store-themes-doc.txt` + `docs/37-souq-common-theme-settings-schema.md`. Live Hostinger SQL `14_*` + `15_*` + API deploy = **only when user asks**. Customizer UI panels for every doc control = incremental (schema locked).