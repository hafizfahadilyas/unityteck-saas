# 00 — Docs Index (Complete Project Arrangement)

**Brand:** منصة سوق / Souq Platform · Unityteck KSA multi-store SaaS  
**Agent entry:** repo root `AGENTS.md` · Always-on: `.cursor/rules/*.mdc`  
**Handoff:** `docs/00-AI-HANDOFF.md`

Yeh index **poori docs folder** ko task ke hisaab se arrange karti hai. Naye agent / owner pehle yahan se relevant file kholen — har cheez mat padhein.

---

## A) Start here (always)

| Order | File | Why |
|------:|------|-----|
| 1 | `../AGENTS.md` | Live hosts, locks, commands, docs map |
| 2 | `.cursor/rules/*.mdc` | Deploy / i18n / zero-mock / coffee / Souq common (auto) |
| 3 | `00-master-project-goal.md` | North star — UI rebuild banned |
| 4 | `01-phases-and-golden-rules.md` | Phases + golden rules |
| 5 | `02-tech-stack-no-vps.md` | Hostinger + Vite + Laravel + Next (no VPS) |
| 6 | **This file** | Find the right doc fast |

---

## B) Themes · Page Builder · Marketplace (post-pilot)

| File | Use when |
|------|----------|
| **`38-souq-common-themes-steps-stores-domains.md`** | **Owner steps:** flowers/coffee/car vs common; kis domain pe; kaise banaye / buy / activate |
| `36-souq-common-theme-subscription-marketplace.md` | Policy: 100/300/500, entitlements, AI price-first, Master powers |
| `37-souq-common-theme-settings-schema.md` | Shared Customize panels (ثيمات المتجر.docx) |
| **`41-souq-default-template-theme-execution.md`** | **Step SDT-xx: `store-souq-default` template → all new merchants** |
| `31-page-builder-theme-customizer-execution.md` | Builder step status PB-xx |
| `09-visual-theme-builder.md` | Concept / builder vision |
| `23-storefront-themes-elementor-customizer-guide.md` | Storefront customizer guide |
| `30-coffee-store-theme-settings-execution.md` | **Flagship coffee only** |
| `32-coffee-theme-docs-page-builder-execution.md` | Coffee builder docs |
| `33-coffee-doc-full-recheck-execution.md` | Coffee recheck |
| `34-coffee-20-elements-widget-parity.md` | Coffee widgets |
| `20-flowers-premium-theme.md` | **Flagship flowers** |
| `32-alsaeedi-vip-execution.md` | **Flagship car / Bleco** |
| `designs/Common_Theme_Settings_UIUX/` | Common theme UI refs |
| `designs/Theme_Settings_UIUX/` | Theme settings packs |

**Rule:** `.cursor/rules/souq-common-theme-subscription-lock.mdc` · `coffee-frontend-ui-lock.mdc` · `page-builder-theme-customizer.mdc`

---

## C) Master · Plans · Onboarding · Auth

| File | Use when |
|------|----------|
| `15-phase2.6-plans.md` | Plan limits / features |
| `16-phase2.7-subscriptions.md` | Subscription lifecycle |
| `14-phase2.5-onboarding.md` | Invite → new `store_id` |
| `11-phase2.2-auth-reset.md` | Auth / reset |
| `12-phase2.3-roles.md` | Roles |
| `13-phase2.4-module-permissions.md` | Module permissions |
| `28-saas-scalable-architecture-master-blueprint.md` | Scale / AI credits blueprint |
| **`39-souq-ai-ecosystem-phases.md`** | **AI / social / marketplace 13 phases tracker** |

---

## D) Commerce · Catalog · Shipping · Pay

| File | Use when |
|------|----------|
| `17-phase3.1-products.md` | Products |
| `18-phase3.2-variations.md` | Variations |
| `19-phase3.3-categories.md` | Categories |
| `SHIPPING_COURIER_PAYMENT_INTEGRATION_GUIDE.md` | Shipping / courier / pay |
| **`43-shipping-payment-checkout-zone-execution.md`** | **SPC-xx: zones → calculate → checkout fee + payments (lifetime lock)** |
| **`42-commerce-a2z-bugfix-steps.md`** | **A–Z commerce bug steps + test gates** (Bleco `/bleco` temp path) |
| `25-marketing-hub-campaigns-and-promotions-guide.md` | Marketing hub |
| `26-reporting-business-intelligence-and-analytics-guide.md` | Reports / BI |
| `32-utm-marketing-analytics-audit-implementation.md` | UTM / attribution |

---

## E) SEO · Zero-mock · Quality · UI

| File | Use when |
|------|----------|
| `24-seo-architecture-and-store-instructions.md` | Per-store SEO |
| `29-dashboard-zero-mock-fix-plan.md` | Kill fake KPIs |
| `04-uiux-audit-dashboard-rules.md` | Dashboard UI audit |
| `10-sqa-quality-seo-auditor.md` | SQA / SEO auditor |
| `21-uiux-same-to-same-steps.md` | Pixel same-to-same |
| `22-pixel-perfect-roadmap.md` | Pixel roadmap |
| `05-requirements-gap-matrix.md` | Requirements gaps |

