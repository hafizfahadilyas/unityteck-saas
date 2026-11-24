<?php
/**
 * Live Hostinger gateway extensions: design-templates, media library, AI media, SEO write.
 * Real store_id isolation — no fake metrics.
 */
declare(strict_types=1);

function souq_load_root_env(): array
{
    static $vars = null;
    if (is_array($vars)) {
        return $vars;
    }
    $vars = [];
    $candidates = [
        __DIR__ . '/.env',
        dirname(__DIR__) . '/.env',
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__, 2) . '/apps/api/.env',
    ];
    foreach ($candidates as $path) {
        if (!is_readable($path)) {
            continue;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            if ($k === '') {
                continue;
            }
            // Later files fill missing keys only — first readable file wins per key
            if (!array_key_exists($k, $vars)) {
                $vars[$k] = trim($v, " \t\"'");
            }
        }
    }
    return $vars;
}

function souq_driver_is_mysql(PDO $pdo): bool
{
    try {
        return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    } catch (Throwable) {
        return false;
    }
}

/** Cached column existence check (MySQL Laravel + SQLite gateway). */
function souq_table_has_column(PDO $pdo, string $table, string $column, bool $bust = false): bool
{
    static $cache = [];
    $key = spl_object_id($pdo) . ':' . $table . '.' . $column;
    if ($bust) {
        unset($cache[$key]);
    }
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    try {
        if (souq_driver_is_mysql($pdo)) {
            // MySQL often ignores/fails prepared SHOW COLUMNS … LIKE ? — that made
            // every order PATCH field (except payment_status) silently skip on Hostinger.
            $safeTable = preg_replace('/[^a-zA-Z0-9_]/', '', $table) ?: 'orders';
            $safeColumn = preg_replace('/[^a-zA-Z0-9_]/', '', $column) ?: '';
            if ($safeColumn === '') {
                $cache[$key] = false;
                return false;
            }
            $st = $pdo->prepare(
                'SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                 LIMIT 1'
            );
            $st->execute([$safeTable, $safeColumn]);
            $found = (bool) $st->fetchColumn();
            if (!$found) {
                // Fallback for hosts that restrict information_schema reads.
                $q = $pdo->query('SHOW COLUMNS FROM `' . $safeTable . '` LIKE ' . $pdo->quote($safeColumn));
                $found = (bool) ($q && $q->fetch(PDO::FETCH_ASSOC));
            }
            $cache[$key] = $found;
        } else {
            $safe = preg_replace('/[^a-z0-9_]/i', '', $table) ?: 'stores';
            $cols = $pdo->query('PRAGMA table_info(' . $safe . ')')->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $found = false;
            foreach ($cols as $col) {
                if (strcasecmp((string) ($col['name'] ?? ''), $column) === 0) {
                    $found = true;
                    break;
                }
            }
            $cache[$key] = $found;
        }
    } catch (Throwable) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

/** Ensure order note columns exist (customer + internal) on live MySQL/SQLite. */
function souq_ensure_order_notes_columns(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    $add = static function (PDO $pdo, string $column, string $ddl) {
        if (souq_table_has_column($pdo, 'orders', $column)) {
            return;
        }
        try {
            $pdo->exec($ddl);
            souq_table_has_column($pdo, 'orders', $column, true);
        } catch (Throwable) {
            /* column may already exist under race */
        }
    };
    if (souq_driver_is_mysql($pdo)) {
        $add($pdo, 'customer_notes', 'ALTER TABLE `orders` ADD COLUMN `customer_notes` TEXT NULL');
        $add($pdo, 'internal_notes', 'ALTER TABLE `orders` ADD COLUMN `internal_notes` TEXT NULL');
        return;
    }
    $add($pdo, 'customer_notes', 'ALTER TABLE orders ADD COLUMN customer_notes TEXT');
    $add($pdo, 'internal_notes', 'ALTER TABLE orders ADD COLUMN internal_notes TEXT');
}

/**
 * Normalize a stores row for both SQLite (JSON `data`) and Laravel MySQL (real columns).
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function souq_store_payload(array $row): array
{
    $data = [];
    if (!empty($row['data']) && is_string($row['data'])) {
        $decoded = json_decode($row['data'], true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $copyKeys = [
        'id', 'name', 'name_ar', 'name_en', 'slug', 'domain', 'demo_domain', 'custom_domain', 'status', 'plan',
        'currency', 'locale', 'text_direction', 'timezone', 'phone', 'email', 'owner_name',
        'city', 'country', 'category', 'logo', 'accent_color', 'ssl_status',
        'products_count', 'orders_count', 'revenue', 'visitors_count',
        'hosting_mode', 'db_isolation', 'subscription_status', 'deployment_status',
    ];
    foreach ($copyKeys as $col) {
        if (array_key_exists($col, $row) && $row[$col] !== null && $row[$col] !== '') {
            $data[$col] = $row[$col];
        }
    }

    if (array_key_exists('master_granted_pro', $row) && $row['master_granted_pro'] !== null) {
        $granted = (bool) $row['master_granted_pro'];
        $data['master_granted_pro'] = $granted;
        $data['masterGrantedPro'] = $granted;
    }

    $email = strtolower(trim((string) (
        $data['email']
        ?? $data['ownerEmail']
        ?? $data['owner_email']
        ?? $data['loginEmail']
        ?? ($row['email'] ?? '')
    )));
    if ($email !== '' && str_contains($email, '@')) {
        $data['email'] = $email;
        $data['ownerEmail'] = $email;
        $data['owner_email'] = $email;
        if (empty($data['loginEmail'])) {
            $data['loginEmail'] = $email;
        }
    }

    if (array_key_exists('login_email_active', $row) && $row['login_email_active'] !== null) {
        $data['login_email_active'] = (bool) $row['login_email_active'];
    } elseif (!array_key_exists('login_email_active', $data) || $data['login_email_active'] === null) {
        $data['login_email_active'] = true;
    } else {
        $data['login_email_active'] = (bool) $data['login_email_active'];
    }

    if (!empty($row['id'])) {
        $data['id'] = (string) $row['id'];
    }
    if (!empty($row['name'])) {
        $data['name'] = (string) $row['name'];
    }
    if (!empty($row['slug'])) {
        $data['slug'] = (string) $row['slug'];
    }
    if (array_key_exists('domain', $row) && $row['domain'] !== null) {
        $data['domain'] = (string) $row['domain'];
    }

    return $data;
}

/** Ensure Master Active/Inactive column exists on Hostinger MySQL. */
function souq_ensure_mysql_store_login_column(PDO $pdo): void
{
    if (!souq_driver_is_mysql($pdo)) {
        return;
    }
    if (souq_table_has_column($pdo, 'stores', 'login_email_active')) {
        return;
    }
    try {
        $pdo->exec('ALTER TABLE `stores` ADD COLUMN `login_email_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `email`');
        souq_table_has_column($pdo, 'stores', 'login_email_active', true);
    } catch (Throwable) {
        /* column may already exist under race */
    }
}

/** Ensure bilingual store name columns exist on Hostinger MySQL. */
function souq_ensure_mysql_store_name_i18n_columns(PDO $pdo): void
{
    if (!function_exists('souq_driver_is_mysql') || !souq_driver_is_mysql($pdo)) {
        return;
    }
    foreach ([
        'name_ar' => 'ALTER TABLE `stores` ADD COLUMN `name_ar` VARCHAR(191) NULL AFTER `name`',
        'name_en' => 'ALTER TABLE `stores` ADD COLUMN `name_en` VARCHAR(191) NULL AFTER `name_ar`',
    ] as $col => $sql) {
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', $col)) {
            continue;
        }
        try {
            $pdo->exec($sql);
            if (function_exists('souq_table_has_column')) {
                souq_table_has_column($pdo, 'stores', $col, true);
            }
        } catch (Throwable) {
            /* column may already exist under race */
        }
    }
}

/** Ensure JSON blob for SEO / Google / store extras on Hostinger MySQL. */
function souq_ensure_mysql_store_data_column(PDO $pdo): void
{
    if (!souq_driver_is_mysql($pdo)) {
        return;
    }
    if (souq_table_has_column($pdo, 'stores', 'data')) {
        return;
    }
    try {
        $pdo->exec('ALTER TABLE `stores` ADD COLUMN `data` LONGTEXT NULL');
        souq_table_has_column($pdo, 'stores', 'data', true);
    } catch (Throwable) {
        /* column may already exist under race */
    }
}

/** SQL NOW() expression for MySQL vs SQLite gateway. */
function souq_sql_now_expr(PDO $pdo): string
{
    return souq_driver_is_mysql($pdo) ? 'NOW()' : "datetime('now')";
}

