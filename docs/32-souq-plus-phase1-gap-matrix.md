# SOUQ PLUS · Phase 1 Central Admin — Gap Matrix (LOCKED)

**Source:** Phase 1 Requirements (Central Administration Dashboard)  
**Rules:** `master-admin-security-control.mdc` · `zero-mock-saudi-saas.mdc` · `no-language-mix.mdc`  
**Live Master:** `https://mieraf-ksa.com/masteradmin` · `https://mieraf-ksa.com/master/login` · `master@unityteck.com`  
**Principle:** Classify before inventing. No decorative controls. No fake gateways.

**Last audit:** 2026-11-14 · Support / Services&Points / Notifications / Sessions + dashboard tickets KPI live · GitHub push

## Verdict

Mandatory operational core for *current* Unityteck stack = **live**.  
Still deferred (honest, no invent): MFA UI, multi-role matrix, payment reconciliation / trusted gateway ledger.

## Default decisions

| Open decision | Default |
|---|---|
| Merchant / store statuses | Store: `active` / `pending` / `suspended` |
| Onboarding | Master invite → `onboarding_invites` MySQL |
| Subscription expiry | Grace ~7 days |
| Payments / invoices | **Deferred** — no trusted gateway ledger |
| Admin roles | Super Admin only; role matrix later |
| Platform points | **Live** — point **units** (not cash) via `platform_services` / `platform_point_transactions` |
| Support tickets | **Live** — `support_tickets` + replies |
| Time zone / currency / language | Asia/Riyadh · SAR · AR / EN |
| Health | Real `/api/health` only |

## Section classification (§3–4)

| § | Section | Status | Live / evidence | Gaps |
|---|---|---|---|---|
| 4.1 | Main Dashboard | **Live** | KPIs + audit + **open tickets from MySQL** | Lean quick actions |
| 4.2 | Account Management | **Partial** | Merchants + invites + activate/suspend + audit | Doc verification queue later |
| 4.3 | Store Management | **Existing** | Active/Inactive + login email | Status history deepen |
| 4.4 | Subscriptions & Plans | **Partial** | Catalogue + PATCH + audit | No payment invoices |
| 4.5 | Services & Points | **Live** | `MasterServicesPoints` → `/master/services` + points adjust | Units ≠ SAR cash |
| 4.6 | Integrations | **Partial** | Control Center + real health | Unsupported hidden |
| 4.7 | Customer Service | **Live** | `MasterSupportCenter` → tickets + replies + close reason | Surveys/help CMS later |
| 4.8 | Basic Reports | **Partial** | Operational counts | Export gated |
| 4.9 | Security | **Partial** | Audit + **sessions revoke** + login attempts | MFA / multi-role **Deferred** |
| 4.10 | Notifications | **Live** | `platform_notifications` ack/archive | — |
| 4.11 | Platform Settings | **Partial** | Identity + maintenance | Policy CMS later |

## §6–7 / Acceptance (§9)

| Area | Status |
|---|---|
| Tenant isolation | **Existing** |
| Audit trail | **Partial** (key Master actions) |
| Onboarding lifecycle | **Partial** |
| Backup UI | **Existing** |
| MFA | **Deferred** |
| Session terminate | **Live** |
| Payment reconciliation | **Deferred** |
| Support / platform points | **Live** |

## Mandatory checklist

- [x] Tenant isolation server-side
- [x] Master portal gate + Bearer on sensitive Master routes
- [x] Audit trail readable + written
- [x] Plans/subscriptions Master UI
- [x] Account Management real tables
- [x] Backup UI
- [x] Onboarding invites
- [x] Platform identity + maintenance
- [x] Support tickets MySQL + UI
- [x] Services & point units MySQL + UI
- [x] Notifications persist + ack/archive
- [x] Session list + revoke (+ login attempts)
- [ ] MFA + multi-role matrix
- [ ] Payment reconciliation (trusted ledger)
- [ ] Full §9 acceptance battery signed off

## Ban

- Rebuilding Master shell
- Fake MFA / fake Connected payment gateways
- Platform “wallet cash” pretending to be SAR money
- English in Arabic chrome / Arabic in English chrome
---
