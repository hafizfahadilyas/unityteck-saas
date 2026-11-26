---
name: release-gate-trio
description: >-
  Before claiming Ho gaya on storefront/checkout/customer/auth/shipping changes,
  run Gitleaks + live API smoke + npm run build. Use on every commerce slice.
---

# Release gate trio (project)

## When

After changes to: storefront checkout, customer profile, shipping calculate, coupons/gift cards, payments UI, or customer auth.

## Steps (in order)

1. **Gitleaks** — scan changed paths; fail on secrets in UI/logs/commits.
2. **Live smoke** (read-only):
   - `GET /api/health` → 200
   - `POST /api/shipping/calculate` with target `store_id`, city, `product_ids` → `available_methods` non-empty when DB has methods
   - `POST /api/storefront/coupons/validate` when coupons enabled
3. **Build** — `npm run build` and `npm run lint` with zero errors.

## Ban

- Claiming done without build passing.
- Showing admin links or mock shipping on public checkout.

## Report (Roman Urdu)

End with **Ho gaya** / **Baqi** + trio status.