function souq_ensure_live_extension_tables(PDO $pdo): void
{
    // Laravel MySQL already has migrations — SQLite DDL (TEXT indexes) breaks MySQL.
    try {
        if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
            try {
                $pdo->exec(
                    'CREATE TABLE IF NOT EXISTS `ai_generation_usage` (
                        `store_id` VARCHAR(64) NOT NULL,
                        `period_key` VARCHAR(16) NOT NULL,
                        `images_used` INT NOT NULL DEFAULT 0,
                        `videos_used` INT NOT NULL DEFAULT 0,
                        `updated_at` TIMESTAMP NULL DEFAULT NULL,
                        PRIMARY KEY (`store_id`, `period_key`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
                );
            } catch (Throwable) {
                /* ignore — AI routes still work with zero-usage fallback */
            }
            return;
        }
    } catch (Throwable $e) {
        /* continue with sqlite bootstrap */
    }
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            file_name TEXT,
            file_type TEXT DEFAULT 'image',
            mime TEXT,
            size_bytes INTEGER DEFAULT 0,
            width INTEGER,
            height INTEGER,
            url TEXT,
            optimized_url TEXT,
            webp_url TEXT,
            thumbnail_url TEXT,
            poster_url TEXT,
            alt TEXT,
            caption TEXT,
            folder TEXT DEFAULT 'general',
            processing_status TEXT DEFAULT 'ready',
            optimization_status TEXT DEFAULT 'optimized',
            version INTEGER DEFAULT 1,
            metadata TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_media_store ON media(store_id);

        CREATE TABLE IF NOT EXISTS ai_generation_usage (
            store_id TEXT NOT NULL,
            period_key TEXT NOT NULL,
            images_used INTEGER DEFAULT 0,
            videos_used INTEGER DEFAULT 0,
            updated_at TEXT,
            PRIMARY KEY (store_id, period_key)
        );

        CREATE TABLE IF NOT EXISTS store_ai_brand_profiles (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL UNIQUE,
            palette_hex TEXT,
            persona TEXT DEFAULT 'modern',
            brand_lock_default INTEGER DEFAULT 1,
            logo_overlay_enabled INTEGER DEFAULT 0,
            logo_overlay_position TEXT DEFAULT 'bottom_end',
            logo_url TEXT,
            style_reference_urls TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_ai_brand_store ON store_ai_brand_profiles(store_id);
    ");
}

function souq_store_row(PDO $pdo, string $storeId): ?array
{
    $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
    $st->execute([$storeId]);
    $row = $st->fetch();
    return $row ?: null;
}

function souq_store_plan_code(PDO $pdo, string $storeId): string
{
    $row = souq_store_row($pdo, $storeId);
    if (!$row) {
        return 'free';
    }
    $data = json_decode((string)($row['data'] ?? '{}'), true);
    if (!is_array($data)) {
        $data = [];
    }
    $plan = strtolower((string)($data['plan'] ?? 'free'));
    $granted = !empty($data['masterGrantedPro']) || !empty($data['master_granted_pro']);
    if ($granted && in_array($plan, ['free', 'paid'], true)) {
        return 'pro';
    }
    return in_array($plan, ['free', 'paid', 'pro', 'premium', 'custom'], true) ? $plan : 'free';
}

/** @return array{images:int,videos:int} */
function souq_ai_limits(string $plan): array
{
    return match ($plan) {
        'paid' => ['images' => 25, 'videos' => 0],
        'pro' => ['images' => 60, 'videos' => 8],
        'premium' => ['images' => 200, 'videos' => 30],
        'custom' => ['images' => 500, 'videos' => 50],
        default => ['images' => 8, 'videos' => 0],
    };
}

function souq_ai_period_key(): string
{
    try {
        $tz = new DateTimeZone('Asia/Riyadh');
        return (new DateTimeImmutable('now', $tz))->format('Y-m');
    } catch (Throwable) {
        return date('Y-m');
    }
}

function souq_ai_quota_snapshot(PDO $pdo, string $storeId): array
{
    $plan = souq_store_plan_code($pdo, $storeId);
    $limits = souq_ai_limits($plan);
    $period = souq_ai_period_key();
    $imagesUsed = 0;
    $videosUsed = 0;
    try {
        $st = $pdo->prepare('SELECT images_used, videos_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
        $st->execute([$storeId, $period]);
        $row = $st->fetch() ?: ['images_used' => 0, 'videos_used' => 0];
        $imagesUsed = (int)$row['images_used'];
        $videosUsed = (int)$row['videos_used'];
    } catch (Throwable) {
        /* Table missing on some MySQL hosts — treat as zero usage, do not 500. */
    }
    $env = souq_load_root_env();
    $key = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    $imageReady = $key !== '' && $key !== 'MY_GEMINI_API_KEY';
    $videoReady = $imageReady && filter_var($env['GEMINI_VIDEO_ENABLED'] ?? false, FILTER_VALIDATE_BOOLEAN);

    return [
        'store_id' => $storeId,
        'period_key' => $period,
        'plan_code' => $plan,
        'images_limit' => $limits['images'],
        'images_used' => $imagesUsed,
        'images_remaining' => max(0, $limits['images'] - $imagesUsed),
        'videos_limit' => $limits['videos'],
        'videos_used' => $videosUsed,
        'videos_remaining' => max(0, $limits['videos'] - $videosUsed),
        'image_provider_ready' => $imageReady,
        'video_provider_ready' => $videoReady,
        'models' => souq_ai_model_catalog(),
        'default_model' => souq_ai_resolve_model(null, $env),
        'image_sizes' => ['1K', '2K', '4K'],
        'aspects' => ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'],
    ];
}

function souq_ai_consume(PDO $pdo, string $storeId, string $kind): array
{
    $snap = souq_ai_quota_snapshot($pdo, $storeId);
    if ($kind === 'video') {
        if ($snap['videos_remaining'] <= 0) {
            return ['ok' => false, 'code' => 'video_quota_exhausted', 'snapshot' => $snap];
        }
    } elseif ($snap['images_remaining'] <= 0) {
        return ['ok' => false, 'code' => 'image_quota_exhausted', 'snapshot' => $snap];
    }

    $period = $snap['period_key'];
    $st = $pdo->prepare('SELECT images_used, videos_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
    $st->execute([$storeId, $period]);
    $row = $st->fetch();
    $images = (int)($row['images_used'] ?? 0);
    $videos = (int)($row['videos_used'] ?? 0);
    if ($kind === 'video') {
        $videos++;
    } else {
        $images++;
    }
    if ($row) {
        $pdo->prepare('UPDATE ai_generation_usage SET images_used = ?, videos_used = ?, updated_at = ? WHERE store_id = ? AND period_key = ?')
            ->execute([$images, $videos, date('c'), $storeId, $period]);
    } else {
        $pdo->prepare('INSERT INTO ai_generation_usage (store_id, period_key, images_used, videos_used, updated_at) VALUES (?,?,?,?,?)')
            ->execute([$storeId, $period, $images, $videos, date('c')]);
    }

    return ['ok' => true, 'snapshot' => souq_ai_quota_snapshot($pdo, $storeId)];
}

function souq_ai_refund_image(PDO $pdo, string $storeId): void
{
    $period = souq_ai_period_key();
    $st = $pdo->prepare('SELECT images_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
    $st->execute([$storeId, $period]);
    $used = max(0, (int)($st->fetchColumn() ?: 0) - 1);
    $pdo->prepare('UPDATE ai_generation_usage SET images_used = ?, updated_at = ? WHERE store_id = ? AND period_key = ?')
        ->execute([$used, date('c'), $storeId, $period]);
}

function souq_ai_image_models(): array
{
    return [
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image',
    ];
}

function souq_ai_model_catalog(): array
{
    return [
        ['id' => 'gemini-2.5-flash-image', 'label_en' => 'Flash Image (fast)', 'label_ar' => 'فلاش صورة (سريع)', 'tier' => 'standard'],
        ['id' => 'gemini-3.1-flash-lite-image', 'label_en' => 'Flash Lite (fastest)', 'label_ar' => 'فلاش لايت (الأسرع)', 'tier' => 'standard'],
        ['id' => 'gemini-3.1-flash-image', 'label_en' => 'Flash Image 3.1 (balanced)', 'label_ar' => 'فلاش صورة ٣٫١ (متوازن)', 'tier' => 'balanced'],
        ['id' => 'gemini-3-pro-image', 'label_en' => 'Pro Image (highest quality)', 'label_ar' => 'برو صورة (أعلى جودة)', 'tier' => 'pro'],
    ];
}

function souq_ai_resolve_model(?string $requested, array $env): string
{
    $requested = trim((string)$requested);
    $allowed = souq_ai_image_models();
    if ($requested !== '' && in_array($requested, $allowed, true)) {
        return $requested;
    }
    $configured = trim((string)($env['GEMINI_IMAGE_MODEL'] ?? 'gemini-2.5-flash-image'));
    if (in_array($configured, $allowed, true)) {
        return $configured;
    }
    return 'gemini-2.5-flash-image';
}

/**
 * POST JSON to Gemini. Prefers x-goog-api-key header (avoids some WAF query stripping).
 *
 * @return array{raw:string|false,status:int,err:string}
 */
function souq_gemini_curl_json(string $url, array $payload, int $timeout = 120, ?string $apiKey = null): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    $postUrl = $url;
    if ($apiKey !== null && $apiKey !== '') {
        $headers[] = 'x-goog-api-key: ' . $apiKey;
        // Drop ?key= from URL when header auth is used.
        $postUrl = preg_replace('/([?&])key=[^&]*&?/', '$1', $url) ?? $url;
        $postUrl = rtrim($postUrl, '?&');
    }
    $ch = curl_init($postUrl);
    $opts = [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        // Hostinger shared often black-holes IPv6 → "0 bytes received" timeouts to Google.
        CURLOPT_CONNECTTIMEOUT => min(10, max(4, (int) floor($timeout / 3))),
        CURLOPT_NOSIGNAL => true,
    ];
    if (defined('CURL_HTTP_VERSION_1_1')) {
        $opts[CURLOPT_HTTP_VERSION] = CURL_HTTP_VERSION_1_1;
    }
    if (defined('CURL_IPRESOLVE_V4')) {
        $opts[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['raw' => $raw, 'status' => $status, 'err' => $err];
}

/**
 * Resolve Gemini text model from env.
 * New AI Studio keys: gemini-2.5-flash returns 404 → must use gemini-3.8-flash.
 * (Outbound hang was IPv6; fixed via CURL_IPRESOLVE_V4 — not a 3.8 model ban.)
 */
function souq_gemini_resolve_text_model(?string $configured = null): string
{
    if ($configured === null) {
        $env = souq_load_root_env();
        $configured = (string)($env['GEMINI_TEXT_MODEL'] ?? '');
    }
    $model = trim((string)$configured);
    $model = trim($model, "\"'");
    // Retired for new users (Google 404 → migrate to 3.8 Flash).
    if ($model === '' || $model === 'gemini-2.0-flash' || $model === 'gemini-2.5-flash' || $model === 'gemini-2.5-flash-lite') {
        return 'gemini-3.8-flash';
    }
    return $model;
}

/** Sanitize Gemini API key from .env (strip quotes / BOM / whitespace). */
function souq_gemini_api_key(): string
{
    $env = souq_load_root_env();
    $key = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    $key = trim($key, "\"'");
    $key = preg_replace('/^\xEF\xBB\xBF/', '', $key) ?? $key;
    return trim($key);
}

/**
 * Primary + fast fallbacks for product copy / prompt enhance.
 *
 * @return list<string>
 */
function souq_gemini_text_model_candidates(?string $preferred = null): array
{
    $primary = souq_gemini_resolve_text_model($preferred);
    $out = [$primary];
    // Keep short — nginx gateway ~60s; each attempt can take ~22s + one 503 retry.
    foreach (['gemini-3.8-flash', 'gemini-flash-latest'] as $fallback) {
        if (!in_array($fallback, $out, true)) {
            $out[] = $fallback;
        }
    }
    return $out;
}

/**
 * Gemini 3.x defaults to medium thinking which can eat the whole token budget
 * and hang free-tier keys — disable thinking for short catalog copy jobs.
 *
 * @param array<string,mixed> $base
 * @return array<string,mixed>
 */
function souq_gemini_text_generation_config(string $model, array $base): array
{
    // Gemini 3.x defaults to medium thinking (slow + burns tokens). Prefer LOW for catalog copy.
    if (str_starts_with($model, 'gemini-3')) {
        $base['thinkingConfig'] = ['thinkingLevel' => 'LOW'];
    }
    return $base;
}

/**
 * Call Gemini once; on transient 503 high-demand retry once quickly.
 *
 * @return array{raw:string|false,status:int,err:string}
 */
function souq_gemini_curl_json_retry(string $url, array $payload, int $timeout, string $apiKey): array
{
    $res = souq_gemini_curl_json($url, $payload, $timeout, $apiKey);
    if ($res['status'] === 503) {
        usleep(600000);
        $res = souq_gemini_curl_json($url, $payload, $timeout, $apiKey);
    }
    return $res;
}

function souq_gemini_parse_image(string $raw, string $model): array
{
    $json = json_decode($raw, true);
    $block = strtoupper((string)($json['promptFeedback']['blockReason'] ?? $json['candidates'][0]['finishReason'] ?? ''));
    if (in_array($block, ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY'], true)) {
        return ['ok' => false, 'code' => 'safety_blocked', 'message' => 'Prompt was blocked by safety filters. Soften the description and try again.'];
    }
    $parts = $json['candidates'][0]['content']['parts'] ?? [];
    if (!is_array($parts)) {
        return ['ok' => false, 'code' => 'empty_result', 'message' => 'AI image provider returned no image data.'];
    }
    foreach ($parts as $part) {
        $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
        if (!is_array($inline) || empty($inline['data'])) {
            continue;
        }
        $mime = (string)($inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png');
        return [
            'ok' => true,
            'mime' => $mime !== '' ? $mime : 'image/png',
            'base64' => (string)$inline['data'],
            'model' => $model,
        ];
    }
    return ['ok' => false, 'code' => 'empty_result', 'message' => 'AI image provider returned text only — no image bytes.'];
}

function souq_ai_brand_personas(): array
{
    return ['minimalist', 'luxury', 'vibrant', 'eco', 'modern', 'traditional_saudi', 'playful', 'cinematic'];
}

function souq_ai_campaign_presets(): array
{
    return ['none', 'founding_day', 'ramadan', 'eid', 'national_day', 'black_friday', 'white_friday', 'back_to_school', 'mothers_day', 'seasonal_sale'];
}

function souq_ai_output_templates(): array
{
    return [
        'product_square' => '1:1',
        'instagram_post' => '4:5',
        'instagram_story' => '9:16',
        'snapchat_story' => '9:16',
        'store_banner' => '16:9',
        'web_landscape' => '4:3',
        'catalog_portrait' => '3:4',
    ];
}

function souq_ai_normalize_hex(?string $hex): ?string
{
    $h = strtoupper(trim((string)$hex));
    if ($h === '') {
        return null;
    }
    if (!str_starts_with($h, '#')) {
        $h = '#' . $h;
    }
    if (!preg_match('/^#[0-9A-F]{6}$/', $h) && !preg_match('/^#[0-9A-F]{3}$/', $h)) {
        return null;
    }
    if (strlen($h) === 4) {
        $h = '#' . $h[1] . $h[1] . $h[2] . $h[2] . $h[3] . $h[3];
    }
    return $h;
}

/** @param mixed $raw @return list<string> */
function souq_ai_normalize_palette($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $item) {
        $hex = souq_ai_normalize_hex(is_string($item) ? $item : null);
        if ($hex !== null && !in_array($hex, $out, true)) {
            $out[] = $hex;
        }
        if (count($out) >= 8) {
            break;
        }
    }
    return $out;
}

/** @param mixed $raw @return list<string> */
function souq_ai_normalize_style_refs($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $url) {
        if (!is_string($url)) {
            continue;
        }
        $u = trim($url);
        if ($u === '') {
            continue;
        }
        if (!str_starts_with($u, 'http') && !str_starts_with($u, '/') && !str_starts_with($u, 'data:')) {
            continue;
        }
        if (!in_array($u, $out, true)) {
            $out[] = $u;
        }
        if (count($out) >= 15) {
            break;
        }
    }
    return $out;
}

function souq_ai_persona_hint(string $persona): string
{
    return match ($persona) {
        'minimalist' => 'minimalist and modern style, clean negative space',
        'luxury' => 'luxury cinematic lighting, premium refined aesthetic',
        'vibrant' => 'vibrant energetic color blocking, bold commercial energy',
        'eco' => 'eco-friendly natural materials, soft organic textures',
        'traditional_saudi' => 'Saudi heritage elegance, warm hospitality mood',
        'playful' => 'playful friendly lifestyle composition',
        'cinematic' => 'cinematic shallow depth of field, dramatic premium light',
        default => 'modern clean commercial brand style',
    };
}

function souq_ai_campaign_hint(string $campaign): string
{
    return match ($campaign) {
        'founding_day' => 'Saudi Founding Day campaign mood while preserving store brand colors',
        'ramadan' => 'Ramadan campaign atmosphere while preserving store brand colors',
        'eid' => 'Eid celebration campaign mood while preserving store brand colors',
        'national_day' => 'Saudi National Day campaign mood while preserving store brand colors',
        'black_friday' => 'Black Friday promotional urgency while preserving store brand colors',
        'white_friday' => 'White Friday KSA sale campaign while preserving store brand colors',
        'back_to_school' => 'back-to-school campaign mood while preserving store brand colors',
        'mothers_day' => 'Mother\'s Day gift campaign mood while preserving store brand colors',
        'seasonal_sale' => 'seasonal sale promotional layout while preserving store brand colors',
        default => '',
    };
}

/**
 * @param array{
 *   palette_hex?: list<string>|null,
 *   persona?: string|null,
 *   brand_lock?: bool,
 *   campaign_preset?: string|null,
 *   product_injection?: bool,
 *   match_perspective?: bool,
 *   accent_color?: string|null
 * } $brand
 */
function souq_ai_brand_merge_prompt(string $userPrompt, array $brand = []): string
{
    $prompt = trim($userPrompt);
    if ($prompt === '' || empty($brand['brand_lock'])) {
        return $prompt;
    }
    $parts = [$prompt];
    $persona = strtolower(trim((string)($brand['persona'] ?? 'modern')));
    if (!in_array($persona, souq_ai_brand_personas(), true)) {
        $persona = 'modern';
    }
    $parts[] = souq_ai_persona_hint($persona);
    $colors = souq_ai_normalize_palette($brand['palette_hex'] ?? null);
    $accent = souq_ai_normalize_hex($brand['accent_color'] ?? null);
    if ($accent !== null && !in_array($accent, $colors, true)) {
        array_unshift($colors, $accent);
    }
    if ($colors !== []) {
        $parts[] = 'dominant brand colors strictly: ' . implode(' and ', array_slice($colors, 0, 5));
        $parts[] = 'apply these hex colors to backgrounds, decorative elements, and lighting color grade — do not invent off-brand hues';
    }
    $campaign = strtolower(trim((string)($brand['campaign_preset'] ?? 'none')));
    $cHint = souq_ai_campaign_hint(in_array($campaign, souq_ai_campaign_presets(), true) ? $campaign : 'none');
    if ($cHint !== '') {
        $parts[] = $cHint;
    }
    if (!empty($brand['product_injection'])) {
        $parts[] = 'keep the uploaded product photorealistic and unchanged in shape/logo/label; remove or replace only the background';
        if (!empty($brand['match_perspective'])) {
            $parts[] = 'match lighting, shadows, camera angle, and scale of the original product photo for a realistic composite';
        }
    }
    $parts[] = 'high quality commercial 4K look, Saudi e-commerce ready';
    return implode(', ', $parts);
}

function souq_ai_load_brand_profile(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM store_ai_brand_profiles WHERE store_id = ? LIMIT 1');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    $store = souq_store_row($pdo, $storeId);
    $palette = [];
    $refs = [];
    if ($row) {
        $palette = souq_ai_normalize_palette(json_decode((string)($row['palette_hex'] ?? '[]'), true));
        $refs = souq_ai_normalize_style_refs(json_decode((string)($row['style_reference_urls'] ?? '[]'), true));
    } elseif (!empty($store['accent_color'])) {
        $palette = souq_ai_normalize_palette([$store['accent_color']]);
    }
    $persona = (string)($row['persona'] ?? 'modern');
    if (!in_array($persona, souq_ai_brand_personas(), true)) {
        $persona = 'modern';
    }
    $count = count($refs);
    return [
        'store_id' => $storeId,
        'palette_hex' => $palette,
        'persona' => $persona,
        'brand_lock_default' => $row ? (bool)(int)($row['brand_lock_default'] ?? 1) : true,
        'logo_overlay_enabled' => $row ? (bool)(int)($row['logo_overlay_enabled'] ?? 0) : false,
        'logo_overlay_position' => (string)($row['logo_overlay_position'] ?? 'bottom_end'),
        'logo_url' => ($row['logo_url'] ?? null) ?: ($store['logo'] ?? null),
        'store_accent_color' => $store['accent_color'] ?? null,
        'style_reference_urls' => $refs,
        'style_reference_count' => $count,
        'style_reference_status' => $count >= 10 ? 'ready' : ($count > 0 ? 'partial' : 'waiting'),
        'style_reference_target_min' => 10,
        'style_reference_target_max' => 15,
        'persisted' => (bool)$row,
    ];
}

/** @param array{model?:string,aspect?:string,image_size?:string,style?:string,negative_prompt?:string,brand_locked?:bool,product_image?:array{mime:string,base64:string}|null,style_reference_images?:list<array{mime:string,base64:string}>|null} $options */
function souq_gemini_generate_image(string $prompt, array $options = []): array
{
    $env = souq_load_root_env();
    $apiKey = souq_gemini_api_key();
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return ['ok' => false, 'code' => 'provider_not_connected', 'message' => 'AI image provider is not connected.'];
    }

    $model = souq_ai_resolve_model($options['model'] ?? null, $env);
    $aspect = (string)($options['aspect'] ?? '1:1');
    if (!in_array($aspect, ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'], true)) {
        $aspect = '1:1';
    }
    $imageSize = strtoupper(trim((string)($options['image_size'] ?? '1K')));
    if (!in_array($imageSize, ['1K', '2K', '4K'], true)) {
        $imageSize = '1K';
    }
    if ($imageSize === '4K' && !str_contains($model, 'pro')) {
        $imageSize = '2K';
    }
    $style = trim((string)($options['style'] ?? ''));
    $negative = trim((string)($options['negative_prompt'] ?? ''));
    $brandLocked = !empty($options['brand_locked']);
    $styleHint = match ($style) {
        'studio' => 'Professional product studio photography, softbox lighting, clean background.',
        'lifestyle' => 'Lifestyle commercial photography, natural light, authentic Saudi market feel.',
        'flat' => 'Clean flat illustration, bold shapes, modern e-commerce graphic.',
        'cinematic' => 'Cinematic lighting, shallow depth of field, premium campaign look.',
        'minimal' => 'Minimalist composition, generous negative space, elegant branding aesthetic.',
        default => 'High-quality commercial marketing visual.',
    };

    $text = 'Create a high-quality Saudi e-commerce marketing visual. No watermarks, no logos of other brands, suitable for store social posts. '
        . $styleHint . ' Composition aspect ' . $aspect . '. ';
    if ($brandLocked) {
        $text .= 'Brand Lock is ON: strictly honor the brand colors, persona, and style cues in the prompt; do not invent off-brand palettes. ';
    }
    $text .= 'Prompt: ' . trim($prompt);
    if ($negative !== '') {
        $text .= ' Avoid: ' . $negative . '.';
    }

    $parts = [];
    $product = $options['product_image'] ?? null;
    if (is_array($product) && !empty($product['base64'])) {
        $parts[] = [
            'inline_data' => [
                'mime_type' => (string)($product['mime'] ?? 'image/png'),
                'data' => (string)$product['base64'],
            ],
        ];
        $text .= ' The first attached image is the REAL product photo: cut out / place this exact product into a brand-consistent professional scene; preserve product identity, labels, and proportions.';
    }
    $styleRefs = $options['style_reference_images'] ?? null;
    if (is_array($styleRefs)) {
        $added = 0;
        foreach ($styleRefs as $ref) {
            if (!is_array($ref) || empty($ref['base64']) || $added >= 4) {
                continue;
            }
            $parts[] = [
                'inline_data' => [
                    'mime_type' => (string)($ref['mime'] ?? 'image/jpeg'),
                    'data' => (string)$ref['base64'],
                ],
            ];
            $added++;
        }
        if ($added > 0) {
            $text .= ' Additional attached images are this store\'s style references — match their visual soul, materials, and aesthetic (not copy their products).';
        }
    }
    $parts[] = ['text' => $text];
    $temperature = $brandLocked ? 0.55 : 0.85;
    $textOnlyParts = array_values(array_filter($parts, static fn ($p) => is_array($p) && isset($p['text'])));

    $configs = [
        [
            'responseModalities' => ['TEXT', 'IMAGE'],
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect, 'imageSize' => $imageSize],
        ],
        [
            'responseModalities' => ['IMAGE'],
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ],
        [
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ],
        [
            'temperature' => $temperature,
        ],
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => 'AI image provider returned an error.'];
    $usedModel = $model;
    $usedParts = $parts;

    $tryOnce = static function (string $tryUrl, string $tryModel, array $tryParts, array $genConfig) use (&$lastFail, $apiKey): ?array {
        $payload = [
            'contents' => [['parts' => $tryParts]],
            'generationConfig' => $genConfig,
        ];
        $res = souq_gemini_curl_json($tryUrl, $payload, 120, $apiKey);
        if ($res['raw'] !== false && $res['status'] >= 200 && $res['status'] < 300) {
            $parsed = souq_gemini_parse_image((string)$res['raw'], $tryModel);
            if (!empty($parsed['ok'])) {
                return $parsed;
            }
            // 200 but no image bytes — keep message, try next config/model.
            if (($parsed['code'] ?? '') === 'safety_blocked') {
                $lastFail = $parsed;
                return ['__terminal' => true] + $parsed;
            }
            $lastFail = $parsed;
            return null;
        }

        $msg = $res['err'] !== '' ? $res['err'] : 'AI image provider returned an error.';
        $decoded = json_decode((string)$res['raw'], true);
        if (is_array($decoded) && !empty($decoded['error']['message'])) {
            $msg = (string)$decoded['error']['message'];
        }
        if (stripos($msg, 'not found') !== false || stripos($msg, 'is not supported') !== false) {
            $msg = 'Selected AI image model is unavailable. Try Flash Lite or Flash Image and retry.';
        }
        $code = 'provider_error';
        if (
            $res['status'] === 429
            || stripos($msg, 'quota') !== false
            || stripos($msg, 'rate limit') !== false
            || stripos($msg, 'RESOURCE_EXHAUSTED') !== false
            || stripos($msg, 'limit: 0') !== false
            || stripos($msg, 'billing') !== false
        ) {
            $code = 'provider_quota_exceeded';
            $msg = 'Google AI free quota is exhausted for now. Wait for reset or enable billing in Google AI Studio, then retry.';
        }
        $lastFail = ['ok' => false, 'code' => $code, 'message' => mb_substr($msg, 0, 280)];
        if ($code === 'provider_quota_exceeded') {
            return ['__terminal' => true] + $lastFail;
        }
        return null;
    };

    foreach ($configs as $genConfig) {
        $hit = $tryOnce($url, $usedModel, $usedParts, $genConfig);
        if (is_array($hit) && !empty($hit['__terminal'])) {
            unset($hit['__terminal']);
            return $hit;
        }
        if (is_array($hit) && !empty($hit['ok'])) {
            return $hit;
        }
    }

    // Drop product/style attachments — oversized multimodal payloads often 400.
    if (count($textOnlyParts) > 0 && count($textOnlyParts) < count($parts)) {
        $usedParts = $textOnlyParts;
        foreach ($configs as $genConfig) {
            // Prefer lean configs after stripping images.
            if (isset($genConfig['imageConfig']['imageSize'])) {
                continue;
            }
            $hit = $tryOnce($url, $usedModel, $usedParts, $genConfig);
            if (is_array($hit) && !empty($hit['__terminal'])) {
                unset($hit['__terminal']);
                return $hit;
            }
            if (is_array($hit) && !empty($hit['ok'])) {
                return $hit;
            }
        }
    }

    $fallbacks = array_values(array_filter(
        ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image'],
        static fn (string $id): bool => $id !== $model
    ));
    foreach ($fallbacks as $fallbackModel) {
        $fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($fallbackModel)
            . ':generateContent?key='
            . rawurlencode($apiKey);
        $lean = [
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ];
        $hit = $tryOnce($fallbackUrl, $fallbackModel, $usedParts, $lean);
        if (is_array($hit) && !empty($hit['__terminal'])) {
            unset($hit['__terminal']);
            return $hit;
        }
        if (is_array($hit) && !empty($hit['ok'])) {
            return $hit;
        }
    }

    return $lastFail;
}

function souq_gemini_enhance_prompt(string $rawPrompt, string $locale = 'en', string $aspect = '1:1', ?string $style = null): array
{
    $apiKey = souq_gemini_api_key();
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return ['ok' => false, 'code' => 'provider_not_connected', 'message' => 'AI image provider is not connected.'];
    }
    $wantAr = str_starts_with(strtolower($locale), 'ar');
    $instruction = $wantAr
        ? 'حسّن الوصف التالي ليصبح موجهاً تفصيلياً لتوليد صورة تسويقية لمتجر إلكتروني سعودي. أعد الموجه فقط بدون شرح، وباللغة العربية الفصحى الواضحة، مع تفاصيل الإضاءة والتكوين والخلفية والأسلوب.'
        : 'Rewrite the following into ONE detailed English image-generation prompt for a Saudi e-commerce marketing visual. Return ONLY the prompt text, no quotes or explanation. Include lighting, composition, background, camera angle, and style.';
    $instruction .= ' Target aspect ratio ' . $aspect . '.';
    if ($style) {
        $instruction .= ' Preferred style key: ' . $style . '.';
    }
    $instruction .= "\n\nMerchant note:\n" . trim($rawPrompt);

    $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => 'AI prompt enhance returned an error.'];
    foreach (souq_gemini_text_model_candidates() as $model) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
        $res = souq_gemini_curl_json_retry($url, [
            'contents' => [['parts' => [['text' => $instruction]]]],
            'generationConfig' => souq_gemini_text_generation_config($model, [
                'temperature' => 0.7,
                'maxOutputTokens' => 512,
            ]),
        ], 22, $apiKey);

        if ($res['raw'] === false || $res['status'] < 200 || $res['status'] >= 300) {
            $msg = $res['err'] !== '' ? $res['err'] : 'AI prompt enhance returned an error.';
            $decoded = json_decode((string)$res['raw'], true);
            if (is_array($decoded) && !empty($decoded['error']['message'])) {
                $msg = (string)$decoded['error']['message'];
            }
            $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => mb_substr($msg, 0, 280)];
            continue;
        }
        $json = json_decode((string)$res['raw'], true);
        $text = '';
        foreach (($json['candidates'][0]['content']['parts'] ?? []) as $part) {
            if (!empty($part['text'])) {
                $text .= (string)$part['text'];
            }
        }
        $text = trim(preg_replace('/^["“]|["”]$/u', '', trim($text)) ?? '');
        if (mb_strlen($text) < 12) {
            $lastFail = ['ok' => false, 'code' => 'empty_result', 'message' => 'AI prompt enhance returned empty text.'];
            continue;
        }
        return ['ok' => true, 'prompt' => mb_substr($text, 0, 2000), 'model' => $model];
    }

    return $lastFail;
}

