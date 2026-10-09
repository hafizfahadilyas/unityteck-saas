# Phase 2.7 — Subscription lifecycle (LOCKED)

**Date:** 2026-09-29  
**Rule:** Extend existing `subscriptions` table — no invent billing UI. API enforce writes.

## Lifecycle

| Status | Writable | Notes |
|--------|----------|-------|
| `trial` | Yes | Before `ends_at` |
| `active` | Yes | Normal paid period |
| `grace` | Yes | Past `ends_at`, within 7-day grace |
| `expired` | **No** | Past grace — reads OK, mutations 403 |
| `suspended` | **No** | Master force — mutations 403 |

**Billing interval:** `monthly` | `yearly`  
**Renew:** extends `ends_at`, clears grace, sets `renewed_at`, status → `active`.

## Shipped

| Item | Detail |
|------|--------|
| Schema | `billing_interval` · `grace_ends_at` · `renewed_at` |
| `App\Support\Subscriptions` | resolve · renew · canWrite |
| Middleware | `subscription.writable` on commerce mutations |
| API | `GET /subscriptions/current` · `PATCH /stores/{id}/subscription` (Master) |
| Plans payload | `subscription` object inside `/plans/current` |
| SPA | `src/auth/subscriptions.ts` · sidebar status badge · products write gate |
| Seed | store-1 active · yearly |

## Golden rules

- Design: badge on existing Holst store sidebar — no new page  
- Ultra-fast: toast on deny — no full reload  
- Security: expired/suspended blocked server-side  
- Code: one Subscriptions support class + SPA mirror  

## Smoke QA

1. Active yearly store — Add Product OK · badge **active**.  
2. Mock set `endsAt` past + no grace → status **expired** · Add Product disabled + toast.  
3. API PATCH renew (Master) → active again.  
4. Status `suspended` → writes 403.  
5. Grace window → writable + badge **grace**.

## Not in this slice

- Payment gateway / invoice PDF for renewals  
- Email expiry reminders (Phase 6.5)  
- Full Master subscription management screen (extend MasterStores later)
