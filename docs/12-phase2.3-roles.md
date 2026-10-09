# Phase 2.3 — Roles catalog + API enforce (LOCKED)

**Date:** 2026-09-29  
**Rule:** Inspect → extend — no Holst rebuild; frontend hide ≠ security.

## Canonical roles

| Slug | Label | Portal |
|------|-------|--------|
| `super_admin` | Super Admin | master |
| `admin` | Admin | store |
| `manager` | Manager | store |
| `developer` | Developer | store |
| `seo` | SEO | store |
| `marketing` | Marketing | store |
| `content` | Content | store |
| `sales` | Sales | store |
| `support` | Support | store |

Legacy aliases still normalize: `master_admin`→`super_admin`, `store_manager`→`manager`, `store_staff`→`support`, `store_viewer`→`viewer`.

## Shipped

| Item | Detail |
|------|--------|
| Catalog | `App\Support\Roles` + SPA `src/auth/roles.ts` |
| Schema | `users.role` → `VARCHAR(64)` · migration `2026_09_29_230000_expand_user_roles` |
| Middleware | `role.can:{ability}` · alias in `bootstrap/app.php` |
| Routes | All commerce/master store routes: `auth:sanctum` + ability gate |
| Auth payload | login/`me` return `role_label`, `role_level`, `abilities` |
| Catalog API | `GET /api/auth/roles?portal=store\|master` |
| Seed | Master `super_admin` · Tariq `manager` · `support@wardalmakkah.sa` support |
| Chrome | Soft role pill in Holst top bar (no new screen) |

## Ability examples

- Support: `products.read` OK · `products.write` → **403**
- Manager/Admin: full store module set
- Super Admin: `stores.*` + `*`

## Golden rules

- Design: no invent — extend chrome only  
- Code: one Roles source · middleware reuse  
- Security: API enforce on writes/reads for tenant routes  
- Ultra-fast: session abilities cached in local auth session (no full reload)

## Not in this slice

- Team invite UI / role assigner screens (settings later)  
- Deeper per-module UI gating polish (**2.4** continues)  
- Real mailer for team invites (6.5)

## Smoke QA

1. Master login → role pill **Super Admin** · stores API OK.  
2. Store manager login → products write OK.  
3. `support@wardalmakkah.sa` / `password` → products POST → **403**.  
4. Legacy `master_admin` rows still login after migrate normalize.  
5. Soft SPA — no full page freeze on deny (toast/error from API client).