/**
 * Suggest product title + description (suggestion only — no catalog write).
 *
 * @param array{name?:string,category?:string,brand?:string,product_type?:string,store_name?:string,seed?:string,locale?:string} $input
 * @return array{ok:bool,code?:string,message?:string,title?:string,subtitle?:string,description?:string,model?:string}
 */
/**
 * Download a public product image for Gemini vision (HTTPS only, size-capped).
 * @return array{mime:string,base64:string}|null
 */
function souq_fetch_remote_image_inline(string $url, int $maxBytes = 3500000): ?array
{
    $url = trim($url);
    if ($url === '' || !preg_match('#^https?://#i', $url)) {
        return null;
    }
    if (preg_match('#^(blob:|data:)#i', $url)) {
        return null;
    }
    $ch = curl_init($url);
    if ($ch === false) {
        return null;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 18,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'SouqProductAI/1.0',
        CURLOPT_HTTPHEADER => ['Accept: image/*,*/*;q=0.8'],
    ]);
    $bin = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $ctype = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    if ($bin === false || $status < 200 || $status >= 300 || $bin === '') {
        return null;
    }
    if (strlen($bin) < 64 || strlen($bin) > $maxBytes) {
        return null;
    }
    $mime = 'image/jpeg';
    $ctypeLow = strtolower(explode(';', $ctype)[0] ?? '');
    if (str_starts_with($ctypeLow, 'image/')) {
        $mime = $ctypeLow;
    } elseif (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = $finfo->buffer($bin);
        if (is_string($detected) && str_starts_with($detected, 'image/')) {
            $mime = $detected;
        } else {
            return null;
        }
    } else {
        // Magic bytes fallback when fileinfo is unavailable.
        $head = substr($bin, 0, 12);
        if (str_starts_with($head, "\xFF\xD8\xFF")) {
            $mime = 'image/jpeg';
        } elseif (str_starts_with($head, "\x89PNG")) {
            $mime = 'image/png';
        } elseif (str_starts_with($head, 'GIF8')) {
            $mime = 'image/gif';
        } elseif (str_starts_with($head, 'RIFF') && str_contains(substr($head, 8, 4), 'WEBP')) {
            $mime = 'image/webp';
        } else {
            return null;
        }
    }
    if (!in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'], true)) {
        return null;
    }
    if ($mime === 'image/jpg') {
        $mime = 'image/jpeg';
    }

    return [
        'mime' => $mime,
        'base64' => base64_encode($bin),
    ];
}

