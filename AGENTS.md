# AGENTS.md — Cursor / AI Handoff (READ THIS FIRST)

**Brand:** منصة سوق / Souq Platform (Unityteck KSA multi-store e-commerce SaaS)  
**Purpose:** Dusre Cursor account / naye AI session mein yeh file + `.cursor/rules/` kaafi hain. Project history explain karne ki zaroorat **nahi**.

> Chat history account se transfer **nahi** hoti. Rules + docs **repo ke andar** hain — wohi transfer hoti hai.

---

## 0) 30-second start (har naye agent ke liye)

1. Read **this file** (`AGENTS.md`).
2. Obey **all** always-on rules in `.cursor/rules/*.mdc` (Cursor unko auto-load karta hai).
3. Deep context: `docs/00-master-project-goal.md` → `docs/01-phases-and-golden-rules.md` → task-specific doc.
4. **Inspect → Reuse → Extend → Test.** UI rebuild **banned**.
5. Deploy **sirf** jab user explicitly bole (`deploy`, `deploy:fast`, `Hostinger pe bhejo`).

---

## 1) Live hosts & tenants (production truth)

| Surface | Host | Notes |
|--------|------|--------|
| Flowers storefront + `/admin` | `https://giftshop-sa.com` | Tenant `store-1` · **alag Hostinger (LOCKED)** — central migrate cancelled unless owner re-opens `docs/33` |
| Central / Coffee + Master + **all new stores** | `https://mieraf-ksa.com` | Coffee `store-coffee` · Bleco · new tenants · Master **only** here · DB `u393490678_ksa` |
| Master login | `https://mieraf-ksa.com/master/login` | SuperAdmin · email Master-owned |
| Flowers Master | **Banned** | giftshop pe `/master*` → central login bounce |
| New store domain | `{slug}.mieraf-ksa.com` (+ custom) | `ProvisionNewStoreService` + `HostingerCloud` — always central |

**Isolation:** har commerce row = `store_id`. Store A ≠ Store B. No `|| 'store-1'` / Flora fallback for other tenants.

**Zero mock:** no fake KPIs, `INITIAL_*`, Instant OAuth, invent visits (`orders×N`). Empty → real empty / 0 / Not Connected.

---

## 2) Stack (NO VPS)

| Layer | Path / tech | Deploy target |
|-------|-------------|----------------|
| Admin SPA (Master + Store) | `src/` · Vite/React | Hostinger static (`dist/`) |
| API | `apps/api/` · Laravel 11 | Hostinger PHP |
| DB | Hostinger MySQL | `store_id` isolation |
| Designs (pixel truth) | `designs/` | Do not delete / invent UI |
| Docs | `docs/` | Plans + execution |
| Scripts | `scripts/` | deploy / smoke / gate |
| Cursor rules | `.cursor/rules/` | Always-on agent law |
| Skills | `.cursor/skills/` | e.g. release-gate-trio |

Full stack: `docs/02-tech-stack-no-vps.md`

---

## 3) Absolute locks (do not weaken)

| Lock | Rule file / doc |
|------|-----------------|
| Do not rebuild Master/Store/Storefront UI | `master-project-goal.mdc` · `docs/00` |
| AR chrome = Arabic only · EN = English only | `no-language-mix.mdc` |
| No deploy without explicit ask | `no-deploy-without-ask.mdc` |
| Delta deploy only (after ask) | `ultra-fast-delta-deploy.mdc` |
| Zero mock / real Hostinger data | `zero-mock-saudi-saas.mdc` · `real-data-pixel-perfect-hostinger.mdc` |
| Live probe before “Ho gaya” | `live-verify-before-done.mdc` · `senior-sqa-never-repeat.mdc` |
| Testing trio (Gitleaks + load + Lighthouse / gate) | `mandatory-testing-trio.mdc` · `.cursor/skills/release-gate-trio/` |
| Holst tokens admin chrome | `global-modal-holst-tokens.mdc` · `design-pixel-golden.mdc` |
| Coffee storefront look locked | `coffee-frontend-ui-lock.mdc` |
| Common themes · 100/300/500 SAR · marketplace | `souq-common-theme-subscription-lock.mdc` · `docs/36` |
| Page builder / theme steps | `page-builder-theme-customizer.mdc` · `docs/31` |
| Store login email = Master only | `store-login-email-master.mdc` |
| Customers never get `/admin` | `customer-storefront-no-dashboard.mdc` |
| Status summaries | Roman Urdu **Ho gaya** / **Baqi** (`coffee-status-roman-urdu.mdc`) |

