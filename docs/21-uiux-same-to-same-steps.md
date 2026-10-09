# UI/UX Same-to-Same — Step Prompts (LOCKED)

**Date:** 2026-09-29 · **Updated:** Master+Store ek saath · dark/light · AR/EN · number-only money · review-gate  
**Owner:** Fahad · Unityteck  
**Rule:** Inspect → compare design → fix only gaps. **Do not rebuild** working features. One step = one Cursor prompt.

**Related:** `docs/00` · `docs/01` · `docs/04` · `docs/09` · `.cursor/rules/design-pixel-golden.mdc` · `lean-speed-seo.mdc`

---

## ALWAYS WITH EVERY UI/UX STEP (LOCKED — yaad rakhna)

Jab bhi **start** / koi bhi slice (header, footer, sidebar, overview, page, theme) — ye **ek saath** hona zaroori. Alag phase mein “baad mein dark / baad mein Store” **mana**.

| Must | Rule |
|------|------|
| **Dark + Light** | Holst CSS vars (`data-theme`). Dono modes mein same layout · readable · no hard-coded one-off colors that break dark/light |
| **Arabic + English** | Prefs locale · `dir=rtl` / `ltr` · mirrored chrome (search, icons, chevrons). Labels i18n keys — hard-coded EN-only strings mat chhodo jab key maujood ho |
| **Master + Store — SAME design · EK SAATH** | Jo PNG / updated design aaye → **dono dashboards** pe same Holst chrome + same layout. Sirf **role / data / brand label / favicon-title** alag. Header / footer / sidebar / overview jab bhi → **Master + Store dono ek hi step** (M1+S1, M2+S2, M3+S3…). “Pehle Master, baad mein Store” **forbidden** |
| **Favicon + `<title>`** | **Master** = Unityteck platform. **Har Store** = us store ka apna. Cross-force mana. Switch → turant update (zero stale) |
| **Fonts + colors** | Top 5 EN + Top 5 AR Google Fonts · Top 10 Holst plates — `branding.ts`. Amounts = **number only** (no `ر.س` / no `SAR` in `money()`/`amount()`) |
| **Overview KPI boxes** | Label EN/AR via `t()` · value = **number only** |
| **No invent** | Design PNG + Holst only |

**Step done = incomplete** jab tak agent ne smoke na kiya ho:
- Light · Dark toggle  
- EN · AR (RTL)  
- **Master aur Store dono** pe same slice check  
- Favicon + tab title portal-correct

**Review gate findings:** dark/light OK? · AR/EN+RTL OK? · Master↔Store same Holst? · favicon/title OK?

---

## REVIEW GATE (LOCKED — har step ke baad)

Har UI/UX step **complete** hone ke baad next design pe **mat** jao jab tak ye 3 cheezen na ho jayein:

| # | Who | Kaam |
|---|-----|------|
| 1 | **Agent (AI)** | Self-review: PNG vs live · **dark/light** · **AR/EN+RTL** · **Master+Store same** · smoke · no invent |
| 2 | **Fahad (user)** | Review — localhost · dark/light + AR/EN · Master **aur** Store dono · OK / changes |
| 3 | **Both OK** | Status = **Approved** → next unlock |

**Agent MUST end every finished step with:**
```
✅ Step {ID} UI/UX done — please review once (http://localhost:3010/).
Main ne bhi review kiya: dark/light · AR/EN · Master/Store · {short gaps}.
OK bolo → next ({NEXT_ID}) start; warna changes batao.
```

**Forbidden:** user se pooche bina next pe jump.  
**Allowed after “OK” / “next”:** next **paired** step (Master+Store ek saath).

---

## Order (do not skip) — Master + Store paired

```
① CHROME (dono portals ek saath)
   Header (M1+S1) → Footer (M1b+S1b) → Sidebar (M2+S2)

② OVERVIEW (dono)
   M3+S3 — same Holst cards/charts shell · data alag (platform vs one store)

③ PAGES then THEMES
   Master pages · Store pages · Theme Settings 01–18 last
```

**Why:** same design dono dashboards; dark/light + AR/EN hamesha saath; Store catch-up chrome pehle agar peeche ho, phir Overview paired.

**Catch-up (2026-09-29):** Master M1/M1b/M2 ship; Store chrome peeche → next = **S1+S1b+S2 catch-up** (Master pattern copy) **ya** user bole to **M3+S3 Overview** — dono cases mein Master+Store smoke required.