function souq_gemini_suggest_product_copy(array $input): array
{
    $apiKey = souq_gemini_api_key();
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return [
            'ok' => false,
            'code' => 'provider_not_connected',
            'message' => 'AI text provider is not connected. Set GEMINI_API_KEY on the API server.',
        ];
    }
    $locale = strtolower(trim((string)($input['locale'] ?? 'en')));
    $wantAr = str_starts_with($locale, 'ar');
    $name = trim((string)($input['name'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $brand = trim((string)($input['brand'] ?? ''));
    $productType = trim((string)($input['product_type'] ?? ''));
    $storeName = trim((string)($input['store_name'] ?? ''));
    $seed = trim((string)($input['seed'] ?? ''));
    $imageUrl = trim((string)($input['image_url'] ?? ''));
    $availableCategories = [];
    if (is_array($input['available_categories'] ?? null)) {
        foreach ($input['available_categories'] as $c) {
            $c = trim((string)$c);
            if ($c !== '' && mb_strlen($c) <= 120) {
                $availableCategories[] = $c;
            }
            if (count($availableCategories) >= 80) {
                break;
            }
        }
    }
    $availableBrands = [];
    if (is_array($input['available_brands'] ?? null)) {
        foreach ($input['available_brands'] as $b) {
            $b = trim((string)$b);
            if ($b !== '' && mb_strlen($b) <= 80) {
                $availableBrands[] = $b;
            }
            if (count($availableBrands) >= 60) {
                break;
            }
        }
    }

    if (mb_strlen($name) < 2) {
        return [
            'ok' => false,
            'code' => 'missing_context',
            'message' => 'Enter a product name first so AI can fetch real product details.',
        ];
    }

    $facts = ['Product name (required): ' . $name];
    if ($category !== '') {
        $facts[] = 'Current category: ' . $category;
    }
    if ($brand !== '') {
        $facts[] = 'Current brand: ' . $brand;
    }
    if ($productType !== '') {
        $facts[] = 'Product type: ' . $productType;
    }
    if ($storeName !== '') {
        $facts[] = 'Store: ' . $storeName;
    }
    if ($seed !== '') {
        $facts[] = 'Merchant notes: ' . $seed;
    }
    if ($availableCategories !== []) {
        $facts[] = 'Store category options (prefer exact matches only): ' . implode(' | ', $availableCategories);
    }
    if ($availableBrands !== []) {
        $facts[] = 'Store brand options (prefer exact matches when possible): ' . implode(' | ', $availableBrands);
    }

    $inline = $imageUrl !== '' ? souq_fetch_remote_image_inline($imageUrl) : null;
    if ($inline) {
        $facts[] = 'A real product photo is attached — read brand/logo, model text, labels, visible specs, and any printed SAR price from the image.';
    }

    $instruction = implode("\n", [
        'You enrich Saudi e-commerce product catalog fields from the REAL product name and optional product photo.',
        'Always return BOTH Arabic and English text for every copy field (bilingual). Arabic values = formal Arabic only (no English words). English values = English only (no Arabic words). Brand names and model codes may stay as printed.',
        'Return ONLY valid JSON with keys: title_en, title_ar, subtitle_en, subtitle_ar, description_en, description_ar, seo_title_en, seo_title_ar, seo_description_en, seo_description_ar, seo_keywords_en, seo_keywords_ar, tags_en, tags_ar, brand, categories, price_sar, price_source, google_taxonomy, barcode, weight_kg.',
        'title_en / title_ar = accurate product display names, max 80 chars each.',
        'subtitle_en / subtitle_ar = one short factual marketing line each, max 120 chars.',
        'description_en / description_ar = 2-4 short HTML <p> paragraphs each based on identifiable product facts from name/image. No invented reviews, ratings, or competitor claims.',
        'seo_title_* max 60 chars; seo_description_* max 155 chars — honest Saudi shopper SEO in that language.',
        'seo_keywords_en / seo_keywords_ar = comma-separated 4-8 real keywords for that language.',
        'tags_en / tags_ar = JSON arrays of 3-6 short catalog tags in that language. No fake sales numbers.',
        'brand = real brand if identifiable from name or image logo/text; else empty string. Prefer a store brand option when it matches.',
        'categories = JSON array of 1-3 labels chosen ONLY from the store category options list when provided; if no good match, return []. Never invent unrelated categories.',
        'price_sar = number in Saudi Riyal ONLY if a price is clearly printed on the image OR you are highly certain of the official list price for this exact model. Otherwise null. NEVER guess a random price.',
        'price_source = "image" | "known_model" | null matching price_sar.',
        'google_taxonomy = short Google product category path if confidently known, else empty string.',
        'barcode = only if clearly readable on the image, else empty string.',
        'weight_kg = only if clearly printed on packaging/image, else null.',
        'Do NOT invent stock, SKU, ratings, fake engagement, or dummy commerce metrics.',
        'Facts:',
        implode("\n", $facts),
    ]);

    $parts = [];
    if ($inline) {
        $parts[] = [
            'inline_data' => [
                'mime_type' => $inline['mime'],
                'data' => $inline['base64'],
            ],
        ];
    }
    $parts[] = ['text' => $instruction];

    $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => 'AI product copy returned an error.'];
    $timeout = $inline ? 45 : 28;
    foreach (souq_gemini_text_model_candidates() as $model) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
        $res = souq_gemini_curl_json_retry($url, [
            'contents' => [['parts' => $parts]],
            'generationConfig' => souq_gemini_text_generation_config($model, [
                'temperature' => 0.35,
                'maxOutputTokens' => 2048,
                'responseMimeType' => 'application/json',
            ]),
        ], $timeout, $apiKey);

        if ($res['raw'] === false || $res['status'] < 200 || $res['status'] >= 300) {
            $msg = $res['err'] !== '' ? $res['err'] : 'AI product copy returned an error.';
            $decoded = json_decode((string)$res['raw'], true);
            if (is_array($decoded) && !empty($decoded['error']['message'])) {
                $msg = (string)$decoded['error']['message'];
            }
            $code = 'provider_error';
            $low = strtolower($msg);
            if (
                str_contains($low, 'quota')
                || str_contains($low, 'rate limit')
                || str_contains($low, 'resource_exhausted')
                || (int)$res['status'] === 429
            ) {
                $code = 'quota_exceeded';
                $msg = 'AI quota exceeded for this Google key. Wait for the free-tier reset, or set a billed GEMINI_API_KEY on the API server.';
            } elseif ((int)$res['status'] === 503 || str_contains($low, 'high demand')) {
                $code = 'provider_busy';
                $msg = 'AI model is busy (high demand). Try again in a minute.';
            }
            $lastFail = ['ok' => false, 'code' => $code, 'message' => mb_substr($msg, 0, 280)];
            continue;
        }

        $json = json_decode((string)$res['raw'], true);
        $text = '';
        foreach (($json['candidates'][0]['content']['parts'] ?? []) as $part) {
            if (!empty($part['text'])) {
                $text .= (string)$part['text'];
            }
        }
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*|\s*```$/u', '', $text) ?? $text;
        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            $lastFail = ['ok' => false, 'code' => 'empty_result', 'message' => 'AI product copy returned invalid JSON.'];
            continue;
        }
        $titleEn = trim((string)($decoded['title_en'] ?? $decoded['title'] ?? ''));
        $titleAr = trim((string)($decoded['title_ar'] ?? ''));
        $subtitleEn = trim((string)($decoded['subtitle_en'] ?? $decoded['subtitle'] ?? ''));
        $subtitleAr = trim((string)($decoded['subtitle_ar'] ?? ''));
        $descriptionEn = trim((string)($decoded['description_en'] ?? $decoded['description'] ?? ''));
        $descriptionAr = trim((string)($decoded['description_ar'] ?? ''));
        $seoTitleEn = trim((string)($decoded['seo_title_en'] ?? $decoded['seo_title'] ?? ''));
        $seoTitleAr = trim((string)($decoded['seo_title_ar'] ?? ''));
        $seoDescriptionEn = trim((string)($decoded['seo_description_en'] ?? $decoded['seo_description'] ?? ''));
        $seoDescriptionAr = trim((string)($decoded['seo_description_ar'] ?? ''));
        $seoKeywordsEn = trim((string)($decoded['seo_keywords_en'] ?? $decoded['seo_keywords'] ?? ''));
        $seoKeywordsAr = trim((string)($decoded['seo_keywords_ar'] ?? ''));
        $title = $wantAr ? ($titleAr !== '' ? $titleAr : $titleEn) : ($titleEn !== '' ? $titleEn : $titleAr);
        $subtitle = $wantAr ? ($subtitleAr !== '' ? $subtitleAr : $subtitleEn) : ($subtitleEn !== '' ? $subtitleEn : $subtitleAr);
        $description = $wantAr
            ? ($descriptionAr !== '' ? $descriptionAr : $descriptionEn)
            : ($descriptionEn !== '' ? $descriptionEn : $descriptionAr);
        $seoTitle = $wantAr ? ($seoTitleAr !== '' ? $seoTitleAr : $seoTitleEn) : ($seoTitleEn !== '' ? $seoTitleEn : $seoTitleAr);
        $seoDescription = $wantAr
            ? ($seoDescriptionAr !== '' ? $seoDescriptionAr : $seoDescriptionEn)
            : ($seoDescriptionEn !== '' ? $seoDescriptionEn : $seoDescriptionAr);
        $outBrand = trim((string)($decoded['brand'] ?? ''));
        $googleTaxonomy = trim((string)($decoded['google_taxonomy'] ?? ''));
        $barcode = trim((string)($decoded['barcode'] ?? ''));
        $parseTags = static function ($raw): array {
            $out = [];
            if (!is_array($raw)) {
                return $out;
            }
            foreach ($raw as $tag) {
                $t = trim((string)$tag);
                if ($t === '' || mb_strlen($t) > 40) {
                    continue;
                }
                $out[] = $t;
                if (count($out) >= 8) {
                    break;
                }
            }
            return $out;
        };
        $tagsEn = $parseTags($decoded['tags_en'] ?? ($wantAr ? [] : ($decoded['tags'] ?? [])));
        $tagsAr = $parseTags($decoded['tags_ar'] ?? ($wantAr ? ($decoded['tags'] ?? []) : []));
        $tags = $wantAr ? ($tagsAr !== [] ? $tagsAr : $tagsEn) : ($tagsEn !== [] ? $tagsEn : $tagsAr);
        $catsRaw = $decoded['categories'] ?? [];
        $categoriesOut = [];
        if (is_array($catsRaw)) {
            foreach ($catsRaw as $c) {
                $c = trim((string)$c);
                if ($c === '' || mb_strlen($c) > 120) {
                    continue;
                }
                if ($availableCategories !== []) {
                    $hit = null;
                    foreach ($availableCategories as $opt) {
                        if (mb_strtolower($opt) === mb_strtolower($c)) {
                            $hit = $opt;
                            break;
                        }
                    }
                    if ($hit === null) {
                        foreach ($availableCategories as $opt) {
                            $ol = mb_strtolower($opt);
                            $cl = mb_strtolower($c);
                            if (str_contains($ol, $cl) || str_contains($cl, $ol)) {
                                $hit = $opt;
                                break;
                            }
                        }
                    }
                    if ($hit === null) {
                        continue;
                    }
                    $c = $hit;
                }
                if (!in_array($c, $categoriesOut, true)) {
                    $categoriesOut[] = $c;
                }
                if (count($categoriesOut) >= 3) {
                    break;
                }
            }
        }
        $priceSar = null;
        $priceSource = null;
        if (array_key_exists('price_sar', $decoded) && $decoded['price_sar'] !== null && $decoded['price_sar'] !== '') {
            $p = (float)$decoded['price_sar'];
            $src = strtolower(trim((string)($decoded['price_source'] ?? '')));
            if ($p > 0 && $p < 500000 && ($src === 'image' || $src === 'known_model')) {
                $priceSar = round($p, 2);
                $priceSource = $src;
            }
        }
        $weightKg = null;
        if (array_key_exists('weight_kg', $decoded) && $decoded['weight_kg'] !== null && $decoded['weight_kg'] !== '') {
            $w = (float)$decoded['weight_kg'];
            if ($w > 0 && $w < 500) {
                $weightKg = round($w, 3);
            }
        }
        if (mb_strlen($title) < 2 && mb_strlen($description) < 8) {
            $lastFail = ['ok' => false, 'code' => 'empty_result', 'message' => 'AI product copy returned empty text.'];
            continue;
        }
        if ($title === '') {
            $title = $name;
        }
        if ($seoTitle === '' && $title !== '') {
            $seoTitle = mb_substr($title, 0, 60);
        }
        if ($seoDescription === '' && $description !== '') {
            $plain = trim(preg_replace('/\s+/u', ' ', strip_tags($description)) ?? '');
            $seoDescription = mb_substr($plain, 0, 155);
        }
        if ($outBrand !== '' && $availableBrands !== []) {
            foreach ($availableBrands as $ob) {
                if (mb_strtolower($ob) === mb_strtolower($outBrand)) {
                    $outBrand = $ob;
                    break;
                }
            }
        }

        return [
            'ok' => true,
            'title' => mb_substr($title, 0, 120),
            'subtitle' => mb_substr($subtitle, 0, 200),
            'description' => mb_substr($description, 0, 8000),
            'seo_title' => mb_substr($seoTitle, 0, 70),
            'seo_description' => mb_substr($seoDescription, 0, 160),
            'tags' => $tags,
            'title_en' => mb_substr($titleEn !== '' ? $titleEn : $title, 0, 120),
            'title_ar' => mb_substr($titleAr !== '' ? $titleAr : ($wantAr ? $title : ''), 0, 120),
            'subtitle_en' => mb_substr($subtitleEn !== '' ? $subtitleEn : $subtitle, 0, 200),
            'subtitle_ar' => mb_substr($subtitleAr !== '' ? $subtitleAr : ($wantAr ? $subtitle : ''), 0, 200),
            'description_en' => mb_substr($descriptionEn !== '' ? $descriptionEn : $description, 0, 8000),
            'description_ar' => mb_substr($descriptionAr !== '' ? $descriptionAr : ($wantAr ? $description : ''), 0, 8000),
            'seo_title_en' => mb_substr($seoTitleEn !== '' ? $seoTitleEn : $seoTitle, 0, 70),
            'seo_title_ar' => mb_substr($seoTitleAr !== '' ? $seoTitleAr : ($wantAr ? $seoTitle : ''), 0, 70),
            'seo_description_en' => mb_substr($seoDescriptionEn !== '' ? $seoDescriptionEn : $seoDescription, 0, 160),
            'seo_description_ar' => mb_substr($seoDescriptionAr !== '' ? $seoDescriptionAr : ($wantAr ? $seoDescription : ''), 0, 160),
            'seo_keywords_en' => mb_substr($seoKeywordsEn, 0, 240),
            'seo_keywords_ar' => mb_substr($seoKeywordsAr, 0, 240),
            'tags_en' => $tagsEn !== [] ? $tagsEn : $tags,
            'tags_ar' => $tagsAr !== [] ? $tagsAr : ($wantAr ? $tags : []),
            'brand' => mb_substr($outBrand, 0, 80),
            'categories' => $categoriesOut,
            'price_sar' => $priceSar,
            'price_source' => $priceSource,
            'google_taxonomy' => mb_substr($googleTaxonomy, 0, 160),
            'barcode' => mb_substr(preg_replace('/\s+/', '', $barcode) ?? '', 0, 64),
            'weight_kg' => $weightKg,
            'used_image' => $inline !== null,
            'model' => $model,
        ];
    }

    return $lastFail;
}

function souq_media_row(array $row): array
{
    $v = (int)($row['version'] ?? 1);
    $url = (string)($row['url'] ?? '');
    $path = strtok($url, '?') ?: $url;
    $versioned = $path !== '' ? ($path . '?v=' . ($row['updated_at'] ? strtotime((string)$row['updated_at']) : $v)) : $url;
    return [
        'id' => $row['id'],
        'store_id' => $row['store_id'],
        'file_name' => $row['file_name'],
        'file_type' => $row['file_type'] ?? 'image',
        'mime' => $row['mime'],
        'size_bytes' => (int)($row['size_bytes'] ?? 0),
        'width' => $row['width'] !== null ? (int)$row['width'] : null,
        'height' => $row['height'] !== null ? (int)$row['height'] : null,
        'url' => $versioned,
        'optimized_url' => $versioned,
        'webp_url' => $versioned,
        'thumbnail_url' => $versioned,
        'poster_url' => $row['poster_url'] ?? null,
        'alt' => $row['alt'],
        'caption' => $row['caption'],
        'folder' => $row['folder'] ?? 'general',
        'processing_status' => $row['processing_status'] ?? 'ready',
        'optimization_status' => $row['optimization_status'] ?? 'optimized',
        'version' => $v,
        'metadata' => !empty($row['metadata']) ? (json_decode((string)$row['metadata'], true) ?: null) : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function souq_save_binary_media(PDO $pdo, string $storeId, string $binary, string $mime, string $fileName, string $folder, ?string $alt, ?string $caption, ?array $metadata): array
{
    $ext = str_contains($mime, 'webp') ? 'webp' : (str_contains($mime, 'png') ? 'png' : (str_contains($mime, 'gif') ? 'gif' : 'jpg'));
    $safe = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($fileName, PATHINFO_FILENAME)) ?: 'media';
    $filename = $safe . '-' . time() . '-' . substr(md5(uniqid('', true)), 0, 6) . '.' . $ext;
    $uploadDir = dirname(__DIR__) . '/images/uploads/' . $storeId;
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }
    $dest = $uploadDir . '/' . $filename;
    file_put_contents($dest, $binary);
    $url = '/images/uploads/' . rawurlencode($storeId) . '/' . $filename;
    $width = null;
    $height = null;
    if (function_exists('getimagesizefromstring')) {
        $info = @getimagesizefromstring($binary);
        if (is_array($info)) {
            $width = $info[0] ?? null;
            $height = $info[1] ?? null;
        }
    }
    $id = 'med-' . substr(md5(uniqid($storeId, true)), 0, 12);
    $now = date('c');
    $pdo->prepare('INSERT INTO media (id, store_id, file_name, file_type, mime, size_bytes, width, height, url, optimized_url, webp_url, thumbnail_url, alt, caption, folder, processing_status, optimization_status, version, metadata, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([
            $id, $storeId, $filename, 'image', $mime, strlen($binary), $width, $height,
            $url, $url, $url, $url, $alt ?: $safe, $caption, $folder, 'ready', 'optimized', 1,
            $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null, $now, $now,
        ]);
    $st = $pdo->prepare('SELECT * FROM media WHERE id = ? AND store_id = ?');
    $st->execute([$id, $storeId]);
    return souq_media_row($st->fetch());
}

/** @return bool */
function souq_table_exists(PDO $pdo, string $table): bool
{
    try {
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'mysql') {
            $st = $pdo->prepare(
                'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1'
            );
            $st->execute([$table]);
            return (bool) $st->fetchColumn();
        }
        $st = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1");
        $st->execute([$table]);
        return (bool) $st->fetchColumn();
    } catch (Throwable) {
        return false;
    }
}

/** Catalog Free/Paid/Pro/Premium/Custom — matches apps/api Plans support. */
function souq_plans_catalog(): array
{
    return [
        ['code' => 'free', 'id' => 'plan-free', 'name' => 'Free', 'name_ar' => 'مجاني', 'price_sar' => 0, 'currency' => 'SAR', 'product_limit' => 50, 'order_limit' => 100, 'storage_mb' => 512, 'team_seats' => 1, 'features' => ['catalog', 'orders', 'basic_seo', 'themes_basic', 'media_studio', 'whatsapp']],
        ['code' => 'paid', 'id' => 'plan-paid', 'name' => 'Paid', 'name_ar' => 'مدفوع', 'price_sar' => null, 'currency' => 'SAR', 'product_limit' => 500, 'order_limit' => 2000, 'storage_mb' => 5120, 'team_seats' => 5, 'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'reports', 'themes_basic', 'media_studio', 'whatsapp', 'ai'], 'help_chat_ai_monthly' => 100],
        ['code' => 'pro', 'id' => 'plan-pro', 'name' => 'Pro', 'name_ar' => 'احترافي', 'price_sar' => 300, 'currency' => 'SAR', 'product_limit' => 5000, 'order_limit' => null, 'storage_mb' => 51200, 'team_seats' => 20, 'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'reports', 'themes_basic', 'themes', 'media_studio', 'custom_domain', 'whatsapp', 'social', 'ai'], 'help_chat_ai_monthly' => 300],
        ['code' => 'premium', 'id' => 'plan-premium', 'name' => 'Premium', 'name_ar' => 'مميز', 'price_sar' => 500, 'currency' => 'SAR', 'product_limit' => null, 'order_limit' => null, 'storage_mb' => 102400, 'team_seats' => 50, 'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'reports', 'themes_basic', 'themes', 'media_studio', 'custom_domain', 'whatsapp', 'social', 'backups', 'zatca', 'ai', 'api_access', 'advanced_seo', 'advanced_analytics'], 'help_chat_ai_monthly' => 500],
        ['code' => 'custom', 'id' => 'plan-custom', 'name' => 'Custom', 'name_ar' => 'مخصص', 'price_sar' => null, 'currency' => 'SAR', 'product_limit' => null, 'order_limit' => null, 'storage_mb' => null, 'team_seats' => null, 'features' => ['all']],
    ];
}

function souq_ensure_phase1_tables(PDO $pdo): void
{
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (!souq_table_exists($pdo, 'subscriptions')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `subscriptions` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `plan_id` VARCHAR(64) NOT NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'trial',
                    `billing_interval` VARCHAR(16) NULL DEFAULT 'monthly',
                    `starts_at` TIMESTAMP NULL DEFAULT NULL,
                    `ends_at` TIMESTAMP NULL DEFAULT NULL,
                    `grace_ends_at` TIMESTAMP NULL DEFAULT NULL,
                    `renewed_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NULL DEFAULT NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `subscriptions_store_id_index` (`store_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'onboarding_invites')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `onboarding_invites` (
                    `id` VARCHAR(64) NOT NULL,
                    `token` VARCHAR(128) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `plan` VARCHAR(32) NOT NULL DEFAULT 'pro',
                    `label` VARCHAR(191) NOT NULL DEFAULT '',
                    `locale` VARCHAR(8) NOT NULL DEFAULT 'en',
                    `text_dir` VARCHAR(8) NOT NULL DEFAULT 'ltr',
                    `currency` VARCHAR(8) NOT NULL DEFAULT 'SAR',
                    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Riyadh',
                    `expires_at` TIMESTAMP NOT NULL,
                    `used_at` TIMESTAMP NULL DEFAULT NULL,
                    `redeemed_store_id` VARCHAR(64) NULL DEFAULT NULL,
                    `created_by_user_id` VARCHAR(64) NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `onboarding_invites_token_unique` (`token`),
                    UNIQUE KEY `onboarding_invites_store_id_unique` (`store_id`),
                    KEY `onboarding_invites_expires_used` (`expires_at`, `used_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'platform_settings')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_settings` (
                    `id` VARCHAR(32) NOT NULL,
                    `settings` JSON NULL,
                    `updated_by_user_id` VARCHAR(64) NULL DEFAULT NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'audit_logs')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `audit_logs` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `user_id` VARCHAR(64) NULL,
                    `action` VARCHAR(191) NOT NULL,
                    `entity_type` VARCHAR(64) NULL,
                    `entity_id` VARCHAR(64) NULL,
                    `meta` JSON NULL,
                    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `audit_logs_store_created` (`store_id`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
    } catch (Throwable) {
        /* ignore — handlers degrade to empty/safe responses */
    }
}

function souq_audit_write(PDO $pdo, ?string $storeId, string $action, ?string $entityType, ?string $entityId, ?array $meta): void
{
    if (!souq_table_exists($pdo, 'audit_logs')) {
        return;
    }
    try {
        $id = 'aud-' . bin2hex(random_bytes(8));
        $safeMeta = $meta;
        if (is_array($safeMeta)) {
            foreach (['password', 'token', 'secret', 'api_key', 'otp', 'code'] as $bad) {
                if (array_key_exists($bad, $safeMeta)) {
                    $safeMeta[$bad] = '[redacted]';
                }
            }
        }
        $pdo->prepare(
            'INSERT INTO audit_logs (id, store_id, user_id, action, entity_type, entity_id, meta, created_at)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $storeId,
            null,
            $action,
            $entityType,
            $entityId,
            $safeMeta ? json_encode($safeMeta, JSON_UNESCAPED_UNICODE) : null,
            date('Y-m-d H:i:s'),
        ]);
    } catch (Throwable) {
        /* never break primary mutation */
    }
}

/**
 * SOUQ PLUS Phase 1 Master endpoints on Hostinger PHP gateway (real MySQL).
 * @return bool true if handled
 */
function souq_platform_settings_defaults(): array
{
    return [
        'platformName' => 'Souq Platform',
        'platformNameAr' => 'منصة سوق',
        'platformTagline' => '',
        'platformTaglineAr' => '',
        'platformLogo' => '/favicon.svg',
        'supportEmail' => 'admin@unityteck.sa',
        'timezone' => 'Asia/Riyadh',
        'defaultLocale' => 'ar',
        'defaultCurrency' => 'SAR',
        'whatsappEnabled' => false,
        'whatsappNumber' => '',
        'maintenanceMode' => false,
        'maintenanceMessage' => '',
        'maintenanceMessageAr' => '',
        'socialLinks' => [
            'twitter' => ['enabled' => false, 'url' => ''],
            'linkedin' => ['enabled' => false, 'url' => ''],
            'instagram' => ['enabled' => false, 'url' => ''],
            'youtube' => ['enabled' => false, 'url' => ''],
        ],
        'branding' => [
            'palette' => 'holst',
            'fontEn' => 'jakarta',
            'fontAr' => 'ibm-plex-ar',
            'iconStyle' => 'rounded',
            'fontWeight' => 'regular',
            'customAccentHex' => null,
            'customScrollbarHex' => null,
            'customBgHex' => null,
            'customTextHex' => null,
        ],
        'seo' => [
            'preset' => 'post_name',
            'dateInUrl' => false,
            'postType' => 'product',
            'productPattern' => '/{post_type}/{slug}',
            'categoryPattern' => '/category/{slug}',
            'blogPattern' => '/blog/{slug}',
            'pagePattern' => '/{slug}',
            'defaultOgImage' => '',
            'twitterCard' => 'summary_large_image',
        ],
    ];
}

function souq_platform_settings_merged(PDO $pdo): array
{
    $defaults = souq_platform_settings_defaults();
    if (!souq_table_exists($pdo, 'platform_settings')) {
        return $defaults;
    }
    try {
        $st = $pdo->query("SELECT settings FROM platform_settings WHERE id = 'platform' LIMIT 1");
        $row = $st ? $st->fetch(PDO::FETCH_ASSOC) : null;
        $saved = [];
        if ($row && isset($row['settings'])) {
            $decoded = is_string($row['settings']) ? json_decode($row['settings'], true) : $row['settings'];
            $saved = is_array($decoded) ? $decoded : [];
        }
        return array_replace_recursive($defaults, $saved);
    } catch (Throwable) {
        return $defaults;
    }
}

/** @param array<string,mixed> $row */
function souq_map_onboarding_invite(array $row): array
{
    return [
        'id' => $row['id'] ?? null,
        'token' => $row['token'] ?? '',
        'storeId' => $row['store_id'] ?? '',
        'plan' => $row['plan'] ?? 'pro',
        'label' => $row['label'] ?? '',
        'locale' => $row['locale'] ?? 'en',
        'textDir' => $row['text_dir'] ?? 'ltr',
        'currency' => $row['currency'] ?? 'SAR',
        'timezone' => $row['timezone'] ?? 'Asia/Riyadh',
        'createdAt' => $row['created_at'] ?? null,
        'expiresAt' => $row['expires_at'] ?? null,
        'usedAt' => $row['used_at'] ?? null,
        'redeemedStoreId' => $row['redeemed_store_id'] ?? null,
    ];
}

function souq_allocate_reserved_store_id(PDO $pdo): string
{
    for ($i = 0; $i < 8; $i++) {
        $id = 'store-' . bin2hex(random_bytes(5));
        $st = $pdo->prepare('SELECT 1 FROM stores WHERE id = ? LIMIT 1');
        $st->execute([$id]);
        if ($st->fetchColumn()) {
            continue;
        }
        if (souq_table_exists($pdo, 'onboarding_invites')) {
            $st2 = $pdo->prepare('SELECT 1 FROM onboarding_invites WHERE store_id = ? LIMIT 1');
            $st2->execute([$id]);
            if ($st2->fetchColumn()) {
                continue;
            }
        }
        return $id;
    }
    return 'store-' . bin2hex(random_bytes(8));
}

/** Master-only routes require a Bearer token (lite|… or Sanctum). Public invite validate/redeem stay open. */
function souq_require_master_bearer(): bool
{
    $auth = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    if ($auth === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strtolower((string) $k) === 'authorization') {
                    $auth = trim((string) $v);
                    break;
                }
            }
        }
    }
    if (!preg_match('/^Bearer\s+(\S+)/i', $auth, $m)) {
        http_response_code(401);
        echo json_encode(['message' => 'Master SuperAdmin session required.']);
        return false;
    }
    $token = trim($m[1]);
    if ($token === '' || str_starts_with($token, 'mock-')) {
        http_response_code(401);
        echo json_encode(['message' => 'Master SuperAdmin session required.']);
        return false;
    }

    return true;
}

function souq_phase1_master_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    souq_ensure_phase1_tables($pdo);
    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));

    if (preg_match('#^/onboarding/invites/([^/]+)$#', $uri, $om) && $method === 'GET') {
        $token = (string) $om[1];
        if (!souq_table_exists($pdo, 'onboarding_invites')) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'reason' => 'invalid']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM onboarding_invites WHERE token = ? LIMIT 1');
        $st->execute([$token]);
        $invite = $st->fetch(PDO::FETCH_ASSOC);
        if (!$invite) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'reason' => 'invalid']);
            return true;
        }
        if (!empty($invite['used_at'])) {
            http_response_code(410);
            echo json_encode(['ok' => false, 'reason' => 'used']);
            return true;
        }
        if (!empty($invite['expires_at']) && strtotime((string) $invite['expires_at']) < time()) {
            http_response_code(410);
            echo json_encode(['ok' => false, 'reason' => 'expired']);
            return true;
        }
        $mapped = souq_map_onboarding_invite($invite);
        echo json_encode([
            'ok' => true,
            'invite' => [
                'token' => $mapped['token'],
                'storeId' => $mapped['storeId'],
                'plan' => $mapped['plan'],
                'locale' => $mapped['locale'],
                'textDir' => $mapped['textDir'],
                'currency' => $mapped['currency'],
                'timezone' => $mapped['timezone'],
                'expiresAt' => $mapped['expiresAt'],
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/onboarding/invites/([^/]+)/redeem$#', $uri, $rm) && $method === 'POST') {
        $token = (string) $rm[1];
        $redeemStoreId = trim((string) ($input['store_id'] ?? ''));
        if ($redeemStoreId === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'reason' => 'store_mismatch']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM onboarding_invites WHERE token = ? LIMIT 1');
        $st->execute([$token]);
        $invite = $st->fetch(PDO::FETCH_ASSOC);
        if (!$invite) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'reason' => 'invalid']);
            return true;
        }
        if ((string) ($invite['store_id'] ?? '') !== $redeemStoreId) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'reason' => 'store_mismatch']);
            return true;
        }
        if (!empty($invite['used_at'])) {
            if ((string) ($invite['redeemed_store_id'] ?? '') === $redeemStoreId) {
                echo json_encode(['ok' => true, 'invite' => souq_map_onboarding_invite($invite)], JSON_UNESCAPED_UNICODE);
                return true;
            }
            http_response_code(410);
            echo json_encode(['ok' => false, 'reason' => 'used']);
            return true;
        }
        if (!empty($invite['expires_at']) && strtotime((string) $invite['expires_at']) < time()) {
            http_response_code(410);
            echo json_encode(['ok' => false, 'reason' => 'expired']);
            return true;
        }
        $now = date('Y-m-d H:i:s');
        $pdo->prepare('UPDATE onboarding_invites SET used_at = ?, redeemed_store_id = ? WHERE id = ?')
            ->execute([$now, $redeemStoreId, $invite['id']]);
        $invite['used_at'] = $now;
        $invite['redeemed_store_id'] = $redeemStoreId;
        souq_audit_write($pdo, $redeemStoreId, 'onboarding_invite.redeemed', 'onboarding_invite', (string) $invite['id'], ['store_id' => $redeemStoreId]);
        echo json_encode(['ok' => true, 'invite' => souq_map_onboarding_invite($invite)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/onboarding/invites' && $method === 'GET') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $rows = [];
        if (souq_table_exists($pdo, 'onboarding_invites')) {
            $rows = $pdo->query('SELECT * FROM onboarding_invites ORDER BY created_at DESC LIMIT 50')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        $data = array_map('souq_map_onboarding_invite', $rows);
        echo json_encode([
            'data' => $data,
            'meta' => [
                'total' => count($data),
                'last_refresh' => date('c'),
                'source' => 'onboarding_invites',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/onboarding/invites' && $method === 'POST') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $plan = strtolower(trim((string) ($input['plan'] ?? 'pro')));
        if (!in_array($plan, ['free', 'paid', 'pro', 'custom'], true)) {
            $plan = 'pro';
        }
        $label = trim((string) ($input['label'] ?? 'Merchant invite'));
        $days = max(1, min(90, (int) ($input['days_valid'] ?? 7)));
        $locale = ($input['locale'] ?? 'en') === 'ar' ? 'ar' : 'en';
        $textDir = in_array(($input['text_dir'] ?? ''), ['ltr', 'rtl'], true)
            ? (string) $input['text_dir']
            : ($locale === 'ar' ? 'rtl' : 'ltr');
        $currency = in_array(($input['currency'] ?? 'SAR'), ['SAR', 'USD', 'AED', 'EUR'], true)
            ? (string) $input['currency']
            : 'SAR';
        $timezone = trim((string) ($input['timezone'] ?? 'Asia/Riyadh')) ?: 'Asia/Riyadh';
        $reservedId = trim((string) ($input['store_id'] ?? ''));
        if ($reservedId === '') {
            $reservedId = souq_allocate_reserved_store_id($pdo);
        }
        $id = 'inv-' . bin2hex(random_bytes(8));
        $token = bin2hex(random_bytes(24));
        $expires = date('Y-m-d H:i:s', time() + ($days * 86400));
        $created = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO onboarding_invites (id, token, store_id, plan, label, locale, text_dir, currency, timezone, expires_at, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([$id, $token, $reservedId, $plan, $label, $locale, $textDir, $currency, $timezone, $expires, $created]);
        $row = [
            'id' => $id,
            'token' => $token,
            'store_id' => $reservedId,
            'plan' => $plan,
            'label' => $label,
            'locale' => $locale,
            'text_dir' => $textDir,
            'currency' => $currency,
            'timezone' => $timezone,
            'created_at' => $created,
            'expires_at' => $expires,
            'used_at' => null,
            'redeemed_store_id' => null,
        ];
        souq_audit_write($pdo, null, 'onboarding_invite.created', 'onboarding_invite', $id, ['store_id' => $reservedId, 'plan' => $plan]);
        http_response_code(201);
        echo json_encode(['data' => souq_map_onboarding_invite($row)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/platform/settings' && $method === 'GET') {
        if ($portal === 'master') {
            if (!souq_require_master_bearer()) {
                return true;
            }
            $merged = souq_platform_settings_merged($pdo);
            $updatedAt = null;
            if (souq_table_exists($pdo, 'platform_settings')) {
                $st = $pdo->query("SELECT updated_at FROM platform_settings WHERE id = 'platform' LIMIT 1");
                $u = $st ? $st->fetch(PDO::FETCH_ASSOC) : null;
                $updatedAt = $u['updated_at'] ?? null;
            }
            echo json_encode([
                'data' => $merged,
                'meta' => ['updated_at' => $updatedAt, 'source' => 'platform_settings'],
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }
        http_response_code(401);
        echo json_encode(['message' => 'Unauthorized.']);
        return true;
    }

    if ($uri === '/platform/settings' && $method === 'PATCH') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $previous = souq_platform_settings_merged($pdo);
        $patch = is_array($input) ? $input : [];
        $allowed = [
            'platformName', 'platformNameAr', 'platformTagline', 'platformTaglineAr',
            'platformLogo', 'supportEmail', 'timezone', 'defaultLocale', 'defaultCurrency',
            'whatsappEnabled', 'whatsappNumber', 'maintenanceMode', 'maintenanceMessage',
            'maintenanceMessageAr', 'socialLinks', 'branding', 'seo',
        ];
        $delta = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $patch)) {
                $delta[$key] = $patch[$key];
            }
        }
        $next = array_replace_recursive($previous, $delta);
        $now = date('Y-m-d H:i:s');
        $json = json_encode($next, JSON_UNESCAPED_UNICODE);
        $exists = $pdo->query("SELECT id FROM platform_settings WHERE id = 'platform' LIMIT 1")->fetchColumn();
        if ($exists) {
            $pdo->prepare("UPDATE platform_settings SET settings = ?, updated_at = ? WHERE id = 'platform'")
                ->execute([$json, $now]);
        } else {
            $pdo->prepare("INSERT INTO platform_settings (id, settings, created_at, updated_at) VALUES ('platform', ?, ?, ?)")
                ->execute([$json, $now, $now]);
        }
        souq_audit_write($pdo, null, 'platform_settings.updated', 'platform_settings', 'platform', ['keys' => array_keys($delta)]);
        echo json_encode([
            'data' => $next,
            'meta' => ['updated_at' => $now, 'source' => 'platform_settings'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/plans' && $method === 'GET') {
        $out = souq_plans_catalog();
        if (souq_table_exists($pdo, 'plans')) {
            try {
                $rows = $pdo->query('SELECT * FROM plans')->fetchAll(PDO::FETCH_ASSOC) ?: [];
                $byCode = [];
                foreach ($rows as $r) {
                    $code = strtolower((string) ($r['code'] ?? ''));
                    if ($code !== '') {
                        $byCode[$code] = $r;
                    }
                }
                foreach ($out as &$plan) {
                    $hit = $byCode[$plan['code']] ?? null;
                    if (!$hit) {
                        continue;
                    }
                    if (isset($hit['name']) && $hit['name'] !== '') {
                        $plan['name'] = $hit['name'];
                    }
                    if (array_key_exists('price_sar', $hit)) {
                        $plan['price_sar'] = $hit['price_sar'] === null ? null : (is_numeric($hit['price_sar']) ? (float) $hit['price_sar'] : $plan['price_sar']);
                    }
                    if (!empty($hit['id'])) {
                        $plan['id'] = $hit['id'];
                    }
                }
                unset($plan);
            } catch (Throwable) {
                /* keep catalog defaults */
            }
        }
        echo json_encode([
            'data' => $out,
            'platform' => [
                'name_en' => 'Souq Plus',
                'name_ar' => 'سوق بلس',
                'package' => 'unityteck-multi-store',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/subscriptions' && $method === 'GET') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $stores = $pdo->query('SELECT * FROM stores ORDER BY name ASC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $rows = [];
        $nearExpiry = 0;
        $now = time();
        foreach ($stores as $store) {
            $payload = function_exists('souq_store_payload') ? souq_store_payload($store) : $store;
            $sid = (string) ($store['id'] ?? '');
            $plan = strtolower((string) ($payload['plan'] ?? souq_store_plan_code($pdo, $sid)));
            $raw = null;
            if (souq_table_exists($pdo, 'subscriptions') && $sid !== '') {
                try {
                    $st = $pdo->prepare('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1');
                    $st->execute([$sid]);
                    $raw = $st->fetch(PDO::FETCH_ASSOC) ?: null;
                } catch (Throwable) {
                    $raw = null;
                }
            }
            $status = strtolower((string) ($raw['status'] ?? ($payload['subscription_status'] ?? 'active')));
            $endsAt = $raw['ends_at'] ?? null;
            $lifecycle = [
                'status' => $status !== '' ? $status : 'active',
                'billing_interval' => $raw['billing_interval'] ?? 'monthly',
                'starts_at' => $raw['starts_at'] ?? null,
                'ends_at' => $endsAt,
                'grace_ends_at' => $raw['grace_ends_at'] ?? null,
                'renewed_at' => $raw['renewed_at'] ?? null,
                'writable' => !in_array($status, ['expired', 'suspended'], true),
                'message' => null,
            ];
            if ($endsAt) {
                $ts = strtotime((string) $endsAt);
                if ($ts !== false) {
                    $days = ($ts - $now) / 86400;
                    if ($days >= 0 && $days <= 14) {
                        $nearExpiry++;
                    }
                }
            }
            $rows[] = [
                'store_id' => $sid,
                'store_name' => (string) ($payload['name'] ?? $store['name'] ?? $sid),
                'plan' => $plan,
                'subscription_status' => $payload['subscription_status'] ?? null,
                'lifecycle' => $lifecycle,
                'raw' => $raw,
            ];
        }
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'near_expiry' => $nearExpiry,
                'last_refresh' => date('c'),
                'source' => 'subscriptions+stores',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/audit-logs' && $method === 'GET') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 50)));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $action = trim((string) ($_GET['action'] ?? ''));
        $filterStore = trim((string) ($_GET['store_id'] ?? ''));
        if (!souq_table_exists($pdo, 'audit_logs')) {
            echo json_encode([
                'data' => [],
                'meta' => [
                    'total' => 0,
                    'page' => $page,
                    'per_page' => $perPage,
                    'last_refresh' => date('c'),
                    'source' => 'audit_logs',
                ],
            ]);
            return true;
        }
        $where = [];
        $params = [];
        if ($action !== '') {
            $where[] = 'action LIKE ?';
            $params[] = '%' . $action . '%';
        }
        if ($filterStore !== '') {
            $where[] = 'store_id = ?';
            $params[] = $filterStore;
        }
        $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        $countSt = $pdo->prepare("SELECT COUNT(*) FROM audit_logs {$sqlWhere}");
        $countSt->execute($params);
        $total = (int) $countSt->fetchColumn();
        $offset = ($page - 1) * $perPage;
        $st = $pdo->prepare("SELECT * FROM audit_logs {$sqlWhere} ORDER BY created_at DESC LIMIT {$perPage} OFFSET {$offset}");
        $st->execute($params);
        $items = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($items as &$item) {
            if (isset($item['meta']) && is_string($item['meta'])) {
                $decoded = json_decode($item['meta'], true);
                $item['meta'] = is_array($decoded) ? $decoded : $item['meta'];
            }
        }
        unset($item);
        echo json_encode([
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_refresh' => date('c'),
                'source' => 'audit_logs',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/stores/([^/]+)/subscription$#', $uri, $m) && $method === 'PATCH') {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return true;
        }
        if (!souq_require_master_bearer()) {
            return true;
        }
        $targetStoreId = (string) $m[1];
        $row = souq_store_row($pdo, $targetStoreId);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Store not found.']);
            return true;
        }
        $status = isset($input['status']) ? strtolower(trim((string) $input['status'])) : null;
        $allowed = ['trial', 'active', 'grace', 'expired', 'suspended'];
        if ($status !== null && !in_array($status, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid subscription status.']);
            return true;
        }
        $reason = isset($input['reason']) ? trim((string) $input['reason']) : null;
        $before = null;
        $sub = null;
        if (souq_table_exists($pdo, 'subscriptions')) {
            try {
                $st = $pdo->prepare('SELECT * FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1');
                $st->execute([$targetStoreId]);
                $sub = $st->fetch(PDO::FETCH_ASSOC) ?: null;
                $before = $sub ? [
                    'status' => $sub['status'] ?? null,
                    'ends_at' => $sub['ends_at'] ?? null,
                ] : null;
                if (!$sub) {
                    $planCode = souq_store_plan_code($pdo, $targetStoreId);
                    $subId = 'sub-' . $targetStoreId;
                    $pdo->prepare(
                        'INSERT INTO subscriptions (id, store_id, plan_id, status, billing_interval, starts_at, ends_at, created_at, updated_at)
                         VALUES (?,?,?,?,?,?,?,?,?)'
                    )->execute([
                        $subId,
                        $targetStoreId,
                        'plan-' . $planCode,
                        $status ?: 'trial',
                        'monthly',
                        date('Y-m-d H:i:s'),
                        date('Y-m-d H:i:s', time() + 14 * 86400),
                        date('Y-m-d H:i:s'),
                        date('Y-m-d H:i:s'),
                    ]);
                    $st->execute([$targetStoreId]);
                    $sub = $st->fetch(PDO::FETCH_ASSOC) ?: null;
                } elseif ($status !== null) {
                    $pdo->prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?')
                        ->execute([$status, date('Y-m-d H:i:s'), $sub['id']]);
                    $st->execute([$targetStoreId]);
                    $sub = $st->fetch(PDO::FETCH_ASSOC) ?: $sub;
                }
            } catch (Throwable $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Subscription update failed.']);
                return true;
            }
        }

        // Mirror status onto stores.subscription_status when column exists.
        try {
            $pdo->prepare('UPDATE stores SET subscription_status = ? WHERE id = ?')->execute([
                $status ?: ($sub['status'] ?? 'active'),
                $targetStoreId,
            ]);
        } catch (Throwable) {
            /* column may not exist on older schemas */
        }

        souq_audit_write($pdo, $targetStoreId, 'subscription.update', 'subscription', $sub['id'] ?? null, [
            'reason' => $reason,
            'before' => $before,
            'after' => [
                'status' => $sub['status'] ?? $status,
                'ends_at' => $sub['ends_at'] ?? null,
            ],
        ]);

        echo json_encode([
            'data' => [
                'status' => $sub['status'] ?? ($status ?: 'active'),
                'billing_interval' => $sub['billing_interval'] ?? 'monthly',
                'starts_at' => $sub['starts_at'] ?? null,
                'ends_at' => $sub['ends_at'] ?? null,
                'grace_ends_at' => $sub['grace_ends_at'] ?? null,
                'renewed_at' => $sub['renewed_at'] ?? null,
                'writable' => true,
                'message' => null,
            ],
            'raw' => $sub,
            'store_id' => $targetStoreId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}

/**
 * @return bool true if request handled
 */
function souq_live_extensions_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    souq_ensure_live_extension_tables($pdo);

    if (!function_exists('souq_session_lite_dispatch')) {
        require_once __DIR__ . '/session_lite.php';
    }
    if (souq_session_lite_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    if (!function_exists('souq_google_dispatch')) {
        require_once __DIR__ . '/google_oauth.php';
    }
    if (souq_google_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── Official Canva Connect (Master testing — separate from Design Studio) ──
    if (!function_exists('souq_canva_dispatch')) {
        require_once __DIR__ . '/canva_connect.php';
    }
    if (souq_canva_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── SOUQ PLUS Phase 1 — Master plans / subscriptions / audit (Hostinger gateway) ──
    if (souq_phase1_master_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    if (!function_exists('souq_phase1_ops_dispatch')) {
        require_once __DIR__ . '/master_phase1_ops.php';
    }
    if (souq_phase1_ops_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── Store Help Chatbot (AI + Master human handoff) ──
    if (!function_exists('souq_help_chatbot_dispatch')) {
        require_once __DIR__ . '/help_chatbot.php';
    }
    if (souq_help_chatbot_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── SOUQ PLUS Phase 2–5 — roles / verification / CS CMS / ops ──
    if (!function_exists('souq_phase2to5_ops_dispatch')) {
        require_once __DIR__ . '/master_phase2to5_ops.php';
    }
    if (souq_phase2to5_ops_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── SOUQ PLUS Phase 6–9 — attachments / messaging / governance / acceptance ──
    if (!function_exists('souq_phase6to9_ops_dispatch')) {
        require_once __DIR__ . '/master_phase6to9_ops.php';
    }
    if (souq_phase6to9_ops_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    // ── Master Platform Blog (Google Blogger-style · EN/AR · live/unlisted/private) ──
    if (!function_exists('souq_platform_blog_dispatch')) {
        require_once __DIR__ . '/master_platform_blog.php';
    }
    if (souq_platform_blog_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    if ($uri === '/design-templates/entitlements' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $plan = souq_store_plan_code($pdo, $storeId);
        $row = souq_store_row($pdo, $storeId);
        $data = $row ? (json_decode((string)($row['data'] ?? '{}'), true) ?: []) : [];
        $override = $data['canvaTemplatesPerCategory'] ?? $data['canva_templates_per_category'] ?? null;
        $limit = in_array($plan, ['pro', 'premium', 'custom'], true)
            ? null
            : ((is_numeric($override) && (int)$override > 0) ? (int)$override : 5);
        echo json_encode(['data' => [
            'store_id' => $storeId,
            'plan_code' => $plan,
            'billed_code' => strtolower((string)($data['plan'] ?? 'free')),
            'master_granted_pro' => !empty($data['masterGrantedPro']) || !empty($data['master_granted_pro']),
            'media_studio' => true,
            'canva_templates_per_category' => $limit,
            'canva_categories' => ['product', 'category', 'banner', 'social'],
            'free_default' => 5,
        ]]);
        return true;
    }

    if ($uri === '/ai-media/ping' && $method === 'GET') {
        $key = souq_gemini_api_key();
        $host = 'generativelanguage.googleapis.com';
        $dns = @gethostbyname($host);
        $tcpOk = false;
        $tcpErr = '';
        $tcpIp = ($dns && $dns !== $host) ? $dns : $host;
        $fp = @fsockopen('ssl://' . $tcpIp, 443, $errno, $errstr, 8);
        if ($fp) {
            $tcpOk = true;
            fclose($fp);
        } else {
            $tcpErr = trim($errno . ' ' . $errstr);
        }
        $geminiHttp = 0;
        $geminiErr = '';
        $geminiMs = 0;
        if ($key !== '' && $key !== 'MY_GEMINI_API_KEY') {
            $t0 = microtime(true);
            $pingModel = souq_gemini_resolve_text_model();
            $res = souq_gemini_curl_json(
                'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($pingModel) . ':generateContent',
                [
                    'contents' => [['parts' => [['text' => 'Reply with OK']]]],
                    'generationConfig' => souq_gemini_text_generation_config($pingModel, ['maxOutputTokens' => 16]),
                ],
                20,
                $key
            );
            $geminiMs = (int) round((microtime(true) - $t0) * 1000);
            $geminiHttp = (int)$res['status'];
            $geminiErr = (string)$res['err'];
            if ($geminiHttp >= 200 && $geminiHttp < 300) {
                $geminiErr = '';
            } elseif ($geminiErr === '' && is_string($res['raw'])) {
                $decoded = json_decode($res['raw'], true);
                $geminiErr = (string)($decoded['error']['message'] ?? mb_substr((string)$res['raw'], 0, 160));
            }
        }
        echo json_encode([
            'ok' => $geminiHttp >= 200 && $geminiHttp < 300,
            'key_present' => $key !== '' && $key !== 'MY_GEMINI_API_KEY',
            'key_len' => strlen($key),
            'text_model' => souq_gemini_resolve_text_model(),
            'dns' => $dns,
            'tcp_443' => $tcpOk ? 'ok' : ('fail: ' . $tcpErr),
            'gemini_http' => $geminiHttp,
            'gemini_ms' => $geminiMs,
            'gemini_err' => mb_substr($geminiErr, 0, 220),
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/quota' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        $snap['models'] = souq_ai_model_catalog();
        $snap['personas'] = souq_ai_brand_personas();
        $snap['campaign_presets'] = souq_ai_campaign_presets();
        $snap['output_templates'] = souq_ai_output_templates();
        echo json_encode(['data' => $snap]);
        return true;
    }

    if ($uri === '/ai-media/brand-profile' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        echo json_encode([
            'data' => souq_ai_load_brand_profile($pdo, $storeId),
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/brand-profile' && ($method === 'PUT' || $method === 'POST')) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $palette = souq_ai_normalize_palette($input['palette_hex'] ?? []);
        $persona = strtolower(trim((string)($input['persona'] ?? 'modern')));
        if (!in_array($persona, souq_ai_brand_personas(), true)) {
            $persona = 'modern';
        }
        $refs = souq_ai_normalize_style_refs($input['style_reference_urls'] ?? []);
        $pos = (string)($input['logo_overlay_position'] ?? 'bottom_end');
        if (!in_array($pos, ['top_start', 'top_end', 'bottom_start', 'bottom_end'], true)) {
            $pos = 'bottom_end';
        }
        $logoUrl = trim((string)($input['logo_url'] ?? ''));
        $now = date('c');
        $existing = $pdo->prepare('SELECT id FROM store_ai_brand_profiles WHERE store_id = ? LIMIT 1');
        $existing->execute([$storeId]);
        $id = (string)($existing->fetchColumn() ?: '');
        if ($id === '') {
            $id = 'aibrand-' . bin2hex(random_bytes(6));
            $ins = $pdo->prepare('INSERT INTO store_ai_brand_profiles (id, store_id, palette_hex, persona, brand_lock_default, logo_overlay_enabled, logo_overlay_position, logo_url, style_reference_urls, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
            $ins->execute([
                $id,
                $storeId,
                json_encode($palette, JSON_UNESCAPED_UNICODE),
                $persona,
                !empty($input['brand_lock_default']) || !array_key_exists('brand_lock_default', $input) ? 1 : 0,
                !empty($input['logo_overlay_enabled']) ? 1 : 0,
                $pos,
                $logoUrl !== '' ? $logoUrl : null,
                json_encode($refs, JSON_UNESCAPED_UNICODE),
                $now,
                $now,
            ]);
        } else {
            $upd = $pdo->prepare('UPDATE store_ai_brand_profiles SET palette_hex=?, persona=?, brand_lock_default=?, logo_overlay_enabled=?, logo_overlay_position=?, logo_url=?, style_reference_urls=?, updated_at=? WHERE store_id=?');
            $upd->execute([
                json_encode($palette, JSON_UNESCAPED_UNICODE),
                $persona,
                array_key_exists('brand_lock_default', $input) ? (!empty($input['brand_lock_default']) ? 1 : 0) : 1,
                !empty($input['logo_overlay_enabled']) ? 1 : 0,
                $pos,
                $logoUrl !== '' ? $logoUrl : null,
                json_encode($refs, JSON_UNESCAPED_UNICODE),
                $now,
                $storeId,
            ]);
        }
        echo json_encode([
            'data' => souq_ai_load_brand_profile($pdo, $storeId),
            'message' => 'Brand identity saved for this store.',
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/product-copy' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'code' => 'validation']);
            return true;
        }
        try {
            $env = souq_load_root_env();
            $key = trim((string)($env['GEMINI_API_KEY'] ?? ''));
            if ($key === '' || $key === 'MY_GEMINI_API_KEY') {
                http_response_code(503);
                echo json_encode([
                    'message' => 'AI text provider is not connected.',
                    'code' => 'provider_not_connected',
                    'store_id' => $storeId,
                ]);
                return true;
            }
            $storeName = '';
            try {
                $storeRow = souq_store_row($pdo, $storeId);
                $storeName = is_array($storeRow) ? trim((string)($storeRow['name'] ?? '')) : '';
            } catch (Throwable) {
                $storeName = '';
            }
            $result = souq_gemini_suggest_product_copy([
                'name' => (string)($input['name'] ?? ''),
                'category' => (string)($input['category'] ?? ''),
                'brand' => (string)($input['brand'] ?? ''),
                'product_type' => (string)($input['product_type'] ?? ''),
                'store_name' => $storeName,
                'seed' => (string)($input['seed'] ?? ''),
                'locale' => (string)($input['locale'] ?? 'en'),
                'image_url' => (string)($input['image_url'] ?? ''),
                'available_categories' => is_array($input['available_categories'] ?? null)
                    ? $input['available_categories']
                    : [],
                'available_brands' => is_array($input['available_brands'] ?? null)
                    ? $input['available_brands']
                    : [],
            ]);
            if (!$result['ok']) {
                $code = (string) ($result['code'] ?? 'provider_error');
                $msg = (string) ($result['message'] ?? 'AI product copy failed.');
                $busy = str_contains(strtolower($msg), 'high demand')
                    || str_contains(strtolower($msg), 'try again later')
                    || str_contains(strtolower($msg), 'resource exhausted')
                    || $code === 'provider_quota_exceeded';
                $status = $code === 'provider_not_connected' || $busy ? 503
                    : ($code === 'missing_context' ? 422 : 502);
                http_response_code($status);
                echo json_encode([
                    'message' => $busy
                        ? 'AI text provider is busy right now. Please try again in a moment.'
                        : $msg,
                    'code' => $busy ? 'provider_busy' : $code,
                    'store_id' => $storeId,
                ]);
                return true;
            }
            echo json_encode([
                'success' => true,
                'store_id' => $storeId,
                'data' => [
                    'title' => $result['title'] ?? '',
                    'subtitle' => $result['subtitle'] ?? '',
                    'description' => $result['description'] ?? '',
                    'seo_title' => $result['seo_title'] ?? '',
                    'seo_description' => $result['seo_description'] ?? '',
                    'tags' => is_array($result['tags'] ?? null) ? $result['tags'] : [],
                    'title_en' => $result['title_en'] ?? '',
                    'title_ar' => $result['title_ar'] ?? '',
                    'subtitle_en' => $result['subtitle_en'] ?? '',
                    'subtitle_ar' => $result['subtitle_ar'] ?? '',
                    'description_en' => $result['description_en'] ?? '',
                    'description_ar' => $result['description_ar'] ?? '',
                    'seo_title_en' => $result['seo_title_en'] ?? '',
                    'seo_title_ar' => $result['seo_title_ar'] ?? '',
                    'seo_description_en' => $result['seo_description_en'] ?? '',
                    'seo_description_ar' => $result['seo_description_ar'] ?? '',
                    'seo_keywords_en' => $result['seo_keywords_en'] ?? '',
                    'seo_keywords_ar' => $result['seo_keywords_ar'] ?? '',
                    'tags_en' => is_array($result['tags_en'] ?? null) ? $result['tags_en'] : [],
                    'tags_ar' => is_array($result['tags_ar'] ?? null) ? $result['tags_ar'] : [],
                    'brand' => $result['brand'] ?? '',
                    'categories' => is_array($result['categories'] ?? null) ? $result['categories'] : [],
                    'price_sar' => $result['price_sar'] ?? null,
                    'price_source' => $result['price_source'] ?? null,
                    'google_taxonomy' => $result['google_taxonomy'] ?? '',
                    'barcode' => $result['barcode'] ?? '',
                    'weight_kg' => $result['weight_kg'] ?? null,
                    'used_image' => !empty($result['used_image']),
                    'saved' => false,
                    'model' => $result['model'] ?? null,
                ],
                'message' => 'Product copy suggestion ready.',
            ], JSON_UNESCAPED_UNICODE);
            return true;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'message' => 'AI product copy failed: ' . $e->getMessage(),
                'code' => 'server_error',
                'store_id' => $storeId,
            ]);
            return true;
        }
    }

    if ($uri === '/ai-media/enhance-prompt' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $prompt = trim((string)($input['prompt'] ?? ''));
        if (mb_strlen($prompt) < 4) {
            http_response_code(422);
            echo json_encode(['message' => 'Prompt must be at least 4 characters.', 'code' => 'validation']);
            return true;
        }
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        if (!$snap['image_provider_ready']) {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        $profile = souq_ai_load_brand_profile($pdo, $storeId);
        $brandLock = array_key_exists('brand_lock', $input)
            ? !empty($input['brand_lock'])
            : (bool)$profile['brand_lock_default'];
        $templates = souq_ai_output_templates();
        $tpl = (string)($input['output_template'] ?? '');
        $aspect = (string)($templates[$tpl] ?? ($input['aspect'] ?? '1:1'));
        $seed = souq_ai_brand_merge_prompt($prompt, [
            'palette_hex' => $profile['palette_hex'],
            'persona' => (string)($input['persona'] ?? $profile['persona']),
            'brand_lock' => $brandLock,
            'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
            'accent_color' => $profile['store_accent_color'] ?? null,
        ]);
        $result = souq_gemini_enhance_prompt(
            $seed,
            (string)($input['locale'] ?? 'en'),
            $aspect,
            isset($input['style']) ? (string)$input['style'] : null,
        );
        if (!$result['ok']) {
            http_response_code(502);
            echo json_encode(['message' => $result['message'], 'code' => $result['code']]);
            return true;
        }
        echo json_encode([
            'data' => [
                'prompt' => $result['prompt'],
                'prompt_seed' => $seed,
                'brand_lock' => $brandLock,
                'model' => $result['model'],
                'store_id' => $storeId,
            ],
            'message' => 'Prompt enhanced.',
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/generate' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $kind = (($input['kind'] ?? 'image') === 'video') ? 'video' : 'image';
        $prompt = trim((string)($input['prompt'] ?? ''));
        $templates = souq_ai_output_templates();
        $tpl = (string)($input['output_template'] ?? '');
        $aspect = (string)($templates[$tpl] ?? ($input['aspect'] ?? '1:1'));
        if (!in_array($aspect, ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'], true)) {
            $aspect = '1:1';
        }
        if (strlen($prompt) < 8) {
            http_response_code(422);
            echo json_encode(['message' => 'Prompt must be at least 8 characters.']);
            return true;
        }
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        if ($kind === 'video') {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI video generation is not connected yet. Waiting for provider.',
                'code' => 'video_provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        if (!$snap['image_provider_ready']) {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        $consume = souq_ai_consume($pdo, $storeId, 'image');
        if (!$consume['ok']) {
            http_response_code(429);
            echo json_encode([
                'message' => 'Monthly AI image generation limit reached for this store.',
                'code' => $consume['code'],
                'data' => ['quota' => $consume['snapshot']],
            ]);
            return true;
        }

        $profile = souq_ai_load_brand_profile($pdo, $storeId);
        $brandLock = array_key_exists('brand_lock', $input)
            ? !empty($input['brand_lock'])
            : (bool)$profile['brand_lock_default'];
        $productB64 = trim((string)($input['product_image_base64'] ?? ''));
        $productImage = null;
        if ($productB64 !== '') {
            if (str_starts_with($productB64, 'data:') && preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $productB64, $m)) {
                $productImage = ['mime' => $m[1], 'base64' => $m[2]];
            } else {
                $productImage = [
                    'mime' => (string)($input['product_image_mime'] ?? 'image/jpeg'),
                    'base64' => $productB64,
                ];
            }
        }

        $mergedPrompt = souq_ai_brand_merge_prompt($prompt, [
            'palette_hex' => $profile['palette_hex'],
            'persona' => (string)($input['persona'] ?? $profile['persona']),
            'brand_lock' => $brandLock,
            'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
            'product_injection' => $productImage !== null,
            'match_perspective' => !array_key_exists('match_perspective', $input) || !empty($input['match_perspective']),
            'accent_color' => $profile['store_accent_color'] ?? null,
        ]);

        $finalPrompt = $mergedPrompt;
        $autoEnhance = !empty($input['auto_enhance']);
        if ($autoEnhance) {
            $enhanced = souq_gemini_enhance_prompt(
                $mergedPrompt,
                (string)($input['locale'] ?? 'en'),
                $aspect,
                isset($input['style']) ? (string)$input['style'] : null,
            );
            if (!empty($enhanced['ok']) && !empty($enhanced['prompt'])) {
                $finalPrompt = (string)$enhanced['prompt'];
            }
        }

        $result = souq_gemini_generate_image($finalPrompt, [
            'model' => isset($input['model']) ? (string)$input['model'] : null,
            'aspect' => $aspect,
            'image_size' => (string)($input['image_size'] ?? '1K'),
            'style' => isset($input['style']) ? (string)$input['style'] : null,
            'negative_prompt' => isset($input['negative_prompt']) ? (string)$input['negative_prompt'] : null,
            'brand_locked' => $brandLock,
            'product_image' => $productImage,
        ]);
        if (!$result['ok']) {
            souq_ai_refund_image($pdo, $storeId);
            http_response_code(502);
            echo json_encode([
                'message' => $result['message'],
                'code' => $result['code'],
                'data' => ['quota' => souq_ai_quota_snapshot($pdo, $storeId)],
            ]);
            return true;
        }
        $binary = base64_decode((string)$result['base64'], true);
        if ($binary === false || $binary === '') {
            souq_ai_refund_image($pdo, $storeId);
            http_response_code(502);
            echo json_encode(['message' => 'Failed to decode AI image bytes.', 'code' => 'decode_error']);
            return true;
        }
        $title = trim((string)($input['title'] ?? '')) ?: ('ai-' . substr(md5($prompt), 0, 8));
        $media = souq_save_binary_media(
            $pdo,
            $storeId,
            $binary,
            (string)$result['mime'],
            $title,
            'ai-generated',
            $title,
            $finalPrompt,
            [
                'source' => 'ai_generator',
                'prompt' => $finalPrompt,
                'prompt_raw' => $prompt,
                'prompt_merged' => $mergedPrompt,
                'aspect' => $aspect,
                'model' => $result['model'],
                'image_size' => (string)($input['image_size'] ?? '1K'),
                'style' => $input['style'] ?? null,
                'kind' => 'image',
                'auto_enhance' => $autoEnhance,
                'brand_lock' => $brandLock,
                'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
                'product_injection' => $productImage !== null,
            ]
        );
        echo json_encode([
            'data' => [
                'kind' => 'image',
                'saved' => true,
                'prompt_used' => $finalPrompt,
                'prompt_merged' => $mergedPrompt,
                'brand_lock' => $brandLock,
                'logo_overlay_applied' => false,
                'quota' => souq_ai_quota_snapshot($pdo, $storeId),
                'media' => array_merge($media, [
                    'prompt' => $finalPrompt,
                    'aspect' => $aspect,
                    'model' => $result['model'],
                    'preview_data_url' => 'data:' . $result['mime'] . ';base64,' . $result['base64'],
                ]),
            ],
            'message' => 'AI image generated for this store.',
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        http_response_code(201);
        return true;
    }

    // Media library
    if ($uri === '/media' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $q = $pdo->prepare('SELECT * FROM media WHERE store_id = ? ORDER BY datetime(created_at) DESC');
        $q->execute([$storeId]);
        $rows = array_map('souq_media_row', $q->fetchAll());
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'current_page' => 1,
                'per_page' => max(1, count($rows)),
                'total' => count($rows),
                'last_page' => 1,
            ],
        ]);
        return true;
    }

    if ($uri === '/media' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        if (!empty($_FILES['file']['tmp_name'])) {
            $tmp = $_FILES['file']['tmp_name'];
            $binary = (string)file_get_contents($tmp);
            $mime = (string)($_FILES['file']['type'] ?: 'image/jpeg');
            $name = (string)($_FILES['file']['name'] ?: 'upload.jpg');
            $row = souq_save_binary_media($pdo, $storeId, $binary, $mime, $name, (string)($_POST['folder'] ?? 'general'), $_POST['alt'] ?? null, $_POST['caption'] ?? null, null);
            http_response_code(201);
            echo json_encode(['data' => $row, 'message' => 'File uploaded', 'store_id' => $storeId]);
            return true;
        }
        $rawUrl = (string)($input['url'] ?? '');
        if (preg_match('/^data:([^;]+);base64,(.+)$/', $rawUrl, $m)) {
            $binary = base64_decode($m[2], true);
            if ($binary === false) {
                http_response_code(422);
                echo json_encode(['message' => 'Invalid base64 media.']);
                return true;
            }
            $row = souq_save_binary_media(
                $pdo,
                $storeId,
                $binary,
                $m[1],
                (string)($input['file_name'] ?? 'media-asset'),
                (string)($input['folder'] ?? 'general'),
                $input['alt'] ?? null,
                $input['caption'] ?? null,
                is_array($input['metadata'] ?? null) ? $input['metadata'] : null
            );
            http_response_code(201);
            echo json_encode(['data' => $row, 'message' => 'Media asset saved', 'store_id' => $storeId]);
            return true;
        }
        if ($rawUrl !== '') {
            $id = 'med-' . substr(md5(uniqid($storeId, true)), 0, 12);
            $now = date('c');
            $pdo->prepare('INSERT INTO media (id, store_id, file_name, file_type, mime, size_bytes, width, height, url, optimized_url, webp_url, thumbnail_url, alt, caption, folder, processing_status, optimization_status, version, metadata, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
                ->execute([
                    $id, $storeId, $input['file_name'] ?? 'media-asset', $input['file_type'] ?? 'image', $input['mime'] ?? 'image/jpeg',
                    (int)($input['size_bytes'] ?? 0), $input['width'] ?? null, $input['height'] ?? null,
                    $rawUrl, $input['optimized_url'] ?? $rawUrl, $input['webp_url'] ?? $rawUrl, $input['thumbnail_url'] ?? $rawUrl,
                    $input['alt'] ?? null, $input['caption'] ?? null, $input['folder'] ?? 'general',
                    'ready', 'optimized', 1, isset($input['metadata']) ? json_encode($input['metadata']) : null, $now, $now,
                ]);
            $st = $pdo->prepare('SELECT * FROM media WHERE id = ? AND store_id = ?');
            $st->execute([$id, $storeId]);
            http_response_code(201);
            echo json_encode(['data' => souq_media_row($st->fetch()), 'message' => 'Media asset saved', 'store_id' => $storeId]);
            return true;
        }
        http_response_code(400);
        echo json_encode(['message' => 'No file or url provided.']);
        return true;
    }

    if (preg_match('#^/media/([^/]+)$#', $uri, $mm) && $method === 'DELETE') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $pdo->prepare('DELETE FROM media WHERE id = ? AND store_id = ?')->execute([$mm[1], $storeId]);
        echo json_encode(['success' => true]);
        return true;
    }

    // SEO write (real store data only)
    if ($uri === '/seo' && in_array($method, ['PATCH', 'PUT', 'POST'], true)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        try {
            souq_ensure_mysql_store_data_column($pdo);
            $row = souq_store_row($pdo, $storeId);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['message' => 'Store not found']);
                return true;
            }
            $data = function_exists('souq_store_data')
                ? souq_store_data($pdo, $storeId)
                : (function_exists('souq_store_payload')
                    ? souq_store_payload($row)
                    : (json_decode((string)($row['data'] ?? '{}'), true) ?: []));
            if (!is_array($data)) {
                $data = [];
            }
            $seo = is_array($data['seo'] ?? null) ? $data['seo'] : [];
            $map = [
                'meta_title' => 'metaTitle',
                'meta_description' => 'metaDescription',
                'ga4_measurement_id' => 'ga4MeasurementId',
                'keywords' => 'keywords',
            ];
            foreach ($map as $apiKey => $seoKey) {
                if (array_key_exists($apiKey, $input)) {
                    $seo[$seoKey] = $input[$apiKey];
                }
                if (array_key_exists($seoKey, $input)) {
                    $seo[$seoKey] = $input[$seoKey];
                }
            }
            if (isset($input['extra']) && is_array($input['extra'])) {
                $seo = array_merge($seo, $input['extra']);
            }
            $data['seo'] = $seo;
            if (!empty($seo['ga4MeasurementId'])) {
                $data['ga4MeasurementId'] = $seo['ga4MeasurementId'];
            }
            if (function_exists('souq_save_store_data')) {
                souq_save_store_data($pdo, $storeId, $data);
            } else {
                $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $storeId]);
            }

            $ga = strtoupper(trim((string)($seo['ga4MeasurementId'] ?? '')));
            $gaOk = (bool)preg_match('/^G-[A-Z0-9]+$/', $ga);
            $gInt = is_array($data['google_integration'] ?? null) ? $data['google_integration'] : [];
            $googleConnected = !empty($gInt['is_connected']) && !empty($gInt['google_account_email']);
            $host = function_exists('souq_request_host') ? souq_request_host() : '';
            $publicHost = '';
            if ($host && function_exists('souq_host_store') && souq_host_store($host) === $storeId) {
                $publicHost = $host;
            } elseif (!empty($row['domain'])) {
                $publicHost = strtolower((string)preg_replace('#^https?://#', '', (string)$row['domain']));
                $publicHost = explode('/', $publicHost)[0];
            }
            echo json_encode(['data' => [
                'store_id' => $storeId,
                'google_connected' => $googleConnected,
                'google_account_email' => $googleConnected ? (string)($gInt['google_account_email'] ?? '') : '',
                'ga4_measurement_id' => $gaOk ? $ga : '',
                'meta_title' => (string)($seo['metaTitle'] ?? ''),
                'meta_description' => (string)($seo['metaDescription'] ?? ''),
                'keywords' => $seo['keywords'] ?? [],
                'sitemap_url' => $publicHost !== '' ? 'https://' . $publicHost . '/sitemap.xml' : '',
                'indexed_urls_count' => null,
                'total_search_clicks' => null,
                'total_search_impressions' => null,
                'avg_ctr' => null,
                'avg_position' => null,
                'top_queries' => [],
                'extra' => new stdClass(),
            ]]);
            return true;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'SEO save failed', 'error' => $e->getMessage()]);
            return true;
        }
    }

    // ── Bank accounts / customer wallet / activities (Hostinger MySQL gateway) ──
    if (souq_gateway_bank_wallet_activity_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    return false;
}

/**
 * Real store_id scoped bank accounts, wallets, and customer activities for the PHP gateway.
 * Empty tables → empty data (never fake rows). Missing tables → empty / soft fail.
 */
function souq_gateway_table_exists(PDO $pdo, string $table): bool
{
    static $cache = [];
    $key = spl_object_id($pdo) . ':' . $table;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    try {
        if (souq_driver_is_mysql($pdo)) {
            $st = $pdo->prepare('SHOW TABLES LIKE ?');
            $st->execute([$table]);
            $cache[$key] = (bool) $st->fetchColumn();
        } else {
            $safe = preg_replace('/[^a-z0-9_]/i', '', $table) ?: 'x';
            $st = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='{$safe}' LIMIT 1");
            $cache[$key] = (bool) ($st && $st->fetchColumn());
        }
    } catch (Throwable) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

/**
 * Normalize a delivery_drivers MySQL/SQLite row for the admin API (JSON cols + bools).
 *
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function souq_map_delivery_driver_row(array $row): array
{
    foreach (['service_areas', 'payment_options'] as $jsonCol) {
        if (!array_key_exists($jsonCol, $row)) {
            continue;
        }
        $raw = $row[$jsonCol];
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $row[$jsonCol] = is_array($decoded) ? $decoded : [];
        } elseif ($raw === null) {
            $row[$jsonCol] = [];
        } elseif (!is_array($raw)) {
            $row[$jsonCol] = [];
        }
    }
    if (array_key_exists('is_active', $row)) {
        $row['is_active'] = (bool) $row['is_active'];
    }
    if (array_key_exists('same_day', $row)) {
        $row['same_day'] = (bool) $row['same_day'];
    }
    foreach (['fixed_rate', 'per_kg_rate', 'per_km_rate'] as $numCol) {
        if (array_key_exists($numCol, $row) && $row[$numCol] !== null && $row[$numCol] !== '') {
            $row[$numCol] = round((float) $row[$numCol], 2);
        }
    }

    return $row;
}

/** Ensure delivery_drivers exists + expanded rate/area columns (MySQL or SQLite fallback). */
function souq_ensure_delivery_drivers_table(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        if (souq_driver_is_mysql($pdo)) {
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS `delivery_drivers` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `name` VARCHAR(191) NOT NULL,
                    `name_ar` VARCHAR(191) NULL,
                    `phone` VARCHAR(32) NOT NULL,
                    `email` VARCHAR(191) NULL,
                    `vehicle_type` VARCHAR(64) NULL,
                    `city` VARCHAR(100) NULL,
                    `base_location` VARCHAR(191) NULL,
                    `service_areas` JSON NULL,
                    `rate_mode` VARCHAR(32) NOT NULL DEFAULT \'fixed\',
                    `fixed_rate` DECIMAL(10,2) NOT NULL DEFAULT 0,
                    `per_kg_rate` DECIMAL(10,2) NOT NULL DEFAULT 0,
                    `per_km_rate` DECIMAL(10,2) NOT NULL DEFAULT 0,
                    `same_day` TINYINT(1) NOT NULL DEFAULT 0,
                    `eta_text` VARCHAR(100) NULL,
                    `payment_options` JSON NULL,
                    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
                    `notes` TEXT NULL,
                    `created_at` TIMESTAMP NULL DEFAULT NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `delivery_drivers_store_id_index` (`store_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
            );
            $alters = [
                'base_location' => 'VARCHAR(191) NULL',
                'service_areas' => 'JSON NULL',
                'rate_mode' => "VARCHAR(32) NOT NULL DEFAULT 'fixed'",
                'fixed_rate' => 'DECIMAL(10,2) NOT NULL DEFAULT 0',
                'per_kg_rate' => 'DECIMAL(10,2) NOT NULL DEFAULT 0',
                'per_km_rate' => 'DECIMAL(10,2) NOT NULL DEFAULT 0',
                'same_day' => 'TINYINT(1) NOT NULL DEFAULT 0',
                'eta_text' => 'VARCHAR(100) NULL',
                'payment_options' => 'JSON NULL',
            ];
            foreach ($alters as $col => $ddl) {
                if (!souq_table_has_column($pdo, 'delivery_drivers', $col)) {
                    try {
                        $pdo->exec("ALTER TABLE `delivery_drivers` ADD COLUMN `{$col}` {$ddl}");
                        souq_table_has_column($pdo, 'delivery_drivers', $col, true);
                    } catch (Throwable) {
                        /* ignore — INSERT will skip missing cols */
                    }
                }
            }
            return;
        }

        // SQLite fallback host (when MySQL credentials fail on shared hosting)
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS delivery_drivers (
                id TEXT PRIMARY KEY,
                store_id TEXT NOT NULL,
                name TEXT NOT NULL,
                name_ar TEXT,
                phone TEXT NOT NULL,
                email TEXT,
                vehicle_type TEXT,
                city TEXT,
                base_location TEXT,
                service_areas TEXT,
                rate_mode TEXT DEFAULT 'fixed',
                fixed_rate REAL DEFAULT 0,
                per_kg_rate REAL DEFAULT 0,
                per_km_rate REAL DEFAULT 0,
                same_day INTEGER DEFAULT 0,
                eta_text TEXT,
                payment_options TEXT,
                is_active INTEGER DEFAULT 1,
                notes TEXT,
                created_at TEXT,
                updated_at TEXT
            )"
        );
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_delivery_drivers_store ON delivery_drivers(store_id)');
        $sqliteAlters = [
            'base_location' => 'TEXT',
            'service_areas' => 'TEXT',
            'rate_mode' => "TEXT DEFAULT 'fixed'",
            'fixed_rate' => 'REAL DEFAULT 0',
            'per_kg_rate' => 'REAL DEFAULT 0',
            'per_km_rate' => 'REAL DEFAULT 0',
            'same_day' => 'INTEGER DEFAULT 0',
            'eta_text' => 'TEXT',
            'payment_options' => 'TEXT',
        ];
        foreach ($sqliteAlters as $col => $ddl) {
            if (!souq_table_has_column($pdo, 'delivery_drivers', $col)) {
                try {
                    $pdo->exec("ALTER TABLE delivery_drivers ADD COLUMN {$col} {$ddl}");
                    souq_table_has_column($pdo, 'delivery_drivers', $col, true);
                } catch (Throwable) {
                    /* ignore */
                }
            }
        }
    } catch (Throwable) {
        /* soft — handlers return empty / 503 */
    }
}

