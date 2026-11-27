# Changelog — Commerce A–Z lifetime fixes (2026-11-27)

**Goal:** Bugs from QA audit never recur. Guest order / fake Ads / PII leak / coupon mismatch / paid-without-gateway / Bleco path / robots `/src/`.

## Fixed (lifetime)

| ID | Fix |
|----|-----|
| STEP 0 | Bleco public path `https://mieraf-ksa.com/bleco` — resolve-domain `path` wins over coffee apex; rule `bleco-temp-path-until-domain.mdc` (custom domain hang later) |
| STEP 1 | `GET/POST/PATCH /orders` + `GET /customers` on `commerce.php` require merchant Bearer (not `sf|` / mock) |
| STEP 2 | Guest checkout **OFF** by default (API + Coffee/Bleco/Flowers UI). Need logged-in `customer_id` / session. Merchant may set `allowGuest: true` |
| STEP 3 | Coupon validate accepts `cart_total`/`total`/`cartTotal`; returns `{ valid, discount, data }` |
| STEP 4 | Google Ads only with paid signals (`gclid` / cpc / adwords); bare google → Organic Search |
| STEP 5 | Storefront never sends/trusts client `paid` — always pending until gateway |
| STEP 6 | Order status change syncs `shipping_status` when merchant omits it |
| STEP 11 | `visitorsCount` mapper never trusts seeded `stores.visitors_count` (dashboard = analytics events) |
| STEP 12 | Default robots Disallow `/src/` + `/api/`; poison detector already drops `Allow: /src` |

## Tests

- PHPUnit: `TrafficSourceNormalizeTest` + `RobotsTxtGuardTest`
- Vitest: `trafficSource.test.ts`

## Deploy note

Hostinger live still needs owner `deploy:api` / `deploy:fast:central` for PHP + UI. GitHub push ≠ Hostinger.

## Remaining (follow-up slices)

STEP 7 gift/loyalty redeem depth · STEP 8 PDP options catalog seed · STEP 9 WhatsApp live credentials · STEP 10 invoice AR PDF visual · STEP 13 abandoned E2E · STEP 14 logged-in 1-order×3 stores after deploy.
