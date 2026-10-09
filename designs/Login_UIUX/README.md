# Login + Admin shell look — SOURCE OF TRUTH

**Locked:** 2026-09-27 (Fahad)  
**Layout ref:** Confo-style secure login card (dark/light) — brand = **Unityteck**, not ConfoStudy  
**Build:** PROMPT **04** = login UI + auth only · full settings CRUD later

---

## Split (do not invent a third theme)

| Surface | Color family | Palette file |
|---------|--------------|--------------|
| **Master / Super Admin** login + dashboard chrome | **Holst** (`#04222B` … `#E2F4F0`) | `00_palettes/portal-tokens.css` |
| **Store Admin** login + dashboard chrome | **Same Holst** (identical tokens) | same file |

**Locked (Fahad):** Master + Store look **ek jaisa** — sirf data + brand name/role alag. Purana GREEN-vs-BLUE shell split = **removed**.

Layout structure (both portals): same Confo-like shell — see `01_Master_SuperAdmin/01_login/ref_layout_confo_style.png`  
Same Holst tokens on both portals.

---

## Master BLUE palette (CSS tokens)

| Token | Hex | Use |
|-------|-----|-----|
| `--m-950` | `#04222B` | Darkest bg / text on light |
| `--m-900` | `#0A3D4A` | Dark panels |
| `--m-800` | `#10606F` | Headers / chrome |
| `--m-600` | `#1D8B94` | Primary accent bridge |
| `--m-400` | `#4FB8B4` | Highlights / links |
| `--m-200` | `#98D8D0` | Soft accents |
| `--m-50` | `#E2F4F0` | Light surfaces |

Primary CTA gradient (Master): teal → aqua (`#1D8B94` → `#4FB8B4`).  
Legacy note: older azure `#1a6fbf` = **replaced** by this Holst blue set for Master.

---

## Store = same Holst (no separate green shell)

Store Admin uses the **same** CSS tokens as Master (`[data-portal="store"]` = same vars).  
Optional per-store accent via Settings (Master grant) can tint CTAs — base chrome stays Holst.

---

## Always-on product rules (Fahad)

1. **Dark + Light** modes — Master can enable/default; Store uses allowed modes (`docs/23`).  
2. **Multilingual** — AR + EN first; Master on/off + per-store (`docs/22`).  
3. **Multicurrency** — SAR, USD, … Master on/off + default (`docs/22`).  
4. **Settings se change** (not hard-coded forever): platform/store **name**, **colors**, **logo**, login **email/password** flows, branding, languages, currencies — via Master/Store settings when those prompts unlock.  
5. CSS = **variables** from theme/settings DB — no single hard-coded brand only in CSS.  
6. After publish → **instant** public + admin (`docs/30`).

---

## Routes

| Portal | Login path | App |
|--------|------------|-----|
| Master / Super Admin | `/master/login` | `apps/admin` |
| Store Admin | `/store/login` | `apps/admin` |

Same SPA, **different theme tokens** + session/role.

---

## AI build rule

- PROMPT 04: implement login screens with Holst tokens + dark/light skeleton.  
- Do **not** invent a third rainbow theme.  
- Master + Store = **same Holst chrome**; only session/data/brand label differ.  
- Full “change everything from Settings” UI = later prompts (14+, Master settings) — architecture ready from day-1 (CSS vars).

---

## Ultra-fast + modern feedback (LOCKED — Fahad 2026-09-27)

Dashboard + login must feel **Confo-level instant**. No hang on click.

| Rule | Locked |
|------|--------|
| **Nav / buttons** | Soft SPA nav (React Router). Click = immediate visual press; no full-page reload |
| **Loading** | Button `aria-busy` + subtle spinner on submit only — never freeze whole page |
| **Toasts** | Modern non-blocking toasts for success / error / info (corner). Auto-dismiss ~3-4s. Stack max 3 |
| **Alerts** | Prefer toast. Use **dialog/modal** only for confirm destructive (delete) or must-read |
| **Popups / dialogs** | Lightweight modal: Esc + backdrop click close (unless critical). Focus trap. Portal palette colors |
| **Motion** | Short only (120-200ms opacity/translate). No heavy blur orbs, no laggy particles |
| **Data** | TanStack Query: cache + prefetch + mutation invalidate — no hard refresh to "fix" UI |
| **Sounds** | Optional later — default OFF |
| **Library** | Lean shared toast/dialog in `apps/admin` (PROMPT 04 skeleton; reuse everywhere). No fat UI kit |

### Do NOT
- Native `alert()` / `confirm()` / `prompt()` in production UI
- Full-page spinners for every click
- Slow multi-second transitions
- Fake success toasts without real API result

### Prompt map
- **04:** login form + toast on auth success/fail + busy button
- Later shells: same toast/dialog primitives for all Master/Store actions


## Master dashboard screens

After login, Master pages = **same-to-same** `designs/Master_Admin_UIUX/` (Overview first). Login chrome colors stay Holst BLUE; page layouts come from that pack — do not invent.
