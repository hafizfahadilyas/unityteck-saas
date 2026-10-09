# Phase 0 — Inspect & Lock Report

**Status:** LOCKED · 2026-09-29  
**Order followed:** Inspect → Understand → Preserve → Document gaps (no rebuild)

Full gap detail: [`docs/05-requirements-gap-matrix.md`](05-requirements-gap-matrix.md)

---

## App shape (preserve)

| Surface | Location | Notes |
|---------|----------|--------|
| Entry | `src/main.tsx` → `src/App.tsx` | `TenantProvider` wraps all |
| Master Admin | `src/components/master/*` | Tab-driven from `App.tsx` |
| Store Dashboard | `src/components/store/*` | Tab-driven |
| Storefront preview | `src/components/storefront/StoreFrontPreview.tsx` | In-SPA preview — not Next yet |
| Tenant state | `src/context/TenantContext.tsx` | In-memory maps seeded by `src/data/mockData.ts` |
| SQL helper | `src/utils/hostingerMysql.ts` | DDL/seed **generators** only |
| Types | `src/types/index.ts` | Shared domain types |

**Not present:** Laravel API · React Router · TanStack Query · Next storefront · live MySQL client · dedicated login pages.

---

## Design SoT

| Pack | Use |
|------|-----|
| `designs/Login_UIUX/` | Login + Holst `portal-tokens.css` (Master = Store chrome) |
| `designs/Master_Admin_UIUX/` | Master screens same-to-same when unlocked |
| `designs/Theme_Settings_UIUX/` | Theme Settings 01–18 (Phase 5) |

**Gap:** Holst tokens file exists but is **not wired** into `src/` CSS yet — wire in Phase 2.1 / chrome alignment, not invent new palette.

---

## Golden rules (always on)

| File |
|------|
| `.cursor/rules/lean-speed-seo.mdc` |
| `.cursor/rules/design-pixel-golden.mdc` |
| `.cursor/rules/code-organize-optimize.mdc` |
| `.cursor/rules/multistore-ops-backup-plans.mdc` |
| `.cursor/rules/master-project-goal.mdc` |
| `.cursor/rules/uiux-audit-dashboard.mdc` |

Canonical prose: `docs/01-phases-and-golden-rules.md` §0.

---

## Lock decisions

1. **Do not rebuild** Master / Store / Storefront preview UI.  
2. **Extend** `TenantContext` → API later; screens stay.  
3. **One slice at a time** — next = Phase 1 schema + API scaffold.  
4. **NO VPS** — Hostinger + Vercel + R2 only (`docs/02`).  
5. Brand = **Unityteck** only in product UI.

---

## Phase 0 checklist

- [x] Existing AI Studio app inspected  
- [x] Requirements gap matrix written (`docs/05`)  
- [x] Local `designs/` audited  
- [x] Golden rules in `.cursor/rules/`  
- [x] Phases doc + this lock report  

**Next action:** Phase 1.1 — MySQL schema extend (`store_id`) without UI rebuild.
