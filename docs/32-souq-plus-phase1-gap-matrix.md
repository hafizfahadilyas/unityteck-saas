# SOUQ PLUS · Phase 1 Central Admin — Gap Matrix (LOCKED)

**Source:** Phase 1 Requirements (Central Administration Dashboard)  
**Rules:** `master-admin-security-control.mdc` · `zero-mock-saudi-saas.mdc` · `no-language-mix.mdc`  
**Live Master:** `https://mieraf-ksa.com/master/login` · `master@unityteck.com`  
**Principle:** Classify before inventing. No decorative controls. No fake gateways/points/tickets.

## Default decisions (until product sign-off)

| Open decision | Default from current system |
|---|---|
| Merchant / store statuses | Store: `active` / `pending` / `suspended`. Merchant = store owner email lifecycle. |
| Onboarding | Master invite link → self-register · **`onboarding_invites` MySQL** (API slice). Manual approve via Active/Inactive. |
| Subscription expiry | `Subscriptions::GRACE_DAYS = 7`; statuses trial/active/grace/expired/suspended. |
| Payments / invoices | **Deferred** until trusted gateway ledger connected. |
| Admin roles | Super Admin only on Master for Phase 1 UI; role matrix schema later. |
| Platform points | **Not Supported** (loyalty points are store-customer, not platform service units). |
| Support tickets / CS | **Deferred** — no ticket tables wired. |
| Time zone / currency / language | Asia/Riyadh · SAR · AR default / EN supported. |
| Health | Real `/api/health` only — Unknown when check missing. |

## Section classification

| § | Section | Status | Evidence / action |
|---|---|---|---|
| 4.1 | Main Dashboard | **Existing (modified)** | Platform KPIs on `MasterDashboard` (merchants, stores, subs, onboarding; tickets=0 Not Connected). |
| 4.2 | Account Management | **Existing (new screen)** | `MasterAccountManagement` — merchants / customers / onboarding invites. |
| 4.3 | Store Management | **Existing** | `MasterStores` preserved. |
| 4.4 | Subscriptions & Plans | **Existing (new screen)** | `MasterPlansSubscriptions` + `GET /subscriptions` + audited PATCH. |
| 4.5 | Services & Points | **Deferred** | `MasterCapabilityDeferred` — no fake ledger. |
| 4.6 | Integrations & Add-ons | **Existing** | integrations + Control Center. |
| 4.7 | Customer Service | **Deferred** | `MasterCapabilityDeferred` — no fake tickets. |
| 4.8 | Basic Reports | **Existing** | `MasterGeneralView` reports. |
| 4.9 | Security & Permissions | **Existing (new screen)** | `MasterSecurityCenter` + `Audit` + `GET /audit-logs`. |
| 4.10 | Notifications Center | **Existing (new screen)** | `MasterNotificationsHub` — real store/login signals only. |
| 4.11 | Platform Settings | **Existing (modified)** | `MasterSettings` + `platform_settings` JSON + `PATCH /platform/settings`. |

## Mandatory launch checklist (from §11)

- [x] Tenant isolation server-side (`store.id` / role middleware)
- [x] Master portal gate (`portal: master` / `super_admin`)
- [x] Audit trail readable + written on subscription Master actions
- [x] Plans/subscriptions Master UI
- [x] Account Management real tables
- [x] Backup UI exists (`StoreBackupRestoreCenter`)
- [x] Essential loading/empty/deferred states on new screens
- [x] No fake Connected / fake KPIs / decorative buttons on new Phase 1 surfaces
- [x] Local `npm run build` EXIT 0 · PHPUnit `AuditRedactTest` + `SubscriptionsStatusesTest` OK
- [x] Onboarding invites server API + UI wiring (`onboarding_invites`, public validate/redeem)
- [x] Platform identity persist API (`platform_settings`, Master save)
- [ ] Hostinger DDL `12_platform_master_phase1.sql` on live MySQL (with deploy)
- [ ] Live API+UI deploy — **only after explicit user ask** (`deploy:fast` / `deploy:api`)

## Ban

- Rebuilding Master shell or inventing second admin
- Platform “wallet cash” points UI
- Fake support tickets or payment reconciliation
- English in Arabic chrome / Arabic in English chrome
---