**Primary Overview ref (dono):**  
`designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png`  
(+ user-updated PNG chat/Drive — Store bhi isi shell)

**Color lock:** Holst. Amounts = numbers only.
---

## Design sources (open before every step)

| Surface | Path |
|---------|------|
| Holst tokens | `designs/Login_UIUX/00_palettes/portal-tokens.css` |
| Master chrome + Overview | `designs/Master_Admin_UIUX/00_Chrome_Locked/` · `01_Overview/01_refs_unityteck/01_master_dashboard_ref.png` |
| Master pages 02–15 | `designs/Master_Admin_UIUX/0N_*/mockup_consistent/` |
| Theme Settings 01–18 | `designs/Theme_Settings_UIUX/0N_*/01_screen/` |
| Store Admin | Same Holst shell as Master; page content = existing Store screens + Store refs when present |

**Color lock:** Holst (`#04222B` … `#E2F4F0`) wins. Agar kisi old mockup mein slate/`#2563EB` dikhe → **ignore colors**; structure only. Brand = **Unityteck**.

**Primary Overview ref (header + sidebar + KPIs):**  
`designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png`

---

## Current code map (extend — do not rewrite from zero)

| Piece | File |
|-------|------|
| Top chrome (lean bar) | `src/components/common/HolstChromeBar.tsx` |
| Master page header | `src/components/master/MasterTopBar.tsx` |
| Store page header | `src/components/store/StoreTopBar.tsx` |
| Master sidebar (+ footer card) | `src/components/master/MasterSidebar.tsx` |
| Store sidebar (+ footer) | `src/components/store/StoreSidebar.tsx` |
| Master Overview | `src/components/master/MasterDashboard.tsx` |
| Store Overview | `src/components/store/StoreDashboard.tsx` |
| Shell wiring | `src/App.tsx` |
| Themes picker / templates | `src/components/store/StoreThemes.tsx` · master themes tab |
| Theme Settings 18 | Phase 5 — wire to `designs/Theme_Settings_UIUX/` |

---

## Gap snapshot (from ref vs code — fix only if clearly different)

**Rule (Fahad 2026-09-29):** Jo pehle se design se milta hai → **SKIP / rebuild mat**. Gaps list karo; code tab jab user bole “banao”.

| Area | Design ref | Code today | Verdict |
|------|------------|------------|---------|
| **M1 Header** | One white bar: search · Quick Actions · bell · lang · theme · avatar · Logout | `MasterTopBar` unified; dark chrome Master pe off; prefs + logout in bar; Client Portal/Arch removed; Master favicon/title | **SKIP rebuild** — close match. Optional polish later (sirf agar bolo): globe+“English” dropdown vs EN\|ع pills · photo avatar vs initials · mail icon (docs had it; PNG sometimes omits) |
| **M1b Footer** | Sidebar bottom Saudi skyline + EN+AR promo | Skyline SVG · `saudiFooterEn` + `saudiFooterAr` · Architecture link removed | **SKIP rebuild** — Done (agent). Review gate → M2 |
| **M2 Sidebar** | Dark Holst · brand · PNG nav order · active teal · Saudi footer | Lean labels · denser nav · Holst active · canTab · Open Store Admin removed from rail · M1b footer kept | **SKIP rebuild** — Done (agent). Review → M3 |
| **M3 Overview** | KPI grid · analytics · charts · table · right rail | Partial structure; numbers/layout differ | **WAIT** — `M3` |
| **M4 pages** | Pack 02–15 | Not pixel-matched | **WAIT** — one page / prompt |
| **S1–S2 Store chrome** | Same Holst as Master | Unified `StoreTopBar` + denser `StoreSidebar` + shared Saudi footer; dark chrome bar off | **SKIP rebuild** — Done (agent). `admin_47` Cashback wizard = later S4 page (Holst colors) |
| **Themes 01–18** | Theme_Settings_UIUX | Partial / picker | **WAIT** — Part C |

**Primary ref:** `designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png`  
**Color lock:** Holst tokens — old mockup blue/slate ignore.

---

# PART A — MASTER ADMIN

## Step M0 — Inspect only (no code)

**Prompt:**
```
docs/21 Step M0 only. Open designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png
and current HolstChromeBar + MasterTopBar + MasterSidebar + MasterDashboard.
List gaps only (header / sidebar / overview). Do not edit code.
```

