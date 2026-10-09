# Tech Stack — NO VPS (LOCKED)

**Rule:** Shared / managed hosting only. **VPS mat lo** is phase mein.  
Future: dedicated DB / client hosting possible — architecture ready, abhi NO VPS.

Golden rules saath: ultra-fast · **bina full refresh** · **kahin pe bhi cache/old data na dikhe**.

---

## 1. Tech list (yaad rakho)

| Layer | Tech | Host (NO VPS) | Kam |
|-------|------|---------------|-----|
| Master + Store Admin | **React 19 + Vite + TypeScript + Tailwind** | Hostinger static / public HTML | Dashboard SPA |
| Admin data layer | **TanStack Query + React Router** | (same SPA) | Cache tags, soft nav, no reload |
| Public Storefront | **Next.js 15 (SSR/ISR)** | **Vercel** (free/hobby → pro) | SEO + instant revalidate |
| API | **Laravel 11 + PHP 8.2+ + Sanctum** | **Hostinger** shared / cloud | Auth, CRUD, tenant isolation |
| Database | **MySQL 8** | Hostinger MySQL | Central DB + `store_id` |
| Queues / cron | Laravel scheduler + Hostinger cron | Hostinger | Backups, emails, indexing jobs |
| Media / images | **Cloudflare R2 + CDN** | Cloudflare | Hashed/versioned URLs |
| Edge cache | CDN + Next ISR tags | Vercel + Cloudflare | Purge on publish |
| Optional realtime | Laravel Echo / SSE / polling (lean) | Hostinger | Orders/stock only — no spam listeners |

**Not in stack (abhi):** own VPS, Docker-on-VPS, bare-metal Redis server (agar Hostinger pe na ho), Firebase as primary DB.

---

## 2. Topology (NO VPS)

```
Users / Merchants / Customers
     │
     ├─► Admin (Master + Store)  Vite SPA  ──► Hostinger Static
     │        TanStack Query · React Router · Holst UI
     │
     ├─► Public Storefront       Next.js 15 ──► Vercel
     │        SSR SEO · ISR tag revalidate · zero-stale
     │
     ├─► API                     Laravel 11 ──► Hostinger PHP
     │        Sanctum · MySQL store_id · cron queues
     │
     └─► Media                   R2 + CDN   ──► Cloudflare
              versioned / hashed URLs · instant image swap
```

---

## 3. Ultra-fast · bina refresh · ZERO old/cache data

### 3.1 Kabhi stale data na dikhe
| Change | Must happen |
|--------|-------------|
| Product add/edit/delete | Admin lists + public shop invalidate (Query tags + Next `revalidateTag('store-{id}-products')`) |
| Price / stock | Cards + PDP + cart checks refresh from API (no hard reload) |
| Image replace | New URL = hash **or** `?v={updated_at}` — purani cached image **kabhi** na aaye |
| Category / theme / logo / banner / colors | Tag purge + ISR revalidate that store only |
| Order status | Dashboard order row + notifications update (poll/SSE lean) |
| SEO fields | SSR HTML next request pe naya meta |

### 3.2 Cache rules (LOCKED)
1. **Cache allowed** for speed — lekin har write pe **invalidate**.
2. Cache keys / tags hamesha `store_id` scoped: `store:{id}:products`, `store:{id}:theme`, …
3. Images: immutable hashed path **ya** version query — overwrite same URL without bust = **forbidden**.
4. Admin SPA: TanStack Query `staleTime` short for live commerce; mutation `onSuccess` → `invalidateQueries`.
5. Next.js: `revalidateTag` / `revalidatePath` after Master/Store publish — full site rebuild wait **nahi**.
6. CDN purge only touched store/assets — global wipe mat.
7. DB = source of truth. Cache = mirror. Conflict pe DB jeetay.
8. “Purge cache” button = real tag purge API, toast-only fake nahi.

### 3.3 No full page refresh
- Soft SPA navigation only.
- Optimistic UI where safe; rollback on API error + toast.
- No `location.reload()` for normal CRUD.
- Button busy state; page never freezes.

---

## 4. Multi-tenant (shared hosting)

- Ek MySQL database, har table pe `store_id`.
- Laravel middleware: resolve store from token / domain / subdomain.
- Future: `dbIsolation = dedicated_mysql` flag ready — abhi shared.

---

## 5. Local / Hostinger env (names)

```
Admin:       apps/admin   or current src/ (Vite)
API:         apps/api     (Laravel)
Storefront:  apps/web     (Next.js)
DB:          Hostinger MySQL (see .env — never commit secrets)
Media:       Cloudflare R2
```

---

## 6. Checklist — har deploy / phase

- [ ] Koi VPS dependency add to nahi hui
- [ ] Write path pe cache tag invalidation hai
- [ ] Image URLs versioned / hashed
- [ ] Public page SSR meta store-specific
- [ ] Admin change → UI + public without full refresh
- [ ] Dusre store ka cache/data leak nahi

---

**See also:** `docs/01-phases-and-golden-rules.md` · `.cursor/rules/lean-speed-seo.mdc`
