# Phase 2.5 — Onboarding invite → unique store_id + locale defaults (LOCKED)

**Date:** 2026-09-29  
**Rule:** Extend Master Onboarding + register — do not invent new screens.

## Shipped

| Item | Detail |
|------|--------|
| Invite | Generates **unique `store_id`** at create (reserved until redeem) |
| Prefs on invite | `locale` · `textDir` (LTR/RTL) · `currency` · `timezone` · plan |
| Master UI | Extra selects on existing invite card · table shows store_id + prefs |
| Register | Uses reserved `store_id` · locks plan from invite · shows defaults on review |
| Soft prefs | Wizard applies invite locale/currency (no full reload) |
| Schema | `stores.locale` · `text_direction` · `timezone` (+ existing `currency`) |
| Seed | store-1 = AR / RTL / Asia/Riyadh / SAR |

## Flow

1. Master → Client onboarding → set plan + lang/dir/currency/tz → **Generate link**  
2. Toast shows reserved `store_id` · copy `/store/register?invite=…`  
3. Client registers → isolated store with that `store_id` + defaults  
4. Invite marked used · cannot re-register with same token  

## Golden rules

- Design: extend existing Holst onboarding / register — no invent  
- Ultra-fast: toast + soft pref patch — no `location.reload()`  
- `store_id` isolation from first byte of provision  
- Code: one invites module · registerNewClient extended  

## Not in this slice

- Laravel invite API table (mock localStorage until Hostinger mailer/ops)  
- Plans feature limits enforce (**2.6**)  
- Subscription lifecycle (**2.7**)

## Smoke QA

1. Generate invite with AR + RTL + SAR + Asia/Riyadh → see `store_id` in toast/table.  
2. Open register link → plan locked · defaults panel shows store_id/lang/currency/tz.  
3. Complete register → new store id matches reserved · invite status **Used**.  
4. Re-open same invite → blocked (used).  
5. Master simulate provision also stamps locale defaults.
