# Souq Integration Health Center — Phase 1 Evidence Report

**Date:** 2026-11-25  
**Scope:** Audit + truthfulness hardening + Health Center APIs/UI + bank-transfer proof + webhook tenant/idempotency  
**Deploy:** Not deployed (await explicit user ask)

---

## Live host probes (evidence)

| Host | Result | Evidence |
|------|--------|----------|
| `https://giftshop-sa.com/api/health` | **503 Server Unavailable** | PowerShell `Invoke-RestMethod` → HTTP 503 at 2026-11-25T17:57Z |
| `https://mieraf-ksa.com/api/health` | **200 OK · `active_live_mysql`** | JSON: `"status":"ok","database":"active_live_mysql","db_name":"u393490678_ksa","stores_count":3,"products_count":77,"orders_count":44` |

Gateway/courier sandbox & production verification against live credentials: **NOT TESTED** (new Health Center APIs not on Hostinger until deploy; no live charges/AWB booked).

---

## 1) Configured payment gateways (code inventory)

| Provider | Backend class | Reality |
|----------|---------------|---------|
| Moyasar | `MoyasarGatewayService` | Real HTTP (test + verify + refund attempt). Paid fallbacks **removed** in Phase 1. |
| Tamara | `TamaraGatewayService` | Real HTTP (closest to complete). |
| Tabby | `TabbyGatewayService` | Partial real HTTP; invent-paid fallback **removed**. |
| COD | `CodPaymentService` | Manual ops; verify no longer auto-marks Paid. |
| Bank Transfer | `BankTransferGatewayService` | Manual pending + **proof upload/approve** added. |
| Stripe | `StripeGatewayService` | **Stub** — incomplete backend; never invents Paid/Connected. |
| PayPal | `PayPalGatewayService` | **Stub** — same. |
| HyperPay | `HyperPayGatewayService` | **Stub** — same. |
| Tap | `TapGatewayService` | **Stub** — same. |
| PayTabs / Google Pay / Samsung Pay / Emkan / MIS / Madfoat | UI/logos only | No `PaymentManager` service. |
| STC Pay | Allowed in controller `store` Rule | **Missing** from `PaymentManager` — unresolved. |

## 2) Configured shipping providers

| Provider | Backend | Reality |
|----------|---------|---------|
| SPL | `SplCourierService` | Real HTTP; ping test. |
| SMSA | `SmsaCourierService` | Real HTTP; non-destructive track probe for test. |
| Aramex | `AramexCourierService` | Real HTTP; ValidateAddress test. |
| DHL | `DhlCourierService` | Real HTTP; address-validate probe. |
| FedEx | `FedexCourierService` | Real OAuth probe. |
| UPS | `UpsCourierService` | Real OAuth probe. |
| RedBox / AyMakan / J&T | UI / shipping method logos | **No** `CourierManager` entry. |
| Naqel / iMile | — | **Absent** from codebase. |
| Zones / methods | `ShippingController` | Local rate calc — **not** carrier quote APIs. |

## 3) Already functional (pre-Phase-1 core)

- Per-`store_id` `payment_gateways` / `courier_connections` / `payment_transactions` / `shipments`
- Moyasar / Tamara / Tabby HTTP paths (partial)
- SPL / SMSA / Aramex / DHL / FedEx / UPS create/track attempt (no invent AWB)
- Store Payments / Shipping Test Connection UI
- Bank accounts CRUD + checkout IBAN display
- Local shipping zone/method pricing

## 4) Frontend / mock-only before Phase 1

- Stripe / PayPal / HyperPay / Tap invent-`paid` verify (now blocked)
- Moyasar / Tabby API-fail → invent paid (now blocked)
- COD verify → always paid (now pending unless merchant confirm)
- RedBox / AyMakan / J&T connect cards without API
- MasterGeneralView fake courier “Test Connection” timer (left alone; not primary hub)
- Docs claiming HMAC + encrypted secrets (were overclaims)

## 5) Incomplete backend APIs