**Done when:** gap list written in chat (or short note under this doc §Status).

---

## Step M1 — Master Header (FIRST UI change)

**Refs:** Overview PNG top bar · Holst tokens  
**Code:** `HolstChromeBar.tsx` · `MasterTopBar.tsx` · `App.tsx` wiring

**Target (same-to-same from ref):**
- Left: Unityteck mark + “Multi-Store E-Commerce SaaS” (or locked brand subtitle)
- Center: search — “Search stores, products, orders, customers…”
- Right: Quick Actions · Bell (badge) · Mail · Language · Dark/Light · Avatar + name + “Master Admin” · Logout
- Soft SPA · tokens · no AI Studio / demo junk · no invent controls beyond ref

**Prompt:**
```
docs/21 Step M1 — Master Header only.
Compare designs/Master_Admin_UIUX/01_Overview/01_refs_unityteck/01_master_dashboard_ref.png top bar
vs HolstChromeBar + MasterTopBar.
Make Master header same-to-same. Holst tokens. Extend existing — no full shell rewrite.
MUST with this step: Dark + Light · Arabic + English (RTL) · prefs in header.
Remove clearly-extra junk (demo Client Portal / Architecture if not in ref).
Do not touch sidebar body, overview cards, or Store yet (Store header = S1 same pattern later).
Smoke: Master login → header matches · theme toggle · lang AR/EN · logout · no full reload.
```

**Done when:** Master header matches ref; Store unchanged.  
**Then:** Agent self-review → ask Fahad review → **wait for OK** → M1b/M2.

---

## Step M1b — Master Footer (chrome / sidebar footer)

**Refs:** Overview PNG sidebar bottom “Powering Saudi…” · chrome locked  
**Code:** usually inside `MasterSidebar.tsx` footer (not a separate public site footer)

**Prompt:**
```
docs/21 Step M1b — Master chrome/sidebar footer only.
Same-to-same Saudi e-commerce footer card from 01_master_dashboard_ref.png.
Do not change header body or Overview KPIs.
Smoke: footer EN+AR visible · no layout break.
```

**Then:** review gate → OK → M2.

---

## Step M2 — Master Sidebar

**Refs:** Overview PNG left rail · Saudi footer  
**Code:** `MasterSidebar.tsx`

**Target:**
- Brand block top
- Nav items + icons + chevron where in ref
- Active = Holst teal gradient
- Footer: “Powering Saudi E-Commerce Businesses” EN + AR card (from Overview refs)
- Permissions (`canTab`) keep working — hide unauthorized; do not invent new modules beyond pack + existing real tabs

**Prompt:**
```
docs/21 Step M2 — Master Sidebar only.
Same-to-same left rail from 01_master_dashboard_ref.png.
Holst tokens. Saudi footer card. Active state match.
Keep canTab filtering. Do not redesign header or Overview content.
Smoke: nav click soft · active highlight · footer visible.
```

**Done when:** Sidebar matches ref chrome; header from M1 intact.  
**Then:** review gate → OK → M3.

---

## Step M3 — Master Overview (Dashboard)

**Refs:** `01_Overview/` (refs + mockup_clear)  
**Code:** `MasterDashboard.tsx` · shared charts/cards

**Target blocks (top → bottom):**
1. Title “Master Admin Dashboard” + date range
2. KPI cards (stores / products / orders / customers / revenue / visitors / sales / pending / promos…) — **real series only**; no fake % invent
3. Platform analytics tabs: Daily · Weekly · Monthly · Yearly · Custom + growth charts
4. Product / Store / Sales performance charts
5. Store Performance table (search · filter · sort · Add Store · pagination)
6. Right rail: Create New Store + Recent Activity (if in ref)

**Prompt:**
```
docs/21 Step M3 — Master Overview only.
Same-to-same MasterDashboard to 01_Overview refs.
Reuse OverviewStatCard / charts / AdminPageHeader.
Real data + honest deltas only (Unknown ok). No fake attribution.
Header + sidebar already done — do not regress.
Smoke: date range · KPIs · table search/pagination · Create Store CTA.
```

**Done when:** Overview layout matches ref; live/session data wired without invent growth.  
**Then:** review gate → OK → M4 (ek page).

---

## Step M4 — Master remaining pages (one prompt each)

