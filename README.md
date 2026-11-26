# Unityteck · Multi-Store E-Commerce SaaS (KSA)

Saudi multi-tenant store platform: Master Admin + Store Dashboard + Laravel API + storefront themes.

## AI / other Cursor account (handoff)

Chat history transfer **nahi** hoti. Project ke andar pehle se sab locked hai:

1. **[`AGENTS.md`](AGENTS.md)** — naye AI / dusre Cursor account ki **pehli file**
2. **[`.cursor/rules/`](.cursor/rules/)** — always-on locks (deploy, i18n, zero-mock, coffee, Master…)
3. **[`docs/00-AI-HANDOFF.md`](docs/00-AI-HANDOFF.md)** — Roman Urdu transfer steps + copy-paste first prompt

Same folder Open karo **ya** Git clone → rules auto-load. Local `.env` manually copy (secrets git mein nahi).

## Structure

| Path | Purpose |
|------|---------|
| `src/` | Admin SPA (Vite/React) — Master + Store portals |
| `apps/api/` | Laravel API + MySQL (`store_id` isolation) |
| `public/` | Static public assets for Hostinger |
| `scripts/` | Deploy / smoke / ops scripts |
| `database/` | Hostinger SQL helpers |
| `designs/` | Pixel UI reference packs (do not delete) |
| `docs/` | Plans, execution trackers, feature requirements |
| `tests/` | Automated / smoke tests |
| `backups/` | Local backup snapshots (gitignored) |

Feature requirement specs live in `docs/requirements/`.

## Local run

1. `npm install`
2. Copy `.env.example` → `.env` (never commit secrets)
3. `npm run dev`

## Deploy

Only when explicitly asked — see `.cursor/rules/no-deploy-without-ask.mdc` and `ultra-fast-delta-deploy.mdc`.
