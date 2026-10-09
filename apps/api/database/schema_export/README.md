# Schema export notes

Preferred Hostinger phpMyAdmin pack (repo root):

- `database/hostinger/01_schema.sql`
- `database/hostinger/02_seed.sql`
- `database/hostinger/README.md`

Optional Laravel schema dump (after migrations succeed against MySQL):

```bash
php artisan schema:dump
```

This writes under `database/schema/` (Laravel default). Requires `mysqldump` / `sqlite3` CLI.

This folder remains a Phase 1 placeholder pointer — do not duplicate DDL here.
