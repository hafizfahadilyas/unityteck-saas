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
| STEP 11 | `visitorsCount` mapper + `souq_store_payload` + resolve-domain force 0; DB purge seeded Bleco 80000 on resolve |
| STEP 12 | Live robots `Disallow: /src/` · smoke sitemap host-scoped · RobotsTxtGuard · no Instant GTM |

## Tests

- PHPUnit: `TrafficSourceNormalizeTest` + `RobotsTxtGuardTest`
- Vitest: `trafficSource.test.ts`

## Deploy note

Hostinger live still needs owner `deploy:api` / `deploy:fast:central` for PHP + UI. GitHub push ≠ Hostinger.

## Follow-up (2026-11-27 evening)

| ID | Fix |
|----|-----|
| STEP 7 | Gift card deduct + loyalty points redeem on order; gift `valid` contract; loyalty redeem API |
| STEP 8 | selected_options already persist on order lines (coffee/bleco) |
| STEP 9 | WhatsApp notify on storefront create; Bleco WA links → mieraf `/bleco` |
| STEP 10 | Invoice paid only from payment_status (not completed alone) |
| STEP 13 | Abandoned carts accept begin_checkout + checkout_started |
| STEP 14 | `scripts/smoke-commerce-a2z-lifetime.mjs` |

Manual: 1 logged-in order × Flowers/Coffee/Bleco after Hostinger deploy.
