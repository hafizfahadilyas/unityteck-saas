# Master Admin UI/UX — Design Pack (LOCKED)

**PRIMARY source of truth for Unityteck Master Admin dashboard.**  
Path: `E:\unityteckksa\designs\Master_Admin_UIUX\`  

**Same-to-same.** AI must follow this folder. Do **not** invent a generic Master dashboard.

| Surface | Follow |
|---------|--------|
| Master **dashboard pages** (Overview, Stores, Orders, Settings…) | **THIS pack** — folder for that screen |
| Master **login** look / BLUE Holst tokens | `designs/Login_UIUX/` |
| Store Admin pages | `docs/masteradminsettings.docx` + **same Holst** as Master (`Login_UIUX` tokens) |
| Theme Settings (18 pages) | `designs/Theme_Settings_UIUX/` (folders `16`/`17` here are pointers only) |

## Always with this pack (GOLDEN RULE `docs/01`)
- **AI invent ZERO** — this pack same-to-same only — `.cursor/rules/design-pixel-golden.mdc`
- Lean · Speed · SEO · Master grants · ultra-fast toasts — `.cursor/rules/lean-speed-seo.mdc`
- One prompt slice only — `docs/01`
- Real data only — no fake Products/Orders charts until those prompts

## Locked chrome

| Token | Value |
|-------|-------|
| Brand | Unityteck · Super Admin |
| Menu (real only until later prompts) | Overview · **Orders** · Stores & plans · Accounts · Settings · Log out |
| Accent | **Holst** (`#04222B` ... `#E2F4F0`) — same on Master + Store — `designs/Login_UIUX/00_palettes/` |
| Dark / Light | Supported |
| Sidebar footer | Saudi e-commerce promo (EN + AR) when in Overview refs |

## Numbered folders (build only when prompt unlocks)

| Folder | Screen |
|--------|--------|
| `00_Chrome_Locked/` | Shared chrome rules |
| `01_Overview/` / `01_Overview_Dashboard/` | Master Overview first |
| `02_Performance_Channels/` ... `15_Settings/` | Later Master modules |
| `16` / `17` | Moved → Theme_Settings_UIUX |

### `01_Overview/` — start here for Master home
| Subfolder | Contents |
|-----------|----------|
| `01_refs_unityteck/` | Unityteck dashboard + Super Admin chrome refs |
| `02_mockup_clear/` | Clear numbered mockups |
| `03_source_docx/` | Related screenshots from design docs |

## App code target (hybrid stack)

- Admin SPA: **`apps/admin`** (Vite) — NOT Next dashboard
- Routes under `/master/*`
- Login: `/master/login` from Login_UIUX + Holst BLUE

## Prompt rule (every Master UI task)
> Master Admin UI = **same to same** `designs/Master_Admin_UIUX/`. Read `docs/19`. Lean/speed/SEO. No menus beyond current real settings. No invented layout.
