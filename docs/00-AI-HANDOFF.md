# AI / Cursor Account Handoff (Roman Urdu + EN)

**Canonical entry for agents:** repo root [`AGENTS.md`](../AGENTS.md)  
**Always-on law:** [`.cursor/rules/`](../.cursor/rules/) (29+ `.mdc` files — Cursor auto-load)

Yeh doc is liye hai ke **kisi bhi Cursor account / naye AI** ko project explain na karna pade. Sara path pehle se repo mein hai.

---

## A) Account transfer — kya aata hai / kya nahi

| Cheez | Transfer? | Kaise |
|-------|-----------|--------|
| Source code + `docs/` + `designs/` | Haan | Same folder open **ya** Git clone/pull |
| `.cursor/rules/*.mdc` | Haan | Repo ke andar — naye account pe auto apply |
| `AGENTS.md` / yeh handoff | Haan | Repo ke andar |
| Local `.env` / API secrets | **Nahi** (gitignore) | Manually copy `.env` + `apps/api/.env` |
| Purani Cursor **chat history** | **Nahi** | Is liye AGENTS + rules likhe gaye |
| Hostinger / FTP / Clerk live keys | Account alag | Secrets manager / local env — commit mat |

### Human steps (dusra Cursor account)

1. Cursor (dusra account) → **Open Folder** → yahi project path  
   **ya** GitHub se clone: remote pe jo `CENTRAL_GIT_REPO` / team remote hai.
2. Verify: `AGENTS.md` aur `.cursor/rules/` dikhein.
3. Secrets copy: `.env.example` se guide, real values local se.
4. Pehle message (optional, short):  
   > Read `AGENTS.md` + follow `.cursor/rules`. Inspect→reuse. Deploy only when I say deploy.
5. Kaam shuru — project “samjhao” mat; paths already locked.

---

## B) Project ek line mein

Saudi multi-tenant SaaS: **Master Admin** (sirf `mieraf-ksa.com/master`) + **Store Admin** (`/admin`) + **Laravel API** (`apps/api`) + storefront themes. Har store `store_id` se isolated. UI Google AI Studio se aayi — **rebuild mana**.

---

## C) Important paths (yaad mat rakho — yahan se kholo)

```
AGENTS.md                          ← AI pehli file
.cursor/rules/*.mdc                ← hard locks (deploy, i18n, zero-mock, coffee…)
.cursor/skills/release-gate-trio/  ← pre-done gate skill
docs/00-DOCS-INDEX.md              ← ALL docs arranged by task
docs/00-master-project-goal.md     ← north star
docs/01-phases-and-golden-rules.md
docs/02-tech-stack-no-vps.md
docs/29-dashboard-zero-mock-fix-plan.md
docs/31-page-builder-theme-customizer-execution.md
docs/36 / 37 / 38                  ← common themes policy / schema / owner steps
src/                               ← Admin SPA (Master + Store)
apps/api/                          ← Laravel
designs/                           ← pixel UI truth
scripts/                           ← deploy / smoke / gate
```

---

## D) Live hosts (smoke pehle)

- Flowers: `https://giftshop-sa.com` → `store-1` (flagship theme — not common pack)
- Central / Coffee / Master: `https://mieraf-ksa.com` → coffee `store-coffee` (flagship)
- Car / Bleco: `store-bleco` on central mapping (flagship transport)
- **Naye stores:** common themes — steps `docs/38-souq-common-themes-steps-stores-domains.md`
- Souq marketing: `https://souq.mieraf-ksa.com` (pricing 100/300/500)
- Master login: `https://mieraf-ksa.com/master/login`
- Health: `GET /api/health` → `active_live_mysql` expected
- Docs index: `docs/00-DOCS-INDEX.md`

---

## E) Non-negotiable rules (short)

1. **Inspect → Reuse → Extend** — naya Master/Store/Coffee UI mat banao.
2. **Zero mock** — fake KPI / Instant OAuth / cross-store decorate = banned.
3. **AR = Arabic only · EN = English only** — chrome mix banned.
4. **Deploy** — user bole tabhi (`deploy:fast*` / `deploy:api`).
5. **Done claim** — live probe + build/gate; status **Ho gaya** / **Baqi** (Roman Urdu).
6. Store login email change — **Master SuperAdmin only**.
7. Storefront customer → kabhi `/admin` / `/master` nahi.

Poori list: `AGENTS.md` §3 + har `.mdc` file.

---

## F) Deploy commands (yaad — run mat karo jab tak user na bole)

- API: `npm run deploy:api`
- Delta UI: `npm run deploy:fast:flowers` | `deploy:fast:central` | `deploy:fast`
- Gate pehle: `npm run gate:predeploy`

---

## G) Naye agent ko pehla prompt (copy-paste)

```
You are on Unityteck / Souq multi-store SaaS.
1) Read AGENTS.md
2) Obey all .cursor/rules/*.mdc
3) Do not rebuild UI; inspect → reuse → extend
4) store_id isolation; zero mock; AR/EN no mix
5) Deploy only if I explicitly ask
6) End status in Roman Urdu: Ho gaya / Baqi + live HTTP notes when relevant
Task: <yahan apna kaam likho>
```

---

## H) Related deep docs

| Topic | File |
|-------|------|
| Handbook (Roman) | `docs/27-ai-and-developer-master-handbook-roman.md` |
| SEO | `docs/24-seo-architecture-and-store-instructions.md` |
| Shipping/payments | `docs/SHIPPING_COURIER_PAYMENT_INTEGRATION_GUIDE.md` |
| Coffee UI lock | `.cursor/rules/coffee-frontend-ui-lock.mdc` |
| Master security | `.cursor/rules/master-admin-security-control.mdc` |

**Note:** `docs/27` purana overview hai; conflict ho to **`.cursor/rules` + `docs/00` + `AGENTS.md` jeetate hain** (live Hostinger / zero-mock / Master host lock).
