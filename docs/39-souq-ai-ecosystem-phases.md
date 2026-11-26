# 39 — Souq AI / Integrations Ecosystem Phases

**Source:** Owner master prompt (13 phases) · Hosting lock: flowers alag, sab naya central (`HostingerCloud`)  
**Rule:** Inspect → reuse → extend. Deploy only when owner asks. Status: PASS / FAIL / BLOCKED / NOT TESTED / PARTIAL / DONE

---

## Total phases = **13**

| # | Phase | Status | Notes |
|--:|-------|--------|-------|
| 1 | Complete project audit | **DONE** | Audit delivered 2026-11-26 |
| 2 | Central AI engine (10 modules) | **PARTIAL** | Catalog + run + merchant Advanced hub; video BLOCKED; **no deploy until owner final testing**; live OpenAI NOT TESTED |
| 3 | AI Developer Agent | **PARTIAL** | Merchant request UI + Master Support AI Developer + ensure script; auto-deploy BLOCKED; **deploy only after final testing** |
| 4 | AI Voice Calling | PENDING | Provider + minutes + AR/EN/Urdu |
| 5 | Social Media Engine | PARTIAL | Meta IG/FB code; TikTok/Snap/LinkedIn BLOCKED |
| 6 | Marketplace Engine (Amazon/Noon/Salla/…) | PENDING | Souq theme marketplace ≠ external seller APIs |
| 7 | WhatsApp Automation | PARTIAL | Controller + webhooks exist; real Meta verify NOT TESTED |
| 8 | AI Image + Video system | PARTIAL | Images yes; video adapter BLOCKED |
| 9 | Multi-store isolation | PARTIAL | API `store_id` strong; zero-mock / INITIAL_* baqi |
| 10 | Super Admin dashboard controls | PARTIAL | OpenAI + health; voice/marketplace P&L baqi |
| 11 | Automated testing | PARTIAL | Theme-heavy; integration suite baqi |
| 12 | Real integration verification | PENDING | Per-provider PASS matrix |
| 13 | Final report | PENDING | After 1–12 |

### Hosting (parallel lock — not a numbered phase)

| Tenant | Hosting |
|--------|---------|
| Flowers `store-1` | **Alag** Hostinger (`giftshop-sa.com`) — stay |
| Coffee / Bleco / **all new** | **Central** (`mieraf-ksa.com` + `{slug}.mieraf-ksa.com`) |

---

## Phase 3 acceptance (when DONE)

1. Master-only diagnostics API (read authorized logs / health) — no browser secrets  
2. Merchant support ticket / request flow only — **no** source edit  
3. Fix proposals optional; **no** auto branch/deploy to production  
4. Feature tests: merchant 403; master auth required  
5. Honest status: BLOCKED until provider/logs wired end-to-end  

---

## Deploy rule (owner)

- **Testing without deploy** = normal after each slice (PHPUnit / lint / local).
- **Deploy / Hostinger push** = **sirf** jab owner bole **final testing** / `deploy` / `deploy:fast`.
- Agent **kabhi auto-deploy nahi** (Phase 3 AI fixes included).

## Next 2–3 steps (owner queue)

1. **DONE (local):** AI hub big buttons + price popup (suite levels + AI add-ons SAR) + voice card (honest Soon)  
2. **DONE (local):** Phase 3 merchant request + Master diagnose (no auto-deploy)  
3. **NEXT when owner says final testing:** migrate `store_ai_dev_requests` + `deploy:fast:central` + live smoke AI Tools on coffee/new store  
4. **Then Phase 4:** real voice provider (still price-first; no fake Connected)

## Current pointer

**Active:** Phase **2 + 3** local polish  
**Deploy:** waiting for owner **final testing** ask  
**Previous:** Phase 1 DONE · Hosting lock DONE
