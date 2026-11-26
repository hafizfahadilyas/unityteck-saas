# 32 · UTM & Marketing Analytics — Audit & Implementation

**Status:** Phase 1 live-wired (2026-11-24) · Hostinger gateway (`commerce.php`) + React UI · MySQL `store_utm_links` auto-ensured.

## 1. Audit summary (existing before this slice)

| Area | Status | Location |
|------|--------|----------|
| UTM link builder UI | **Partial** | `UtmCampaignBuilder.tsx` under SEO → `utm` tab; URLs generated client-side |
| Saved campaigns | **Partial / wrong store** | Was `localStorage` only — not MySQL |
| Storefront event tracking | **Complete** | `storefrontAnalytics.ts` → `POST /storefront/events` |
| Attribution capture | **Partial** | `trafficSource.ts` session-only; no first-touch persistence |
| Orders UTM fields | **Complete** | `source`, `medium`, `campaign`, `utm_term`, `utm_content` |
| First / last touch on orders | **Missing** | No DB columns until migration `2026_11_24_120000_*` |
| GA4 per store | **Complete** | `GoogleIntegrationController`, `StoreAnalytics.tsx` |
| Campaign reports | **Complete** | `AnalyticsReportController::campaignAnalytics`, `ReportsCampaigns.tsx` |
| Channel overview | **Complete** | `MarketingCampaignsController`, `StoreChannelPerformance.tsx` |
| Dedicated marketing dashboard KPIs | **Partial** | Split across Dashboard, Analytics, Reports |
| Store isolation | **Complete** | `forStore()` / `requireStoreId()` on analytics APIs |

## 2. Implemented in this slice

- **Migration:** `store_utm_links`, order attribution columns, optional `visitor_key` on events.
- **APIs:** `GET/POST/DELETE /utm-links`, `GET /analytics/marketing`.
- **Models:** `StoreUtmLink`.
- **Attribution:** First-touch `localStorage` per `store_id`; last-touch session; checkout sends both.
- **UTM builder:** Platform presets (WhatsApp group/broadcast, Meta, Snap, TikTok, Telegram, Google Ads, Email, Influencer, QR, Other), product picker, MySQL save.
- **UI:** `StoreMarketingAnalytics` on Analytics tab (internal vs GA4 labeled).

## 3. Remaining (Phase 2)

- Master cross-store marketing overview (authorized SuperAdmin only).
- Payment redirect attribution (Tamara/Tabby return URLs) — server-side session if needed.
- Privacy/consent gate before `visitor_key` persistence (KSA PDPL).
- PHPUnit + E2E automation for two-store isolation.
- Optional: dual-write gateway `analytics_events` ↔ Laravel `storefront_analytics_events` if a pure-Laravel path is enabled later.

## 3b. Live verify (2026-11-24)

- `GET /api/utm-links` + `GET /api/analytics/marketing` → **200** on mieraf (coffee) + giftshop (store-1).
- `POST /api/utm-links` → **201**; store-1 list stays empty (isolation).
- SPA `index-B9mTN3No.js` **200** (previous broken `index-BTf_zFja.js` 404 fixed by deploy:fast).
- Custom date range UI wired on `StoreMarketingAnalytics`.

## 4. Test checklist (manual)

1. Generate WhatsApp link → open in incognito → verify `page_view` with `utm_*` in DB.
2. Complete order → `orders` row has last-touch + first-touch (after migration).
3. Second visit with different UTM → first-touch unchanged on new order.
4. Store A admin cannot pass Store B `store_id` on `/utm-links` (auth middleware).
5. Analytics → Souq Marketing section shows sessions/orders from API (empty if no events).

## 5. Deploy note

After user asks deploy: `npm run deploy:api` + `deploy:fast:*` for UI; run `php artisan migrate` on Hostinger for new tables/columns.