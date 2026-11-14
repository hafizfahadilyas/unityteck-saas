# SOUQ PLUS · Central Admin Phase 2–5 (LOCKED)

**Parent:** Phase 1 requirements + [`docs/32-souq-plus-phase1-gap-matrix.md`](32-souq-plus-phase1-gap-matrix.md)  
**Rules:** zero-mock · Master portal gate · no fake MFA Connected · no fake payment ledger  
**Started:** 2026-11-14

| Phase | Focus | Status |
|---|---|---|
| **2** | Security — admin users + role permission matrix (MFA stays deferred until real TOTP) | **DONE** · `platform_admin_users` / `platform_role_permissions` |
| **3** | Accounts — doc verification queue API + lifecycle | **DONE** · `account_verification_queue` |
| **4** | Customer Service CMS — complaints / surveys / announcements / incidents / help | **DONE** · support_* + `help_center_articles` |
| **5** | Ops — scheduled job monitor + policy CMS + error log; payments reconcile stays deferred | **DONE** · `MasterOpsMonitor` + `/master/payments/ledger` unavailable |

## Ban

- Fake MFA enrollment UI that pretends enrolled
- Fake gateway health / estimated SAR reconciliation
- Mock CS or verification rows
---
