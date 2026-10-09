# Phase 2.4 — Module permissions UI gates (LOCKED)

**Date:** 2026-09-29  
**Depends on:** Phase 2.3 `role.can` API + abilities on session  
**Rule:** UI hide = hint only · API remain source of truth.

## Shipped

| Item | Detail |
|------|--------|
| Module map | `src/auth/modules.ts` — tab → read ability · module → write ability |
| Hook | `usePermissions()` — `can` / `canTab` / `canWrite` / `firstAllowedTab` |
| Sidebars | Master + Store nav filtered by `canTab` (Holst chrome unchanged) |
| Soft redirect | Denied tab → first allowed + toast (no full reload) |
| Products write | Add / publish gated by `products.write` |
| Staff footer | Store sidebar shows real session name + role label |

## Golden rules

- Design same-to-same — no new screens / no invent menus  
- Ultra-fast — soft SPA tab switch + toast ~3–4s  
- Security — frontend hide ≠ security; API `role.can` still blocks  
- Code — one modules map + one hook; no duplicate permission matrices

## Smoke QA

1. Login as **manager** — full store nav · Add Product works.  
2. Login as **support@wardalmakkah.sa** — coupons/SEO/themes/settings **hidden**; products list visible; Add Product **disabled** + toast.  
3. Force `storeTab` to denied module → soft jump + `noPermissionTab` toast.  
4. Master Super Admin — full master nav.  
5. No `location.reload()` on deny.

## Not in this slice

- Team invite / role assigner UI (settings later)  
- Every commerce screen write button (extend pattern as Phase 3 wires CRUD)  
- Plan feature flags (2.6)
