# Phase 2.2 — Auth reset · OTP stubs · rate limit (LOCKED)

**Date:** 2026-09-29  
**Rule:** Inspect → extend — do not rebuild Holst login (2.1).

## Shipped

| Item | Detail |
|------|--------|
| Forgot password | `POST /api/auth/forgot-password` · throttle **5/min** · no email enum |
| Reset password | `POST /api/auth/reset-password` · revokes Sanctum tokens · TTL 60m |
| OTP stubs | `POST /api/auth/otp/request` + `/verify` · `auth_otps` table · delivery=`stubbed` |
| Login throttle | unchanged **8/min** (2.1) |
| Stub reveal | `dev_token` / `dev_code` only when `APP_DEBUG` or `AUTH_STUB_REVEAL=true` |
| Holst UI | `/master|store/forgot-password` · `/master|store/reset-password` · toast + `aria-busy` |
| Mock fallback | SPA mock reset/OTP when API off |

## Golden rules applied

- Design same-to-same Holst (extend login chrome; no invent)
- Ultra-fast: soft SPA paths · toast · button busy — no full reload / no `alert()`
- Code organize: extend `AuthController` + `src/auth/api.ts` — no duplicate auth stack
- Secrets: reset/OTP codes hashed at rest; stub reveal never for production mailer assumption

## Not in this slice

- Real email/SMS provider (Phase 6.5)
- Roles / module permissions (2.3–2.4)
- Onboarding / plans (2.5–2.7)

## Smoke QA

1. Master + Store login still works (demo creds).
2. Forgot → toast → (dev) lands on reset with token → new password → sign in.
3. OTP send/verify stub succeeds with revealed code (debug/mock).
4. Wrong portal email still returns generic “if exists” message.
5. No full page freeze; soft nav back to login.