---

## 4) Commands cheat sheet

```bash
npm install
# copy .env.example → .env  (secrets NEVER commit)
npm run dev                 # local Vite (+ API stack helper)
npm run build               # vite build — required before UI claim
npm run lint                # tsc --noEmit
npm run smoke:live          # live host smoke
npm run gate:predeploy      # before deploy (when user asked deploy)
```

**Deploy (user must ask first):**

| Need | Command |
|------|---------|
| API PHP only | `npm run deploy:api` or `node scripts/deploy-api-hotfiles.js --target=flowers\|central\|all` |
| UI + API delta | `npm run deploy:fast:flowers` / `deploy:fast:central` / `deploy:fast` |
| Full resync | `npm run deploy:all` **only if user says full** |

---

## 5) Live smoke (before claiming done)

Against the host user cares about:

1. `GET /api/health` → 200 + `active_live_mysql` (flowers must not be sqlite / Access Denied)
2. `GET /api/storefront/resolve-domain?domain=…` → correct `store_id`
3. `GET /api/products?store_id=…` / catalog → real rows or genuine empty
4. Auth / admin path as relevant — never bounce merchant to storefront `/`

---

## 6) Docs map (open by task — don’t re-read everything)

| Need | Doc |
|------|-----|
| **Full docs arrangement (index)** | **`docs/00-DOCS-INDEX.md`** |
| North star | `docs/00-master-project-goal.md` |
| Phases + golden rules | `docs/01-phases-and-golden-rules.md` |
| Tech / Hostinger / Vercel | `docs/02-tech-stack-no-vps.md` |
| Media / backup / plans | `docs/03-multistore-media-backup-plans.md` |
| UI/UX audit | `docs/04-uiux-audit-dashboard-rules.md` |
| Zero-mock fix plan | `docs/29-dashboard-zero-mock-fix-plan.md` |
| Page builder execution | `docs/31-page-builder-theme-customizer-execution.md` |
| Coffee theme settings | `docs/30-coffee-store-theme-settings-execution.md` |
| **Common themes · stores · domains (steps)** | **`docs/38-souq-common-themes-steps-stores-domains.md`** |
| Common theme + subscription marketplace | `docs/36-souq-common-theme-subscription-marketplace.md` |
| Common theme settings schema (ثيمات المتجر) | `docs/37-souq-common-theme-settings-schema.md` |
| Common theme UI/UX image refs | `designs/Common_Theme_Settings_UIUX/` |
| SEO | `docs/24-seo-architecture-and-store-instructions.md` |
| Shipping / pay / courier | `docs/SHIPPING_COURIER_PAYMENT_INTEGRATION_GUIDE.md` |
| Roman Urdu handbook (broad) | `docs/27-ai-and-developer-master-handbook-roman.md` |
| Full AI handoff (this pack) | `docs/00-AI-HANDOFF.md` |
| Status / changelog | `docs/PROJECT_STATUS_AND_CHANGELOG.md` |
| Pixel designs | `designs/Store_Dashboard_UIUX/` · `designs/Master_Admin_UIUX/` · `designs/Login_UIUX/` |

Feature specs: `docs/requirements/` (if present) + `designs/**/*.docx`.

---

## 7) Other Cursor account — transfer steps (human)

1. Same PC: dusre Cursor account se **isi folder** ko Open Folder — ya Git clone of this repo.
2. Confirm `.cursor/rules/` aur `AGENTS.md` clone/folder ke andar hain.
3. `.env` / `apps/api/.env` **manually copy** (gitignored — secrets account se nahi aate).
4. Naye chat mein bas yeh bolo (optional):  
   `Read AGENTS.md and follow .cursor/rules. Do not rebuild UI. Deploy only if I ask.`
5. **Purani chat history transfer nahi hoti** — is liye yeh files hain.

---

## 8) What NOT to do

- Rebuild Master / Store / Coffee storefront “for improvement”
- Fake data, Instant Google Connected, cross-tenant decorate
- Deploy without explicit user ask
- Commit `.env`, Clerk secrets, FTP passwords
- Mix English into Arabic UI chrome (or reverse)
- Claim **Ho gaya** without live probe / build when surface changed
