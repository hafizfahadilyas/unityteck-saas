# SOUQ PLUS · Phase 1 Central Admin — Gap Matrix (LOCKED)

**Source:** Phase 1 Requirements (Central Administration Dashboard)  
**Rules:** `master-admin-security-control.mdc` · `zero-mock-saudi-saas.mdc` · `no-language-mix.mdc`  
**Live Master:** `https://mieraf-ksa.com/masteradmin` · `https://mieraf-ksa.com/master/login` · `master@unityteck.com`  
**Principle:** Classify before inventing. No decorative controls. No fake gateways.

**Last audit:** 2026-11-14 · Phase 6–9 shipped (attachments, messaging, governance, §9 checklist) — MFA TOTP + payment ledger still deferred

## Verdict

Mandatory operational core for *current* Unityteck stack = **live**.  
Still deferred (honest, no invent): **real TOTP MFA enrollment**, **trusted payment gateway ledger / invoices**, **email/SMS Sent without provider**.

Roadmaps: [`docs/33`](33-souq-plus-phase2-5-roadmap.md) · [`docs/34`](34-souq-plus-phase6-9-roadmap.md)

## Default decisions

| Open decision | Default |
|---|---|
| Merchant / store statuses | Store: `active` / `pending` / `suspended` + **status history** |
| Onboarding | Master invite → `onboarding_invites` MySQL |
| Subscription expiry | Grace ~7 days |
| Payments / invoices | **Deferred** — `/master/payments/ledger` `available:false` |
| Admin roles | Matrix live; MFA status API returns `deferred` |
| Attachments | Metadata registry · max 10MB · malware scan unavailable |
| Messaging | Templates live · email/SMS Not Connected · no fake Sent |
| Time zone / currency / language | Asia/Riyadh · SAR · AR / EN |
| Health | Real `/api/health` only |

## Section classification (§3–4 / §6–§9)

| Area | Status |
|---|---|
| Dashboard / Accounts / Stores / Plans / Services | **Live** |
| Integrations / Reports / Support CS CMS | **Live** |
| Security admins + roles | **Live** (MFA deferred) |
| Notifications / Settings / Ops / Policies | **Live** |
| Attachments / Messaging / Governance | **Live** (Phase 6–8) |
| §9 acceptance checklist API | **Live snapshot** (manual sign-off open) |
| MFA TOTP / Payment ledger | **Deferred** |

## Mandatory checklist

- [x] Tenant isolation server-side
- [x] Master portal gate + Bearer
- [x] Audit trail
- [x] Plans/subscriptions / accounts / verification
- [x] Support tickets + CS CMS
- [x] Admin users + role matrix
- [x] Ops jobs / errors / policies
- [x] Attachment metadata limits
- [x] Messaging templates + honest channels
- [x] Maintenance events + privacy requests + store status history
- [x] MFA status honest deferred endpoint
- [x] Acceptance checklist API + `scripts/smoke-master-phase9.mjs`
- [ ] Real TOTP MFA enrollment
- [ ] Payment reconciliation (trusted ledger)
- [ ] Full §9 human sign-off

## Ban

- Rebuilding Master shell
- Fake MFA / fake Connected payment gateways / fake Sent messages
- Platform “wallet cash” pretending to be SAR money
- English in Arabic chrome / Arabic in English chrome
---