| Slice | Folder | Prompt id |
|-------|--------|-----------|
| M4.02 | `02_Performance_Channels/` | Performance / channels |
| M4.03 | `03_Alerts_Actions/` | Alerts & actions |
| M4.04 | `04_Orders_List/` | Orders list |
| M4.05 | `05_Order_Details/` | Order details |
| M4.06 | `06_Products_List/` | Products list |
| M4.07 | `07_Product_Edit/` | Product edit |
| M4.08 | `08_Customers/` | Customers |
| M4.09 | `09_Marketing/` | Marketing |
| M4.10 | `10_Analytics/` | Analytics |
| M4.11 | `11_Reports/` | Reports |
| M4.12 | `12_SEO/` | SEO |
| M4.13 | `13_Shipping/` | Shipping |
| M4.14 | `14_Payments/` | Payments |
| M4.15 | `15_Settings/` | Settings (modular) |

**Prompt template (replace NN + name):**
```
docs/21 Step M4.NN — Master {PageName} only.
Open designs/Master_Admin_UIUX/{Folder}/mockup_consistent/ and source_from_docx if needed.
Extend existing Master component for this tab. Same-to-same. Holst chrome unchanged.
Advanced table where list page. No invent. No theme builder.
Smoke: open tab · layout match · soft nav back to Overview.
End with review gate — do not start next page until Fahad OK.
```

**Also align when unlocked:** Stores · Onboarding · Domains · Database · Updates · Themes catalog · Marketplace (existing tabs — match nearest pack or keep until pack unlock).

**Master Part A complete when:** Header + Footer + Sidebar + Overview + all M4 pages **Approved** → then Part B Store.

---

# PART B — STORE ADMIN (same steps, after Master chrome stable + Approved)

Store = **same Holst** header/sidebar language as Master. Only labels/data differ (`Store Admin`, store name, store-scoped search).

## Step S1 — Store Header

**Code:** `HolstChromeBar` (store mode) · `StoreTopBar.tsx`

**Prompt:**
```
docs/21 Step S1 — Store Header only.
Match Master header pattern (M1) with Store labels: search store scope · back-to-master if allowed · bell · avatar.
Holst tokens. Same-to-same density as Master ref. No Master Overview edits.
Smoke: store session header · search · notifications toast · no full reload.
End with review gate.
```

## Step S1b — Store Footer

**Prompt:**
```
docs/21 Step S1b — Store sidebar/chrome footer only. Match Master Holst footer pattern. Review gate.
```

---

## Step S2 — Store Sidebar

**Code:** `StoreSidebar.tsx`

**Prompt:**
```
docs/21 Step S2 — Store Sidebar only.
Same Holst sidebar chrome as Master (M2). Store nav items only (dashboard, orders, products…).
Active state + footer pattern consistent. canTab intact.
Smoke: each visible tab soft-nav. Review gate.
```

---

## Step S3 — Store Overview

**Code:** `StoreDashboard.tsx`

**Prompt:**
```
docs/21 Step S3 — Store Overview only.
Align StoreDashboard to Holst Overview language (KPI cards, charts, channels honesty).
Order source ≠ traffic source. Real store_id data. No invent Master-only widgets.
Smoke: revenue/orders cards · channel links · date honesty. Review gate.
```

---

## Step S4 — Store remaining pages (one each)

| Slice | Screen | Notes |
|-------|--------|-------|
| S4.orders | Orders | Advanced table |
| S4.products | Products | Already 3.1 — UI align only if clearly off |
| S4.categories | Categories | Already 3.3 — align only gaps |
| S4.customers | Customers | |
| S4.marketing | Channel performance | |
| S4.seo | Store SEO | |
| S4.coupons | Coupons | |
| S4.shipping | Shipping | |
| S4.inventory | Inventory | |
| S4.payments | Payments | |
| S4.settings | Settings modular | |
| S4.storefront | Preview | Preserve; no public Next rewrite here |

**Prompt template:**
```
docs/21 Step S4.{screen} — Store {Screen} only.
Compare existing Store component to Holst + any Store refs.
Fix only missing/broken/clearly different. Keep API store_id. Advanced table on lists.
Smoke: open · search/filter if list · toast on mutate · no full reload.
End with review gate — wait Fahad OK before next Store page.
```

**Store Part B complete when:** Header + Footer + Sidebar + Overview + all S4 pages **Approved** → then Part C Themes.

---

# PART C — THEMES (only after Master + Store UI/UX Approved)