function souq_gateway_bank_wallet_activity_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    $nowExpr = souq_sql_now_expr($pdo);

    // GET/POST /delivery-drivers  · PATCH/DELETE /delivery-drivers/{id}
    if ($uri === '/delivery-drivers' || preg_match('#^/delivery-drivers/([^/]+)$#', $uri, $mDrv)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        souq_ensure_delivery_drivers_table($pdo);
        // Re-check after ensure (static table-exists cache may be stale).
        $drvTableOk = false;
        try {
            if (souq_driver_is_mysql($pdo)) {
                $chk = $pdo->query("SHOW TABLES LIKE 'delivery_drivers'");
                $drvTableOk = (bool) ($chk && $chk->fetchColumn());
            } else {
                $chk = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_drivers' LIMIT 1");
                $drvTableOk = (bool) ($chk && $chk->fetchColumn());
            }
        } catch (Throwable) {
            $drvTableOk = souq_gateway_table_exists($pdo, 'delivery_drivers');
        }
        if (!$drvTableOk) {
            if ($method === 'GET') {
                echo json_encode([
                    'data' => [],
                    'store_id' => $storeId,
                    'meta' => ['total' => 0, 'page' => 1, 'per_page' => 1, 'last_page' => 1],
                ]);
                return true;
            }
            http_response_code(503);
            echo json_encode(['message' => 'Delivery drivers table is not available on this host.', 'data' => []]);
            return true;
        }

        $driverId = isset($mDrv[1]) ? rawurldecode((string) $mDrv[1]) : '';

        try {
            if ($method === 'GET' && $driverId === '') {
                $sql = 'SELECT * FROM delivery_drivers WHERE store_id = ?';
                $params = [$storeId];
                if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                    $active = filter_var($_GET['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($active !== null) {
                        $sql .= ' AND is_active = ?';
                        $params[] = $active ? 1 : 0;
                    }
                }
                if (!empty($_GET['city'])) {
                    $sql .= ' AND city = ?';
                    $params[] = (string) $_GET['city'];
                }
                if (!empty($_GET['q'])) {
                    $q = '%' . (string) $_GET['q'] . '%';
                    $sql .= ' AND (name LIKE ? OR name_ar LIKE ? OR phone LIKE ? OR email LIKE ?)';
                    $params[] = $q;
                    $params[] = $q;
                    $params[] = $q;
                    $params[] = $q;
                }
                $sql .= ' ORDER BY name ASC';
                $st = $pdo->prepare($sql);
                $st->execute($params);
                $rows = array_map('souq_map_delivery_driver_row', $st->fetchAll() ?: []);
                echo json_encode([
                    'data' => $rows,
                    'store_id' => $storeId,
                    'meta' => [
                        'total' => count($rows),
                        'page' => 1,
                        'per_page' => max(1, count($rows)),
                        'last_page' => 1,
                    ],
                ], JSON_UNESCAPED_UNICODE);
                return true;
            }

            if ($method === 'POST' && $driverId === '') {
                $name = trim((string) ($input['name'] ?? ''));
                $phone = trim((string) ($input['phone'] ?? ''));
                if ($name === '' || $phone === '') {
                    http_response_code(422);
                    echo json_encode(['message' => 'name and phone are required.']);
                    return true;
                }
                $email = trim((string) ($input['email'] ?? ''));
                if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(422);
                    echo json_encode(['message' => 'email must be a valid email address.']);
                    return true;
                }
                $rateMode = (string) ($input['rate_mode'] ?? 'fixed');
                if (!in_array($rateMode, ['fixed', 'per_kg', 'per_km', 'zone'], true)) {
                    $rateMode = 'fixed';
                }
                $serviceAreas = $input['service_areas'] ?? [];
                if (!is_array($serviceAreas)) {
                    $serviceAreas = [];
                }
                $serviceAreas = array_values(array_filter(array_map(static function ($v) {
                    return trim((string) $v);
                }, $serviceAreas)));
                $paymentOptions = $input['payment_options'] ?? ['cod'];
                if (!is_array($paymentOptions) || count($paymentOptions) === 0) {
                    $paymentOptions = ['cod'];
                }
                $paymentOptions = array_values(array_filter($paymentOptions, static function ($v) {
                    return in_array((string) $v, ['cod', 'online', 'bank_transfer'], true);
                }));
                if (count($paymentOptions) === 0) {
                    $paymentOptions = ['cod'];
                }

                $id = 'drv-' . bin2hex(random_bytes(6));
                $cols = ['id', 'store_id', 'name', 'phone', 'is_active', 'created_at', 'updated_at'];
                $vals = [$id, $storeId, $name, $phone, array_key_exists('is_active', $input) ? (!empty($input['is_active']) ? 1 : 0) : 1];
                $placeholders = ['?', '?', '?', '?', '?', $nowExpr, $nowExpr];
                $quoteCol = static function (string $c) use ($pdo): string {
                    return souq_driver_is_mysql($pdo) ? '`' . $c . '`' : $c;
                };

                $optional = [
                    'name_ar' => trim((string) ($input['name_ar'] ?? '')) ?: null,
                    'email' => $email !== '' ? $email : null,
                    'vehicle_type' => trim((string) ($input['vehicle_type'] ?? '')) ?: null,
                    'city' => trim((string) ($input['city'] ?? '')) ?: null,
                    'base_location' => trim((string) ($input['base_location'] ?? '')) ?: null,
                    'service_areas' => json_encode($serviceAreas, JSON_UNESCAPED_UNICODE),
                    'rate_mode' => $rateMode,
                    'fixed_rate' => max(0, (float) ($input['fixed_rate'] ?? 0)),
                    'per_kg_rate' => max(0, (float) ($input['per_kg_rate'] ?? 0)),
                    'per_km_rate' => max(0, (float) ($input['per_km_rate'] ?? 0)),
                    'same_day' => !empty($input['same_day']) ? 1 : 0,
                    'eta_text' => trim((string) ($input['eta_text'] ?? '')) ?: null,
                    'payment_options' => json_encode($paymentOptions, JSON_UNESCAPED_UNICODE),
                    'notes' => trim((string) ($input['notes'] ?? '')) ?: null,
                ];
                foreach ($optional as $col => $val) {
                    if (!souq_table_has_column($pdo, 'delivery_drivers', $col)) {
                        continue;
                    }
                    $cols[] = $col;
                    $vals[] = $val;
                    $placeholders[] = '?';
                }

                $colSql = implode(', ', array_map($quoteCol, $cols));
                $phSql = implode(', ', $placeholders);
                $ins = $pdo->prepare("INSERT INTO delivery_drivers ({$colSql}) VALUES ({$phSql})");
                $ins->execute($vals);

                $st = $pdo->prepare('SELECT * FROM delivery_drivers WHERE store_id = ? AND id = ? LIMIT 1');
                $st->execute([$storeId, $id]);
                $row = $st->fetch(PDO::FETCH_ASSOC);
                http_response_code(201);
                echo json_encode(['data' => $row ? souq_map_delivery_driver_row($row) : null], JSON_UNESCAPED_UNICODE);
                return true;
            }

            if (in_array($method, ['PATCH', 'PUT'], true) && $driverId !== '') {
                $st = $pdo->prepare('SELECT * FROM delivery_drivers WHERE store_id = ? AND id = ? LIMIT 1');
                $st->execute([$storeId, $driverId]);
                $existing = $st->fetch(PDO::FETCH_ASSOC);
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Delivery driver not found.']);
                    return true;
                }

                $sets = [];
                $params = [];
                $qCol = static function (string $c) use ($pdo): string {
                    return souq_driver_is_mysql($pdo) ? '`' . $c . '`' : $c;
                };
                $stringFields = ['name', 'name_ar', 'phone', 'email', 'vehicle_type', 'city', 'base_location', 'eta_text', 'notes', 'rate_mode'];
                foreach ($stringFields as $field) {
                    if (!array_key_exists($field, $input) || !souq_table_has_column($pdo, 'delivery_drivers', $field)) {
                        continue;
                    }
                    $val = $input[$field];
                    if ($field === 'rate_mode') {
                        $mode = (string) $val;
                        $val = in_array($mode, ['fixed', 'per_kg', 'per_km', 'zone'], true) ? $mode : 'fixed';
                    } elseif ($field === 'email') {
                        $email = trim((string) ($val ?? ''));
                        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                            http_response_code(422);
                            echo json_encode(['message' => 'email must be a valid email address.']);
                            return true;
                        }
                        $val = $email !== '' ? $email : null;
                    } elseif (is_string($val)) {
                        $val = trim($val);
                        if ($val === '' && $field !== 'name' && $field !== 'phone') {
                            $val = null;
                        }
                    }
                    if (($field === 'name' || $field === 'phone') && ($val === null || $val === '')) {
                        http_response_code(422);
                        echo json_encode(['message' => "{$field} is required."]);
                        return true;
                    }
                    $sets[] = $qCol($field) . ' = ?';
                    $params[] = $val;
                }
                foreach (['fixed_rate', 'per_kg_rate', 'per_km_rate'] as $numField) {
                    if (!array_key_exists($numField, $input) || !souq_table_has_column($pdo, 'delivery_drivers', $numField)) {
                        continue;
                    }
                    $sets[] = $qCol($numField) . ' = ?';
                    $params[] = max(0, (float) $input[$numField]);
                }
                if (array_key_exists('service_areas', $input) && souq_table_has_column($pdo, 'delivery_drivers', 'service_areas')) {
                    $areas = is_array($input['service_areas']) ? $input['service_areas'] : [];
                    $areas = array_values(array_filter(array_map(static fn ($v) => trim((string) $v), $areas)));
                    $sets[] = $qCol('service_areas') . ' = ?';
                    $params[] = json_encode($areas, JSON_UNESCAPED_UNICODE);
                }
                if (array_key_exists('payment_options', $input) && souq_table_has_column($pdo, 'delivery_drivers', 'payment_options')) {
                    $opts = is_array($input['payment_options']) ? $input['payment_options'] : [];
                    $opts = array_values(array_filter($opts, static fn ($v) => in_array((string) $v, ['cod', 'online', 'bank_transfer'], true)));
                    if (count($opts) === 0) {
                        $opts = ['cod'];
                    }
                    $sets[] = $qCol('payment_options') . ' = ?';
                    $params[] = json_encode($opts, JSON_UNESCAPED_UNICODE);
                }
                if (array_key_exists('same_day', $input) && souq_table_has_column($pdo, 'delivery_drivers', 'same_day')) {
                    $sets[] = $qCol('same_day') . ' = ?';
                    $params[] = !empty($input['same_day']) ? 1 : 0;
                }
                if (array_key_exists('is_active', $input) && souq_table_has_column($pdo, 'delivery_drivers', 'is_active')) {
                    $sets[] = $qCol('is_active') . ' = ?';
                    $params[] = !empty($input['is_active']) ? 1 : 0;
                }

                if (count($sets) === 0) {
                    echo json_encode(['data' => souq_map_delivery_driver_row($existing)], JSON_UNESCAPED_UNICODE);
                    return true;
                }
                $sets[] = $qCol('updated_at') . " = {$nowExpr}";
                $params[] = $storeId;
                $params[] = $driverId;
                $upd = $pdo->prepare('UPDATE delivery_drivers SET ' . implode(', ', $sets) . ' WHERE store_id = ? AND id = ?');
                $upd->execute($params);

                $st2 = $pdo->prepare('SELECT * FROM delivery_drivers WHERE store_id = ? AND id = ? LIMIT 1');
                $st2->execute([$storeId, $driverId]);
                $fresh = $st2->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['data' => $fresh ? souq_map_delivery_driver_row($fresh) : null], JSON_UNESCAPED_UNICODE);
                return true;
            }

            if ($method === 'DELETE' && $driverId !== '') {
                $st = $pdo->prepare('SELECT id FROM delivery_drivers WHERE store_id = ? AND id = ? LIMIT 1');
                $st->execute([$storeId, $driverId]);
                if (!$st->fetchColumn()) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Delivery driver not found.']);
                    return true;
                }
                $pdo->prepare('DELETE FROM delivery_drivers WHERE store_id = ? AND id = ?')->execute([$storeId, $driverId]);
                echo json_encode(['message' => 'Delivery driver deleted.', 'id' => $driverId]);
                return true;
            }

            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed for delivery-drivers.']);
            return true;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Delivery drivers request failed.', 'error' => $e->getMessage()]);
            return true;
        }
    }

    // GET/POST /bank-accounts  · PATCH/DELETE /bank-accounts/{id}
    if ($uri === '/bank-accounts' || preg_match('#^/bank-accounts/([^/]+)$#', $uri, $mBank)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        if (!souq_gateway_table_exists($pdo, 'store_bank_accounts')) {
            if ($method === 'GET') {
                echo json_encode(['data' => [], 'store_id' => $storeId, 'meta' => ['total' => 0]]);
                return true;
            }
            http_response_code(503);
            echo json_encode(['message' => 'Bank accounts table is not available on this host.', 'data' => []]);
            return true;
        }

        $bankId = isset($mBank[1]) ? rawurldecode((string) $mBank[1]) : '';

        try {
            if ($method === 'GET' && $bankId === '') {
                $sql = 'SELECT * FROM store_bank_accounts WHERE store_id = ?';
                $params = [$storeId];
                if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
                    $active = filter_var($_GET['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($active !== null) {
                        $sql .= ' AND is_active = ?';
                        $params[] = $active ? 1 : 0;
                    }
                }
                $sql .= ' ORDER BY is_default DESC, bank_name ASC';
                $st = $pdo->prepare($sql);
                $st->execute($params);
                $rows = $st->fetchAll() ?: [];
                echo json_encode([
                    'data' => $rows,
                    'store_id' => $storeId,
                    'meta' => ['total' => count($rows)],
                ]);
                return true;
            }

            if ($method === 'POST' && $bankId === '') {
                $bankName = trim((string) ($input['bank_name'] ?? ''));
                $accountTitle = trim((string) ($input['account_title'] ?? ''));
                $iban = strtoupper(trim((string) ($input['iban'] ?? '')));
                if ($bankName === '' || $accountTitle === '' || $iban === '') {
                    http_response_code(422);
                    echo json_encode(['message' => 'bank_name, account_title, and iban are required.']);
                    return true;
                }
                $isDefault = !empty($input['is_default']) ? 1 : 0;
                $isActive = array_key_exists('is_active', $input) ? (!empty($input['is_active']) ? 1 : 0) : 1;
                if ($isDefault) {
                    $pdo->prepare('UPDATE store_bank_accounts SET is_default = 0 WHERE store_id = ?')->execute([$storeId]);
                }
                $id = 'bank-' . bin2hex(random_bytes(6));
                $ins = $pdo->prepare("INSERT INTO store_bank_accounts (id, store_id, bank_name, bank_name_ar, account_title, account_title_ar, iban, account_number, payment_reference_prefix, is_default, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,{$nowExpr},{$nowExpr})");
                $ins->execute([
                    $id,
                    $storeId,
                    $bankName,
                    trim((string) ($input['bank_name_ar'] ?? '')) ?: null,
                    $accountTitle,
                    trim((string) ($input['account_title_ar'] ?? '')) ?: null,
                    $iban,
                    trim((string) ($input['account_number'] ?? '')) ?: null,
                    trim((string) ($input['payment_reference_prefix'] ?? '')) ?: null,
                    $isDefault,
                    $isActive,
                ]);
                $st = $pdo->prepare('SELECT * FROM store_bank_accounts WHERE store_id = ? AND id = ? LIMIT 1');
                $st->execute([$storeId, $id]);
                http_response_code(201);
                echo json_encode(['data' => $st->fetch() ?: null]);
                return true;
            }

            if (in_array($method, ['PATCH', 'PUT'], true) && $bankId !== '') {
                $st = $pdo->prepare('SELECT * FROM store_bank_accounts WHERE store_id = ? AND id = ? LIMIT 1');
                $st->execute([$storeId, $bankId]);
                $row = $st->fetch();
                if (!$row) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Bank account not found.']);
                    return true;
                }
                $fields = [
                    'bank_name' => 'bank_name',
                    'bank_name_ar' => 'bank_name_ar',
                    'account_title' => 'account_title',
                    'account_title_ar' => 'account_title_ar',
                    'iban' => 'iban',
                    'account_number' => 'account_number',
                    'payment_reference_prefix' => 'payment_reference_prefix',
                ];
                $sets = [];
                $params = [];
                foreach ($fields as $key => $col) {
                    if (array_key_exists($key, $input)) {
                        $val = $input[$key];
                        if ($key === 'iban' && is_string($val)) {
                            $val = strtoupper(trim($val));
                        }
                        $sets[] = "`{$col}` = ?";
                        $params[] = $val === '' ? null : $val;
                    }
                }
                if (array_key_exists('is_default', $input)) {
                    $isDefault = !empty($input['is_default']) ? 1 : 0;
                    if ($isDefault) {
                        $pdo->prepare('UPDATE store_bank_accounts SET is_default = 0 WHERE store_id = ? AND id != ?')->execute([$storeId, $bankId]);
                    }
                    $sets[] = '`is_default` = ?';
                    $params[] = $isDefault;
                }
                if (array_key_exists('is_active', $input)) {
                    $sets[] = '`is_active` = ?';
                    $params[] = !empty($input['is_active']) ? 1 : 0;
                }
                if ($sets !== []) {
                    $sets[] = "updated_at = {$nowExpr}";
                    $params[] = $storeId;
                    $params[] = $bankId;
                    $pdo->prepare('UPDATE store_bank_accounts SET ' . implode(', ', $sets) . ' WHERE store_id = ? AND id = ?')->execute($params);
                }
                $st->execute([$storeId, $bankId]);
                echo json_encode(['data' => $st->fetch() ?: null]);
                return true;
            }

            if ($method === 'DELETE' && $bankId !== '') {
                $del = $pdo->prepare('DELETE FROM store_bank_accounts WHERE store_id = ? AND id = ?');
                $del->execute([$storeId, $bankId]);
                echo json_encode(['message' => 'Bank account deleted.', 'id' => $bankId]);
                return true;
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Bank accounts request failed.', 'error' => $e->getMessage()]);
            return true;
        }
        return false;
    }

    // GET /customers/{id}/wallet · /wallet/transactions · POST /wallet/adjust
    if (preg_match('#^/customers/([^/]+)/wallet(?:/(transactions|adjust))?$#', $uri, $mW)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $customerId = rawurldecode((string) $mW[1]);
        $action = isset($mW[2]) ? (string) $mW[2] : '';

        try {
            $cust = $pdo->prepare('SELECT id FROM customers WHERE store_id = ? AND id = ? LIMIT 1');
            $cust->execute([$storeId, $customerId]);
            if (!$cust->fetchColumn()) {
                http_response_code(404);
                echo json_encode(['message' => 'Customer not found.']);
                return true;
            }

            if ($method === 'GET' && $action === '') {
                $balance = 0.0;
                $points = 0;
                if (souq_gateway_table_exists($pdo, 'customer_wallets')) {
                    $st = $pdo->prepare('SELECT balance, loyalty_points FROM customer_wallets WHERE store_id = ? AND customer_id = ? LIMIT 1');
                    $st->execute([$storeId, $customerId]);
                    $row = $st->fetch();
                    if ($row) {
                        $balance = (float) ($row['balance'] ?? 0);
                        $points = (int) ($row['loyalty_points'] ?? 0);
                    }
                }
                echo json_encode([
                    'data' => ['balance' => $balance, 'loyalty_points' => $points],
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                ]);
                return true;
            }

            if ($method === 'GET' && $action === 'transactions') {
                $rows = [];
                if (souq_gateway_table_exists($pdo, 'wallet_transactions')) {
                    $st = $pdo->prepare('SELECT * FROM wallet_transactions WHERE store_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT 100');
                    $st->execute([$storeId, $customerId]);
                    $rows = $st->fetchAll() ?: [];
                }
                echo json_encode([
                    'data' => $rows,
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                ]);
                return true;
            }

            if ($method === 'POST' && $action === 'adjust') {
                if (!souq_gateway_table_exists($pdo, 'customer_wallets') || !souq_gateway_table_exists($pdo, 'wallet_transactions')) {
                    http_response_code(503);
                    echo json_encode(['message' => 'Wallet tables are not available on this host.']);
                    return true;
                }
                $type = strtolower(trim((string) ($input['type'] ?? '')));
                $amount = round((float) ($input['amount'] ?? 0), 2);
                if (!in_array($type, ['add', 'deduct'], true) || $amount <= 0) {
                    http_response_code(422);
                    echo json_encode(['message' => 'type (add|deduct) and positive amount are required.']);
                    return true;
                }
                $resetLoyalty = !empty($input['reset_loyalty']);
                $notify = trim((string) ($input['notify_channel'] ?? ''));
                if ($notify === 'none') {
                    $notify = '';
                }

                $pdo->beginTransaction();
                try {
                    $st = $pdo->prepare('SELECT * FROM customer_wallets WHERE store_id = ? AND customer_id = ? LIMIT 1 FOR UPDATE');
                    if (!souq_driver_is_mysql($pdo)) {
                        $st = $pdo->prepare('SELECT * FROM customer_wallets WHERE store_id = ? AND customer_id = ? LIMIT 1');
                    }
                    $st->execute([$storeId, $customerId]);
                    $wallet = $st->fetch() ?: null;
                    if (!$wallet) {
                        $pdo->prepare("INSERT INTO customer_wallets (store_id, customer_id, balance, loyalty_points, created_at, updated_at) VALUES (?,?,0,0,{$nowExpr},{$nowExpr})")
                            ->execute([$storeId, $customerId]);
                        $st->execute([$storeId, $customerId]);
                        $wallet = $st->fetch() ?: ['balance' => 0, 'loyalty_points' => 0];
                    }
                    $before = (float) ($wallet['balance'] ?? 0);
                    if ($type === 'deduct' && $before < $amount) {
                        $pdo->rollBack();
                        http_response_code(422);
                        echo json_encode(['message' => 'Insufficient wallet balance for deduction.']);
                        return true;
                    }
                    $after = $type === 'add' ? round($before + $amount, 2) : round($before - $amount, 2);
                    $points = $resetLoyalty ? 0 : (int) ($wallet['loyalty_points'] ?? 0);
                    $pdo->prepare("UPDATE customer_wallets SET balance = ?, loyalty_points = ?, updated_at = {$nowExpr} WHERE store_id = ? AND customer_id = ?")
                        ->execute([$after, $points, $storeId, $customerId]);
                    $pdo->prepare("INSERT INTO wallet_transactions (store_id, customer_id, type, amount, balance_before, balance_after, reason, employee_id, employee_name, notify_channel, reset_loyalty, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,{$nowExpr})")
                        ->execute([
                            $storeId,
                            $customerId,
                            $type,
                            $amount,
                            $before,
                            $after,
                            trim((string) ($input['reason'] ?? '')) ?: null,
                            trim((string) ($input['employee_id'] ?? '')) ?: null,
                            trim((string) ($input['employee_name'] ?? '')) ?: null,
                            $notify !== '' ? $notify : null,
                            $resetLoyalty ? 1 : 0,
                        ]);
                    $txId = (int) $pdo->lastInsertId();
                    $pdo->commit();
                    $tx = null;
                    if ($txId > 0) {
                        $txSt = $pdo->prepare('SELECT * FROM wallet_transactions WHERE id = ? LIMIT 1');
                        $txSt->execute([$txId]);
                        $tx = $txSt->fetch() ?: null;
                    }
                    echo json_encode([
                        'data' => [
                            'balance' => $after,
                            'loyalty_points' => $points,
                            'transaction' => $tx,
                        ],
                    ]);
                    return true;
                } catch (Throwable $inner) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    throw $inner;
                }
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Wallet request failed.', 'error' => $e->getMessage()]);
            return true;
        }
        return false;
    }

    // GET /customers/{id}/activities
    if (preg_match('#^/customers/([^/]+)/activities$#', $uri, $mA) && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        $customerId = rawurldecode((string) $mA[1]);
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 50)));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $offset = ($page - 1) * $perPage;
        try {
            if (!souq_gateway_table_exists($pdo, 'customer_activities')) {
                echo json_encode([
                    'data' => [],
                    'store_id' => $storeId,
                    'meta' => ['total' => 0, 'page' => 1, 'per_page' => $perPage, 'last_page' => 1],
                ]);
                return true;
            }
            $cust = $pdo->prepare('SELECT id FROM customers WHERE store_id = ? AND id = ? LIMIT 1');
            $cust->execute([$storeId, $customerId]);
            if (!$cust->fetchColumn()) {
                http_response_code(404);
                echo json_encode(['message' => 'Customer not found.', 'data' => []]);
                return true;
            }
            $countSt = $pdo->prepare('SELECT COUNT(*) FROM customer_activities WHERE store_id = ? AND customer_id = ?');
            $countSt->execute([$storeId, $customerId]);
            $total = (int) $countSt->fetchColumn();
            $st = $pdo->prepare('SELECT * FROM customer_activities WHERE store_id = ? AND customer_id = ? ORDER BY occurred_at DESC LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset);
            $st->execute([$storeId, $customerId]);
            $rows = $st->fetchAll() ?: [];
            echo json_encode([
                'data' => $rows,
                'store_id' => $storeId,
                'meta' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                ],
            ]);
            return true;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Customer activities request failed.', 'error' => $e->getMessage(), 'data' => []]);
            return true;
        }
    }

    // GET /customer-activities — real rows when table exists (replaces empty stub noise)
    if ($uri === '/customer-activities' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 40)));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $offset = ($page - 1) * $perPage;
        try {
            if (!souq_gateway_table_exists($pdo, 'customer_activities')) {
                echo json_encode(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => $perPage]]);
                return true;
            }
            $countSt = $pdo->prepare('SELECT COUNT(*) FROM customer_activities WHERE store_id = ?');
            $countSt->execute([$storeId]);
            $total = (int) $countSt->fetchColumn();
            $st = $pdo->prepare('SELECT * FROM customer_activities WHERE store_id = ? ORDER BY occurred_at DESC LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset);
            $st->execute([$storeId]);
            echo json_encode([
                'data' => $st->fetchAll() ?: [],
                'store_id' => $storeId,
                'meta' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'last_page' => max(1, (int) ceil($total / max(1, $perPage))),
                ],
            ]);
            return true;
        } catch (Throwable $e) {
            echo json_encode(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => $perPage], 'error' => $e->getMessage()]);
            return true;
        }
    }

    return false;
}
