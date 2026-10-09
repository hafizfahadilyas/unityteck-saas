# Hostinger MySQL — phpMyAdmin import

Phase 1 SQL aligned with `apps/api/database/migrations` + `DatabaseSeeder`.

## Import order (phpMyAdmin)

1. Select the Hostinger MySQL database.
2. Import **`01_schema.sql`** (CREATE TABLE IF NOT EXISTS + migration bookkeeping).
3. Import **`02_seed.sql`** (plans, master user, store-1, products, customers, orders).

## Point Laravel at Hostinger

In `apps/api/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=srv1422.hstgr.io
DB_PORT=3306
DB_DATABASE=u948210332_unityteck_shop
DB_USERNAME=u948210332_dbadmin
DB_PASSWORD=your_hostinger_db_password_here
APP_URL=http://127.0.0.1:8010
```

Then either:

- **`php artisan migrate --pretend`** — should report nothing pending if schema SQL was imported (migrations rows are seeded), or
- **Skip migrate** entirely when `01_schema.sql` already created all tables.

Optional seed via Laravel instead of `02_seed.sql`: `php artisan db:seed`.

## Local alternative

SQLite is fine for local API work (`DB_CONNECTION=sqlite`). Use this folder only for Hostinger / phpMyAdmin.

## Source of truth

| Layer | Path |
|-------|------|
| Migrations | `apps/api/database/migrations/` |
| Seeder | `apps/api/database/seeders/DatabaseSeeder.php` |
| Hostinger SQL | `database/hostinger/*.sql` (this folder) |
| Admin export helper | `src/utils/hostingerMysql.ts` |