Do **not** start Themes until Fahad confirms Master + Store chrome + pages review done.

## Step T1–T18 — Theme Settings pages (UI/UX)

| # | Folder |
|---|--------|
| T01 | `Theme_Settings_UIUX/01_Store_Identity/` |
| T02 | `02_General_Options/` |
| … | … through `18_Store_Statistics/` |

**Prompt:**
```
docs/21 Step T0N — Theme Settings page 0N only.
Same-to-same designs/Theme_Settings_UIUX/0N_*/01_screen/.
Per-store only. Holst admin chrome unchanged. Publish → invalidate (zero stale).
Do not start Visual Theme Builder (docs/09) in this slice.
End with review gate.
```

## Step TT — Template / theme design settings UI

Catalog · install · preview · options (Master Themes + Store Themes / App Store).  
Refs: Master themes folders + `Theme_Settings` · existing `StoreThemes` / `MasterThemes`.

**Prompt:**
```
docs/21 Step TT — Template & theme design settings UI only.
Same-to-same available theme/template screens. No full Visual Builder yet.
Review gate.
```

**Then (later unlock):** Visual Builder = `docs/09` slices **5.V0→V10** — still one slice + review gate each.

---

## Copy-paste “start next” (use in chat)

| Say this | Means |
|----------|--------|
| `docs/21 M0` | Inspect Master gaps |
| `docs/21 M1` | Master Header |
| `docs/21 M1b` | Master Footer |
| `docs/21 M2` | Master Sidebar |
| `docs/21 M3` | Master Overview |
| `docs/21 M4.04` | e.g. Master Orders list |
| `OK` / `approved` / `next` | Unlock **only** next step after review |
| `docs/21 S1` | Store Header (after Master Approved) |
| `docs/21 S2` | Store Sidebar |
| `docs/21 S3` | Store Overview |
| `docs/21 S4.products` | Store Products UI align |
| `docs/21 T01` | Theme Identity (after Store Approved) |
| `docs/21 TT` | Template / theme design UI |

---

## Hard rules (every step)

1. Open the PNG/ref **before** editing.  
2. If UI already matches → **do not touch**.  
3. No `location.reload()` / native `alert()`. Soft invalidate + toast.  
4. `store_id` + permissions server-side.  
5. One step per prompt — no “fix whole SaaS”.  
6. Brand Unityteck only.  
7. **Review gate:** agent review + Fahad ek dafa review → phir next UI/UX.  
8. **Dark + Light + AR + EN** har slice ke saath — baad mein alag se nahi.  
9. **Master + Store** Holst same; chrome slice pe dono impact socho / Store follow-up S step se sync.  
10. **Favicon + title:** Master apna · har Store apna — portal/store switch pe update; mix mat karo.  
11. **Fonts/colors:** Top 5 EN + Top 5 AR (Google) · Top 10 palettes — `branding.ts`; AR locale pe EN-only font → Cairo auto.

---

## Status tracker

Use: `Pending` → `Done (agent review)` → `Approved (Fahad)` → next unlock.

| Step | Status | Date |
|------|--------|------|
| M0 Inspect | Skipped (user → M1) | 2026-09-29 |
| M1 Header | Done (agent review) | 2026-09-29 |
| M1b Footer | Done (agent review) | 2026-09-29 |
| M2 Sidebar | Done (agent review) | 2026-09-29 |
| M3 Overview | Done (Approved) | 2026-09-30 |
| M4.04 Orders List | Done (agent review) · 100% Mockup 04 | 2026-09-30 |
| M4.05 Order Details | Done (agent review) · 100% Mockup 05 | 2026-09-30 |
| S1 Header | Done (agent review) · paired Holst | 2026-09-29 |
| S1b Footer | Done (agent review) · shared Saudi footer | 2026-09-29 |
| S2 Sidebar | Done (agent review) · paired Holst | 2026-09-29 |
| S3 Overview | Done (Approved) | 2026-09-30 |
| S4.orders | Done (agent review) · paired 100% scoped | 2026-09-30 |
| M4.06 Products List | Next in line | |
| S4.products | Next in line | |
| T01–T18 Theme Settings | Pending (after Core Pages) | |
| TT Template design UI | Pending | |
| 5.V Visual Builder | Locked until docs/09 unlock | |

**Next recommended:** Review Orders Management on `http://localhost:3010/` → OK → Unlock `M4.06 / S4.products` (Products & Catalog).
