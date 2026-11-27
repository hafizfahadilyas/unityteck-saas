# 42 — Commerce A–Z bug fix steps (mandatory test gate)

**Brand:** منصة سوق · Flagships: Flowers / Coffee / Bleco  
**Bleco public (temporary):** `https://mieraf-ksa.com/bleco` until custom domain hung  
**Rule:** Har step **DONE** tabhi jab us step ka **Test gate PASS**. Fail → next step **mat** shuru.

**Deploy:** Sirf jab owner bole (`deploy:api` / `deploy:fast:central` …).

---

## STEP 0 — Bleco path on central (NOW)

| | |
|--|--|
| **Fix** | `/bleco` → `store-bleco`; resolve-domain `path` wins over coffee apex; remember later domain hang |
| **Code** | `DomainController`, `public/api/index.php`, `resolveDomainApi`, `domainRoutingService`, rule `bleco-temp-path-until-domain.mdc` |
| **Test gate** | `GET …/resolve-domain?domain=mieraf-ksa.com&path=/bleco` → `store_id=store-bleco` · bare domain → coffee · `GET https://mieraf-ksa.com/bleco` → 200 + Bleco theme · products `store_id=store-bleco` |
| **Status** | DONE in repo (2026-11-27) — **live after deploy** |

---

## STEP 1 — Orders API auth lock (PII) — DONE (repo)

| | |
|--|--|
| **Bug** | `GET /api/orders?store_id=…` bina merchant auth → names/phones/emails |
| **Fix** | Merchant Bearer required on commerce orders/customers; public only storefront track/mine/create (with login) |
| **Test gate** | Unauth GET orders → **401** · live after deploy |

---

## STEP 2 — Login-required checkout (policy) — DONE (repo)

| | |
|--|--|
| **Bug** | Coffee + API guest order allow; owner: login ke baad hi order |
| **Fix** | allowGuest default false; Coffee/Bleco/Flowers require sf customer; API 401 without customer_id |
| **Test gate** | Bina login Place Order fail · live after deploy |

---

## STEP 3 — Coupon validate contract — DONE (repo)

| | |
|--|--|
| **Bug** | UI `cart_total` + expects `valid`; `commerce.php` uses `total` + returns `{data}` only |
| **Fix** | Align PHP + Laravel: accept `cart_total`/`total`; response `{ valid, discount, data }` |
| **Test gate** | BARISTA15 + cart_total 500 → `valid:true` · live after deploy |

---

## STEP 4 — Order source / attribution (no fake Google Ads) — DONE (repo)

| | |
|--|--|
| **Bug** | `utm_source=google` / organic → labeled Google Ads; seed orders fake sources |
| **Fix** | Ads only if `gclid` or utm_medium=cpc/paid; else Organic Search / Direct / Referral |
| **Test gate** | Unit tests PASS · live probe after deploy |

---

## STEP 5 — Payment status truth — DONE (repo)

| | |
|--|--|
| **Bug** | Client sends paid; completed + payment_status pending; amount_paid 0 |
| **Fix** | Online = pending until gateway verify; storefront never sends paid |
| **Test gate** | New orders payment_status pending · live after deploy |

---

## STEP 6 — Shipping + tracking sync — DONE (repo, status→shipping_status)

| | |
|--|--|
| **Bug** | Completed orders still shipping_status pending, no tracking |
| **Fix** | Dashboard status change syncs shipping_status when omitted |
| **Test gate** | PATCH status=shipped → shipping_status shipped · live after deploy |

---

## STEP 7 — Gift card + loyalty redeem — DONE (repo)

| | |
|--|--|
| **Bug** | UI exists; loyalty rewards empty; redeem path weak |
| **Fix** | Order create deducts gift card + loyalty points; gift validate returns `valid`; `/storefront/{id}/loyalty/redeem` |
| **Test gate** | smoke gift valid:false · redeem preview · live after deploy |

---

## STEP 8 — PDP customize / product_options — DONE (repo wire)

| | |
|--|--|
| **Bug** | Many SKUs have empty options → picker never shows |
| **Fix** | Order lines persist `selected_options` (coffee/bleco already send); picker on products with options |
| **Test gate** | Order item with options JSON when merchant configured options |

---

## STEP 9 — WhatsApp order notify + auto-reply — DONE (repo)

| | |
|--|--|
| **Bug** | Hooks exist; Connected without live Meta/Wasapi = unverified |
| **Fix** | Storefront order create fires `souq_notify_order_whatsapp`; skips if not connected; Bleco links → `/bleco` |
| **Test gate** | Not Connected → skipped · Connected → Meta Cloud send |

---

## STEP 10 — Invoice Arabic + association — DONE (repo)

| | |
|--|--|
| **Bug** | Invoice marked paid from completed status alone |
| **Fix** | Invoice paid only when payment_status paid/captured; sync from real orders; seed demos filtered |
| **Test gate** | completed+pending pay → invoice pending |

---

## STEP 11 — Fake KPI / visitors purge — DONE (repo)

| | |
|--|--|
| **Bug** | Bleco `visitors_count: 80000` invented |
| **Fix** | `souq_store_payload` + resolve-domain force `visitors_count=0` + DB purge on resolve; FE mapper never trusts column; dashboard = analytics events |
| **Test gate** | smoke `bleco visitors_count not seeded fake` · empty events → 0 |

---

## STEP 12 — SEO robots / meta / GTM / PSI — DONE (repo + live robots)

| | |
|--|--|
| **Bug** | flowers robots `Allow: /src/` · GTM/PSI not verified this audit |
| **Fix** | Per-host robots (`Disallow: /src/`); `RobotsTxtGuard` + smoke sitemap host-scoped; GTM only when merchant connected (no Instant) |
| **Test gate** | smoke robots/sitemap PASS · no fake Lighthouse scores |

---

## STEP 13 — Marketing · abandoned cart · reports — DONE (repo)

| | |
|--|--|
| **Bug** | Funnel/abandon need real events; channel ≠ traffic mixups |
| **Fix** | Abandoned accepts checkout_started + begin_checkout; attribution Ads rules fixed (STEP 4) |
| **Test gate** | smoke + abandoned empty when no events |

---

## STEP 14 — Cross-store E2E gates — DONE (smoke script)

| | |
|--|--|
| **Scope** | `scripts/smoke-commerce-a2z-lifetime.mjs` — health, bleco path, auth lock, guest block, coupon, gift, robots |
| **Test gate** | Script PASS after deploy · manual 1 logged-in order × 3 stores still recommended |

---

## Later (owner) — Bleco domain hang

1. Final domain DNS + Hostinger  
2. Update `custom_domain` / domains table  
3. Probe `https://{domain}/api/health` → 200 mysql  
4. Keep `/bleco` as alias or redirect  

---

## How to run

1. Owner: **“STEP 0 deploy karo”** (ya `deploy:api` / `deploy:fast:central`)  
2. Agent: STEP 0 test gate → mark DONE in this file  
3. Next: **STEP 1** only — rinse / repeat  
---
