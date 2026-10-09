# Multi-Store Ops — Media · Backup · Migration · Plans (LOCKED)

**Yaad rakho:** Har store scale pe chalega. Sab control **Master Dashboard** se.  
Golden rules saath: ultra-fast · zero stale cache · `store_id` isolation · Free/Paid/Pro features plan-wise.

---

## 1. Multi-store + Master control

| Rule | Detail |
|------|--------|
| Many stores | Central SaaS — har store ka `store_id` alag |
| Master Dashboard | Stores, plans, features, hosting status, backups, migrations, restores — **sab yahan se manage** |
| Store Dashboard | Apna store data only (products, orders, media, theme…) |
| Future hosting | Kisi store ko **alag hosting / alag DB** pe migrate kar sakte ho — Master se trigger |
| Abhi | Shared Hostinger + MySQL + `store_id` (NO VPS) |

```
Master Admin
   ├─ Store A (Free)     → shared DB partition + media prefix store_A/
   ├─ Store B (Pro)      → shared … (future: dedicated host flag)
   └─ Store C (Paid)     → …
         │
         └─ later: export ZIP → import on client/dedicated hosting
```

---

## 2. Media — 600+ images per store (mandatory scale)

Har store easily **600+ images** (products, gallery, banners, theme, categories, logos, video thumbs).

| Requirement | How |
|-------------|-----|
| Storage path | `stores/{store_id}/...` on Cloudflare R2 (or equivalent) |
| Isolation | Store A media Store B mein kabhi na dikhe / na count ho |
| Library | Upload, replace, delete, search, folders/tags, alt text, file size, used-by, unused detect |
| Formats | Compress + WebP/AVIF where possible; original keep optional by plan |
| Versioning | Replace → naya hash / `?v=updated_at` — **purani cached image kahin nahi** |
| Limits | Free/Paid/Pro storage quotas — **server enforce** (Master sets limits) |
| Performance | Lazy load, CDN, thumbnails; admin grid pagination (600+ list ek saath mat dump) |
| Master view | Per-store media usage (count, GB), cleanup tools, orphan media |

**Plan-aware examples (Master configurable):**
- Free: e.g. lower GB + image count cap  
- Paid / Pro: higher caps, video, advanced compression  

Exact numbers = Master Settings / plan features (DB), hard-code mat.

---

## 3. Backup · Restore · Migration (All-in-one)

### 3.1 Per-store backup package (ZIP)
Har store ke liye **all-in-one ZIP** (Master se create / schedule / download):

```
store-{id}-{timestamp}.zip
  ├── database/
  │     └── store_data.sql          # ONLY is store_id rows (all tables)
  ├── media/
  │     └── (all store files / 600+ images…)
  ├── config/
  │     ├── store.json              # plan, domain, theme, SEO, settings
  │     └── features.json           # enabled features snapshot
  └── manifest.json                 # version, created_at, checksums
```

### 3.2 Operations (Master Dashboard)

| Action | Meaning |
|--------|---------|
| **Backup** | Auto (cron) + manual; history list; status success/fail; retention by plan |
| **Restore** | ZIP / restore point se wapas — DB rows + media + config; confirm dialog; audit log |
| **Migration export** | Same ZIP — move store to new shared slot OR future dedicated hosting |
| **Migration import** | ZIP uthake naya/existing `store_id` pe map; conflict rules (skip/overwrite) |
| **Clone store** | Optional later — backup → import as new store |

### 3.3 Rules
- Backup/restore/migrate **store-scoped** — kabhi pure platform DB dump ko “ek store restore” mat samjho bina filter ke.
- All-in-one = **DB + files + config** ek package.
- Restore se pehle optional safety backup (pre-restore snapshot).
- Progress UI + toast; long jobs = Hostinger cron/queue — page freeze nahi.
- Free/Paid/Pro: backup frequency, retention days, manual download — plan features se.

---

## 4. Future: alag hosting per store

Architecture ready from day-1:

| Field (per store) | Use |
|-------------------|-----|
| `hosting_mode` | `shared` \| `dedicated` \| `client` |
| `db_isolation` | `shared_store_id` \| `dedicated_mysql` |
| `api_base_url` / `media_base_url` | Dedicated endpoints when split |
| `migration_status` | pending / exporting / imported / live |

Flow: Master → Export ZIP → deploy on client/dedicated → Import → switch DNS/domain → mark live.  
**Manage status + trigger hamesha Master Dashboard se.**

---

## 5. Plans — Free / Paid / Pro (+ Custom)

Har store ko **apne plan ke hisaab se** updates + features milte hain. Master control:

| Area | Free | Paid | Pro | Custom |
|------|------|------|-----|--------|
| Products / orders caps | Lower | Mid | High | Master set |
| Team seats | Lower | Mid | High | … |
| Media storage / 600+ headroom | Limited | More | Max | … |
| SEO / GTM / Search Console | Basic / off | On | Full | … |
| Custom code / advanced theme | Off | Partial | On | … |
| Backup frequency / ZIP download | Limited | Daily+ | Priority + longer retention | … |
| Migration / dedicated hosting tools | Off / request | On | Priority | … |
| Feature updates | Platform updates; gated modules by plan | Same | Early / full module set | Master grant |

**Rules:**
- Plan + `master_granted_*` overrides Master Dashboard se.
- Feature flags **API pe enforce** — frontend button hide enough nahi.
- Platform code updates (Central Updates) Master se deploy; store ko milne wale modules unke plan / grant se.

---

## 6. Phase mapping

| Need | Phase |
|------|--------|
| Schema: media, backups, plans, hosting_mode, feature limits | Phase 1 |
| Plan enforce + Master grants | Phase 2 |
| Media library scale (600+), R2 paths | Phase 5 |
| Backup ZIP / restore / migration UI + jobs | Phase 6 |
| Dedicated hosting switch | Phase 6 + future ops |

---

## 7. Checklist (yaad)

- [ ] 600+ images / store manageable (CDN + pagination + quotas)
- [ ] Media + DB isolated by `store_id`
- [ ] Per-store all-in-one ZIP (DB + files + config)
- [ ] Backup history + restore + migration export/import — Master pe
- [ ] Future alag hosting fields ready
- [ ] Free/Paid/Pro features + updates plan-wise, server-enforced
- [ ] Image/version cache bust — purana media na dikhe
- [ ] Long backup jobs async — no full page freeze

**See also:** `docs/01-phases-and-golden-rules.md` · `docs/02-tech-stack-no-vps.md`
