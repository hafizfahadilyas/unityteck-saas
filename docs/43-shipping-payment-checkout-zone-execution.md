# 43 — Shipping · Payment · Checkout zone execution (SPC)

**Rule (lifetime):** `.cursor/rules/shipping-payment-checkout-zone-lock.mdc`  
**Guide:** `SHIPPING_COURIER_PAYMENT_INTEGRATION_GUIDE.md`  
**Stores:** `store-1` (flowers) · `store-coffee` · `store-bleco` · future tenants  

**Law:** Har step **DONE** sirf jab us step ka **Test gate PASS**. Fail → next mat shuru. Purana bug dubara mat lao.

**Owner deploy ask (this track):** ultra-fast delta after SPC-06 gate.

---

## SPC-00 — Baseline + lock

| | |
|--|--|
| **Do** | Rule + this doc + docs index link. Record live baseline: zones exist, calculate `matched_zone` null (pre-fix bug). |
| **Test gate** | Rule file exists · doc linked from `00-DOCS-INDEX.md` |
| **Status** | DONE |

---

## SPC-01 — Live calculate uses `shipping_zones`

| | |
|--|--|
| **Bug** | `public/api/commerce.php` calculate returned methods only; always `matched_zone: null` — dashboard Makkah 20/25/40 never hit checkout. |
| **Fix** | Load zones · AR/EN city match · kg/km/free_above · return `matched_zone` + `calculated_shipping_fee` from zone when matched. |
| **Code** | `public/api/commerce.php` |
| **Test gate** | After deploy: `POST …/storefront/shipping/calculate` city `مكة المكرمة` · `matched_zone` non-null when Makkah zones exist · fee reflects zone rate |
| **Status** | DONE (code) · live after SPC-07 |

---

## SPC-02 — Laravel ShippingController parity

| | |
|--|--|
| **Bug** | City `مكة` did not match zone names like `Makkah - Al-Aziziyah…`. |
| **Fix** | Makkah blob match on name/region (same as commerce). |
| **Code** | `apps/api/app/Http/Controllers/Api/ShippingController.php` |
| **Test gate** | Same calculate contract on Laravel path when used |
| **Status** | DONE (code) · live after SPC-07 |

---

## SPC-03 — Flowers checkout city → fee

| | |
|--|--|
| **Bug** | Hardcoded `مكة المكرمة`; auto-picked Free method → summary 0; city/district ignored. |
| **Fix** | `setCheckoutShippingCity` from city+district; skip `type=free` for auto fee; prefer zone rate floor. |
| **Code** | `src/themes/meccaGifts/context/AppContext.tsx` · `…/pages/CheckoutPage.tsx` |
| **Test gate** | UI build · after deploy: set city Makkah → summary shows zone fee (not silent Free) |
| **Status** | DONE (code) · live after SPC-07 |

---

## SPC-04 — Coffee + Bleco checkout parity

| | |
|--|--|
| **Do** | Coffee already uses `CheckoutShippingMethods` + calculate. Bleco uses `calculated_shipping_fee` — ensure zone-aware fee after API fix; no invent fees. |
| **Code** | `coffeeRoasters/CheckoutPage.tsx` · `saudiaTransport/SaudiaTransportThemeView.tsx` (verify/adjust) |
| **Test gate** | Coffee calculate Makkah → methods + fees · Bleco city change updates fee from API |
| **Status** | DONE (code) · live after SPC-07 |

---

## SPC-05 — Payments real-only

| | |
|--|--|
| **Do** | Confirm storefront methods only from connected gateways; no Instant Connected without DB row. |
| **Test gate** | `GET /storefront/payments/methods` per store · only enabled/connected · COD/bank only if rows exist |
| **Status** | DONE (live probe 200 · mada/apple/card/tabby/tamara/cod present; coffee + bank_transfer) |

---

## SPC-06 — Smoke script + build gate

| | |
|--|--|
| **Do** | `scripts/smoke-shipping-zone-calculate.mjs` · secrets scan on changed paths · commit SPC files only |
| **Test gate** | Smoke script exits 0 against live after deploy · no secrets in commit |
| **Status** | DONE (script + commit) · live smoke after SPC-07 |

---

## SPC-07 — Ultra-fast deploy + live re-probe

| | |
|--|--|
| **Do** | `deploy:api` / hotfiles flowers+central · `deploy:fast:flowers` + `deploy:fast:central` · re-run Makkah calculate + payments smoke |
| **Test gate** | Live `matched_zone` set · fee matches zone · payments OK · health MySQL |
| **Status** | PARTIAL — API hot deploy LIVE (Makkah/Jeddah/districts verified). Flowers UI delta FTP flaky (ECONNRESET / competing `delta:all` lock). Re-run `npm run deploy:fast:flowers` + `deploy:fast:central` when FTP stable. |

---

## Never-again checklist (agent)

- [ ] Calculate reads **zones + methods**
- [ ] Checkout fee follows **customer city**
- [ ] No auto Free override when paid zone applies
- [ ] Payments/couriers never fake Connected
- [ ] Live probe before claiming Ho gaya