---

## F) Ops · Hosting · Migration · Status

| File | Use when |
|------|----------|
| `03-multistore-media-backup-plans.md` | Media / backup / plans quotas |
| `33-flowers-to-central-hostinger-migration.md` | Flowers → central Hostinger |
| `GITHUB_ACTIONS_HOSTINGER_SETUP.md` | CI → Hostinger |
| `ENTERPRISE_MULTI_STORE_EXECUTION_TRACKER.md` | Enterprise tracker |
| `PROJECT_STATUS_AND_CHANGELOG.md` | Status / changelog |
| `33-integration-health-audit-report.md` | Integration health audit |

---

## G) Souq Plus platform phases

| File | Phase |
|------|-------|
| `32-souq-plus-phase1-gap-matrix.md` | Phase 1 gaps |
| `33-souq-plus-phase2-5-roadmap.md` | Phases 2–5 |
| `34-souq-plus-phase6-9-roadmap.md` | Phases 6–9 |
| `35-souq-plus-phase10-11-test-deploy.md` | Phases 10–11 test/deploy |

---

## H) Foundation / lock / handbook

| File | Use when |
|------|----------|
| `06-phase0-inspect-lock.md` | Inspect lock |
| `07-phase1-foundation.md` | Foundation |
| `08-client-scope-lock.md` | Client scope |
| `27-ai-and-developer-master-handbook-roman.md` | Broad Roman Urdu handbook |
| `00-AI-HANDOFF.md` | Cursor account transfer |

---

## I) Live hosts (quick)

| Host | Role |
|------|------|
| `mieraf-ksa.com` | Central API + coffee + Master |
| `mieraf-ksa.com/master` | SuperAdmin only |
| `giftshop-sa.com` | Flowers flagship storefront `/admin` |
| `souq.mieraf-ksa.com` | Public Souq marketing / pricing |

SQL helpers: `database/hostinger/14_starter_theme_entitlements.sql`, `15_souq_common_themes.sql`.

---

## J) Incoming / media (support)

| Path | Notes |
|------|--------|
| `docs/_incoming/store-themes-doc.txt` | Extract from ثيمات المتجر.docx |
| `docs/_incoming/store-themes-media/` | Full theme settings screenshots |
| `designs/` | Pixel truth (Master / Store / Login / Common Theme) |

---

## K) Merchant Settings Guides (SEO & Bilingual Knowledge Base)

| Path | Purpose |
|------|---------|
| `docs/merchant-settings-guides/INDEX.md` | **Master Merchant Settings Guide Index** (AR & EN) |
| `docs/merchant-settings-guides/01-store-identity-and-general-settings.md` | Store Name, Logos, Favicon, Taglines, Support Email, Cache Purging |
| `docs/merchant-settings-guides/02-localization-currencies-and-timezones.md` | SAR Currency, Multi-currency, Asia/Riyadh GMT+3, RTL/LTR Switcher |
| `docs/merchant-settings-guides/03-appearance-colors-fonts-and-chrome.md` | 15 Brand Palettes, Glass Wallpaper, Blur/Opacity, 15 Google Arabic Fonts |
| `docs/merchant-settings-guides/04-social-channels-and-whatsapp-hub.md` | Floating WhatsApp Chat Bubble, Pre-filled Greeting, Social Links |
| `docs/merchant-settings-guides/05-subscription-plans-and-workspace.md` | Free/Pro/Premium Tiers, Product Quotas, License Status, Hostinger DB Sync |
| `docs/merchant-settings-guides/06-maintenance-mode-and-launch-countdown.md` | Under Construction Lock, Launch Countdown Timer, Lead Capture Box |
| `docs/merchant-settings-guides/07-google-search-console-seo-and-tag-manager.md` | Google OAuth, Sitemap Ping, Robots.txt, GA4 & GTM Containers |
| `docs/merchant-settings-guides/08-inventory-thresholds-and-stock-alerts.md` | Low-Stock Warnings, Safety Stock Buffer, Out-of-Stock Display Rules |
| `docs/merchant-settings-guides/09-whatsapp-sms-notifications-and-saudi-gateway.md` | +966 Saudi SMS (Unifonic), WhatsApp Order Alerts, Tracking Link Triggers |
| `docs/merchant-settings-guides/10-payment-gateways-mada-apple-pay-and-bnpl.md` | Mada, Apple Pay, STC Pay, Tamara BNPL, Tabby, Saudi IBAN Transfer |
| `docs/merchant-settings-guides/11-shipping-zones-couriers-and-thermal-labels.md` | Saudi Zones, SMSA, Aramex, SPL, 4×6 Thermal Label Studio, Returns |
| `docs/merchant-settings-guides/12-custom-domain-dns-and-ssl-hosting.md` | Custom Domain (.sa/.com), CNAME & A Records, Free Let's Encrypt SSL |

---

**Rule of thumb:** Flagship look → coffee/flowers/car docs. **Naya store** → `38` + `36` + `37`. Merchant settings → `docs/merchant-settings-guides/`. Deploy → user ask + `ultra-fast-delta-deploy.mdc`.