- Stub PSPs: no live session/capture/refund
- Tabby create session still local URL (not full Tabby checkout API)
- Moyasar session still relies on client SDK (no server charge create)
- Carrier rates / cancel / pickup unsupported
- Webhook HMAC only when secret configured (providers vary)

## 6) Sandbox testing

| Item | Result |
|------|--------|
| Code-path non-destructive probes | Implemented in `IntegrationHealthService` |
| Live sandbox against store credentials | **NOT TESTED** — APIs not deployed; no store secrets used in this session |

## 7) Production verification

| Item | Result |
|------|--------|
| Production Verified status | Remains **`not_tested`** until explicit live authorization |
| Live charges / AWB booking | **Not executed** (Phase 1 ban) |

## 8) Failed / unavailable probes

| Probe | Result |
|-------|--------|
| giftshop `/api/health` | **Failed — HTTP 503** |
| mieraf `/api/health` | **Passed — active_live_mysql** |
| Master Health Center against Hostinger | **NOT TESTED** (undeployed) |

## 9) Missing API credentials

- Per-store: unknown until merchant/Master configures rows — Health Center reports `credentials_missing` / `not_configured`.
- No platform env keys for Moyasar/Stripe/etc. (by design: DB per store).

## 10) Missing provider permissions

- Cancel / pickup: interface stubs, no routes
- Carrier live rate quotes: not implemented
- Stub PSP merchant “Connected” blocked until real API exists

## 11) Webhook configuration

| Item | Status |
|------|--------|
| Endpoints | `POST /api/webhooks/payments/{provider}?store_id=` · `POST /api/webhooks/couriers/{provider}?store_id=` |
| Cross-tenant `first()` fallback | **Removed** |
| Signature verify | When `webhook_secret` present (Moyasar/Tabby headers; courier settings secret) |
| Idempotency | `integration_webhook_events` unique `(store_id, provider, event_id)` |
| Live webhook delivery tests | **NOT TESTED** (needs provider + deploy) |

## 12) Remaining work per provider

| Provider | Remaining |
|----------|-----------|
| Moyasar | Hosted fields / Moyasar.js checkout; production webhook HMAC confirmation with Moyasar docs; live refund evidence |
| Tamara | Ensure storefront redirect to real `checkout_url`; webhook HMAC |
| Tabby | Real checkout session API; refund API |
| COD | Remittance ledger UX polish |
| Bank Transfer | Deploy tables; media disk on Hostinger; end-to-end proof flow |
| Stripe/PayPal/HyperPay/Tap | Real SDK/HTTP or keep Incomplete Backend |
| SPL/SMSA/Aramex/DHL/FedEx/UPS | Harden payloads; optional cancel/pickup; carrier rate APIs |
| RedBox/AyMakan/J&T/Naqel/iMile | Real partner APIs or remove connect pretence |

---

## What Phase 1 shipped (code)

### Backend
- Hardened stub + Moyasar/Tabby/COD verify paths
- Courier OAuth/probe tests (FedEx/UPS/DHL/SMSA)
- Migration + Hostinger SQL: `13_integration_health.sql`
- Models/services: health checks, logs, webhook events, bank proofs
- `IntegrationHealthController` Master routes
- `BankTransferProofController` storefront upload + merchant approve/reject
- Webhooks: store isolation + idempotency + signature gate

### Frontend
- Master → Integrations → **Integration Health Center** (`MasterIntegrationHealthCenter`)
- Checkout bank proof upload
- Store Payments proof review table
- `tenantApi` helpers

### Build / secrets
- `npm run build` — **passed** (2026-11-25)
- Gitleaks-style scan on new Integration files — **no secrets found**
- Autocannon / Lighthouse — **NOT RUN** this slice (no deploy; UI not live)

---

## Deploy checklist (when user asks)

1. Upload API hotfiles + run `database/hostinger/13_integration_health.sql` (or `ensure-integration-health-tables.php`) on both Hostinger DBs.
2. `deploy:fast:central` (Master UI) + `deploy:api --target=all` (or flowers+central).
3. Re-probe health; run Master Full Audit per store (non-destructive).
4. Mark Production Verified only with real evidence.
