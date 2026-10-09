# Client Scope Lock (UI same-to-same · Golden rules)

**Date:** 2026-09-29  
**Rule:** Existing `designs/` + AI Studio screens = SoT. Connect / extend — **do not rebuild or invent UI**.  
**Related:** `docs/00` · `docs/01` · `docs/05` · `.cursor/rules/*`

---

## Locked product surfaces (all must follow design + golden rules)

### A. Catalog & commerce admin
| Item | Phase | Notes |
|------|-------|--------|
| Products list + insert / edit / delete / update | 3.1 | Advanced table: search, sort, filter, pagination |
| Brands | 3.3b | Store-scoped; reuse category-style patterns |
| Categories / subcategories | 3.3 | Image + SEO + sort |
| Variants / variations | 3.2 | Price / SKU / stock / image per variant |
| Orders list + status workflow | 3.5 | Same table UX as products |
| Bulk order tools (admin) | 3.5b | Bulk status / export where design allows |
| Customers · user profile · CRM | 3.10 | Profile, history, spend, notes, block |
| Payments + COD | 3.9 | Modular; secrets server-only |
| Dashboard + system / store settings | 2 + 6 | Modular sections — not one dump page |

### B. Public storefront pages
| Item | Phase | Notes |
|------|-------|--------|
| Header / footer (theme-driven) | 5.1 + 4 | Theme Settings + Next publish |
| Single product page | 4.3 | Add to cart · buy · WhatsApp |
| Cart page | 3.6 + 4 | No full refresh on qty/price |
| Add to cart | 3.6 + 4 | Optimistic UI + invalidate |
| Checkout + payment card / COD | 3.6 · 3.9 · 4 | Store-configurable fields |
| Order on WhatsApp | 3.6 | Store-configurable message/fields |
| Customer order (guest/account) | 3.6 · 3.10 | |
| Thank-you page | 3.6b | Order confirmation · no fake claims |
| Dummy themes + theme select | 2.5 · 5 | Onboarding seed + Theme Settings 01–18 |
| Theme settings (all project) | 5.1 | `designs/Theme_Settings_UIUX/` 01→18 |
| **Visual Theme Builder** (Elementor-concept) | **5.V** | Full-screen Edit Theme · widgets · DnD · draft/publish · see `docs/09` |
| Updated options (store options) | 5.1 | General / identity / colors / banners… |

### C. Locale · money · chrome
| Item | Phase | Notes |
|------|-------|--------|
| Language (AR/EN+) | 2.5 · 4 | Per-store; hreflang in SEO |
| RTL / LTR | 2.5 · 4 · Holst | `dir` + tokens; no hard-coded LTR-only layouts |
| Multi-currency | 2.5 · 3 · 4 | Store default + display; prices `store_id` |
| Dark / Light | Holst · all admin | CSS variables (`portal-tokens`); no one-off brand colors |

### D. SEO · analytics · Google
| Item | Phase | Notes |
|------|-------|--------|
| SEO admin + public meta/OG/JSON-LD/sitemap/robots | 3 fields · **4.4** | Per-store mandatory public SEO |
| Reports / analytics | 5.4 | Date ranges; order source ≠ traffic source |
| Tracking · UTM / campaigns | 4.7 · 5.4 | Unknown = Unknown/Direct — no fake attribution |
| Google Search Console · indexing hooks | 4.7 | Plan-gated; **no indexing guarantee** |
| Tag Manager · GA | 4.7 | Secrets never on frontend |

### E. Ops · Hostinger · security
| Item | Phase | Notes |
|------|-------|--------|
| Custom domain | 6.1 | + platform subdomain |
| Security (sessions, rate limit, audit, 2FA-ready) | 6.4 | API enforce |
| Backup / restore | 6.3 | Per-store all-in-one ZIP |
| Database migration (store move) | 6.3 | Export/import Master |
| Hostinger ZIP (DB `store_id` + media + config) | 6.3 · `docs/03` | Shared now; future dedicated OK |
| Store App Store / theme marketplace | 5.6 | Catalog of dummy + paid themes; plan-gated install — **extend existing Marketplace UI**, no invent |

---

## Explicit build rules

1. **Design:** `designs/Login_UIUX` · `Master_Admin_UIUX` · `Theme_Settings_UIUX` + existing `src/components/*` — same-to-same.  
2. **Golden:** lean · speed · no full refresh · zero stale · SEO · `store_id` · short modular · NO VPS.  
3. **Slice:** one phase item per prompt — full list = backlog, not one rewrite.  
4. **UI already matching design → do not touch.**

---

## Status vs this lock

| Band | Status |
|------|--------|
| Phase 0–1 foundation | **Done** |
| Phase 2.1 login + Holst | **Done** |
| Rest of this document | **Pending** by phase rows in `docs/01` |
