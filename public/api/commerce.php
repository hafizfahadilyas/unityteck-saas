<?php
/**
 * Store-scoped commerce on the live SQLite gateway.
 * Orders, customers, coupons, loyalty, gift cards, and reports.
 * Empty tables stay empty. Payment is Pending until a real capture exists.
 */

declare(strict_types=1);

function souq_pdo_is_mysql(PDO $pdo): bool
{
    try {
        return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    } catch (Throwable $e) {
        return false;
    }
}

/** Analytics tables used by storefront/events (SQLite gateway + MySQL bridge). */
function souq_ensure_analytics_tables(PDO $pdo): void
{
    if (souq_pdo_is_mysql($pdo)) {
        // PDO MySQL often disallows multi-statement exec — run separately.
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS analytics_events (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                store_id VARCHAR(64) NOT NULL,
                event_name VARCHAR(64) NOT NULL,
                path VARCHAR(191) NULL,
                source VARCHAR(64) NULL,
                medium VARCHAR(128) NULL,
                campaign VARCHAR(191) NULL,
                session_key VARCHAR(64) NULL,
                visitor_key VARCHAR(64) NULL,
                meta TEXT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_analytics_store (store_id),
                KEY idx_analytics_session (store_id, event_name, session_key),
                KEY idx_analytics_visitor (store_id, visitor_key, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS store_metrics (
                store_id VARCHAR(64) NOT NULL PRIMARY KEY,
                visitors_count INT UNSIGNED NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        foreach (['medium' => 'VARCHAR(128) NULL', 'campaign' => 'VARCHAR(191) NULL', 'visitor_key' => 'VARCHAR(64) NULL', 'meta' => 'TEXT NULL'] as $col => $def) {
            if (function_exists('souq_table_has_column') && !souq_table_has_column($pdo, 'analytics_events', $col)) {
                try {
                    $pdo->exec("ALTER TABLE analytics_events ADD COLUMN {$col} {$def}");
                } catch (Throwable) {
                    /* already exists / locked */
                }
            }
        }
        return;
    }
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            event_name TEXT NOT NULL,
            path TEXT,
            source TEXT,
            medium TEXT,
            campaign TEXT,
            session_key TEXT,
            visitor_key TEXT,
            meta TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_store ON analytics_events(store_id);
        CREATE TABLE IF NOT EXISTS store_metrics (
            store_id TEXT PRIMARY KEY,
            visitors_count INTEGER DEFAULT 0,
            updated_at TEXT
        );
    ");
    foreach (['medium', 'campaign', 'visitor_key', 'meta'] as $col) {
        try {
            $pdo->exec("ALTER TABLE analytics_events ADD COLUMN {$col} TEXT");
        } catch (Throwable) {
            /* column may already exist */
        }
    }
}

/** UTM saved links + order first-touch columns (store_id isolated). */
function souq_ensure_utm_schema(PDO $pdo): void
{
    $mysql = souq_pdo_is_mysql($pdo);
    if ($mysql) {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS store_utm_links (
                id VARCHAR(64) NOT NULL PRIMARY KEY,
                store_id VARCHAR(64) NOT NULL,
                name VARCHAR(191) NOT NULL,
                platform_key VARCHAR(64) NULL,
                target_path VARCHAR(512) NULL,
                product_id VARCHAR(64) NULL,
                target_url VARCHAR(1024) NOT NULL,
                utm_source VARCHAR(128) NOT NULL,
                utm_medium VARCHAR(128) NOT NULL,
                utm_campaign VARCHAR(191) NOT NULL,
                utm_term VARCHAR(128) NULL,
                utm_content VARCHAR(128) NULL,
                click_sessions INT UNSIGNED NOT NULL DEFAULT 0,
                conversion_count INT UNSIGNED NOT NULL DEFAULT 0,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY sul_store_created_idx (store_id, created_at),
                KEY sul_store_campaign_idx (store_id, utm_campaign)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS store_utm_links (
                id TEXT PRIMARY KEY,
                store_id TEXT NOT NULL,
                name TEXT NOT NULL,
                platform_key TEXT,
                target_path TEXT,
                product_id TEXT,
                target_url TEXT NOT NULL,
                utm_source TEXT NOT NULL,
                utm_medium TEXT NOT NULL,
                utm_campaign TEXT NOT NULL,
                utm_term TEXT,
                utm_content TEXT,
                click_sessions INTEGER DEFAULT 0,
                conversion_count INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE INDEX IF NOT EXISTS sul_store_created_idx ON store_utm_links(store_id, created_at);
        ");
    }

    $orderCols = [
        'first_touch_source' => $mysql ? 'VARCHAR(64) NULL' : 'TEXT',
        'first_touch_medium' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
        'first_touch_campaign' => $mysql ? 'VARCHAR(191) NULL' : 'TEXT',
        'first_touch_utm_term' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
        'first_touch_utm_content' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
        'landing_page' => $mysql ? 'VARCHAR(512) NULL' : 'TEXT',
        'referral_host' => $mysql ? 'VARCHAR(191) NULL' : 'TEXT',
        'medium' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
        'campaign' => $mysql ? 'VARCHAR(191) NULL' : 'TEXT',
        'utm_term' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
        'utm_content' => $mysql ? 'VARCHAR(128) NULL' : 'TEXT',
    ];
    foreach ($orderCols as $col => $def) {
        if (function_exists('souq_table_has_column') && !souq_table_has_column($pdo, 'orders', $col, true)) {
            try {
                $pdo->exec("ALTER TABLE orders ADD COLUMN {$col} {$def}");
            } catch (Throwable) {
                /* ignore */
            }
        }
    }
}

function souq_commerce_schema(PDO $pdo): void
{
    if (souq_pdo_is_mysql($pdo)) {
        souq_ensure_analytics_tables($pdo);
        return;
    }
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            name TEXT,
            email TEXT,
            phone TEXT,
            city TEXT,
            country TEXT,
            acquisition_source TEXT,
            `group` TEXT,
            status TEXT,
            total_orders INTEGER DEFAULT 0,
            total_spend REAL DEFAULT 0,
            avg_order_value REAL DEFAULT 0,
            last_order_date TEXT,
            created_at TEXT,
            password_hash TEXT,
            points INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            order_number TEXT,
            customer_id TEXT,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            items_count INTEGER DEFAULT 0,
            items_summary TEXT,
            total_amount REAL DEFAULT 0,
            currency TEXT DEFAULT 'SAR',
            source TEXT,
            source_details TEXT,
            delivery_location TEXT,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            payment_status TEXT DEFAULT 'Pending',
            shipping_status TEXT,
            tracking_number TEXT,
            courier_code TEXT,
            order_date TEXT,
            coupon_code TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            store_id TEXT,
            product_id TEXT,
            product_name TEXT,
            quantity INTEGER,
            unit_price REAL,
            subtotal REAL
        );
        CREATE INDEX IF NOT EXISTS idx_order_items_store ON order_items(store_id, product_id);
        CREATE TABLE IF NOT EXISTS coupons (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            code TEXT,
            discount_type TEXT,
            discount_value REAL,
            min_order_amount REAL DEFAULT 0,
            max_uses INTEGER,
            usage_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            is_active INTEGER DEFAULT 1,
            expires_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_coupons_store ON coupons(store_id);
        CREATE TABLE IF NOT EXISTS gift_cards (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            code TEXT,
            balance REAL DEFAULT 0,
            currency TEXT DEFAULT 'SAR',
            status TEXT DEFAULT 'active',
            customer_email TEXT
        );
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            event_name TEXT,
            path TEXT,
            source TEXT,
            session_key TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_events_store ON analytics_events(store_id);
        CREATE TABLE IF NOT EXISTS store_metrics (
            store_id TEXT PRIMARY KEY,
            visitors_count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS payment_gateways (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            title TEXT,
            title_ar TEXT,
            is_enabled INTEGER DEFAULT 1,
            is_sandbox INTEGER DEFAULT 0,
            public_key TEXT,
            secret_key TEXT,
            status TEXT DEFAULT 'disconnected',
            supported_methods TEXT,
            last_tested_at TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_payment_gateways_store ON payment_gateways(store_id);
        CREATE TABLE IF NOT EXISTS shipping_methods (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            name TEXT,
            name_ar TEXT,
            type TEXT,
            fulfillment_mode TEXT DEFAULT 'own_delivery',
            base_rate REAL DEFAULT 0,
            free_shipping_threshold REAL,
            estimated_delivery TEXT,
            is_cod_allowed INTEGER DEFAULT 1,
            allow_online INTEGER DEFAULT 1,
            allow_bank_transfer INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            description TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_shipping_methods_store ON shipping_methods(store_id);
        CREATE TABLE IF NOT EXISTS courier_connections (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            account_name TEXT,
            status TEXT DEFAULT 'disconnected',
            is_connected INTEGER DEFAULT 0,
            is_sandbox INTEGER DEFAULT 1,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_couriers_store ON courier_connections(store_id);
    ");
    try {
        $pdo->exec('ALTER TABLE analytics_events ADD COLUMN session_key TEXT');
    } catch (Throwable $e) {
        /* column exists */
    }
}

function souq_new_id(string $prefix): string
{
    return $prefix . '_' . bin2hex(random_bytes(6));
}

/** Free defaults: COD + bank transfer only (no fake card Connected). */
function souq_ensure_payment_defaults(PDO $pdo, string $storeId): void
{
    if ($storeId === '') {
        return;
    }
    $defaults = [
        ['cod', 'Cash on Delivery', 'الدفع عند الاستلام', '["cod"]'],
        ['bank_transfer', 'Bank Transfer', 'تحويل بنكي', '["bank_transfer"]'],
    ];
    foreach ($defaults as [$provider, $title, $titleAr, $methods]) {
        $st = $pdo->prepare('SELECT id FROM payment_gateways WHERE store_id = ? AND provider = ? LIMIT 1');
        $st->execute([$storeId, $provider]);
        if ($st->fetch()) {
            continue;
        }
        $now = date('c');
        $ins = $pdo->prepare('INSERT INTO payment_gateways (id, store_id, provider, title, title_ar, is_enabled, is_sandbox, status, supported_methods, last_tested_at, created_at) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)');
        $ins->execute([souq_new_id('gw'), $storeId, $provider, $title, $titleAr, 'connected', $methods, $now, $now]);
    }
}

function souq_default_bank_account(PDO $pdo, string $storeId): ?array
{
    if ($storeId === '') {
        return null;
    }
    if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'store_bank_accounts')) {
        return null;
    }
    $st = $pdo->prepare(
        'SELECT * FROM store_bank_accounts WHERE store_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC LIMIT 1',
    );
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/** @return array<string, mixed> */
function souq_format_public_bank_account(array $row): array
{
    return [
        'id' => (string)($row['id'] ?? ''),
        'bank_name' => (string)($row['bank_name'] ?? ''),
        'bank_name_ar' => $row['bank_name_ar'] ?? null,
        'account_title' => (string)($row['account_title'] ?? ''),
        'account_title_ar' => $row['account_title_ar'] ?? null,
        'iban' => (string)($row['iban'] ?? ''),
        'account_number' => $row['account_number'] ?? null,
        'payment_reference_prefix' => $row['payment_reference_prefix'] ?? null,
    ];
}

/** Free defaults: flat rate + store pickup (no courier API). */
function souq_ensure_shipping_defaults(PDO $pdo, string $storeId): void
{
    if ($storeId === '') {
        return;
    }
    $st = $pdo->prepare('SELECT COUNT(*) c FROM shipping_methods WHERE store_id = ?');
    $st->execute([$storeId]);
    $row = $st->fetch();
    if ((int)($row['c'] ?? 0) > 0) {
        return;
    }
    $now = date('Y-m-d H:i:s');
    // Laravel MySQL has no fulfillment_mode; SQLite gateway schema may still have it.
    if (souq_pdo_is_mysql($pdo)) {
        $ins = $pdo->prepare('INSERT INTO shipping_methods (id, store_id, name, name_ar, type, base_rate, free_shipping_threshold, estimated_delivery, is_cod_allowed, allow_online, allow_bank_transfer, is_active, sort_order, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, ?, ?, ?)');
        $ins->execute([
            souq_new_id('shipm'), $storeId, 'Standard Delivery', 'توصيل عادي', 'flat_rate',
            25, 250, '2-4 Days', 1, 'Store own delivery', $now, $now,
        ]);
        $ins->execute([
            souq_new_id('shipm'), $storeId, 'Store Pickup', 'استلام من المتجر', 'local_pickup',
            0, null, 'Same Day', 2, 'Customer collects from store', $now, $now,
        ]);
        return;
    }
    $ins = $pdo->prepare('INSERT INTO shipping_methods (id, store_id, name, name_ar, type, fulfillment_mode, base_rate, free_shipping_threshold, estimated_delivery, is_cod_allowed, allow_online, allow_bank_transfer, is_active, sort_order, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, ?, ?)');
    $ins->execute([
        souq_new_id('shipm'), $storeId, 'Standard Delivery', 'توصيل عادي', 'flat_rate', 'own_delivery',
        25, 250, '2-4 Days', 1, 'Store own delivery', $now,
    ]);
    $ins->execute([
        souq_new_id('shipm'), $storeId, 'Store Pickup', 'استلام من المتجر', 'local_pickup', 'own_delivery',
        0, null, 'Same Day', 2, 'Customer collects from store', $now,
    ]);
}

function souq_normalize_city_key(string $value): string
{
    $v = mb_strtolower(trim($value));
    $canonical = [
        'الرياض' => 'riyadh',
        'riyadh' => 'riyadh',
        'جدة' => 'jeddah',
        'jeddah' => 'jeddah',
        'jiddah' => 'jeddah',
        'مكة' => 'makkah',
        'مكة المكرمة' => 'makkah',
        'makkah' => 'makkah',
        'mecca' => 'makkah',
        'الدمام' => 'dammam',
        'dammam' => 'dammam',
        'المدينة' => 'madinah',
        'المدينة المنورة' => 'madinah',
        'madinah' => 'madinah',
        'medina' => 'madinah',
    ];
    if (isset($canonical[$v])) {
        return $canonical[$v];
    }

    return preg_replace('/\s+/u', ' ', $v) ?? $v;
}

function souq_city_matches_zone(string $city, array $zone): bool
{
    $needle = souq_normalize_city_key($city);
    if ($needle === '') {
        return false;
    }
    $zoneNames = array_filter([
        (string) ($zone['name'] ?? ''),
        (string) ($zone['name_ar'] ?? ''),
    ]);
    $cities = $zone['city_names'] ?? [];
    if (is_string($cities)) {
        $decoded = json_decode($cities, true);
        $cities = is_array($decoded) ? $decoded : [];
    }
    if (is_array($cities)) {
        foreach ($cities as $c) {
            if (is_string($c) && trim($c) !== '') {
                $zoneNames[] = $c;
            }
        }
    }
    foreach ($zoneNames as $name) {
        $n = trim((string) $name);
        if ($n === '') {
            continue;
        }
        $key = souq_normalize_city_key($n);
        if ($key !== '' && ($key === $needle || str_contains($key, $needle) || str_contains($needle, $key))) {
            return true;
        }
        if (mb_stripos($n, $city) !== false || mb_stripos($city, $n) !== false) {
            return true;
        }
    }
    if ($needle === 'makkah') {
        $blob = mb_strtolower(
            ((string) ($zone['name'] ?? '')).' '.
            ((string) ($zone['region'] ?? '')).' '.
            ((string) ($zone['name_ar'] ?? ''))
        );
        if (str_contains($blob, 'makkah') || str_contains($blob, 'mecca') || mb_strpos($blob, 'مكة') !== false) {
            return true;
        }
    }
    $region = (string) ($zone['region'] ?? '');
    if ($region !== '' && mb_stripos($city, $region) !== false) {
        return true;
    }

    return false;
}

function souq_match_shipping_zone(string $city, array $zones): ?array
{
    $matches = [];
    foreach ($zones as $z) {
        if (!(bool) (int) ($z['is_active'] ?? 1)) {
            continue;
        }
        if (!souq_city_matches_zone($city, $z)) {
            continue;
        }
        $matches[] = $z;
    }
    if ($matches === []) {
        return null;
    }
    if (count($matches) === 1) {
        return $matches[0];
    }

    // Prefer district/name that appears inside the typed city line; else highest paid rate
    // so city-only "مكة" does not silently pick a free Haram zone over paid districts.
    $cityLower = mb_strtolower(trim($city));
    $best = null;
    $bestScore = -1.0;
    foreach ($matches as $z) {
        $name = (string) ($z['name'] ?? '');
        $nameLower = mb_strtolower($name);
        $rate = (float) ($z['rate'] ?? 0);
        $score = $rate;
        if ($nameLower !== '' && (mb_strpos($cityLower, $nameLower) !== false || mb_strpos($nameLower, $cityLower) !== false)) {
            $score += 1000;
        }
        foreach (['aziziyah', 'العزيزية', 'shawqiyyah', 'الشوقية', 'haram', 'الحرم'] as $token) {
            if (mb_strpos($cityLower, $token) !== false && mb_strpos($nameLower, $token) !== false) {
                $score += 500;
            }
        }
        if ($score > $bestScore) {
            $best = $z;
            $bestScore = $score;
        }
    }

    return $best;
}

function souq_calculate_zone_rate(array $zone, float $orderTotal, float $weightKg, float $distanceKm): array
{
    $estimatedDelivery = (string) ($zone['estimated_delivery'] ?? '2-3 Days');
    $codAvailable = (bool) (int) ($zone['cod_available'] ?? 1);
    $freeAbove = isset($zone['free_above']) && $zone['free_above'] !== '' && $zone['free_above'] !== null
        ? (float) $zone['free_above']
        : null;
    if ($freeAbove !== null && $freeAbove > 0 && $orderTotal >= $freeAbove) {
        return ['rate' => 0.0, 'is_free' => true, 'estimated_delivery' => $estimatedDelivery, 'cod_available' => $codAvailable];
    }
    $base = (float) ($zone['rate'] ?? 0);
    $perKg = (float) ($zone['rate_per_kg'] ?? 0);
    $perKm = (float) ($zone['per_km_rate'] ?? $zone['rate_per_km'] ?? 0);
    $minW = (float) ($zone['min_weight_kg'] ?? 0);
    $rateMode = (string) ($zone['rate_mode'] ?? 'fixed');
    if ($rateMode === 'per_km' && $perKm > 0) {
        $rate = $base + (max(0.0, $distanceKm) * $perKm);
        $rate = min($base + 10.0, max($base, $rate));
    } elseif (($rateMode === 'per_kg' || $perKg > 0) && $weightKg > $minW) {
        $excess = max(0.0, $weightKg - $minW);
        $rate = $base + ($excess * $perKg);
    } else {
        $rate = $base;
    }

    return [
        'rate' => round($rate, 2),
        'is_free' => $rate <= 0,
        'estimated_delivery' => $estimatedDelivery,
        'cod_available' => $codAvailable,
    ];
}

function souq_digits(string $phone): string
{
    return preg_replace('/\D+/', '', $phone) ?? '';
}

function souq_phones_match(string $a, string $b): bool
{
    $a = souq_digits($a);
    $b = souq_digits($b);
    if ($a === '' || $b === '') {
        return false;
    }
    if ($a === $b) {
        return true;
    }
    $tail = static function (string $n): string {
        if (str_starts_with($n, '966')) {
            $n = substr($n, 3);
        }
        return ltrim($n, '0');
    };
    return $tail($a) !== '' && $tail($a) === $tail($b);
}

function souq_normalize_source(?string $raw): string
{
    $s = strtolower(trim((string)$raw));
    if ($s === '') {
        return 'Direct';
    }
    if (str_contains($s, 'whatsapp')) return 'WhatsApp';
    if (str_contains($s, 'instagram')) return 'Instagram';
    if (str_contains($s, 'tiktok')) return 'TikTok';
    if (str_contains($s, 'snap')) return 'Snapchat';
    if (str_contains($s, 'facebook')) return 'Facebook';
    if (str_contains($s, 'google')) return 'Google Ads';
    if (str_contains($s, 'organic') || $s === 'search') return 'Organic Search';
    if (str_contains($s, 'referral') || str_contains($s, 'telegram') || str_contains($s, 'email') || str_contains($s, 'influencer') || str_contains($s, 'qr')) {
        return 'Referral';
    }
    if ($s === 'direct') return 'Direct';
    // Tagged but unknown platform → Referral (never invent WhatsApp/Facebook).
    return 'Referral';
}

function souq_payment_method(?string $raw): string
{
    $s = strtolower(trim((string)$raw));
    if (str_contains($s, 'apple')) return 'Apple Pay';
    if (str_contains($s, 'tabby')) return 'Tabby';
    if (str_contains($s, 'tamara')) return 'Tamara';
    if (str_contains($s, 'stc')) return 'stc pay';
    if (str_contains($s, 'bank') || str_contains($s, 'transfer') || str_contains($s, 'تحويل')) return 'Bank Transfer';
    if (str_contains($s, 'cod') || str_contains($s, 'cash') || str_contains($s, 'استلام')) return 'COD';
    if (str_contains($s, 'mada') || str_contains($s, 'مدى') || str_contains($s, 'atm')) return 'Mada';
    if (str_contains($s, 'visa') || str_contains($s, 'master') || str_contains($s, 'card') || str_contains($s, 'credit')) return 'Visa/MC';
    return $s === '' ? 'Mada' : (string)$raw;
}

function souq_next_order_number(PDO $pdo, string $storeId): string
{
    $st = $pdo->prepare('SELECT order_number FROM orders WHERE store_id = ?');
    $st->execute([$storeId]);
    $max = 0;
    while ($row = $st->fetch()) {
        $digits = preg_replace('/\D+/', '', (string)$row['order_number']) ?? '';
        $n = (int)$digits;
        if ($n > $max) {
            $max = $n;
        }
    }
    return '#' . str_pad((string)($max + 1), 3, '0', STR_PAD_LEFT);
}

function souq_order_row(PDO $pdo, array $row, bool $lean = false): array
{
    $items = [];
    if (!$lean && !empty($row['id']) && !empty($row['store_id'])) {
        $itemCols = 'product_id, product_name, quantity, unit_price, subtotal';
        foreach (['variation_id', 'selected_options', 'sku', 'brand', 'category', 'image_url'] as $extraCol) {
            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', $extraCol)) {
                $itemCols .= ', ' . $extraCol;
            }
        }
        $itemsSt = $pdo->prepare("SELECT {$itemCols} FROM order_items WHERE order_id = ? AND store_id = ?");
        $itemsSt->execute([$row['id'], $row['store_id']]);
        while ($it = $itemsSt->fetch()) {
            $opts = null;
            if (array_key_exists('selected_options', $it) && $it['selected_options'] !== null && $it['selected_options'] !== '') {
                $decoded = is_string($it['selected_options'])
                    ? json_decode((string)$it['selected_options'], true)
                    : $it['selected_options'];
                $opts = is_array($decoded) ? $decoded : null;
            }
            $items[] = [
                'product_id' => $it['product_id'],
                'product_name' => $it['product_name'],
                'name' => $it['product_name'],
                'quantity' => (int)$it['quantity'],
                'unit_price' => (float)$it['unit_price'],
                'price' => (float)$it['unit_price'],
                'subtotal' => (float)$it['subtotal'],
                'variation_id' => $it['variation_id'] ?? null,
                'selected_options' => $opts,
                'sku' => $it['sku'] ?? null,
                'brand' => $it['brand'] ?? null,
                'category' => $it['category'] ?? null,
                'image_url' => $it['image_url'] ?? null,
                'image' => $it['image_url'] ?? null,
            ];
        }
    }
    $out = [
        'id' => $row['id'] ?? '',
        'store_id' => $row['store_id'] ?? '',
        'order_number' => $row['order_number'] ?? '',
        'customer_id' => $row['customer_id'] ?? null,
        'customer_name' => $row['customer_name'] ?? '',
        'customer_email' => $row['customer_email'] ?? null,
        'customer_phone' => $row['customer_phone'] ?? '',
        'items_count' => (int)($row['items_count'] ?? 0),
        'items_summary' => $row['items_summary'] ?? null,
        'items' => $items,
        'total_amount' => (float)($row['total_amount'] ?? 0),
        'currency' => ($row['currency'] ?? '') !== '' ? $row['currency'] : 'SAR',
        'source' => ($row['source'] ?? '') !== '' ? $row['source'] : 'Direct',
        'source_details' => $row['source_details'] ?? null,
        'delivery_location' => $row['delivery_location'] ?? '',
        'status' => ($row['status'] ?? '') !== '' ? $row['status'] : 'pending',
        'payment_method' => $row['payment_method'] ?? null,
        'payment_status' => ($row['payment_status'] ?? '') !== '' ? $row['payment_status'] : 'pending',
        'shipping_status' => $row['shipping_status'] ?? null,
        'tracking_number' => $row['tracking_number'] ?? null,
        'courier_code' => $row['courier_code'] ?? null,
        'order_date' => $row['order_date'] ?? null,
        'coupon_code' => $row['coupon_code'] ?? null,
    ];
    if (array_key_exists('shipping_cost', $row) && $row['shipping_cost'] !== null && $row['shipping_cost'] !== '') {
        $out['shipping_cost'] = (float) $row['shipping_cost'];
        $out['shipping_fee'] = (float) $row['shipping_cost'];
    }
    foreach ([
        'cod_status', 'cod_notes', 'refund_status', 'refund_amount', 'return_reason', 'return_notes',
        'customer_notes', 'internal_notes',
        'delivery_mode', 'driver_id', 'bank_account_id', 'payment_plan', 'amount_paid', 'remaining_balance',
        'payment_transaction_id', 'is_archived', 'archived_at', 'estimated_delivery_at',
        'shipping_method_id', 'courier_code', 'medium', 'campaign', 'utm_term', 'utm_content',
    ] as $extra) {
        if (array_key_exists($extra, $row)) {
            $out[$extra] = $row[$extra];
        }
    }
    return $out;
}

function souq_normalize_order_status(mixed $raw): string
{
    $s = strtolower(trim((string)$raw));
    if ($s === 'awaiting_payment' || $s === 'pending_payment') {
        $s = 'pending';
    }
    if ($s === 'under_review') {
        $s = 'pending_review';
    }
    if ($s === 'canceled') {
        $s = 'cancelled';
    }
    $allowed = [
        'pending', 'pending_review', 'processing', 'preparing', 'ready', 'shipped',
        'out_for_delivery', 'delivered', 'completed', 'cancelled', 'returned', 'refunded',
    ];
    return in_array($s, $allowed, true) ? $s : 'pending';
}

function souq_normalize_payment_status(mixed $raw): string
{
    $s = strtolower(trim((string)$raw));
    if ($s === '') {
        return 'pending';
    }
    $map = [
        'paid' => 'paid',
        'pending' => 'pending',
        'authorized' => 'authorized',
        'failed' => 'failed',
        'cancelled' => 'cancelled',
        'canceled' => 'cancelled',
        'refunded' => 'refunded',
    ];
    return $map[$s] ?? $s;
}

function souq_product_stock_deduct(PDO $pdo, string $storeId, string $productId, int $qty): void
{
    if ($productId === '' || $qty < 1) {
        return;
    }
    $sql = souq_driver_is_mysql($pdo)
        ? 'UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
        : 'UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?';
    $pdo->prepare($sql)->execute([$qty, $qty, $productId, $storeId]);
}

function souq_product_stock_restock(PDO $pdo, string $storeId, string $productId, int $qty): void
{
    if ($productId === '' || $qty < 1) {
        return;
    }
    $pdo->prepare(
        'UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
    )->execute([$qty, $productId, $storeId]);
}

/** Ensure product_variations exists (MySQL Laravel schema or SQLite bridge). */
/** Ensure order_items can store exact variation ownership (store-isolated rows). */
function souq_ensure_order_item_variation_columns(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        $chk = $pdo->query("SHOW TABLES LIKE 'order_items'");
        if (! $chk || ! $chk->fetch()) {
            return;
        }
    } catch (Throwable) {
        return;
    }
    $alters = [];
    if (! function_exists('souq_table_has_column') || ! souq_table_has_column($pdo, 'order_items', 'variation_id')) {
        $alters[] = 'ADD COLUMN variation_id VARCHAR(64) NULL AFTER product_id';
    }
    if (! function_exists('souq_table_has_column') || ! souq_table_has_column($pdo, 'order_items', 'selected_options')) {
        $alters[] = 'ADD COLUMN selected_options JSON NULL AFTER variation_id';
    }
    foreach ($alters as $sql) {
        try {
            $pdo->exec('ALTER TABLE order_items ' . $sql);
        } catch (Throwable) {
            /* column may already exist under race */
        }
    }
    if (function_exists('souq_table_has_column')) {
        souq_table_has_column($pdo, 'order_items', 'variation_id', true);
        souq_table_has_column($pdo, 'order_items', 'selected_options', true);
    }
    try {
        $pdo->exec('CREATE INDEX order_items_store_variation_id_index ON order_items (store_id, variation_id)');
    } catch (Throwable) {
        /* index may exist */
    }
}

function souq_ensure_product_variations_table(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    if (souq_pdo_is_mysql($pdo)) {
        try {
            $chk = $pdo->query("SHOW TABLES LIKE 'product_variations'");
            if ($chk && $chk->fetch()) {
                return;
            }
        } catch (Throwable) {
            /* fall through to create */
        }
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS product_variations (
                id VARCHAR(64) PRIMARY KEY,
                store_id VARCHAR(64) NOT NULL,
                product_id VARCHAR(64) NOT NULL,
                sku VARCHAR(100) NOT NULL,
                barcode VARCHAR(128) NULL,
                options JSON NULL,
                price DECIMAL(12,2) NULL,
                compare_at_price DECIMAL(12,2) NULL,
                stock INT NOT NULL DEFAULT 0,
                weight DECIMAL(12,3) NULL,
                weight_unit VARCHAR(16) NULL DEFAULT 'kg',
                low_stock_alert INT NULL,
                unlimited_stock TINYINT(1) NOT NULL DEFAULT 0,
                image_url TEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                UNIQUE KEY product_variations_store_sku_unique (store_id, sku),
                KEY product_variations_store_product_index (store_id, product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        return;
    }
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_variations (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            sku TEXT NOT NULL,
            barcode TEXT,
            options TEXT,
            price REAL,
            compare_at_price REAL,
            stock INTEGER DEFAULT 0,
            weight REAL,
            weight_unit TEXT DEFAULT 'kg',
            low_stock_alert INTEGER,
            unlimited_stock INTEGER DEFAULT 0,
            image_url TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )"
    );
    try {
        $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_pv_store_sku ON product_variations(store_id, sku)');
    } catch (Throwable) {
        /* index may exist */
    }
}

function souq_variation_options_normalize($raw): array
{
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        $raw = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $key => $value) {
        $k = is_string($key) ? trim($key) : '';
        if ($k === '' || $value === null || $value === '') {
            continue;
        }
        $out[$k] = is_scalar($value) ? (string)$value : json_encode($value);
    }
    return $out;
}

function souq_variation_row(array $row): array
{
    $options = souq_variation_options_normalize($row['options'] ?? []);
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'product_id' => (string)$row['product_id'],
        'sku' => (string)$row['sku'],
        'barcode' => $row['barcode'] !== null && $row['barcode'] !== '' ? (string)$row['barcode'] : null,
        'options' => $options,
        'price' => $row['price'] !== null && $row['price'] !== '' ? (float)$row['price'] : null,
        'compare_at_price' => $row['compare_at_price'] !== null && $row['compare_at_price'] !== '' ? (float)$row['compare_at_price'] : null,
        'stock' => (int)($row['stock'] ?? 0),
        'weight' => $row['weight'] !== null && $row['weight'] !== '' ? (float)$row['weight'] : null,
        'weight_unit' => (string)($row['weight_unit'] ?? 'kg'),
        'low_stock_alert' => $row['low_stock_alert'] !== null && $row['low_stock_alert'] !== '' ? (int)$row['low_stock_alert'] : null,
        'unlimited_stock' => (bool)(int)($row['unlimited_stock'] ?? 0),
        'image_url' => !empty($row['image_url']) ? (string)$row['image_url'] : null,
        'is_active' => (bool)(int)($row['is_active'] ?? 1),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

/** @return list<array<string,mixed>> */
function souq_product_variations_list(PDO $pdo, string $storeId, string $productId): array
{
    try {
        souq_ensure_product_variations_table($pdo);
        $st = $pdo->prepare('SELECT * FROM product_variations WHERE store_id = ? AND product_id = ? ORDER BY sku ASC');
        $st->execute([$storeId, $productId]);
        $out = [];
        while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $out[] = souq_variation_row($row);
        }
        return $out;
    } catch (Throwable) {
        return [];
    }
}

function souq_variation_stock_deduct(PDO $pdo, string $storeId, string $variationId, int $qty): void
{
    if ($variationId === '' || $qty < 1) {
        return;
    }
    try {
        $sql = souq_pdo_is_mysql($pdo)
            ? 'UPDATE product_variations SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?'
            : 'UPDATE product_variations SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND store_id = ?';
        $pdo->prepare($sql)->execute([$qty, $qty, $variationId, $storeId]);
    } catch (Throwable) {
        /* ignore if table missing */
    }
}

function souq_fmt_growth(?float $growth): ?string
{
    if ($growth === null) {
        return null;
    }
    $prefix = $growth >= 0 ? '+' : '';
    return $prefix . round($growth, 1) . '%';
}

function souq_customer_row(array $row): array
{
    $dob = $row['dob'] ?? null;
    if ($dob !== null && $dob !== '') {
        $dob = substr((string)$dob, 0, 10);
    } else {
        $dob = null;
    }
    $gender = isset($row['gender']) && $row['gender'] !== '' ? (string)$row['gender'] : null;

    return [
        'id' => $row['id'],
        'store_id' => $row['store_id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'city' => $row['city'] ?: '',
        'country' => $row['country'] ?: 'Saudi Arabia',
        'gender' => $gender,
        'dob' => $dob,
        'acquisition_source' => $row['acquisition_source'] ?: 'Direct',
        'group' => $row['group'] ?: 'Regular',
        'status' => $row['status'] ?: 'New',
        'total_orders' => (int)$row['total_orders'],
        'total_spend' => (float)$row['total_spend'],
        'avg_order_value' => (float)$row['avg_order_value'],
        'last_order_date' => $row['last_order_date'],
        'created_at' => $row['created_at'],
        'points' => (int)($row['points'] ?? 0),
    ];
}

function souq_upsert_customer(PDO $pdo, string $storeId, string $name, string $phone, ?string $email, string $city, string $source, float $total): array
{
    // Hostinger MySQL: customers.email NOT NULL + UNIQUE(store_id, email).
    // Empty email '' can only exist once per store — use phone-based placeholder instead.
    $emailValue = strtolower(trim((string)$email));
    if ($emailValue === '') {
        $digits = souq_digits($phone);
        $emailValue = $digits !== ''
            ? ('guest+' . $digits . '@noemail.local')
            : ('guest+' . bin2hex(random_bytes(4)) . '@noemail.local');
    }
    $st = $pdo->prepare('SELECT * FROM customers WHERE store_id = ?');
    $st->execute([$storeId]);
    $found = null;
    while ($row = $st->fetch()) {
        $rowEmail = strtolower(trim((string)($row['email'] ?? '')));
        $emailMatch = $rowEmail !== '' && strcasecmp($rowEmail, $emailValue) === 0;
        if ($emailMatch || souq_phones_match((string)$row['phone'], $phone)) {
            $found = $row;
            break;
        }
    }
    $now = date('Y-m-d H:i:s');
    if ($found) {
        $orders = (int)$found['total_orders'] + 1;
        $spend = (float)$found['total_spend'] + $total;
        $avg = $orders > 0 ? round($spend / $orders, 2) : $total;
        $status = ($spend >= 1500 || $orders >= 3) ? 'VIP' : (($found['status'] === 'Inactive' || $found['status'] === 'New') ? 'Active' : $found['status']);
        $group = $status === 'VIP' ? 'VIP' : ($found['group'] ?: 'Regular');
        // Keep real emails; only fill blank/legacy empty email with placeholder.
        $nextEmail = $emailValue;
        $existingEmail = trim((string)($found['email'] ?? ''));
        if ($existingEmail !== '' && !str_ends_with(strtolower($existingEmail), '@noemail.local') && str_contains($emailValue, '@noemail.local')) {
            $nextEmail = $existingEmail;
        }
        // Avoid NULLIF('', …) — Hostinger mixes utf8mb4_general_ci vs unicode_ci and throws 1267.
        $cityWrite = $city !== '' ? $city : null;
        $upd = $pdo->prepare('UPDATE customers SET name = ?, email = ?, phone = ?, city = COALESCE(?, city), total_orders = ?, total_spend = ?, avg_order_value = ?, last_order_date = ?, status = ?, `group` = ?, acquisition_source = COALESCE(acquisition_source, ?) WHERE id = ? AND store_id = ?');
        $upd->execute([$name, $nextEmail, $phone, $cityWrite, $orders, $spend, $avg, $now, $status, $group, $source, $found['id'], $storeId]);
        $found['name'] = $name;
        $found['email'] = $nextEmail;
        $found['total_orders'] = $orders;
        $found['total_spend'] = $spend;
        $found['avg_order_value'] = $avg;
        $found['status'] = $status;
        $found['group'] = $group;
        $found['last_order_date'] = $now;
        return $found;
    }
    $id = 'cust-' . bin2hex(random_bytes(8));
    $status = $total >= 1500 ? 'VIP' : 'New';
    $group = $status === 'VIP' ? 'VIP' : 'Regular';
    $cols = ['id', 'store_id', 'name', 'email', 'phone', 'city', 'country', 'acquisition_source', '`group`', 'status', 'total_orders', 'total_spend', 'avg_order_value', 'last_order_date', 'created_at'];
    $vals = [$id, $storeId, $name, $emailValue, $phone, $city, 'Saudi Arabia', $source, $group, $status, 1, $total, $total, $now, $now];
    if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'customers', 'points')) {
        $cols[] = 'points';
        $vals[] = 0;
    }
    if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'customers', 'updated_at')) {
        $cols[] = 'updated_at';
        $vals[] = $now;
    }
    $placeholders = implode(', ', array_fill(0, count($cols), '?'));
    try {
        $pdo->prepare('INSERT INTO customers (' . implode(', ', $cols) . ') VALUES (' . $placeholders . ')')->execute($vals);
    } catch (Throwable $e) {
        // Unique(store_id,email) clash (legacy '' email or race): bind to matching row or uniqueize email once.
        $st2 = $pdo->prepare('SELECT * FROM customers WHERE store_id = ?');
        $st2->execute([$storeId]);
        $legacy = null;
        while ($row = $st2->fetch()) {
            $rowEmail = trim((string)($row['email'] ?? ''));
            if (souq_phones_match((string)$row['phone'], $phone) || strcasecmp($rowEmail, $emailValue) === 0 || $rowEmail === '') {
                $legacy = $row;
                break;
            }
        }
        if ($legacy) {
            $orders = (int)$legacy['total_orders'] + 1;
            $spend = (float)$legacy['total_spend'] + $total;
            $avg = $orders > 0 ? round($spend / $orders, 2) : $total;
            $status = ($spend >= 1500 || $orders >= 3) ? 'VIP' : 'Active';
            $group = $status === 'VIP' ? 'VIP' : 'Regular';
            $cityWrite = $city !== '' ? $city : null;
            $pdo->prepare('UPDATE customers SET name = ?, email = ?, phone = ?, city = COALESCE(?, city), total_orders = ?, total_spend = ?, avg_order_value = ?, last_order_date = ?, status = ?, `group` = ? WHERE id = ? AND store_id = ?')
                ->execute([$name, $emailValue, $phone, $cityWrite, $orders, $spend, $avg, $now, $status, $group, $legacy['id'], $storeId]);
            $legacy['name'] = $name;
            $legacy['email'] = $emailValue;
            $legacy['phone'] = $phone;
            $legacy['total_orders'] = $orders;
            $legacy['total_spend'] = $spend;
            $legacy['avg_order_value'] = $avg;
            $legacy['status'] = $status;
            $legacy['group'] = $group;
            $legacy['last_order_date'] = $now;
            return $legacy;
        }
        $emailValue = 'guest+' . bin2hex(random_bytes(5)) . '@noemail.local';
        $vals[3] = $emailValue;
        $pdo->prepare('INSERT INTO customers (' . implode(', ', $cols) . ') VALUES (' . $placeholders . ')')->execute($vals);
    }
    return [
        'id' => $id,
        'store_id' => $storeId,
        'name' => $name,
        'email' => $emailValue,
        'phone' => $phone,
        'city' => $city,
        'country' => 'Saudi Arabia',
        'acquisition_source' => $source,
        'group' => $group,
        'status' => $status,
        'total_orders' => 1,
        'total_spend' => $total,
        'avg_order_value' => $total,
        'last_order_date' => $now,
        'created_at' => $now,
        'points' => 0,
    ];
}

function souq_request_host(): string
{
    $host = strtolower((string)preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    return str_starts_with($host, 'www.') ? substr($host, 4) : $host;
}

function souq_host_store(string $host): string
{
    $mapped = match ($host) {
        'mieraf-ksa.com' => 'store-coffee',
        'giftshop-sa.com' => 'store-1',
        'tanjeedmakkah.com' => 'store-bleco',
        default => '',
    };
    if ($mapped !== '') {
        return $mapped;
    }
    if (str_ends_with($host, '.mieraf-ksa.com') && $host !== 'www.mieraf-ksa.com') {
        $sub = substr($host, 0, -strlen('.mieraf-ksa.com'));
        $reserved = ['www', 'souq', 'api', 'app', 'admin', 'master', 'mail', 'smtp', 'ftp', 'cpanel', 'webmail'];
        if ($sub === 'souq-default') {
            return 'store-souq-default';
        }
        if ($sub !== '' && !in_array($sub, $reserved, true)) {
            return '';
        }
    }

    return '';
}

function souq_ensure_store_extras_table(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }
    try {
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo)) {
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS `store_extras` (
                    `store_id` VARCHAR(64) NOT NULL,
                    `data` LONGTEXT NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`store_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
            );
        } else {
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS store_extras (
                    store_id TEXT PRIMARY KEY,
                    data TEXT,
                    updated_at TEXT
                )'
            );
        }
        $ready = true;
    } catch (Throwable) {
        /* extras table optional — stores.data preferred when available */
    }
}

function souq_load_store_extras(PDO $pdo, string $storeId): array
{
    souq_ensure_store_extras_table($pdo);
    try {
        $st = $pdo->prepare('SELECT data FROM store_extras WHERE store_id = ? LIMIT 1');
        $st->execute([$storeId]);
        $raw = $st->fetchColumn();
        if (!$raw) {
            return [];
        }
        $decoded = json_decode((string)$raw, true);
        return is_array($decoded) ? $decoded : [];
    } catch (Throwable) {
        return [];
    }
}

function souq_store_data(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return [];
    }
    $data = function_exists('souq_store_payload')
        ? souq_store_payload($row)
        : (json_decode((string)($row['data'] ?? ''), true) ?: []);
    if (!is_array($data)) {
        $data = [];
    }
    $extras = souq_load_store_extras($pdo, $storeId);
    if ($extras) {
        $data = array_replace_recursive($data, $extras);
    }
    return $data;
}

/** Normalize SA mobile to digits for Meta WhatsApp Cloud (9665xxxxxxxx). */
function souq_wa_digits(?string $phone): string
{
    $d = preg_replace('/\D+/', '', (string)$phone);
    if (preg_match('/^05(\d{8})$/', $d, $m)) return '9665' . $m[1];
    if (preg_match('/^5(\d{8})$/', $d, $m)) return '9665' . $m[1];
    if (preg_match('/^9665\d{8}$/', $d)) return $d;
    return $d;
}

/**
 * Real Meta WhatsApp Cloud send for THIS store only (no cross-tenant tokens).
 * @return array{status:string,error?:string}
 */
function souq_wa_cloud_send(PDO $pdo, string $storeId, string $toDigits, string $body): array
{
    if ($storeId === '' || $toDigits === '' || trim($body) === '') {
        return ['status' => 'skipped', 'error' => 'missing_fields'];
    }
    $data = souq_store_data($pdo, $storeId);
    $wa = is_array($data['whatsapp'] ?? null) ? $data['whatsapp'] : [];
    // Also read store_settings.settings JSON blob when present
    try {
        if (souq_table_has_column($pdo, 'store_settings', 'settings')) {
            $st = $pdo->prepare('SELECT settings FROM store_settings WHERE store_id = ? LIMIT 1');
            $st->execute([$storeId]);
            $raw = $st->fetchColumn();
            $decoded = is_string($raw) ? (json_decode($raw, true) ?: []) : [];
            if (is_array($decoded['whatsapp'] ?? null)) {
                $wa = array_replace($wa, $decoded['whatsapp']);
            }
        }
    } catch (Throwable) {
    }
    $token = trim((string)($wa['access_token'] ?? ''));
    $phoneId = trim((string)($wa['phone_number_id'] ?? ''));
    if ($token === '' || $phoneId === '' || str_contains($token, '...')) {
        return ['status' => 'skipped', 'error' => 'whatsapp_not_connected'];
    }
    $url = 'https://graph.facebook.com/v19.0/' . rawurlencode($phoneId) . '/messages';
    $payload = json_encode([
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $toDigits,
        'type' => 'text',
        'text' => ['preview_url' => true, 'body' => $body],
    ], JSON_UNESCAPED_UNICODE);
    $ch = curl_init($url);
    if ($ch === false) {
        return ['status' => 'failed', 'error' => 'curl_init'];
    }
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 18,
    ]);
    $resp = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 200 && $code < 300) {
        return ['status' => 'sent'];
    }
    $err = is_string($resp) ? (json_decode($resp, true)['error']['message'] ?? ('HTTP ' . $code)) : ('HTTP ' . $code);
    return ['status' => 'failed', 'error' => (string)$err];
}

/**
 * Auto customer + admin WhatsApp: paid → payment+invoice; else → pending reminder.
 * Fire-and-forget; never blocks order API on WA failure.
 */
function souq_notify_order_whatsapp(PDO $pdo, string $storeId, array $orderRow, string $phase = 'created'): void
{
    try {
        $pay = strtolower(trim((string)($orderRow['payment_status'] ?? 'pending')));
        $num = (string)($orderRow['order_number'] ?? $orderRow['id'] ?? '');
        $total = number_format((float)($orderRow['total_amount'] ?? 0), 2);
        $name = (string)($orderRow['customer_name'] ?? '');
        $method = (string)($orderRow['payment_method'] ?? '');
        $custDigits = souq_wa_digits((string)($orderRow['customer_phone'] ?? ''));
        $store = $pdo->prepare('SELECT name, name_ar, phone, custom_domain, domain FROM stores WHERE id = ? LIMIT 1');
        $store->execute([$storeId]);
        $srow = $store->fetch(PDO::FETCH_ASSOC) ?: [];
        $storeName = (string)($srow['name_ar'] ?? $srow['name'] ?? 'Store');
        $domain = trim((string)($srow['custom_domain'] ?? $srow['domain'] ?? ''));
        $base = $domain !== '' ? (preg_match('#^https?://#i', $domain) ? rtrim($domain, '/') : ('https://' . $domain)) : '';
        $invoiceUrl = $base !== '' ? ($base . '/invoice?order=' . rawurlencode($num)) : '';
        $payUrl = $base !== '' ? ($base . '/checkout?pay_order=' . rawurlencode($num)) : '';
        $trackUrl = $base !== '' ? ($base . '/track-order?order=' . rawurlencode($num)) : '';

        $paid = in_array($pay, ['paid', 'completed', 'success', 'captured'], true);
        if ($paid) {
            $msg = "✅ *تم استلام الدفع*\nالمتجر: *{$storeName}*\nالطلب: *#{$num}*\nالمبلغ: *{$total} SAR*\nالطريقة: {$method}\n\n🧾 الفاتورة: {$invoiceUrl}\n🔗 التتبع: {$trackUrl}";
        } else {
            $msg = "💳 *تذكير دفع / طلب بانتظار الدفع*\nالمتجر: *{$storeName}*\nالطلب: *#{$num}*\nالعميل: {$name}\nالمبلغ: *{$total} SAR*\nالحالة: {$pay}\n\nأكمل الدفع: {$payUrl}\nتتبع: {$trackUrl}";
        }

        if (preg_match('/^9665\d{8}$/', $custDigits)) {
            souq_wa_cloud_send($pdo, $storeId, $custDigits, $msg);
        }
        $adminDigits = souq_wa_digits((string)($srow['phone'] ?? ''));
        if (preg_match('/^9665\d{8}$/', $adminDigits) && $adminDigits !== $custDigits) {
            $adminMsg = '[ADMIN] ' . $msg;
            souq_wa_cloud_send($pdo, $storeId, $adminDigits, $adminMsg);
        }
    } catch (Throwable $e) {
        // never break commerce path
    }
}

function souq_save_store_data(PDO $pdo, string $storeId, array $data): void
{
    if (function_exists('souq_ensure_mysql_store_data_column')) {
        souq_ensure_mysql_store_data_column($pdo);
    }
    $hasDataCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'data', true);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if ($hasDataCol) {
        $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([
            $json,
            $storeId,
        ]);
        return;
    }

    // Always persist full JSON blob (SEO / Google / extras) even when stores.data is missing.
    souq_ensure_store_extras_table($pdo);
    try {
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo)) {
            $pdo->prepare(
                'INSERT INTO store_extras (store_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                 ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP'
            )->execute([$storeId, $json]);
        } else {
            $pdo->prepare(
                "INSERT OR REPLACE INTO store_extras (store_id, data, updated_at) VALUES (?, ?, datetime('now'))"
            )->execute([$storeId, $json]);
        }
    } catch (Throwable) {
        /* fall through to column map */
    }

    // Laravel MySQL: also map known fields onto real columns.
    $sets = ['updated_at = CURRENT_TIMESTAMP'];
    $params = [];
    $map = [
        'name' => 'name',
        'slug' => 'slug',
        'domain' => 'domain',
        'email' => 'email',
        'phone' => 'phone',
        'logo' => 'logo',
        'accent_color' => 'accent_color',
        'plan' => 'plan',
        'status' => 'status',
        'owner_name' => 'owner_name',
        'city' => 'city',
        'country' => 'country',
        'category' => 'category',
        'subscription_status' => 'subscription_status',
        'currency' => 'currency',
        'locale' => 'locale',
        'timezone' => 'timezone',
        'text_direction' => 'text_direction',
        'db_isolation' => 'db_isolation',
    ];
    if (array_key_exists('master_granted_pro', $data) || array_key_exists('masterGrantedPro', $data)) {
        $granted = !empty($data['master_granted_pro']) || !empty($data['masterGrantedPro']);
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'master_granted_pro')) {
            $sets[] = 'master_granted_pro = ?';
            $params[] = $granted ? 1 : 0;
        }
    }
    foreach ($map as $src => $col) {
        if (!array_key_exists($src, $data)) {
            continue;
        }
        $sets[] = '`' . $col . '` = ?';
        $params[] = $data[$src];
    }
    if (array_key_exists('login_email_active', $data)) {
        if (function_exists('souq_ensure_mysql_store_login_column')) {
            souq_ensure_mysql_store_login_column($pdo);
        }
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'login_email_active')) {
            $sets[] = 'login_email_active = ?';
            $params[] = !empty($data['login_email_active']) ? 1 : 0;
        }
    }
    if (count($params) === 0) {
        return;
    }
    $params[] = $storeId;
    $pdo->prepare('UPDATE stores SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
}

/**
 * Canonical default earn rules (same ids as Laravel LoyaltyPointsService / StoreLoyaltyProgram UI).
 *
 * @return list<array<string, mixed>>
 */
function souq_default_earn_rules(): array
{
    return [
        [
            'id' => 'earn-order-completed',
            'method' => 'order_completed',
            'methodAr' => 'إكمال الطلب',
            'methodEn' => 'Order Completed',
            'points' => 1,
            'active' => true,
            'config' => [
                'points_per_sar' => 1,
                'qualifying_statuses' => ['completed', 'delivered'],
            ],
        ],
        [
            'id' => 'earn-product-bonus',
            'method' => 'product_bonus',
            'methodAr' => 'نقاط إضافية لمنتجات محددة',
            'methodEn' => 'Product-Specific Bonus',
            'points' => 0,
            'active' => false,
            'config' => [
                'product_ids' => [],
                'mode' => 'double',
                'fixed_points_per_unit' => 10,
            ],
        ],
        [
            'id' => 'earn-tiered-spend',
            'method' => 'tiered_spend',
            'methodAr' => 'مكافأة إنفاق متدرج',
            'methodEn' => 'Tiered Spending',
            'points' => 50,
            'active' => false,
            'config' => [
                'threshold_sar' => 300,
                'bonus_points' => 50,
            ],
        ],
        [
            'id' => 'earn-product-review',
            'method' => 'product_review',
            'methodAr' => 'تقييم منتج',
            'methodEn' => 'Product Review',
            'points' => 5,
            'active' => true,
            'config' => [
                'points' => 5,
                'require_verified' => true,
                'require_approval' => true,
            ],
        ],
        [
            'id' => 'earn-review-media',
            'method' => 'review_with_media',
            'methodAr' => 'تقييم مع صورة أو فيديو',
            'methodEn' => 'Review with Media',
            'points' => 10,
            'active' => true,
            'config' => [
                'points' => 10,
                'require_verified' => true,
                'require_approval' => true,
            ],
        ],
        [
            'id' => 'earn-first-order',
            'method' => 'first_order',
            'methodAr' => 'مكافأة أول طلب',
            'methodEn' => 'First-Order Bonus',
            'points' => 50,
            'active' => true,
            'config' => ['points' => 50],
        ],
        [
            'id' => 'earn-birthday',
            'method' => 'birthday',
            'methodAr' => 'مكافأة عيد الميلاد',
            'methodEn' => "Customer's Birthday Reward",
            'points' => 100,
            'active' => true,
            'config' => ['points' => 100],
        ],
        [
            'id' => 'earn-retention',
            'method' => 'retention',
            'methodAr' => 'مكافأة إعادة الشراء',
            'methodEn' => 'Retention Bonus (Repeat Purchase)',
            'points' => 25,
            'active' => true,
            'config' => [
                'points' => 25,
                'within_days' => 30,
            ],
        ],
    ];
}

/**
 * @param list<array<string, mixed>> $stored
 * @return list<array<string, mixed>>
 */
function souq_merge_earn_rules(array $stored): array
{
    $defaults = souq_default_earn_rules();
    if ($stored === []) {
        return $defaults;
    }
    $byMethod = [];
    $byId = [];
    foreach ($stored as $rule) {
        if (!is_array($rule)) {
            continue;
        }
        $method = (string)($rule['method'] ?? '');
        $id = (string)($rule['id'] ?? '');
        if ($method !== '') {
            $byMethod[$method] = $rule;
        }
        if ($id !== '') {
            $byId[$id] = $rule;
        }
    }
    $merged = [];
    foreach ($defaults as $def) {
        $method = (string)$def['method'];
        $id = (string)$def['id'];
        $src = $byMethod[$method] ?? $byId[$id] ?? null;
        if (!is_array($src)) {
            $merged[] = $def;
            continue;
        }
        $cfg = array_merge(
            is_array($def['config'] ?? null) ? $def['config'] : [],
            is_array($src['config'] ?? null) ? $src['config'] : []
        );
        $merged[] = [
            'id' => $id,
            'method' => $method,
            'methodAr' => (string)($src['methodAr'] ?? $def['methodAr']),
            'methodEn' => (string)($src['methodEn'] ?? $def['methodEn']),
            'points' => isset($src['points']) ? (int)$src['points'] : (int)$def['points'],
            'active' => array_key_exists('active', $src) ? (bool)$src['active'] : (bool)$def['active'],
            'config' => $cfg,
        ];
    }
    return $merged;
}

/**
 * @return array<string, mixed>
 */
function souq_default_loyalty_game_settings(): array
{
    return [
        'gameEnabled' => true,
        'storefrontDockEnabled' => false,
        'coinsPerSar' => 10,
        'minSpinCoins' => 10,
        'maxSpinCoins' => 100,
        'spinCooldownHours' => 24,
        'cardPaymentBonusCoins' => 30,
        'signupLocationBonusCoins' => 50,
    ];
}

/**
 * Normalize /stores/{id}/loyalty/... → /loyalty/...
 */
function souq_loyalty_uri(string $uri): ?string
{
    if (preg_match('#^/stores/[^/]+(/loyalty(?:/.*)?)$#', $uri, $m)) {
        return $m[1];
    }
    if (str_starts_with($uri, '/loyalty')) {
        return $uri;
    }
    return null;
}

/**
 * Load / initialize per-store loyalty program blob (earn rules, rewards, settings).
 *
 * @return array{loyalty: array<string, mixed>, store_data: array<string, mixed>}
 */
function souq_loyalty_program(PDO $pdo, string $storeId): array
{
    $storeData = souq_store_data($pdo, $storeId);
    $loyalty = $storeData['loyalty'] ?? $storeData['loyaltyProgram'] ?? null;
    if (!is_array($loyalty)) {
        $loyalty = [];
    }

    // Migrate legacy flat pointsPerSar into order_completed rule
    $legacyRate = $loyalty['pointsPerSar'] ?? $loyalty['points_per_sar'] ?? null;
    $earnRules = souq_merge_earn_rules(
        is_array($loyalty['earn_rules'] ?? null) ? $loyalty['earn_rules'] : []
    );
    if ($legacyRate !== null && is_numeric($legacyRate)) {
        foreach ($earnRules as &$rule) {
            if (($rule['method'] ?? '') === 'order_completed') {
                $rate = max(0, (float)$legacyRate);
                $rule['points'] = (int)$rate;
                $rule['config'] = array_merge(
                    is_array($rule['config'] ?? null) ? $rule['config'] : [],
                    ['points_per_sar' => $rate]
                );
                $rule['active'] = $rate > 0;
                break;
            }
        }
        unset($rule);
        unset($loyalty['pointsPerSar'], $loyalty['points_per_sar']);
    }

    $settings = is_array($loyalty['settings'] ?? null) ? $loyalty['settings'] : [];
    $settings = array_merge([
        'enableLoyalty' => true,
        'appNotifications' => true,
        'emailNotifications' => true,
        'pointsExpiration' => false,
    ], $settings);

    $game = array_merge(
        souq_default_loyalty_game_settings(),
        is_array($loyalty['game_settings'] ?? null) ? $loyalty['game_settings'] : []
    );

    $loyalty['earn_rules'] = $earnRules;
    $loyalty['rewards'] = is_array($loyalty['rewards'] ?? null) ? array_values($loyalty['rewards']) : [];
    $loyalty['redemptions'] = is_array($loyalty['redemptions'] ?? null) ? array_values($loyalty['redemptions']) : [];
    $loyalty['activities'] = is_array($loyalty['activities'] ?? null) ? array_values($loyalty['activities']) : [];
    $loyalty['settings'] = $settings;
    $loyalty['game_settings'] = $game;

    return ['loyalty' => $loyalty, 'store_data' => $storeData];
}

function souq_loyalty_save(PDO $pdo, string $storeId, array $storeData, array $loyalty): void
{
    $storeData['loyalty'] = $loyalty;
    unset($storeData['loyaltyProgram']);
    souq_save_store_data($pdo, $storeId, $storeData);
}

function souq_loyalty_rate(PDO $pdo, string $storeId): float
{
    $pack = souq_loyalty_program($pdo, $storeId);
    $loyalty = $pack['loyalty'];
    $settings = is_array($loyalty['settings'] ?? null) ? $loyalty['settings'] : [];
    if (array_key_exists('enableLoyalty', $settings) && !$settings['enableLoyalty']) {
        return 0.0;
    }
    foreach (($loyalty['earn_rules'] ?? []) as $rule) {
        if (!is_array($rule) || ($rule['method'] ?? '') !== 'order_completed') {
            continue;
        }
        if (empty($rule['active'])) {
            return 0.0;
        }
        $cfg = is_array($rule['config'] ?? null) ? $rule['config'] : [];
        $rate = $cfg['points_per_sar'] ?? $rule['points'] ?? 0;
        return max(0, (float)$rate);
    }
    $legacy = $loyalty['pointsPerSar'] ?? $loyalty['points_per_sar'] ?? 0;
    return max(0, (float)$legacy);
}

function souq_commerce_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if ($storeId === '' && !in_array($uri, ['/storefront/events'], true)) {
        $needsStore = str_starts_with($uri, '/storefront/') || in_array($uri, [
            '/orders', '/customers', '/coupons', '/seo', '/reports/overview', '/gift-cards',
            '/shipping-methods', '/payment-gateways', '/couriers', '/shipping',
            '/notifications/deliveries', '/payments/transactions', '/couriers/shipments',
        ], true);
        if ($needsStore) {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
    }

    if ($uri === '/storefront/orders' && $method === 'POST') {
        try {
        $name = trim((string)($input['customer_name'] ?? ''));
        $phone = trim((string)($input['customer_phone'] ?? ''));
        $total = (float)($input['total_amount'] ?? 0);
        if ($name === '' || $phone === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Name and phone are required.']);
            return true;
        }
        $email = trim((string)($input['customer_email'] ?? ''));
        $email = $email !== '' ? strtolower($email) : null;
        $source = souq_normalize_source($input['source'] ?? null);
        $details = trim((string)($input['source_details'] ?? ''));
        $city = '';
        $location = trim((string)($input['delivery_location'] ?? ''));
        if ($location !== '') {
            $city = trim(explode(',', explode('-', $location)[0])[0]);
        }
        // MySQL NOT NULL on delivery_location — never insert null.
        if ($location === '') {
            $location = $city !== '' ? $city : 'Saudi Arabia';
        }
        if ($city === '') {
            $city = trim(explode(',', explode('-', $location)[0])[0]);
        }
        $items = is_array($input['items'] ?? null) ? $input['items'] : [];
        // Reject HiBrew grouped parent shells — only independent child products may be purchased.
        foreach ($items as $item) {
            $pid = trim((string)($item['product_id'] ?? $item['id'] ?? ''));
            if ($pid === '') {
                continue;
            }
            try {
                $pst = $pdo->prepare('SELECT product_type, data FROM products WHERE id = ? AND store_id = ? LIMIT 1');
                $pst->execute([$pid, $storeId]);
                $prow = $pst->fetch();
                if (!$prow) {
                    continue;
                }
                $ptype = (string)($prow['product_type'] ?? '');
                if ($ptype === '' && !empty($prow['data'])) {
                    $decoded = json_decode((string)$prow['data'], true);
                    if (is_array($decoded)) {
                        $ptype = (string)($decoded['product_type'] ?? $decoded['productType'] ?? '');
                    }
                }
                if (strtolower(trim($ptype)) === 'grouped') {
                    http_response_code(422);
                    echo json_encode([
                        'message' => 'Grouped parent products cannot be purchased. Add a child product instead.',
                        'message_ar' => 'لا يمكن شراء منتج المجموعة الأب. أضف المنتج الفرعي المحدد بدلاً منه.',
                        'product_id' => $pid,
                    ]);
                    return true;
                }
            } catch (Throwable) {
                /* product_type column optional on some hosts */
            }
        }
        $couponCode = strtoupper(trim((string)($input['coupon_code'] ?? '')));
        $discount = 0.0;
        if ($couponCode !== '') {
            $c = $pdo->prepare('SELECT * FROM coupons WHERE store_id = ? AND UPPER(code) = ? AND is_active = 1 LIMIT 1');
            $c->execute([$storeId, $couponCode]);
            $coupon = $c->fetch();
            if (!$coupon) {
                http_response_code(422);
                echo json_encode(['message' => 'Coupon not found.']);
                return true;
            }
            if (!empty($coupon['expires_at']) && $coupon['expires_at'] < date('Y-m-d')) {
                http_response_code(422);
                echo json_encode(['message' => 'Coupon expired.']);
                return true;
            }
            if ($coupon['max_uses'] !== null && (int)$coupon['usage_count'] >= (int)$coupon['max_uses']) {
                http_response_code(422);
                echo json_encode(['message' => 'Coupon usage limit reached.']);
                return true;
            }
            if ((float)$coupon['min_order_amount'] > $total) {
                http_response_code(422);
                echo json_encode(['message' => 'Order is below the coupon minimum.']);
                return true;
            }
            $discount = $coupon['discount_type'] === 'fixed'
                ? min($total, (float)$coupon['discount_value'])
                : round($total * ((float)$coupon['discount_value'] / 100), 2);
            $pdo->prepare('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ? AND store_id = ?')->execute([$coupon['id'], $storeId]);
        }
        $charged = max(0, $total - $discount);
        $customer = souq_upsert_customer($pdo, $storeId, $name, $phone, $email, $city, $source, $charged);
        $rate = souq_loyalty_rate($pdo, $storeId);
        if ($rate > 0 && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'customers', 'points')) {
            $pts = (int)floor($charged * $rate);
            if ($pts > 0) {
                try {
                    $pdo->prepare('UPDATE customers SET points = points + ? WHERE id = ? AND store_id = ?')->execute([$pts, $customer['id'], $storeId]);
                    $customer['points'] = (int)($customer['points'] ?? 0) + $pts;
                } catch (Throwable) {
                    /* points column optional on some hosts */
                }
            }
        }
        $orderId = 'ord-' . bin2hex(random_bytes(8));
        $number = souq_next_order_number($pdo, $storeId);
        $names = [];
        foreach ($items as $item) {
            if (!empty($item['name'])) {
                $names[] = (string)$item['name'];
            }
        }
        $summary = $names ? implode(', ', $names) : '';
        $now = date('Y-m-d H:i:s');
        $methodName = souq_payment_method($input['payment_method'] ?? null);
        // Prefer dynamic columns like manual orders (MySQL schema varies).
        $cols = [
            'id', 'store_id', 'order_number', 'customer_id', 'customer_name', 'customer_email', 'customer_phone',
            'items_count', 'items_summary', 'total_amount', 'currency', 'source', 'source_details',
            'delivery_location', 'status', 'payment_method', 'payment_status', 'shipping_status',
            'order_date', 'created_at',
        ];
        $vals = [
            $orderId, $storeId, $number, $customer['id'], $name, $email, $phone,
            count($items) ?: 1, $summary, $charged, 'SAR', $source, $details !== '' ? $details : $source,
            $location, 'pending', $methodName, 'Pending', 'pending',
            substr($now, 0, 10), $now,
        ];
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', 'coupon_code')) {
            $cols[] = 'coupon_code';
            $vals[] = $couponCode !== '' ? $couponCode : null;
        }
        $shippingCostIn = null;
        if (array_key_exists('shipping_cost', $input) && $input['shipping_cost'] !== null && $input['shipping_cost'] !== '') {
            $shippingCostIn = (float) $input['shipping_cost'];
        } elseif (array_key_exists('shipping_fee', $input) && $input['shipping_fee'] !== null && $input['shipping_fee'] !== '') {
            $shippingCostIn = (float) $input['shipping_fee'];
        }
        if ($shippingCostIn !== null && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', 'shipping_cost')) {
            $cols[] = 'shipping_cost';
            $vals[] = max(0, $shippingCostIn);
        }
        $customerNotesIn = trim((string) ($input['customer_notes'] ?? $input['notes'] ?? ''));
        if ($customerNotesIn !== '' && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', 'customer_notes')) {
            $cols[] = 'customer_notes';
            $vals[] = mb_substr($customerNotesIn, 0, 2000);
        }
        try {
            souq_ensure_utm_schema($pdo);
        } catch (Throwable) {
            /* optional */
        }
        foreach ([
            'medium', 'campaign', 'utm_term', 'utm_content', 'delivery_mode',
            'first_touch_source', 'first_touch_medium', 'first_touch_campaign',
            'first_touch_utm_term', 'first_touch_utm_content', 'landing_page', 'referral_host',
        ] as $utmCol) {
            $utmVal = trim((string) ($input[$utmCol] ?? ''));
            if ($utmVal !== '' && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', $utmCol)) {
                $cols[] = $utmCol;
                $vals[] = mb_substr($utmVal, 0, $utmCol === 'landing_page' ? 512 : 191);
            }
        }
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', 'updated_at')) {
            $cols[] = 'updated_at';
            $vals[] = $now;
        }
        $placeholders = implode(', ', array_fill(0, count($cols), '?'));
        $colSql = implode(', ', $cols);
        $ins = $pdo->prepare("INSERT INTO orders ({$colSql}) VALUES ({$placeholders})");
        $ins->execute($vals);
        try {
            souq_ensure_product_variations_table($pdo);
            souq_ensure_order_item_variation_columns($pdo);
        } catch (Throwable) {
            /* optional */
        }
        $hasVarCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'variation_id');
        $hasOptsCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'selected_options');
        $hasSkuCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'sku');
        $hasBrandCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'brand');
        $hasCategoryCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'category');
        $hasImageCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'order_items', 'image_url');
        $snapCols = [];
        if ($hasSkuCol) {
            $snapCols[] = 'sku';
        }
        if ($hasBrandCol) {
            $snapCols[] = 'brand';
        }
        if ($hasCategoryCol) {
            $snapCols[] = 'category';
        }
        if ($hasImageCol) {
            $snapCols[] = 'image_url';
        }
        $snapSql = $snapCols !== [] ? (', ' . implode(', ', $snapCols)) : '';
        $snapPlaceholders = $snapCols !== [] ? (', ' . implode(', ', array_fill(0, count($snapCols), '?'))) : '';
        if ($hasVarCol && $hasOptsCol) {
            $itemIns = $pdo->prepare("INSERT INTO order_items (order_id, store_id, product_id, variation_id, selected_options, product_name{$snapSql}, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?{$snapPlaceholders}, ?, ?, ?)");
        } elseif ($hasVarCol) {
            $itemIns = $pdo->prepare("INSERT INTO order_items (order_id, store_id, product_id, variation_id, product_name{$snapSql}, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?{$snapPlaceholders}, ?, ?, ?)");
        } else {
            $itemIns = $pdo->prepare("INSERT INTO order_items (order_id, store_id, product_id, product_name{$snapSql}, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?{$snapPlaceholders}, ?, ?, ?)");
        }
        foreach ($items as $item) {
            $qty = max(1, (int)($item['quantity'] ?? 1));
            $price = (float)($item['price'] ?? 0);
            $pid = (string)($item['product_id'] ?? '');
            $vid = trim((string)($item['variation_id'] ?? $item['variationId'] ?? ''));
            $pname = (string)($item['name'] ?? '');
            $selectedOpts = $item['selected_options'] ?? $item['selectedOptions'] ?? null;
            $selectedOptsJson = is_array($selectedOpts) ? json_encode($selectedOpts, JSON_UNESCAPED_UNICODE) : null;
            $sku = trim((string)($item['sku'] ?? ''));
            $brand = trim((string)($item['brand'] ?? ''));
            $category = trim((string)($item['category'] ?? ''));
            $imageUrl = trim((string)($item['image_url'] ?? $item['imageUrl'] ?? $item['image'] ?? ''));
            if ($pid !== '' && ($sku === '' || $brand === '' || $category === '' || $imageUrl === '')) {
                try {
                    $pst = $pdo->prepare('SELECT sku, brand, category, image_url FROM products WHERE id = ? AND store_id = ? LIMIT 1');
                    $pst->execute([$pid, $storeId]);
                    $prow = $pst->fetch(PDO::FETCH_ASSOC) ?: [];
                    if ($sku === '' && !empty($prow['sku'])) {
                        $sku = (string)$prow['sku'];
                    }
                    if ($brand === '' && !empty($prow['brand'])) {
                        $brand = (string)$prow['brand'];
                    }
                    if ($category === '' && !empty($prow['category'])) {
                        $category = (string)$prow['category'];
                    }
                    if ($imageUrl === '' && !empty($prow['image_url'])) {
                        $imageUrl = (string)$prow['image_url'];
                    }
                } catch (Throwable) {
                    /* optional product snapshot */
                }
            }
            $snapVals = [];
            if ($hasSkuCol) {
                $snapVals[] = $sku !== '' ? $sku : null;
            }
            if ($hasBrandCol) {
                $snapVals[] = $brand !== '' ? $brand : null;
            }
            if ($hasCategoryCol) {
                $snapVals[] = $category !== '' ? $category : null;
            }
            if ($hasImageCol) {
                $snapVals[] = $imageUrl !== '' ? $imageUrl : null;
            }
            $usedVariationStock = false;
            if ($vid !== '') {
                try {
                    $vst = $pdo->prepare('SELECT * FROM product_variations WHERE id = ? AND store_id = ? LIMIT 1');
                    $vst->execute([$vid, $storeId]);
                    $vrow = $vst->fetch(PDO::FETCH_ASSOC);
                    if ($vrow) {
                        if ($vrow['price'] !== null && $vrow['price'] !== '') {
                            $price = (float)$vrow['price'];
                        }
                        if ($pid === '') {
                            $pid = (string)$vrow['product_id'];
                        }
                        $opts = souq_variation_options_normalize($vrow['options'] ?? []);
                        if ($opts !== [] && $pname !== '') {
                            $bits = [];
                            foreach ($opts as $ok => $ov) {
                                $bits[] = $ok . ': ' . $ov;
                            }
                            $pname .= ' (' . implode(', ', $bits) . ')';
                        }
                        if ($selectedOptsJson === null && $opts !== []) {
                            $selectedOptsJson = json_encode($opts, JSON_UNESCAPED_UNICODE);
                        }
                        souq_variation_stock_deduct($pdo, $storeId, $vid, $qty);
                        $usedVariationStock = true;
                    }
                } catch (Throwable) {
                    /* keep posted price */
                }
            }
            if ($hasVarCol && $hasOptsCol) {
                $itemIns->execute(array_merge(
                    [$orderId, $storeId, $pid, $vid !== '' ? $vid : null, $selectedOptsJson, $pname],
                    $snapVals,
                    [$qty, $price, $qty * $price]
                ));
            } elseif ($hasVarCol) {
                $itemIns->execute(array_merge(
                    [$orderId, $storeId, $pid, $vid !== '' ? $vid : null, $pname],
                    $snapVals,
                    [$qty, $price, $qty * $price]
                ));
            } else {
                $itemIns->execute(array_merge(
                    [$orderId, $storeId, $pid, $pname],
                    $snapVals,
                    [$qty, $price, $qty * $price]
                ));
            }
            // Variant line owns inventory — do not double-deduct parent product stock.
            if ($pid !== '' && ! $usedVariationStock) {
                souq_product_stock_deduct($pdo, $storeId, $pid, $qty);
            }
        }
        $fresh = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ?');
        $fresh->execute([$orderId, $storeId]);
        $custFresh = $pdo->prepare('SELECT * FROM customers WHERE id = ? AND store_id = ?');
        $custFresh->execute([$customer['id'], $storeId]);
        echo json_encode([
            'data' => souq_order_row($pdo, $fresh->fetch() ?: []),
            'customer' => souq_customer_row($custFresh->fetch() ?: $customer),
        ]);
        return true;
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'message' => 'Storefront order failed.',
                'error' => $e->getMessage(),
            ]);
            return true;
        }
    }

    if ($uri === '/storefront/orders/track' && $method === 'POST') {
        $number = strtoupper(trim((string)($input['order_number'] ?? '')));
        $phone = (string)($input['phone'] ?? '');
        if ($number === '' || souq_digits($phone) === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Order number and phone are required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM orders WHERE store_id = ?');
        $st->execute([$storeId]);
        $digits = ltrim(preg_replace('/\D+/', '', $number) ?? '', '0');
        $found = null;
        while ($row = $st->fetch()) {
            $rowDigits = ltrim(preg_replace('/\D+/', '', (string)$row['order_number']) ?? '', '0');
            if ($rowDigits !== '' && $rowDigits === $digits && souq_phones_match((string)$row['customer_phone'], $phone)) {
                $found = $row;
                break;
            }
        }
        if (!$found) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        $tracked = souq_order_row($pdo, $found);
        echo json_encode(['data' => [
            'order_number' => $found['order_number'],
            'status' => $found['status'],
            'shipping_status' => $found['shipping_status'],
            'tracking_number' => $found['tracking_number'],
            'courier_code' => $found['courier_code'],
            'items_summary' => $found['items_summary'],
            'items_count' => (int)$found['items_count'],
            'delivery_location' => $found['delivery_location'],
            'order_date' => $found['order_date'],
            'estimated_delivery' => null,
            'payment_status' => $found['payment_status'],
            'payment_method' => $found['payment_method'] ?? null,
            'total_amount' => (float) ($found['total_amount'] ?? 0),
            'shipping_cost' => $tracked['shipping_cost'] ?? null,
            'customer_name' => $found['customer_name'] ?? null,
            'customer_phone' => $found['customer_phone'] ?? null,
            'customer_notes' => $found['customer_notes'] ?? null,
            'items' => $tracked['items'] ?? [],
        ]]);
        return true;
    }

    // Customer profile: real orders for this store_id + email/phone/customer_id (with line items).
    if ($uri === '/storefront/orders/mine' && $method === 'POST') {
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $phoneDigits = souq_digits((string) ($input['phone'] ?? ''));
        $customerId = trim((string) ($input['customer_id'] ?? ''));
        if ($email === '' && $phoneDigits === '' && $customerId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Email, phone, or customer_id required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM orders WHERE store_id = ? ORDER BY COALESCE(updated_at, created_at, order_date) DESC LIMIT 50');
        $st->execute([$storeId]);
        $rows = [];
        while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $match = false;
            if ($customerId !== '' && !str_starts_with($customerId, 'sf-') && (string) ($row['customer_id'] ?? '') === $customerId) {
                $match = true;
            }
            if (!$match && $email !== '' && strtolower(trim((string) ($row['customer_email'] ?? ''))) === $email) {
                $match = true;
            }
            if (!$match && strlen($phoneDigits) >= 8 && souq_phones_match((string) ($row['customer_phone'] ?? ''), $phoneDigits)) {
                $match = true;
            }
            if ($match) {
                $rows[] = souq_order_row($pdo, $row);
            }
        }
        echo json_encode([
            'data' => $rows,
            'store_id' => $storeId,
            'meta' => ['total' => count($rows)],
        ]);
        return true;
    }

    if ($uri === '/storefront/account' && $method === 'POST') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $password = (string)($input['password'] ?? '');
        $mode = (string)($input['mode'] ?? 'login');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            http_response_code(422);
            echo json_encode(['message' => 'A valid email and a password of at least 8 characters are required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM customers WHERE store_id = ? AND lower(email) = ? LIMIT 1');
        $st->execute([$storeId, $email]);
        $row = $st->fetch();
        if ($mode === 'register') {
            if ($row && !empty($row['password_hash'])) {
                http_response_code(409);
                echo json_encode(['message' => 'An account with this email already exists.']);
                return true;
            }
            $name = trim((string)($input['name'] ?? ''));
            $phone = trim((string)($input['phone'] ?? ''));
            $city = trim((string)($input['city'] ?? ''));
            if ($name === '' || $phone === '') {
                http_response_code(422);
                echo json_encode(['message' => 'Name and phone are required.']);
                return true;
            }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            if ($row) {
                $pdo->prepare('UPDATE customers SET name = ?, phone = ?, city = ?, password_hash = ? WHERE id = ? AND store_id = ?')->execute([$name, $phone, $city, $hash, $row['id'], $storeId]);
                $row['name'] = $name;
                $row['phone'] = $phone;
                $row['city'] = $city;
            } else {
                $id = 'cust-' . bin2hex(random_bytes(8));
                $now = date('c');
                $pdo->prepare('INSERT INTO customers (id, store_id, name, email, phone, city, country, acquisition_source, `group`, status, total_orders, total_spend, avg_order_value, created_at, password_hash, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, 0)')
                    ->execute([$id, $storeId, $name, $email, $phone, $city, 'Saudi Arabia', 'Direct', 'Regular', 'New', $now, $hash]);
                $row = ['id' => $id, 'store_id' => $storeId, 'name' => $name, 'email' => $email, 'phone' => $phone, 'city' => $city, 'country' => 'Saudi Arabia', 'acquisition_source' => 'Direct', 'group' => 'Regular', 'status' => 'New', 'total_orders' => 0, 'total_spend' => 0, 'avg_order_value' => 0, 'last_order_date' => null, 'created_at' => $now, 'points' => 0];
            }
        } else {
            if (!$row || empty($row['password_hash']) || !password_verify($password, (string)$row['password_hash'])) {
                http_response_code(401);
                echo json_encode(['message' => 'Email or password is incorrect.']);
                return true;
            }
        }
        $token = 'sf|' . bin2hex(random_bytes(16));
        $pdo->prepare('UPDATE customers SET password_hash = password_hash WHERE id = ?');
        echo json_encode(['token' => $token, 'customer' => souq_customer_row($row)]);
        return true;
    }

    if ($uri === '/storefront/coupons/validate' && $method === 'POST') {
        $code = strtoupper(trim((string)($input['code'] ?? '')));
        $total = (float)($input['total'] ?? 0);
        $st = $pdo->prepare('SELECT * FROM coupons WHERE store_id = ? AND UPPER(code) = ? LIMIT 1');
        $st->execute([$storeId, $code]);
        $row = $st->fetch();
        if (!$row || !(int)$row['is_active']) {
            http_response_code(404);
            echo json_encode(['message' => 'Coupon not found.']);
            return true;
        }
        echo json_encode(['data' => [
            'id' => $row['id'],
            'store_id' => $row['store_id'],
            'code' => $row['code'],
            'discount_type' => $row['discount_type'],
            'discount_value' => (float)$row['discount_value'],
            'min_order_amount' => (float)$row['min_order_amount'],
            'max_uses' => $row['max_uses'],
            'usage_count' => (int)$row['usage_count'],
            'status' => $row['status'],
            'is_active' => (bool)$row['is_active'],
            'expires_at' => $row['expires_at'],
            'applicable' => $total <= 0 || $total >= (float)$row['min_order_amount'],
        ]]);
        return true;
    }

    if ($uri === '/storefront/gift-cards/balance' && $method === 'POST') {
        $code = strtoupper(trim((string)($input['code'] ?? '')));
        $st = $pdo->prepare('SELECT * FROM gift_cards WHERE store_id = ? AND UPPER(code) = ? LIMIT 1');
        $st->execute([$storeId, $code]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Gift card not found.']);
            return true;
        }
        echo json_encode(['data' => [
            'code' => $row['code'],
            'balance' => (float)$row['balance'],
            'currency' => $row['currency'] ?: 'SAR',
            'status' => $row['status'],
        ]]);
        return true;
    }

    if ($uri === '/storefront/events' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $name = strtolower(trim((string)($input['event'] ?? '')));
        $allowed = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'search'];
        if (!in_array($name, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Unknown event.']);
            return true;
        }
        $sessionKey = substr(trim((string)($input['session_key'] ?? '')), 0, 64);
        $visitorKey = substr(trim((string)($input['visitor_key'] ?? '')), 0, 64);
        $path = substr((string)($input['path'] ?? ''), 0, 180);
        $source = souq_normalize_source($input['source'] ?? null);
        $medium = substr(strtolower(trim((string)($input['medium'] ?? ''))), 0, 128);
        $campaign = substr(strtolower(trim((string)($input['campaign'] ?? ''))), 0, 191);
        $metaRaw = $input['meta'] ?? null;
        $metaJson = null;
        if (is_array($metaRaw)) {
            $metaJson = json_encode($metaRaw, JSON_UNESCAPED_UNICODE);
        } elseif (is_string($metaRaw) && trim($metaRaw) !== '') {
            $metaJson = substr(trim($metaRaw), 0, 4000);
        }
        $now = date('Y-m-d H:i:s');
        $mysql = souq_pdo_is_mysql($pdo);

        try {
            souq_ensure_analytics_tables($pdo);

            if ($name === 'page_view') {
                $shouldIncrement = true;
                if ($sessionKey !== '') {
                    $dupSql = $mysql
                        ? "SELECT 1 FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND session_key = ? AND created_at >= (NOW() - INTERVAL 1 DAY) LIMIT 1"
                        : "SELECT 1 FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND session_key = ? AND created_at >= datetime('now', '-1 day') LIMIT 1";
                    $dup = $pdo->prepare($dupSql);
                    $dup->execute([$storeId, $sessionKey]);
                    $shouldIncrement = $dup->fetchColumn() === false;
                }
                if ($shouldIncrement) {
                    $upsert = $mysql
                        ? 'INSERT INTO store_metrics (store_id, visitors_count, updated_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE visitors_count = visitors_count + 1, updated_at = VALUES(updated_at)'
                        : 'INSERT INTO store_metrics (store_id, visitors_count, updated_at) VALUES (?, 1, ?) ON CONFLICT(store_id) DO UPDATE SET visitors_count = visitors_count + 1, updated_at = excluded.updated_at';
                    $pdo->prepare($upsert)->execute([$storeId, $now]);
                }
            }

            $hasMedium = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'medium');
            $hasCampaign = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'campaign');
            $hasVisitor = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'visitor_key');
            $hasMeta = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'meta');
            if ($hasMedium && $hasCampaign && $hasVisitor && $hasMeta) {
                $pdo->prepare('INSERT INTO analytics_events (store_id, event_name, path, source, medium, campaign, session_key, visitor_key, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                    ->execute([
                        $storeId,
                        $name,
                        $path,
                        $source,
                        $medium !== '' ? $medium : null,
                        $campaign !== '' ? $campaign : null,
                        $sessionKey !== '' ? $sessionKey : null,
                        $visitorKey !== '' ? $visitorKey : null,
                        $metaJson,
                        $now,
                    ]);
            } else {
                $pdo->prepare('INSERT INTO analytics_events (store_id, event_name, path, source, session_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                    ->execute([$storeId, $name, $path, $source, $sessionKey !== '' ? $sessionKey : null, $now]);
            }
        } catch (Throwable $e) {
            // Never break storefront for analytics — still acknowledge the event.
            echo json_encode(['ok' => true, 'success' => true, 'analytics' => 'skipped']);
            return true;
        }
        echo json_encode(['ok' => true, 'success' => true]);
        return true;
    }

    if ($uri === '/orders' && $method === 'GET') {
        if (!empty($_GET['summary']) || !empty($_GET['counts'])) {
            $statusCounts = [];
            $st = $pdo->prepare('SELECT status, COUNT(*) c FROM orders WHERE store_id = ? GROUP BY status');
            $st->execute([$storeId]);
            while ($row = $st->fetch()) {
                $statusCounts[(string)$row['status']] = (int)$row['c'];
            }
            $totalSt = $pdo->prepare('SELECT COUNT(*) c FROM orders WHERE store_id = ?');
            $totalSt->execute([$storeId]);
            echo json_encode([
                'store_id' => $storeId,
                'total' => (int)(($totalSt->fetch() ?: ['c' => 0])['c']),
                'by_status' => $statusCounts,
            ]);
            return true;
        }

        $lean = !empty($_GET['lean']);
        $sql = 'SELECT * FROM orders WHERE store_id = ?';
        $params = [$storeId];
        if (($status = trim((string)($_GET['status'] ?? ''))) !== '') {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }
        if (($paymentStatus = trim((string)($_GET['payment_status'] ?? ''))) !== '') {
            $sql .= ' AND payment_status = ?';
            $params[] = $paymentStatus;
        }
        if (($paymentMethod = trim((string)($_GET['payment_method'] ?? ''))) !== '') {
            $sql .= ' AND payment_method = ?';
            $params[] = $paymentMethod;
        }
        if (($source = trim((string)($_GET['source'] ?? ''))) !== '') {
            $sql .= ' AND source = ?';
            $params[] = $source;
        }
        if (($fromDate = trim((string)($_GET['from_date'] ?? ''))) !== '') {
            $sql .= ' AND order_date >= ?';
            $params[] = $fromDate;
        }
        if (($toDate = trim((string)($_GET['to_date'] ?? ''))) !== '') {
            $sql .= ' AND order_date <= ?';
            $params[] = $toDate;
        }
        if (($q = trim((string)($_GET['q'] ?? ''))) !== '') {
            $sql .= ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)';
            $like = '%' . $q . '%';
            array_push($params, $like, $like, $like, $like);
        }
        $sort = (string)($_GET['sort'] ?? 'order_date');
        $allowedSorts = ['order_date', 'order_number', 'total_amount', 'status', 'created_at'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'order_date';
        }
        $dir = strtolower((string)($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
        $sql .= " ORDER BY {$sort} {$dir}";

        $all = !empty($_GET['all']);
        $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 25)));
        $page = max(1, (int)($_GET['page'] ?? 1));

        if ($all) {
            $st = $pdo->prepare($sql);
            $st->execute($params);
            $rows = [];
            while ($row = $st->fetch()) {
                $rows[] = souq_order_row($pdo, $row, $lean);
            }
            echo json_encode([
                'data' => $rows,
                'store_id' => $storeId,
                'meta' => [
                    'total' => count($rows),
                    'page' => 1,
                    'per_page' => max(1, count($rows)),
                    'last_page' => 1,
                    'sort' => $sort,
                    'dir' => strtolower($dir),
                ],
            ]);
            return true;
        }

        $countSql = preg_replace('/^SELECT \* FROM orders/', 'SELECT COUNT(*) c FROM orders', $sql, 1) ?? $sql;
        $countSql = preg_replace('/ ORDER BY .+$/', '', $countSql) ?? $countSql;
        $countSt = $pdo->prepare($countSql);
        $countSt->execute($params);
        $total = (int)(($countSt->fetch() ?: ['c' => 0])['c']);
        $offset = ($page - 1) * $perPage;
        $pageSql = $sql . ' LIMIT ' . (int)$perPage . ' OFFSET ' . (int)$offset;
        $st = $pdo->prepare($pageSql);
        $st->execute($params);
        $rows = [];
        while ($row = $st->fetch()) {
            $rows[] = souq_order_row($pdo, $row, $lean);
        }
        echo json_encode([
            'data' => $rows,
            'store_id' => $storeId,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => max(1, (int)ceil($total / $perPage)),
                'sort' => $sort,
                'dir' => strtolower($dir),
            ],
        ]);
        return true;
    }

    if ($uri === '/orders' && $method === 'POST') {
        try {
            $name = trim((string)($input['customer_name'] ?? ''));
            $phone = trim((string)($input['customer_phone'] ?? ''));
            $total = (float)($input['total_amount'] ?? 0);
            if ($name === '' || $phone === '') {
                http_response_code(422);
                echo json_encode(['message' => 'Name and phone are required.']);
                return true;
            }
            $email = strtolower(trim((string)($input['customer_email'] ?? '')));
            $source = souq_normalize_source($input['source'] ?? null);
            $details = trim((string)($input['source_details'] ?? ''));
            $location = trim((string)($input['delivery_location'] ?? ''));
            if ($location === '') {
                $location = 'Makkah';
            }
            $city = trim(explode(',', explode('-', $location)[0])[0]);
            $items = is_array($input['items'] ?? null) ? $input['items'] : [];
            if ($total <= 0 && $items) {
                foreach ($items as $item) {
                    $total += max(1, (int)($item['quantity'] ?? 1)) * (float)($item['price'] ?? 0);
                }
            }
            $customer = souq_upsert_customer($pdo, $storeId, $name, $phone, $email, $city, $source, max(0, $total));
            $orderId = 'ord-' . bin2hex(random_bytes(8));
            $number = souq_next_order_number($pdo, $storeId);
            $names = [];
            foreach ($items as $item) {
                if (!empty($item['name'])) {
                    $names[] = (string)$item['name'];
                }
            }
            $summary = $names ? implode(', ', $names) : 'Store Products';
            $now = date('Y-m-d H:i:s');
            $methodName = souq_payment_method($input['payment_method'] ?? null);
            $orderStatus = souq_normalize_order_status($input['status'] ?? 'pending');
            $payStatus = souq_normalize_payment_status($input['payment_status'] ?? 'pending');
            $shippingStatus = trim((string)($input['shipping_status'] ?? 'pending'));
            if ($shippingStatus === '') {
                $shippingStatus = 'pending';
            }

            $cols = [
                'id', 'store_id', 'order_number', 'customer_id', 'customer_name', 'customer_email', 'customer_phone',
                'items_count', 'items_summary', 'total_amount', 'currency', 'source', 'source_details',
                'delivery_location', 'status', 'payment_method', 'payment_status', 'shipping_status',
                'order_date', 'created_at',
            ];
            $vals = [
                $orderId, $storeId, $number, $customer['id'], $name, $email !== '' ? $email : null, $phone,
                count($items) ?: 1, $summary, max(0, $total), 'SAR', $source, $details !== '' ? $details : $source,
                $location, $orderStatus, $methodName, $payStatus, $shippingStatus,
                $now, $now,
            ];
            $optional = [
                'delivery_mode' => $input['delivery_mode'] ?? null,
                'driver_id' => $input['driver_id'] ?? null,
                'bank_account_id' => $input['bank_account_id'] ?? null,
                'payment_plan' => $input['payment_plan'] ?? null,
                'amount_paid' => array_key_exists('amount_paid', $input) ? (float)$input['amount_paid'] : null,
                'remaining_balance' => array_key_exists('remaining_balance', $input) ? (float)$input['remaining_balance'] : null,
                'coupon_code' => isset($input['coupon_code']) ? strtoupper(trim((string)$input['coupon_code'])) : null,
                'updated_at' => $now,
            ];
            foreach ($optional as $col => $val) {
                if ($val === null && !in_array($col, ['updated_at'], true)) {
                    continue;
                }
                if (!souq_table_has_column($pdo, 'orders', $col)) {
                    continue;
                }
                $cols[] = $col;
                $vals[] = ($col === 'coupon_code' && $val === '') ? null : $val;
            }
            $placeholders = implode(', ', array_fill(0, count($cols), '?'));
            $colSql = implode(', ', array_map(static function ($c) {
                $safe = preg_replace('/[^a-z0-9_]/i', '', (string)$c) ?: 'id';
                return $safe;
            }, $cols));

            $pdo->beginTransaction();
            $pdo->prepare("INSERT INTO orders ({$colSql}) VALUES ({$placeholders})")->execute($vals);
            $itemIns = $pdo->prepare('INSERT INTO order_items (order_id, store_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)');
            foreach ($items as $item) {
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $price = (float)($item['price'] ?? 0);
                $pid = (string)($item['product_id'] ?? '');
                $itemIns->execute([$orderId, $storeId, $pid !== '' ? $pid : null, (string)($item['name'] ?? 'Item'), $qty, $price, $qty * $price]);
                if ($pid !== '') {
                    souq_product_stock_deduct($pdo, $storeId, $pid, $qty);
                }
            }
            if (souq_table_has_column($pdo, 'stores', 'orders_count')) {
                $pdo->prepare('UPDATE stores SET orders_count = COALESCE(orders_count, 0) + 1, revenue = COALESCE(revenue, 0) + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    ->execute([max(0, $total), $storeId]);
            }
            $pdo->commit();

            $fresh = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ?');
            $fresh->execute([$orderId, $storeId]);
            $row = $fresh->fetch() ?: [];
            // Auto WhatsApp: paid → payment+invoice; unpaid → pending reminder (customer + store admin)
            if (is_array($row) && $row) {
                souq_notify_order_whatsapp($pdo, $storeId, $row, 'created');
            }
            $custFresh = $pdo->prepare('SELECT * FROM customers WHERE id = ? AND store_id = ?');
            $custFresh->execute([$customer['id'], $storeId]);
            $custRow = $custFresh->fetch();
            http_response_code(201);
            echo json_encode([
                'data' => souq_order_row($pdo, $row),
                'customer' => $custRow ? souq_customer_row($custRow) : souq_customer_row($customer),
                'message' => 'Order created successfully.',
            ]);
            return true;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create order.']);
            return true;
        }
    }

    if (
        preg_match('#^/orders/([^/]+)$#', $uri, $mOrd)
        && $method === 'GET'
        && !in_array((string)$mOrd[1], ['invoice', 'fulfillment'], true)
    ) {
        $orderId = (string)$mOrd[1];
        $st = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$orderId, $storeId]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        echo json_encode(['data' => souq_order_row($pdo, $row, false)]);
        return true;
    }

    if (
        preg_match('#^/orders/([^/]+)$#', $uri, $mOrd)
        && $method === 'PATCH'
        && !in_array((string)$mOrd[1], ['invoice', 'fulfillment'], true)
    ) {
        $orderId = (string)$mOrd[1];
        if (function_exists('souq_ensure_order_notes_columns')) {
            souq_ensure_order_notes_columns($pdo);
        }
        $st = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$orderId, $storeId]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        $prevStatus = strtolower((string)($row['status'] ?? ''));
        $sets = [];
        $params = [];
        $map = [
            'customer_name' => 'customer_name',
            'customer_email' => 'customer_email',
            'customer_phone' => 'customer_phone',
            'delivery_location' => 'delivery_location',
            'shipping_status' => 'shipping_status',
            'tracking_number' => 'tracking_number',
            'courier_code' => 'courier_code',
            'payment_method' => 'payment_method',
            'payment_transaction_id' => 'payment_transaction_id',
            'delivery_mode' => 'delivery_mode',
            'driver_id' => 'driver_id',
            'bank_account_id' => 'bank_account_id',
            'payment_plan' => 'payment_plan',
            'cod_status' => 'cod_status',
            'cod_notes' => 'cod_notes',
            'refund_status' => 'refund_status',
            'return_reason' => 'return_reason',
            'return_notes' => 'return_notes',
            'customer_notes' => 'customer_notes',
            'internal_notes' => 'internal_notes',
            'archived_at' => 'archived_at',
            'estimated_delivery_at' => 'estimated_delivery_at',
        ];
        foreach ($map as $inKey => $col) {
            if (!array_key_exists($inKey, $input)) {
                continue;
            }
            if (!souq_table_has_column($pdo, 'orders', $col)) {
                continue;
            }
            $sets[] = "`{$col}` = ?";
            $params[] = $input[$inKey];
        }
        if (array_key_exists('status', $input)) {
            $sets[] = '`status` = ?';
            $params[] = souq_normalize_order_status($input['status']);
        }
        if (array_key_exists('payment_status', $input)) {
            $sets[] = '`payment_status` = ?';
            $params[] = souq_normalize_payment_status($input['payment_status']);
        }
        if (array_key_exists('amount_paid', $input) && souq_table_has_column($pdo, 'orders', 'amount_paid')) {
            $sets[] = '`amount_paid` = ?';
            $params[] = (float)$input['amount_paid'];
        }
        if (array_key_exists('remaining_balance', $input) && souq_table_has_column($pdo, 'orders', 'remaining_balance')) {
            $sets[] = '`remaining_balance` = ?';
            $params[] = (float)$input['remaining_balance'];
        }
        if (array_key_exists('refund_amount', $input) && souq_table_has_column($pdo, 'orders', 'refund_amount')) {
            $sets[] = '`refund_amount` = ?';
            $params[] = (float)$input['refund_amount'];
        }
        if (array_key_exists('is_archived', $input) && souq_table_has_column($pdo, 'orders', 'is_archived')) {
            $sets[] = '`is_archived` = ?';
            $params[] = !empty($input['is_archived']) ? 1 : 0;
        }
        if (souq_table_has_column($pdo, 'orders', 'updated_at')) {
            $sets[] = '`updated_at` = CURRENT_TIMESTAMP';
        }
        $newStatus = array_key_exists('status', $input)
            ? souq_normalize_order_status($input['status'])
            : $prevStatus;
        $shouldRestock = array_key_exists('restock', $input)
            ? !empty($input['restock'])
            : true;

        try {
            $pdo->beginTransaction();
            if ($sets) {
                $params[] = $orderId;
                $params[] = $storeId;
                $pdo->prepare('UPDATE orders SET ' . implode(', ', $sets) . ' WHERE id = ? AND store_id = ?')->execute($params);
            }
            if (
                $shouldRestock
                && in_array($newStatus, ['cancelled', 'canceled', 'returned', 'refunded'], true)
                && !in_array($prevStatus, ['cancelled', 'canceled', 'returned', 'refunded'], true)
            ) {
                $itemsSt = $pdo->prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ? AND store_id = ?');
                $itemsSt->execute([$orderId, $storeId]);
                while ($it = $itemsSt->fetch()) {
                    $pid = (string)($it['product_id'] ?? '');
                    if ($pid !== '') {
                        souq_product_stock_restock($pdo, $storeId, $pid, max(1, (int)$it['quantity']));
                    }
                }
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update order.']);
            return true;
        }

        $fresh = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1');
        $fresh->execute([$orderId, $storeId]);
        $freshRow = $fresh->fetch() ?: $row;
        $payChanged = array_key_exists('payment_status', $input)
            && strtolower((string)($input['payment_status'] ?? '')) !== strtolower((string)($row['payment_status'] ?? ''));
        $completedNow = array_key_exists('status', $input)
            && in_array(souq_normalize_order_status($input['status']), ['completed', 'delivered'], true)
            && !in_array(strtolower((string)($row['status'] ?? '')), ['completed', 'delivered'], true);
        if (is_array($freshRow) && ($payChanged || $completedNow)) {
            souq_notify_order_whatsapp($pdo, $storeId, $freshRow, 'updated');
        }
        echo json_encode(['data' => souq_order_row($pdo, $freshRow)]);
        return true;
    }

    if (preg_match('#^/orders/([^/]+)$#', $uri, $mOrd) && $method === 'DELETE') {
        $orderId = (string)$mOrd[1];
        $st = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$orderId, $storeId]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        $restock = !isset($_GET['restock']) || $_GET['restock'] !== '0';
        try {
            $pdo->beginTransaction();
            if ($restock) {
                $itemsSt = $pdo->prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ? AND store_id = ?');
                $itemsSt->execute([$orderId, $storeId]);
                while ($it = $itemsSt->fetch()) {
                    $pid = (string)($it['product_id'] ?? '');
                    if ($pid !== '') {
                        souq_product_stock_restock($pdo, $storeId, $pid, max(1, (int)$it['quantity']));
                    }
                }
            }
            $pdo->prepare('DELETE FROM order_items WHERE order_id = ? AND store_id = ?')->execute([$orderId, $storeId]);
            $pdo->prepare('DELETE FROM orders WHERE id = ? AND store_id = ?')->execute([$orderId, $storeId]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete order.']);
            return true;
        }
        echo json_encode(['ok' => true, 'message' => 'Order deleted.']);
        return true;
    }

    if ($uri === '/customers' && $method === 'GET') {
        souq_ensure_customer_profile_columns($pdo);
        $st = $pdo->prepare('SELECT * FROM customers WHERE store_id = ? ORDER BY created_at DESC');
        $st->execute([$storeId]);
        $rows = [];
        while ($row = $st->fetch()) {
            $rows[] = souq_customer_row($row);
        }
        echo json_encode(['data' => $rows]);
        return true;
    }

    if ($uri === '/customers' && $method === 'POST') {
        souq_ensure_customer_profile_columns($pdo);
        $name = trim((string)($input['name'] ?? ''));
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $phone = trim((string)($input['phone'] ?? ''));
        if ($name === '' || $email === '' || $phone === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Name, email, and phone are required.']);
            return true;
        }
        $id = trim((string)($input['id'] ?? ''));
        if ($id === '') {
            $id = 'cust-' . bin2hex(random_bytes(8));
        }
        $now = date('Y-m-d H:i:s');
        $city = trim((string)($input['city'] ?? 'Makkah'));
        $country = trim((string)($input['country'] ?? 'Saudi Arabia'));
        $gender = trim((string)($input['gender'] ?? ''));
        $dobRaw = trim((string)($input['dob'] ?? ''));
        $dob = preg_match('/^\d{4}-\d{2}-\d{2}/', $dobRaw) ? substr($dobRaw, 0, 10) : null;
        $group = trim((string)($input['group'] ?? 'Regular')) ?: 'Regular';
        $status = trim((string)($input['status'] ?? 'New')) ?: 'New';
        $source = trim((string)($input['acquisition_source'] ?? $input['source'] ?? 'Direct')) ?: 'Direct';
        $cols = ['id', 'store_id', 'name', 'email', 'phone', 'city', 'country', 'acquisition_source', '`group`', 'status', 'total_orders', 'total_spend', 'avg_order_value', 'created_at', 'points'];
        $vals = [$id, $storeId, $name, $email, $phone, $city, $country, $source, $group, $status, 0, 0, 0, $now, 0];
        if (souq_table_has_column($pdo, 'customers', 'gender')) {
            $cols[] = 'gender';
            $vals[] = $gender !== '' ? $gender : null;
        }
        if (souq_table_has_column($pdo, 'customers', 'dob')) {
            $cols[] = 'dob';
            $vals[] = $dob;
        }
        if (souq_table_has_column($pdo, 'customers', 'updated_at')) {
            $cols[] = 'updated_at';
            $vals[] = $now;
        }
        $placeholders = implode(', ', array_fill(0, count($cols), '?'));
        try {
            $pdo->prepare('INSERT INTO customers (' . implode(', ', $cols) . ') VALUES (' . $placeholders . ')')->execute($vals);
        } catch (Throwable $e) {
            http_response_code(422);
            echo json_encode(['message' => 'Failed to create customer.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM customers WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$id, $storeId]);
        $row = $st->fetch() ?: [];
        echo json_encode(['data' => souq_customer_row($row)]);
        return true;
    }

    if (preg_match('#^/customers/([^/]+)$#', $uri, $cm) && in_array($method, ['PATCH', 'PUT'], true)) {
        souq_ensure_customer_profile_columns($pdo);
        $custId = $cm[1];
        $st = $pdo->prepare('SELECT * FROM customers WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$custId, $storeId]);
        $existing = $st->fetch();
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['message' => 'Customer not found.']);
            return true;
        }
        $sets = [];
        $vals = [];
        $map = [
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'city' => 'city',
            'country' => 'country',
            'group' => '`group`',
            'status' => 'status',
            'acquisition_source' => 'acquisition_source',
        ];
        foreach ($map as $inKey => $col) {
            if (array_key_exists($inKey, $input)) {
                $sets[] = $col . ' = ?';
                $vals[] = $inKey === 'email'
                    ? strtolower(trim((string)$input[$inKey]))
                    : trim((string)$input[$inKey]);
            }
        }
        if (array_key_exists('source', $input) && !array_key_exists('acquisition_source', $input)) {
            $sets[] = 'acquisition_source = ?';
            $vals[] = trim((string)$input['source']);
        }
        if (array_key_exists('gender', $input) && souq_table_has_column($pdo, 'customers', 'gender')) {
            $g = trim((string)($input['gender'] ?? ''));
            $sets[] = 'gender = ?';
            $vals[] = $g !== '' ? $g : null;
        }
        if (array_key_exists('dob', $input) && souq_table_has_column($pdo, 'customers', 'dob')) {
            $dobRaw = trim((string)($input['dob'] ?? ''));
            $sets[] = 'dob = ?';
            $vals[] = preg_match('/^\d{4}-\d{2}-\d{2}/', $dobRaw) ? substr($dobRaw, 0, 10) : null;
        }
        foreach (['total_orders' => 'total_orders', 'total_spend' => 'total_spend', 'avg_order_value' => 'avg_order_value'] as $inKey => $col) {
            if (array_key_exists($inKey, $input)) {
                $sets[] = $col . ' = ?';
                $vals[] = $inKey === 'total_orders' ? (int)$input[$inKey] : (float)$input[$inKey];
            }
        }
        if (array_key_exists('last_order_date', $input)) {
            $sets[] = 'last_order_date = ?';
            $vals[] = $input['last_order_date'] !== null && $input['last_order_date'] !== ''
                ? (string)$input['last_order_date']
                : null;
        }
        if ($sets === []) {
            echo json_encode(['data' => souq_customer_row($existing)]);
            return true;
        }
        if (souq_table_has_column($pdo, 'customers', 'updated_at')) {
            $sets[] = 'updated_at = ?';
            $vals[] = date('Y-m-d H:i:s');
        }
        $vals[] = $custId;
        $vals[] = $storeId;
        try {
            $pdo->prepare('UPDATE customers SET ' . implode(', ', $sets) . ' WHERE id = ? AND store_id = ?')->execute($vals);
        } catch (Throwable) {
            http_response_code(422);
            echo json_encode(['message' => 'Failed to update customer.']);
            return true;
        }
        $st2 = $pdo->prepare('SELECT * FROM customers WHERE id = ? AND store_id = ? LIMIT 1');
        $st2->execute([$custId, $storeId]);
        $fresh = $st2->fetch() ?: $existing;
        echo json_encode(['data' => souq_customer_row($fresh)]);
        return true;
    }

    if ($uri === '/coupons' && $method === 'GET') {
        $st = $pdo->prepare('SELECT * FROM coupons WHERE store_id = ? ORDER BY code ASC');
        $st->execute([$storeId]);
        echo json_encode(['data' => $st->fetchAll()]);
        return true;
    }

    if ($uri === '/coupons' && $method === 'POST') {
        $code = strtoupper(trim((string)($input['code'] ?? '')));
        if ($code === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Coupon code is required.']);
            return true;
        }
        $id = 'cpn-' . bin2hex(random_bytes(6));
        $pdo->prepare('INSERT INTO coupons (id, store_id, code, discount_type, discount_value, min_order_amount, max_uses, usage_count, status, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1, ?)')
            ->execute([
                $id, $storeId, $code,
                ($input['discount_type'] ?? 'percentage') === 'fixed' ? 'fixed' : 'percentage',
                (float)($input['discount_value'] ?? 0),
                (float)($input['min_order_amount'] ?? 0),
                isset($input['max_uses']) ? (int)$input['max_uses'] : null,
                (string)($input['status'] ?? 'active'),
                $input['expires_at'] ?? null,
            ]);
        $st = $pdo->prepare('SELECT * FROM coupons WHERE id = ? AND store_id = ?');
        $st->execute([$id, $storeId]);
        echo json_encode(['data' => $st->fetch()]);
        return true;
    }

    if ($uri === '/seo' && $method === 'GET') {
        $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$storeId]);
        $row = $st->fetch();
        $data = $row ? souq_store_data($pdo, $storeId) : [];
        $seo = is_array($data['seo'] ?? null) ? $data['seo'] : [];
        $host = souq_request_host();
        $publicHost = souq_host_store($host) === $storeId ? $host : '';
        if ($publicHost === '' && $row && !empty($row['domain'])) {
            $publicHost = strtolower((string)preg_replace('#^https?://#', '', (string)$row['domain']));
            $publicHost = explode('/', $publicHost)[0];
        }
        $ga = strtoupper(trim((string)($seo['ga4MeasurementId'] ?? $data['ga4MeasurementId'] ?? $data['ga4_measurement_id'] ?? '')));
        $gaOk = (bool)preg_match('/^G-[A-Z0-9]+$/', $ga);
        $gInt = is_array($data['google_integration'] ?? null) ? $data['google_integration'] : [];
        // Real OAuth connect only — never mark Connected from a typed Measurement ID alone
        $googleConnected = !empty($gInt['is_connected']) && !empty($gInt['google_account_email']);
        $gaOut = '';
        if ($gaOk) {
            $gaOut = $ga;
        } elseif (!empty($gInt['ga4_measurement_id']) && preg_match('/^G-[A-Z0-9]+$/i', (string)$gInt['ga4_measurement_id'])) {
            $gaOut = strtoupper((string)$gInt['ga4_measurement_id']);
        }
        echo json_encode(['data' => [
            'store_id' => $storeId,
            'google_connected' => $googleConnected,
            'google_account_email' => $googleConnected ? (string)($gInt['google_account_email'] ?? '') : '',
            'ga4_measurement_id' => $gaOut,
            'meta_title' => (string)($seo['metaTitle'] ?? $data['metaTitle'] ?? $data['meta_title'] ?? ''),
            'meta_description' => (string)($seo['metaDescription'] ?? $data['metaDescription'] ?? $data['meta_description'] ?? ''),
            'keywords' => $seo['keywords'] ?? $data['keywords'] ?? [],
            'sitemap_url' => $publicHost !== '' ? 'https://' . $publicHost . '/sitemap.xml' : '',
            // No Google Search Console connection → null / empty (never invent clicks)
            'indexed_urls_count' => null,
            'total_search_clicks' => null,
            'total_search_impressions' => null,
            'avg_ctr' => null,
            'avg_position' => null,
            'top_queries' => [],
            'extra' => new stdClass(),
        ]]);
        return true;
    }

    if ($uri === '/store/live-domain' && $method === 'POST') {
        $host = souq_request_host();
        if (souq_host_store($host) !== $storeId) {
            http_response_code(403);
            echo json_encode(['message' => 'This host does not belong to this store.']);
            return true;
        }
        $pdo->prepare('UPDATE stores SET domain = ? WHERE id = ?')->execute([$host, $storeId]);
        echo json_encode(['store_id' => $storeId, 'domain' => $host]);
        return true;
    }

    // ── Loyalty Program (path-style + flat) — matches StoreLoyaltyProgram / tenantApi ──
    $loyaltyPath = souq_loyalty_uri($uri);
    if ($loyaltyPath !== null) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }

        // GET /loyalty/overview  OR  /stores/{id}/loyalty/overview
        if ($loyaltyPath === '/loyalty/overview' && $method === 'GET') {
            $pack = souq_loyalty_program($pdo, $storeId);
            $loyalty = $pack['loyalty'];
            // Persist merged defaults once so toggles have stable ids
            if (($pack['store_data']['loyalty']['earn_rules'] ?? null) !== $loyalty['earn_rules']) {
                souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);
            }

            $custCount = 0;
            $pointsIssued = 0;
            try {
                $sum = $pdo->prepare('SELECT COUNT(*) c, COALESCE(SUM(points), 0) points FROM customers WHERE store_id = ?');
                $sum->execute([$storeId]);
                $row = $sum->fetch() ?: ['c' => 0, 'points' => 0];
                $custCount = (int)$row['c'];
                $pointsIssued = (int)$row['points'];
            } catch (Throwable $e) {
                $custCount = 0;
                $pointsIssued = 0;
            }

            $redemptions = is_array($loyalty['redemptions'] ?? null) ? $loyalty['redemptions'] : [];
            $pointsRedeemed = 0;
            foreach ($redemptions as $red) {
                $pointsRedeemed += (int)($red['points'] ?? 0);
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'summary' => [
                        'contributionToSales' => '0%',
                        'ordersFromPoints' => 0,
                        'totalRedeemed' => $pointsRedeemed,
                        'pointsIssued' => $pointsIssued,
                        'registeredCustomers' => $custCount,
                        'salesGrowth' => '—',
                        'ordersGrowth' => '—',
                        'redeemedGrowth' => '—',
                        'pointsGrowth' => '—',
                        'customersStatus' => $custCount > 0 ? 'Active' : 'Inactive',
                    ],
                    'earn_rules' => $loyalty['earn_rules'],
                    'rewards' => $loyalty['rewards'],
                    'redemptions' => $redemptions,
                    'activities' => $loyalty['activities'],
                    'performance_series' => [],
                    'usage_by_type' => [],
                    'settings' => $loyalty['settings'],
                    'game_settings' => $loyalty['game_settings'],
                ],
                'store_id' => $storeId,
            ]);
            return true;
        }

        // PATCH|PUT|POST /loyalty/earn-rules/{id} (POST/PUT aliases — some hosts block PATCH)
        if (
            preg_match('#^/loyalty/earn-rules/([^/]+)$#', $loyaltyPath, $mRule)
            && in_array($method, ['PATCH', 'PUT', 'POST'], true)
        ) {
            $ruleId = rawurldecode((string)$mRule[1]);
            $pack = souq_loyalty_program($pdo, $storeId);
            $loyalty = $pack['loyalty'];
            $rules = souq_merge_earn_rules(
                is_array($loyalty['earn_rules'] ?? null) ? $loyalty['earn_rules'] : []
            );

            $found = false;
            foreach ($rules as &$rule) {
                if (($rule['id'] ?? '') !== $ruleId) {
                    continue;
                }
                if (array_key_exists('active', $input)) {
                    $rule['active'] = filter_var($input['active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($rule['active'] === null) {
                        $rule['active'] = (bool)$input['active'];
                    }
                }
                if (array_key_exists('points', $input)) {
                    $rule['points'] = (int)$input['points'];
                }
                if (isset($input['config']) && is_array($input['config'])) {
                    $rule['config'] = array_merge(
                        is_array($rule['config'] ?? null) ? $rule['config'] : [],
                        $input['config']
                    );
                    if (isset($input['config']['points'])) {
                        $rule['points'] = (int)$input['config']['points'];
                    }
                    if (isset($input['config']['bonus_points'])) {
                        $rule['points'] = (int)$input['config']['bonus_points'];
                    }
                    if (isset($input['config']['points_per_sar'])) {
                        $rule['points'] = (int)$input['config']['points_per_sar'];
                    }
                }
                $found = true;
                break;
            }
            unset($rule);

            if (!$found) {
                http_response_code(404);
                echo json_encode(['message' => 'Earn rule not found.', 'store_id' => $storeId]);
                return true;
            }

            $loyalty['earn_rules'] = $rules;
            $activities = is_array($loyalty['activities'] ?? null) ? $loyalty['activities'] : [];
            array_unshift($activities, [
                'id' => 'act-' . bin2hex(random_bytes(4)),
                'label' => 'Earn rule updated: ' . $ruleId,
                'time' => date('h:i A'),
                'status' => 'Active',
            ]);
            $loyalty['activities'] = array_slice($activities, 0, 20);
            souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);

            echo json_encode([
                'success' => true,
                'data' => $rules,
                'message' => 'Earn rule updated successfully.',
                'store_id' => $storeId,
            ]);
            return true;
        }

        // POST /loyalty/rewards
        if ($loyaltyPath === '/loyalty/rewards' && $method === 'POST') {
            $name = trim((string)($input['name'] ?? ''));
            $points = (int)($input['points'] ?? 0);
            if ($name === '' || $points < 1) {
                http_response_code(422);
                echo json_encode(['message' => 'Reward name and points (>=1) are required.']);
                return true;
            }
            $pack = souq_loyalty_program($pdo, $storeId);
            $loyalty = $pack['loyalty'];
            $rewards = is_array($loyalty['rewards'] ?? null) ? $loyalty['rewards'] : [];
            $newReward = [
                'id' => 'rew-' . bin2hex(random_bytes(5)),
                'store_id' => $storeId,
                'nameEn' => $name,
                'nameAr' => $name,
                'points' => $points,
                'rewardType' => (string)($input['rewardType'] ?? 'discount'),
                'status' => 'active',
                'createdAt' => date('c'),
            ];
            array_unshift($rewards, $newReward);
            $loyalty['rewards'] = $rewards;
            souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);
            echo json_encode([
                'success' => true,
                'data' => $newReward,
                'message' => 'Reward created successfully.',
                'store_id' => $storeId,
            ]);
            return true;
        }

        // DELETE /loyalty/rewards/{id}
        if (preg_match('#^/loyalty/rewards/([^/]+)$#', $loyaltyPath, $mRew) && $method === 'DELETE') {
            $rewId = rawurldecode((string)$mRew[1]);
            $pack = souq_loyalty_program($pdo, $storeId);
            $loyalty = $pack['loyalty'];
            $rewards = is_array($loyalty['rewards'] ?? null) ? $loyalty['rewards'] : [];
            $loyalty['rewards'] = array_values(array_filter(
                $rewards,
                static fn($r) => is_array($r) && (($r['id'] ?? '') !== $rewId)
            ));
            souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);
            echo json_encode([
                'success' => true,
                'message' => 'Reward deleted successfully.',
                'store_id' => $storeId,
            ]);
            return true;
        }

        // PUT /loyalty/settings
        if ($loyaltyPath === '/loyalty/settings' && $method === 'PUT') {
            $pack = souq_loyalty_program($pdo, $storeId);
            $loyalty = $pack['loyalty'];

            // Legacy flat rate update (keep working for older callers)
            if (array_key_exists('points_per_sar', $input) && !isset($input['enableLoyalty']) && !isset($input['game_settings'])) {
                $rate = (float)$input['points_per_sar'];
                if ($rate < 0 || $rate > 20) {
                    http_response_code(422);
                    echo json_encode(['message' => 'Points per SAR must be between 0 and 20.']);
                    return true;
                }
                $rules = souq_merge_earn_rules(
                    is_array($loyalty['earn_rules'] ?? null) ? $loyalty['earn_rules'] : []
                );
                foreach ($rules as &$rule) {
                    if (($rule['method'] ?? '') === 'order_completed') {
                        $rule['points'] = (int)$rate;
                        $rule['active'] = $rate > 0;
                        $rule['config'] = array_merge(
                            is_array($rule['config'] ?? null) ? $rule['config'] : [],
                            ['points_per_sar' => $rate]
                        );
                        break;
                    }
                }
                unset($rule);
                $loyalty['earn_rules'] = $rules;
                souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);

                $credited = 0;
                if (!empty($input['apply_to_existing'])) {
                    $rows = $pdo->prepare('SELECT id, total_spend FROM customers WHERE store_id = ?');
                    $rows->execute([$storeId]);
                    $upd = $pdo->prepare('UPDATE customers SET points = ? WHERE id = ? AND store_id = ?');
                    while ($cust = $rows->fetch()) {
                        $pts = (int)floor(((float)$cust['total_spend']) * $rate);
                        $upd->execute([$pts, $cust['id'], $storeId]);
                        $credited++;
                    }
                }
                echo json_encode([
                    'success' => true,
                    'store_id' => $storeId,
                    'points_per_sar' => $rate,
                    'customers_updated' => $credited,
                    'data' => [
                        'settings' => $loyalty['settings'],
                        'game_settings' => $loyalty['game_settings'],
                    ],
                ]);
                return true;
            }

            $settings = is_array($loyalty['settings'] ?? null) ? $loyalty['settings'] : [];
            foreach (['enableLoyalty', 'appNotifications', 'emailNotifications', 'pointsExpiration'] as $key) {
                if (array_key_exists($key, $input)) {
                    $val = filter_var($input[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    $settings[$key] = $val === null ? (bool)$input[$key] : $val;
                }
            }
            $loyalty['settings'] = $settings;

            if (isset($input['game_settings']) && is_array($input['game_settings'])) {
                $loyalty['game_settings'] = array_merge(
                    souq_default_loyalty_game_settings(),
                    is_array($loyalty['game_settings'] ?? null) ? $loyalty['game_settings'] : [],
                    $input['game_settings']
                );
            }

            souq_loyalty_save($pdo, $storeId, $pack['store_data'], $loyalty);
            echo json_encode([
                'success' => true,
                'data' => [
                    'settings' => $loyalty['settings'],
                    'game_settings' => $loyalty['game_settings'],
                ],
                'message' => 'Loyalty program settings updated.',
                'store_id' => $storeId,
            ]);
            return true;
        }

        // Unknown loyalty subpath under matched prefix → 404 with clear message
        if (str_starts_with($loyaltyPath, '/loyalty')) {
            http_response_code(404);
            echo json_encode(['message' => 'Loyalty endpoint not found: ' . $loyaltyPath, 'store_id' => $storeId]);
            return true;
        }
    }

    if ($uri === '/gift-cards' && $method === 'GET') {
        $st = $pdo->prepare('SELECT id, store_id, code, balance, currency, status, customer_email FROM gift_cards WHERE store_id = ? ORDER BY code ASC');
        $st->execute([$storeId]);
        echo json_encode(['data' => $st->fetchAll()]);
        return true;
    }

    if ($uri === '/gift-cards' && $method === 'POST') {
        $code = strtoupper(trim((string)($input['code'] ?? '')));
        $balance = (float)($input['balance'] ?? 0);
        if ($code === '' || $balance <= 0) {
            http_response_code(422);
            echo json_encode(['message' => 'Gift card code and a balance above zero are required.']);
            return true;
        }
        $id = 'gc-' . bin2hex(random_bytes(6));
        $pdo->prepare('INSERT INTO gift_cards (id, store_id, code, balance, currency, status, customer_email) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([$id, $storeId, $code, $balance, 'SAR', 'active', strtolower(trim((string)($input['customer_email'] ?? '')))]);
        echo json_encode(['data' => [
            'id' => $id,
            'store_id' => $storeId,
            'code' => $code,
            'balance' => $balance,
            'currency' => 'SAR',
            'status' => 'active',
        ]]);
        return true;
    }

    if ($uri === '/orders/invoice' && $method === 'GET') {
        $number = strtoupper(trim((string)($_GET['order_number'] ?? '')));
        $st = $pdo->prepare('SELECT * FROM orders WHERE store_id = ?');
        $st->execute([$storeId]);
        $digits = ltrim(preg_replace('/\D+/', '', $number) ?? '', '0');
        $found = null;
        while ($row = $st->fetch()) {
            $rowDigits = ltrim(preg_replace('/\D+/', '', (string)$row['order_number']) ?? '', '0');
            if ($rowDigits !== '' && $rowDigits === $digits) {
                $found = $row;
                break;
            }
        }
        if (!$found) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        $order = souq_order_row($pdo, $found);
        $itemsTotal = 0.0;
        foreach ($order['items'] as $item) {
            $itemsTotal += (float)$item['subtotal'];
        }
        echo json_encode(['data' => [
            'invoice_number' => $order['order_number'],
            'store_id' => $storeId,
            'customer_name' => $order['customer_name'],
            'customer_email' => $order['customer_email'],
            'customer_phone' => $order['customer_phone'],
            'items' => $order['items'],
            'items_total' => round($itemsTotal, 2),
            'coupon_code' => $order['coupon_code'],
            'charged_total' => $order['total_amount'],
            'currency' => $order['currency'],
            'payment_method' => $order['payment_method'],
            'payment_status' => $order['payment_status'],
            'shipping_status' => $order['shipping_status'],
            'order_status' => $order['status'],
            'delivery_location' => $order['delivery_location'],
        ]]);
        return true;
    }

    if ($uri === '/orders/fulfillment' && $method === 'PATCH') {
        $number = strtoupper(trim((string)($input['order_number'] ?? '')));
        $shipping = strtolower(trim((string)($input['shipping_status'] ?? '')));
        $allowed = ['pending', 'preparing', 'ready'];
        if ($number === '' || !in_array($shipping, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Order number and a pending, preparing, or ready shipping status are required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM orders WHERE store_id = ?');
        $st->execute([$storeId]);
        $digits = ltrim(preg_replace('/\D+/', '', $number) ?? '', '0');
        $found = null;
        while ($row = $st->fetch()) {
            $rowDigits = ltrim(preg_replace('/\D+/', '', (string)$row['order_number']) ?? '', '0');
            if ($rowDigits !== '' && $rowDigits === $digits) {
                $found = $row;
                break;
            }
        }
        if (!$found) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found.']);
            return true;
        }
        $pdo->prepare('UPDATE orders SET shipping_status = ? WHERE id = ? AND store_id = ?')->execute([$shipping, $found['id'], $storeId]);
        $found['shipping_status'] = $shipping;
        echo json_encode(['data' => souq_order_row($pdo, $found)]);
        return true;
    }

    if ($uri === '/whatsapp/status' && $method === 'GET') {
        $data = souq_store_data($pdo, $storeId);
        $wa = is_array($data['whatsapp'] ?? null) ? $data['whatsapp'] : [];
        $phoneId = trim((string)($wa['phone_number_id'] ?? $data['whatsapp_phone_number_id'] ?? ''));
        $token = trim((string)($wa['access_token'] ?? $data['whatsapp_access_token'] ?? ''));
        echo json_encode([
            'store_id' => $storeId,
            'connected' => $phoneId !== '' && $token !== '',
            'phone_number_id' => $phoneId !== '' ? $phoneId : null,
        ]);
        return true;
    }

    if ($uri === '/reports/overview' && $method === 'GET') {
        $orders = $pdo->prepare('SELECT COUNT(*) c, COALESCE(SUM(total_amount), 0) revenue FROM orders WHERE store_id = ?');
        $orders->execute([$storeId]);
        $o = $orders->fetch() ?: ['c' => 0, 'revenue' => 0];
        $bySource = $pdo->prepare('SELECT source, COUNT(*) c, COALESCE(SUM(total_amount), 0) revenue FROM orders WHERE store_id = ? GROUP BY source');
        $bySource->execute([$storeId]);
        $events = $pdo->prepare('SELECT event_name, COUNT(*) c FROM analytics_events WHERE store_id = ? GROUP BY event_name');
        $events->execute([$storeId]);
        echo json_encode([
            'store_id' => $storeId,
            'orders' => (int)$o['c'],
            'revenue' => (float)$o['revenue'],
            'by_source' => $bySource->fetchAll(),
            'events' => $events->fetchAll(),
        ]);
        return true;
    }

    // ── Payment gateways (zero-mock: only connected rows; free COD/bank auto) ──
    if ($uri === '/payment-gateways' && $method === 'GET') {
        souq_ensure_payment_defaults($pdo, $storeId);
        $st = $pdo->prepare('SELECT id, store_id, provider, title, title_ar, is_enabled, is_sandbox, public_key, status, supported_methods, last_tested_at FROM payment_gateways WHERE store_id = ?');
        $st->execute([$storeId]);
        $rows = [];
        while ($g = $st->fetch(PDO::FETCH_ASSOC)) {
            $g['is_enabled'] = (bool)(int)$g['is_enabled'];
            $g['is_sandbox'] = (bool)(int)$g['is_sandbox'];
            $methodsList = json_decode((string)($g['supported_methods'] ?? '[]'), true) ?: [];
            $g['supported_methods'] = $methodsList;
            $g['show_product_logo'] = in_array('show_product_logo', $methodsList, true);
            $g['masked_secret_key'] = '';
            $rows[] = $g;
        }
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);
        return true;
    }

    if ($uri === '/payment-gateways' && $method === 'POST') {
        souq_ensure_payment_defaults($pdo, $storeId);
        $provider = strtolower(trim((string)($input['provider'] ?? '')));
        $title = trim((string)($input['title'] ?? $provider));
        $titleAr = trim((string)($input['title_ar'] ?? ''));
        $allowed = ['moyasar', 'tap', 'hyperpay', 'stripe', 'paypal', 'tabby', 'tamara', 'stcpay', 'cod', 'bank_transfer'];
        if ($storeId === '' || $provider === '' || !in_array($provider, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'provider and store_id are required.']);
            return true;
        }
        $apiKey = trim((string)($input['api_key'] ?? ''));
        $secretKey = trim((string)($input['secret_key'] ?? ''));
        $publicKey = trim((string)($input['public_key'] ?? ''));
        if ($provider === 'tamara' && $secretKey === '' && $apiKey !== '') {
            $secretKey = $apiKey;
        }
        $isEnabled = array_key_exists('is_enabled', $input) ? (int)!empty($input['is_enabled']) : 1;
        $isSandbox = array_key_exists('is_sandbox', $input) ? (int)!empty($input['is_sandbox']) : 0;
        $methods = $input['supported_methods'] ?? [];
        if (!is_array($methods)) $methods = [];
        $methods = array_values(array_unique(array_map('strval', $methods)));
        if ($provider === 'tamara' && !in_array('tamara', $methods, true)) {
            $methods[] = 'tamara';
        }
        if (array_key_exists('show_product_logo', $input)) {
            $methods = array_values(array_filter($methods, static fn($m) => $m !== 'show_product_logo'));
            if (!empty($input['show_product_logo'])) {
                $methods[] = 'show_product_logo';
            }
        }
        $feePct = isset($input['transaction_fee_percent']) ? (float)$input['transaction_fee_percent'] : 0;
        $feeFixed = isset($input['transaction_fee_fixed']) ? (float)$input['transaction_fee_fixed'] : 0;

        $keyless = in_array($provider, ['cod', 'bank_transfer'], true);
        if ($provider === 'tamara' && ($secretKey === '' || $publicKey === '')) {
            http_response_code(422);
            echo json_encode(['message' => 'Tamara merchant key and public key are required before this gateway can connect.']);
            return true;
        }
        if (!$keyless && $secretKey === '' && $apiKey === '') {
            http_response_code(422);
            echo json_encode(['message' => 'API secret key is required before this gateway can connect.']);
            return true;
        }

        $status = $keyless ? 'connected' : ((strlen($secretKey ?: $apiKey) >= 16) ? 'connected' : 'error');
        $now = date('c');
        $st = $pdo->prepare('SELECT id FROM payment_gateways WHERE store_id = ? AND provider = ? LIMIT 1');
        $st->execute([$storeId, $provider]);
        $existing = $st->fetch(PDO::FETCH_ASSOC);
        if ($existing) {
            $id = $existing['id'];
            $upd = $pdo->prepare('UPDATE payment_gateways SET title = ?, title_ar = ?, is_enabled = ?, is_sandbox = ?, api_key = COALESCE(NULLIF(?, ""), api_key), secret_key = COALESCE(NULLIF(?, ""), secret_key), public_key = COALESCE(NULLIF(?, ""), public_key), supported_methods = ?, transaction_fee_percent = ?, transaction_fee_fixed = ?, status = ?, last_tested_at = ?, updated_at = ? WHERE id = ? AND store_id = ?');
            $upd->execute([
                $title, $titleAr !== '' ? $titleAr : null, $isEnabled, $isSandbox,
                $apiKey, $secretKey, $publicKey, json_encode($methods, JSON_UNESCAPED_UNICODE),
                $feePct, $feeFixed, $status, $now, $now, $id, $storeId,
            ]);
        } else {
            $id = souq_new_id('gw');
            $ins = $pdo->prepare('INSERT INTO payment_gateways (id, store_id, provider, title, title_ar, is_enabled, is_sandbox, api_key, secret_key, public_key, supported_methods, transaction_fee_percent, transaction_fee_fixed, status, last_tested_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $ins->execute([
                $id, $storeId, $provider, $title, $titleAr !== '' ? $titleAr : null,
                $isEnabled, $isSandbox, $apiKey !== '' ? $apiKey : null, $secretKey !== '' ? $secretKey : null,
                $publicKey !== '' ? $publicKey : null, json_encode($methods, JSON_UNESCAPED_UNICODE),
                $feePct, $feeFixed, $status, $now, $now, $now,
            ]);
        }

        $code = $status === 'connected' ? 200 : 422;
        http_response_code($code);
        echo json_encode([
            'data' => [
                'id' => $id,
                'store_id' => $storeId,
                'provider' => $provider,
                'title' => $title,
                'title_ar' => $titleAr !== '' ? $titleAr : null,
                'is_enabled' => (bool)$isEnabled,
                'is_sandbox' => (bool)$isSandbox,
                'public_key' => $publicKey !== '' ? $publicKey : null,
                'supported_methods' => $methods,
                'show_product_logo' => in_array('show_product_logo', $methods, true),
                'status' => $status,
                'last_tested_at' => $now,
            ],
            'message' => $status === 'connected'
                ? 'Payment gateway connection saved securely.'
                : 'Credentials saved but connection test failed. Fix keys and test again.',
        ]);
        return true;
    }

    if ($uri === '/storefront/payments/methods' && $method === 'GET') {
        $sid = $storeId !== '' ? $storeId : trim((string)($_GET['store_id'] ?? ''));
        if ($sid === '') {
            http_response_code(400);
            echo json_encode(['data' => [], 'message' => 'X-Store-Id is required.']);
            return true;
        }
        souq_ensure_payment_defaults($pdo, $sid);
        $st = $pdo->prepare('SELECT provider, supported_methods FROM payment_gateways WHERE store_id = ? AND is_enabled = 1 AND status = ?');
        $st->execute([$sid, 'connected']);
        $connected = [];
        while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
            $methodsList = json_decode((string)($r['supported_methods'] ?? '[]'), true);
            if (!is_array($methodsList)) $methodsList = [];
            $connected[$r['provider']] = $methodsList;
        }
        $catalog = [
            ['id' => 'mada', 'provider' => 'moyasar', 'name_ar' => 'بطاقة مدى البنكية', 'name_en' => 'Mada Debit Card', 'type' => 'card', 'icon' => 'mada', 'is_instant' => true],
            ['id' => 'apple_pay', 'provider' => 'moyasar', 'name_ar' => 'آبل باي', 'name_en' => 'Apple Pay', 'type' => 'digital_wallet', 'icon' => 'apple_pay', 'is_instant' => true],
            ['id' => 'card', 'provider' => 'moyasar', 'name_ar' => 'فيزا / ماستركارد', 'name_en' => 'Credit / Debit Card', 'type' => 'card', 'icon' => 'card', 'is_instant' => true],
            ['id' => 'tabby', 'provider' => 'tabby', 'name_ar' => 'تابي', 'name_en' => 'Tabby', 'type' => 'bnpl', 'icon' => 'tabby', 'is_instant' => false, 'installments_count' => 4],
            ['id' => 'tamara', 'provider' => 'tamara', 'name_ar' => 'تمارا', 'name_en' => 'Tamara', 'type' => 'bnpl', 'icon' => 'tamara', 'is_instant' => false, 'installments_count' => 4],
            ['id' => 'cod', 'provider' => 'cod', 'name_ar' => 'الدفع نقداً عند الاستلام', 'name_en' => 'Cash on Delivery', 'type' => 'cod', 'icon' => 'cod', 'is_instant' => false],
            ['id' => 'bank_transfer', 'provider' => 'bank_transfer', 'name_ar' => 'تحويل بنكي', 'name_en' => 'Bank Transfer', 'type' => 'bank_transfer', 'icon' => 'bank_transfer', 'is_instant' => false],
        ];
        $bankAccount = souq_default_bank_account($pdo, $sid);
        $methods = [];
        foreach ($catalog as $row) {
            if (($row['id'] ?? '') === 'bank_transfer' && ! $bankAccount) {
                continue;
            }
            if (!isset($connected[$row['provider']])) {
                continue;
            }
            $row['is_enabled'] = true;
            if ($row['id'] === 'tamara') {
                $gwMethods = $connected[$row['provider']];
                $row['show_product_logo'] = in_array('tamara', $gwMethods, true)
                    ? in_array('show_product_logo', $gwMethods, true)
                    : true;
            }
            $methods[] = $row;
        }
        $payload = [
            'success' => true,
            'store_id' => $sid,
            'currency' => 'SAR',
            'methods' => $methods,
            'gateways_configured' => count($connected),
        ];
        if ($bankAccount) {
            $payload['bank_account'] = souq_format_public_bank_account($bankAccount);
        }
        echo json_encode($payload);
        return true;
    }

    if ($uri === '/storefront/payments/bank-account' && $method === 'GET') {
        $sid = $storeId !== '' ? $storeId : trim((string)($_GET['store_id'] ?? ''));
        if ($sid === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'X-Store-Id is required.']);
            return true;
        }
        $bankAccount = souq_default_bank_account($pdo, $sid);
        echo json_encode([
            'success' => true,
            'store_id' => $sid,
            'data' => $bankAccount ? souq_format_public_bank_account($bankAccount) : null,
        ]);
        return true;
    }

    if ($uri === '/storefront/payments/initiate' && $method === 'POST') {
        $sid = $storeId !== '' ? $storeId : trim((string)($input['store_id'] ?? ''));
        $payMethod = strtolower(trim((string)($input['payment_method'] ?? '')));
        $amount = (float)($input['amount'] ?? 0);
        if ($sid === '' || $payMethod === '' || $amount < 0.5) {
            http_response_code(422);
            echo json_encode(['success' => false, 'checkout_ready' => false, 'message' => 'store_id, payment_method, and amount are required.']);
            return true;
        }
        souq_ensure_payment_defaults($pdo, $sid);
        $provider = match ($payMethod) {
            'tabby' => 'tabby',
            'tamara' => 'tamara',
            'cod' => 'cod',
            'bank_transfer' => 'bank_transfer',
            default => 'moyasar',
        };
        $st = $pdo->prepare('SELECT * FROM payment_gateways WHERE store_id = ? AND provider = ? AND is_enabled = 1 AND status = ? LIMIT 1');
        $st->execute([$sid, $provider, 'connected']);
        $gw = $st->fetch(PDO::FETCH_ASSOC);
        if (!$gw) {
            http_response_code(422);
            echo json_encode(['success' => false, 'checkout_ready' => false, 'message' => 'Payment method is not connected for this store.']);
            return true;
        }
        if (!in_array($provider, ['cod', 'bank_transfer'], true) && empty($gw['secret_key']) && empty($gw['public_key'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'checkout_ready' => false, 'message' => 'Payment gateway keys are missing.']);
            return true;
        }
        if ($payMethod === 'bank_transfer') {
            $bank = souq_default_bank_account($pdo, $sid);
            if (! $bank) {
                http_response_code(422);
                echo json_encode(['success' => false, 'checkout_ready' => false, 'message' => 'No active bank account configured for this store.']);
                return true;
            }
        }
        $ref = strtoupper($provider) . '-' . strtoupper(bin2hex(random_bytes(5)));
        $out = [
            'success' => true,
            'store_id' => $sid,
            'order_id' => $input['order_id'] ?? null,
            'payment_method' => $payMethod,
            'provider' => $provider,
            'transaction_reference' => $ref,
            'publishable_key' => $gw['public_key'] ?? null,
            'amount' => $amount,
            'currency' => 'SAR',
            'checkout_ready' => true,
            'timestamp' => date('c'),
        ];
        if ($payMethod === 'bank_transfer') {
            $bank = souq_default_bank_account($pdo, $sid);
            if ($bank) {
                $out['bank_account'] = souq_format_public_bank_account($bank);
            }
        }
        echo json_encode($out);
        return true;
    }

    if ($uri === '/storefront/payments/verify' && $method === 'POST') {
        $sid = $storeId !== '' ? $storeId : trim((string)($input['store_id'] ?? ''));
        $provider = strtolower(trim((string)($input['gateway_provider'] ?? '')));
        $ref = trim((string)($input['transaction_reference'] ?? ''));
        $amount = (float)($input['amount'] ?? 0);
        $orderId = trim((string)($input['order_id'] ?? ''));
        if ($sid === '' || $provider === '' || $ref === '') {
            http_response_code(422);
            echo json_encode(['verified' => false, 'status' => 'failed', 'message' => 'Missing payment verify fields.']);
            return true;
        }
        souq_ensure_payment_defaults($pdo, $sid);
        $st = $pdo->prepare('SELECT id FROM payment_gateways WHERE store_id = ? AND provider = ? AND is_enabled = 1 AND status = ? LIMIT 1');
        $st->execute([$sid, $provider, 'connected']);
        if (!$st->fetch()) {
            http_response_code(422);
            echo json_encode(['verified' => false, 'status' => 'failed', 'message' => 'Payment gateway is not connected for this store.']);
            return true;
        }
        // COD / bank: pending until merchant confirms. Never mark verified=true without gateway paid.
        $status = in_array($provider, ['cod', 'bank_transfer'], true) ? 'pending' : 'failed';
        $verified = false;
        if ($orderId !== '' && $status === 'pending') {
            $pdo->prepare('UPDATE orders SET payment_status = ?, payment_method = ? WHERE id = ? AND store_id = ?')
                ->execute([$provider === 'cod' ? 'COD Pending' : 'Pending', $input['payment_method'] ?? $provider, $orderId, $sid]);
        }
        echo json_encode([
            'verified' => $verified,
            'status' => $status,
            'transaction_id' => null,
            'reference' => $ref,
            'order_id' => $orderId !== '' ? $orderId : null,
            'amount' => $amount,
            'currency' => 'SAR',
            'message' => $provider === 'cod'
                ? 'Cash on delivery selected.'
                : ($provider === 'bank_transfer' ? 'Awaiting bank confirmation.' : 'Online payment requires connected gateway keys.'),
        ]);
        return true;
    }

    // ── Shipping methods (free defaults, no fake courier) ──
    if ($uri === '/shipping-methods' && $method === 'GET') {
        souq_ensure_shipping_defaults($pdo, $storeId);
        $st = $pdo->prepare('SELECT * FROM shipping_methods WHERE store_id = ? ORDER BY sort_order, created_at');
        $st->execute([$storeId]);
        $rows = [];
        while ($m = $st->fetch(PDO::FETCH_ASSOC)) {
            $m['is_active'] = (bool)(int)$m['is_active'];
            $m['is_cod_allowed'] = (bool)(int)$m['is_cod_allowed'];
            $m['allow_online'] = (bool)(int)$m['allow_online'];
            $m['allow_bank_transfer'] = (bool)(int)$m['allow_bank_transfer'];
            $m['base_rate'] = (float)$m['base_rate'];
            $m['free_shipping_threshold'] = $m['free_shipping_threshold'] !== null ? (float)$m['free_shipping_threshold'] : null;
            $rows[] = $m;
        }
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);
        return true;
    }

    if ($uri === '/couriers' && $method === 'GET') {
        $st = $pdo->prepare('SELECT id, store_id, provider, account_name, status, is_connected, is_sandbox, created_at FROM courier_connections WHERE store_id = ?');
        $st->execute([$storeId]);
        $rows = [];
        while ($c = $st->fetch(PDO::FETCH_ASSOC)) {
            $c['is_connected'] = (bool)(int)$c['is_connected'];
            $c['is_sandbox'] = (bool)(int)$c['is_sandbox'];
            $rows[] = $c;
        }
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);
        return true;
    }

    // ── Domains (real store.domain only — never invent bindings) ──
    if ($uri === '/domains' && $method === 'GET') {
        $rows = [];
        $sidFilter = trim((string)($_GET['store_id'] ?? $_GET['storeId'] ?? $storeId));
        if ($sidFilter !== '') {
            $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
            $st->execute([$sidFilter]);
            $storeRows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } else {
            $storeRows = $pdo->query('SELECT * FROM stores')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        foreach ($storeRows as $row) {
            $sid = (string)($row['id'] ?? '');
            $data = function_exists('souq_store_payload')
                ? souq_store_payload($row)
                : (json_decode((string)($row['data'] ?? '{}'), true) ?: []);
            if (!is_array($data)) {
                $data = [];
            }
            $listed = is_array($data['domains'] ?? null) ? $data['domains'] : [];
            $added = false;
            foreach ($listed as $dom) {
                if (!is_array($dom)) {
                    continue;
                }
                $name = trim((string)($dom['domain_name'] ?? $dom['domain'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $rows[] = [
                    'id' => (string)($dom['id'] ?? ('dom-' . substr(md5($sid . '|' . $name), 0, 10))),
                    'store_id' => $sid,
                    'domain_name' => $name,
                    'ssl_status' => (string)($dom['ssl_status'] ?? 'pending'),
                    'dns_verified' => !empty($dom['dns_verified']),
                    'hosting_tier' => (string)($dom['hosting_tier'] ?? 'Hostinger Shared Business'),
                    'monthly_fee' => (float)($dom['monthly_fee'] ?? 0),
                    'payment_received' => !empty($dom['payment_received']),
                    'status' => (string)($dom['status'] ?? 'pending'),
                    'is_primary' => !empty($dom['is_primary']),
                    'nameservers' => is_array($dom['nameservers'] ?? null) ? $dom['nameservers'] : [],
                    'registered_date' => (string)($dom['registered_date'] ?? ''),
                    'deployment_status' => (string)($dom['deployment_status'] ?? 'pending'),
                ];
                $added = true;
            }
            $primary = trim((string)($row['domain'] ?? ''));
            if (!$added && $primary !== '') {
                $rows[] = [
                    'id' => 'dom-' . $sid,
                    'store_id' => $sid,
                    'domain_name' => $primary,
                    'ssl_status' => 'active',
                    'dns_verified' => true,
                    'hosting_tier' => 'Hostinger Shared Business',
                    'monthly_fee' => 0,
                    'payment_received' => true,
                    'status' => 'active',
                    'is_primary' => true,
                    'nameservers' => [],
                    'registered_date' => '',
                    'deployment_status' => 'live',
                ];
            }
        }
        echo json_encode(['data' => $rows, 'count' => count($rows)]);
        return true;
    }

    // ── Shipping zones (shipping_zones table first; store_data fallback) ──
    if ($uri === '/shipping' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $out = [];
        $hasZonesTable = false;
        try {
            $hasZonesTable = (bool) $pdo->query("SHOW TABLES LIKE 'shipping_zones'")->fetch(PDO::FETCH_NUM);
        } catch (Throwable) {
            $hasZonesTable = false;
        }
        if ($hasZonesTable) {
            $st = $pdo->prepare('SELECT * FROM shipping_zones WHERE store_id = ? ORDER BY name');
            $st->execute([$storeId]);
            while ($z = $st->fetch(PDO::FETCH_ASSOC)) {
                $cities = $z['city_names'] ?? null;
                if (is_string($cities)) {
                    $decoded = json_decode($cities, true);
                    $cities = is_array($decoded) ? $decoded : [];
                }
                if (!is_array($cities)) {
                    $cities = [];
                }
                $out[] = [
                    'id' => (string) $z['id'],
                    'store_id' => $storeId,
                    'name' => (string) ($z['name'] ?? ''),
                    'cityName' => (string) ($z['name'] ?? ''),
                    'region' => (string) ($z['region'] ?? ''),
                    'province' => (string) ($z['region'] ?? ''),
                    'rate' => (float) ($z['rate'] ?? 0),
                    'rate_per_kg' => (float) ($z['rate_per_kg'] ?? 0),
                    'ratePerKg' => (float) ($z['rate_per_kg'] ?? 0),
                    'min_weight_kg' => isset($z['min_weight_kg']) ? (float) $z['min_weight_kg'] : null,
                    'max_weight_kg' => isset($z['max_weight_kg']) ? (float) $z['max_weight_kg'] : null,
                    'free_above' => isset($z['free_above']) ? (float) $z['free_above'] : null,
                    'freeShippingAbove' => isset($z['free_above']) ? (float) $z['free_above'] : null,
                    'estimated_delivery' => (string) ($z['estimated_delivery'] ?? ''),
                    'estimatedDelivery' => (string) ($z['estimated_delivery'] ?? ''),
                    'courier_code' => $z['courier_code'] ?? null,
                    'cod_available' => (bool) (int) ($z['cod_available'] ?? 1),
                    'city_names' => $cities,
                    'status' => ((int) ($z['is_active'] ?? 1) === 1) ? 'active' : 'inactive',
                    'is_active' => (bool) (int) ($z['is_active'] ?? 1),
                ];
            }
        }
        if ($out === []) {
            $data = souq_store_data($pdo, $storeId);
            $zones = $data['shipping'] ?? $data['shipping_zones'] ?? [];
            if (!is_array($zones)) {
                $zones = [];
            }
            foreach ($zones as $z) {
                if (!is_array($z)) {
                    continue;
                }
                $out[] = array_merge($z, [
                    'id' => (string) ($z['id'] ?? ('ship-' . bin2hex(random_bytes(4)))),
                    'store_id' => $storeId,
                ]);
            }
        }
        echo json_encode(['data' => $out, 'store_id' => $storeId, 'meta' => ['total' => count($out)]]);
        return true;
    }

    // ── Notification delivery log (genuine empty when none) ──
    if ($uri === '/notifications/deliveries' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $items = [];
        $data = souq_store_data($pdo, $storeId);
        $stored = $data['notification_deliveries'] ?? [];
        if (is_array($stored)) {
            foreach ($stored as $row) {
                if (is_array($row)) {
                    $items[] = $row;
                }
            }
        }
        $limit = max(1, min(200, (int)($_GET['limit'] ?? 40)));
        $items = array_slice($items, 0, $limit);
        echo json_encode([
            'success' => true,
            'data' => [
                'store_id' => $storeId,
                'summary' => [
                    'total' => count($items),
                    'unread' => 0,
                    'sent' => count($items),
                    'failed' => 0,
                    'skipped' => 0,
                ],
                'items' => $items,
            ],
        ]);
        return true;
    }

    if ($uri === '/notifications/deliveries/mark-read' && $method === 'POST') {
        echo json_encode(['success' => true, 'updated' => 0, 'store_id' => $storeId]);
        return true;
    }

    // ── Payment transactions / courier shipments (empty when none — no fake rows) ──
    if ($uri === '/payments/transactions' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $data = souq_store_data($pdo, $storeId);
        $tx = is_array($data['payment_transactions'] ?? null) ? array_values($data['payment_transactions']) : [];
        echo json_encode(['data' => $tx, 'store_id' => $storeId, 'meta' => ['total' => count($tx)]]);
        return true;
    }

    if ($uri === '/couriers/shipments' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $rows = [];
        try {
            $st = $pdo->prepare('SELECT * FROM courier_shipments WHERE store_id = ? ORDER BY created_at DESC LIMIT 200');
            $st->execute([$storeId]);
            $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Throwable) {
            $data = souq_store_data($pdo, $storeId);
            $rows = is_array($data['courier_shipments'] ?? null) ? array_values($data['courier_shipments']) : [];
        }
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);
        return true;
    }

    // ── Product variations (store_id isolated) ──
    if (preg_match('#^/products/([^/]+)/variations$#', $uri, $vm) && $method === 'GET') {
        $productId = rawurldecode($vm[1]);
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $pst = $pdo->prepare('SELECT id FROM products WHERE id = ? AND store_id = ? LIMIT 1');
        $pst->execute([$productId, $storeId]);
        if (!$pst->fetch()) {
            http_response_code(404);
            echo json_encode(['message' => 'Product not found in this store.']);
            return true;
        }
        $rows = souq_product_variations_list($pdo, $storeId, $productId);
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'product_id' => $productId]);
        return true;
    }

    if (preg_match('#^/products/([^/]+)/variations$#', $uri, $vm) && $method === 'POST') {
        $productId = rawurldecode($vm[1]);
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        souq_ensure_product_variations_table($pdo);
        $pst = $pdo->prepare('SELECT id FROM products WHERE id = ? AND store_id = ? LIMIT 1');
        $pst->execute([$productId, $storeId]);
        if (!$pst->fetch()) {
            http_response_code(404);
            echo json_encode(['message' => 'Product not found in this store.']);
            return true;
        }
        $sku = trim((string)($input['sku'] ?? ''));
        if ($sku === '') {
            http_response_code(422);
            echo json_encode(['message' => 'SKU is required.']);
            return true;
        }
        $dup = $pdo->prepare('SELECT id FROM product_variations WHERE store_id = ? AND sku = ? LIMIT 1');
        $dup->execute([$storeId, $sku]);
        if ($dup->fetch()) {
            http_response_code(422);
            echo json_encode(['message' => 'Variation SKU already exists for this store.']);
            return true;
        }
        $options = souq_variation_options_normalize($input['options'] ?? []);
        $id = trim((string)($input['id'] ?? ''));
        if ($id === '') {
            $id = 'var-' . bin2hex(random_bytes(6));
        }
        $now = date('Y-m-d H:i:s');
        $optsJson = json_encode($options, JSON_UNESCAPED_UNICODE);
        $pdo->prepare(
            'INSERT INTO product_variations (id, store_id, product_id, sku, barcode, options, price, compare_at_price, stock, weight, weight_unit, low_stock_alert, unlimited_stock, image_url, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $id,
            $storeId,
            $productId,
            $sku,
            $input['barcode'] ?? null,
            $optsJson,
            array_key_exists('price', $input) ? $input['price'] : null,
            array_key_exists('compare_at_price', $input) ? $input['compare_at_price'] : null,
            (int)($input['stock'] ?? 0),
            array_key_exists('weight', $input) ? $input['weight'] : null,
            (string)($input['weight_unit'] ?? 'kg'),
            array_key_exists('low_stock_alert', $input) ? $input['low_stock_alert'] : null,
            !empty($input['unlimited_stock']) ? 1 : 0,
            $input['image_url'] ?? null,
            array_key_exists('is_active', $input) ? (!empty($input['is_active']) ? 1 : 0) : 1,
            $now,
            $now,
        ]);
        $fresh = $pdo->prepare('SELECT * FROM product_variations WHERE id = ? AND store_id = ?');
        $fresh->execute([$id, $storeId]);
        http_response_code(201);
        echo json_encode(['data' => souq_variation_row($fresh->fetch(PDO::FETCH_ASSOC) ?: ['id' => $id, 'store_id' => $storeId, 'product_id' => $productId, 'sku' => $sku, 'options' => $optsJson, 'stock' => 0, 'is_active' => 1])]);
        return true;
    }

    if (preg_match('#^/products/([^/]+)/variations/([^/]+)$#', $uri, $vm) && in_array($method, ['PATCH', 'PUT', 'POST'], true)) {
        $productId = rawurldecode($vm[1]);
        $varId = rawurldecode($vm[2]);
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        souq_ensure_product_variations_table($pdo);
        $st = $pdo->prepare('SELECT * FROM product_variations WHERE id = ? AND product_id = ? AND store_id = ? LIMIT 1');
        $st->execute([$varId, $productId, $storeId]);
        $existing = $st->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['message' => 'Variation not found.']);
            return true;
        }
        $sku = array_key_exists('sku', $input) ? trim((string)$input['sku']) : (string)$existing['sku'];
        if ($sku === '') {
            http_response_code(422);
            echo json_encode(['message' => 'SKU is required.']);
            return true;
        }
        if ($sku !== (string)$existing['sku']) {
            $dup = $pdo->prepare('SELECT id FROM product_variations WHERE store_id = ? AND sku = ? AND id != ? LIMIT 1');
            $dup->execute([$storeId, $sku, $varId]);
            if ($dup->fetch()) {
                http_response_code(422);
                echo json_encode(['message' => 'Variation SKU already exists for this store.']);
                return true;
            }
        }
        $options = array_key_exists('options', $input)
            ? souq_variation_options_normalize($input['options'])
            : souq_variation_options_normalize($existing['options'] ?? []);
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'UPDATE product_variations SET sku = ?, barcode = ?, options = ?, price = ?, compare_at_price = ?, stock = ?, weight = ?, weight_unit = ?, low_stock_alert = ?, unlimited_stock = ?, image_url = ?, is_active = ?, updated_at = ? WHERE id = ? AND store_id = ?'
        )->execute([
            $sku,
            array_key_exists('barcode', $input) ? $input['barcode'] : $existing['barcode'],
            json_encode($options, JSON_UNESCAPED_UNICODE),
            array_key_exists('price', $input) ? $input['price'] : $existing['price'],
            array_key_exists('compare_at_price', $input) ? $input['compare_at_price'] : $existing['compare_at_price'],
            array_key_exists('stock', $input) ? (int)$input['stock'] : (int)$existing['stock'],
            array_key_exists('weight', $input) ? $input['weight'] : $existing['weight'],
            array_key_exists('weight_unit', $input) ? $input['weight_unit'] : ($existing['weight_unit'] ?? 'kg'),
            array_key_exists('low_stock_alert', $input) ? $input['low_stock_alert'] : $existing['low_stock_alert'],
            array_key_exists('unlimited_stock', $input) ? (!empty($input['unlimited_stock']) ? 1 : 0) : (int)$existing['unlimited_stock'],
            array_key_exists('image_url', $input) ? $input['image_url'] : $existing['image_url'],
            array_key_exists('is_active', $input) ? (!empty($input['is_active']) ? 1 : 0) : (int)$existing['is_active'],
            $now,
            $varId,
            $storeId,
        ]);
        $fresh = $pdo->prepare('SELECT * FROM product_variations WHERE id = ? AND store_id = ?');
        $fresh->execute([$varId, $storeId]);
        echo json_encode(['data' => souq_variation_row($fresh->fetch(PDO::FETCH_ASSOC) ?: $existing)]);
        return true;
    }

    if (preg_match('#^/products/([^/]+)/variations/([^/]+)$#', $uri, $vm) && $method === 'DELETE') {
        $productId = rawurldecode($vm[1]);
        $varId = rawurldecode($vm[2]);
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        souq_ensure_product_variations_table($pdo);
        $del = $pdo->prepare('DELETE FROM product_variations WHERE id = ? AND product_id = ? AND store_id = ?');
        $del->execute([$varId, $productId, $storeId]);
        echo json_encode(['success' => true, 'deleted' => $del->rowCount() > 0, 'store_id' => $storeId]);
        return true;
    }

    // ── Storefront categories (public, store_id isolated) ──
    if ($uri === '/storefront/categories' && $method === 'GET') {
        $sid = $storeId !== '' ? $storeId : trim((string)($_GET['store_id'] ?? ''));
        if ($sid === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT id, store_id, parent_id, name, name_ar, slug, image_url, sort_order FROM categories WHERE store_id = ? AND (is_active = 1 OR is_active IS NULL) ORDER BY sort_order ASC, name ASC');
        $st->execute([$sid]);
        $rows = [];
        while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
            $rows[] = [
                'id' => (string)$r['id'],
                'store_id' => (string)$r['store_id'],
                'parent_id' => !empty($r['parent_id']) ? (string)$r['parent_id'] : null,
                'name' => (string)$r['name'],
                'name_ar' => $r['name_ar'] !== null && $r['name_ar'] !== '' ? (string)$r['name_ar'] : null,
                'slug' => (string)($r['slug'] ?? ''),
                'image_url' => !empty($r['image_url']) ? (string)$r['image_url'] : null,
            ];
        }
        echo json_encode(['data' => $rows, 'store_id' => $sid, 'meta' => ['total' => count($rows)]]);
        return true;
    }

    // ── Shipping calculate (admin + storefront) ──
    if (($uri === '/shipping/calculate' || $uri === '/storefront/shipping/calculate') && $method === 'POST') {
        $sid = $storeId !== '' ? $storeId : trim((string)($input['store_id'] ?? ''));
        if ($sid === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        souq_ensure_shipping_defaults($pdo, $sid);
        $city = trim((string)($input['city'] ?? ''));
        $orderTotal = (float)($input['order_total'] ?? $input['subtotal'] ?? 0);
        $weightKg = (float)($input['total_weight_kg'] ?? 1);
        $distanceKm = (float)($input['distance_km'] ?? 0);
        $matchedZone = null;
        $zoneRate = 0.0;
        $zoneIsFree = false;
        $zoneDelivery = '2-3 Days';
        $zoneCod = true;
        $zones = [];
        try {
            $hasZonesTable = (bool) $pdo->query("SHOW TABLES LIKE 'shipping_zones'")->fetch(PDO::FETCH_NUM);
            if ($hasZonesTable) {
                $zst = $pdo->prepare('SELECT * FROM shipping_zones WHERE store_id = ? AND (is_active = 1 OR is_active IS NULL) ORDER BY name');
                $zst->execute([$sid]);
                $zones = $zst->fetchAll(PDO::FETCH_ASSOC) ?: [];
            }
        } catch (Throwable) {
            $zones = [];
        }
        if ($city !== '' && $zones !== []) {
            $picked = souq_match_shipping_zone($city, $zones);
            if ($picked !== null) {
                $matchedZone = $picked;
                $zoneCalc = souq_calculate_zone_rate($picked, $orderTotal, $weightKg, $distanceKm);
                $zoneRate = (float) ($zoneCalc['rate'] ?? 0);
                $zoneIsFree = (bool) ($zoneCalc['is_free'] ?? false);
                $zoneDelivery = (string) ($zoneCalc['estimated_delivery'] ?? '2-3 Days');
                $zoneCod = (bool) ($zoneCalc['cod_available'] ?? true);
            }
        }
        $st = $pdo->prepare('SELECT * FROM shipping_methods WHERE store_id = ? AND is_active = 1 ORDER BY sort_order, created_at');
        $st->execute([$sid]);
        $methods = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $options = [];
        foreach ($methods as $m) {
            $base = (float)($m['base_rate'] ?? 0);
            $perKg = (float)($m['per_kg_rate'] ?? 0);
            $perKm = (float)($m['per_km_rate'] ?? 0);
            $type = (string)($m['type'] ?? 'flat_rate');
            $threshold = $m['free_shipping_threshold'] !== null && $m['free_shipping_threshold'] !== ''
                ? (float)$m['free_shipping_threshold']
                : null;
            $isFree = ($type === 'free')
                || ($threshold !== null && $threshold > 0 && $orderTotal >= $threshold);
            $fulfillment = (string)($m['fulfillment_mode'] ?? 'courier');
            if ($isFree) {
                $rate = 0.0;
            } elseif ($type === 'weight_based' && $perKg > 0) {
                $rate = $base + ($weightKg * $perKg);
            } elseif ($perKm > 0) {
                // Distance band: base + per_km, soft-capped +10 SAR (e.g. 10→20).
                $rate = $base + (max(0.0, $distanceKm) * $perKm);
                $rate = min($base + 10.0, max($base, $rate));
            } elseif (
                $sid === 'store-coffee'
                && $fulfillment === 'own_delivery'
                && $type !== 'local_pickup'
            ) {
                // Makkah local own fleet: 10–20 SAR by distance (live fallback).
                $bandBase = 10.0;
                $rate = min(20.0, max($bandBase, $bandBase + (max(0.0, $distanceKm) * 1.0)));
            } else {
                $rate = $base;
            }
            $rate = round($rate, 2);
            $logoUrl = $m['logo_url'] ?? null;
            // Hide broken SPL PNG (file not in shipping-methods pack).
            if (is_string($logoUrl) && stripos($logoUrl, 'spl.png') !== false) {
                $logoUrl = null;
            }
            $row = [
                'id' => (string)$m['id'],
                'name' => (string)$m['name'],
                'name_ar' => (string)($m['name_ar'] ?? $m['name']),
                'type' => $type,
                'fee' => $rate,
                'rate' => $rate,
                'is_free' => $isFree,
                'estimated_delivery' => (string)($m['estimated_delivery'] ?? '2-4 Days'),
                'courier_code' => $m['courier_code'] ?? null,
                'logo_url' => $logoUrl,
                'fulfillment_mode' => $fulfillment,
                'is_cod_allowed' => (bool)(int)($m['is_cod_allowed'] ?? 1),
                'city' => $city !== '' ? $city : null,
            ];
            $options[] = $row;
        }
        if ($options === [] && $matchedZone !== null) {
            $options[] = [
                'id' => 'zone:'.(string) ($matchedZone['id'] ?? ''),
                'name' => (string) ($matchedZone['name'] ?? 'Delivery'),
                'name_ar' => (string) ($matchedZone['name_ar'] ?? $matchedZone['name'] ?? 'توصيل'),
                'type' => 'zone_rate',
                'fee' => $zoneRate,
                'rate' => $zoneRate,
                'is_free' => $zoneIsFree,
                'estimated_delivery' => $zoneDelivery,
                'courier_code' => $matchedZone['courier_code'] ?? null,
                'logo_url' => null,
                'fulfillment_mode' => 'courier',
                'is_cod_allowed' => $zoneCod,
                'city' => $city !== '' ? $city : null,
            ];
        }
        $eligible = array_values(array_filter(
            $options,
            static fn (array $m): bool => (string) ($m['type'] ?? '') !== 'free',
        ));
        if ($eligible === []) {
            $eligible = $options;
        }
        usort($eligible, static fn (array $a, array $b): int => ((float) ($a['fee'] ?? 0)) <=> ((float) ($b['fee'] ?? 0)));
        $best = $eligible[0] ?? ($options[0] ?? null);
        $methodFee = (float) ($best['fee'] ?? 0);
        // Zone match wins for calculated fee (merchant city pricing). Methods stay selectable separately.
        $calculatedFee = $matchedZone !== null ? $zoneRate : $methodFee;
        $isFreeShipping = $calculatedFee <= 0 || ($matchedZone !== null && $zoneIsFree);
        $matchedZonePayload = null;
        if ($matchedZone !== null) {
            $matchedZonePayload = [
                'id' => (string) ($matchedZone['id'] ?? ''),
                'name' => (string) ($matchedZone['name'] ?? ''),
                'region' => (string) ($matchedZone['region'] ?? ''),
                'rate' => round($zoneRate, 2),
                'free_above' => isset($matchedZone['free_above']) ? (float) $matchedZone['free_above'] : null,
                'is_free' => $zoneIsFree,
                'estimated_delivery' => $zoneDelivery,
                'cod_available' => $zoneCod,
            ];
        }
        echo json_encode([
            'store_id' => $sid,
            'city' => $city !== '' ? $city : null,
            'order_total' => $orderTotal,
            'rate' => round($calculatedFee, 2),
            'calculated_shipping_fee' => round($calculatedFee, 2),
            'is_free' => $isFreeShipping,
            'is_free_shipping' => $isFreeShipping,
            'estimated_delivery' => $best['estimated_delivery'] ?? $zoneDelivery,
            'cod_available' => $best['is_cod_allowed'] ?? $zoneCod,
            'matched_zone' => $matchedZonePayload,
            'available_methods' => $options,
            'methods' => $options,
            'data' => $options,
        ]);
        return true;
    }

    // ── Analytics overview / sales-revenue (real orders only — no invented KPIs) ──
    if (($uri === '/analytics/overview' || $uri === '/analytics/sales-revenue') && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $range = (string)($_GET['range'] ?? '30d');
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            'year' => 365,
            default => 30,
        };
        $now = date('Y-m-d H:i:s');
        $start = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        $prevStart = date('Y-m-d H:i:s', strtotime('-' . ($days * 2) . ' days'));
        $prevEnd = $start;

        $sumOrders = static function (PDO $pdo, string $sid, string $from, string $to): array {
            $st = $pdo->prepare("SELECT COUNT(*) c, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) revenue FROM orders WHERE store_id = ? AND created_at >= ? AND created_at <= ?");
            $st->execute([$sid, $from, $to]);
            $row = $st->fetch(PDO::FETCH_ASSOC) ?: ['c' => 0, 'revenue' => 0];
            return ['orders' => (int)$row['c'], 'revenue' => (float)$row['revenue']];
        };
        $cur = $sumOrders($pdo, $storeId, $start, $now);
        $prev = $sumOrders($pdo, $storeId, $prevStart, $prevEnd);
        $aov = $cur['orders'] > 0 ? round($cur['revenue'] / $cur['orders'], 2) : 0.0;
        $prevAov = $prev['orders'] > 0 ? round($prev['revenue'] / $prev['orders'], 2) : 0.0;
        $revGrowth = $prev['revenue'] > 0 ? (($cur['revenue'] - $prev['revenue']) / $prev['revenue']) * 100 : null;
        $ordGrowth = $prev['orders'] > 0 ? (($cur['orders'] - $prev['orders']) / $prev['orders']) * 100 : null;
        $aovGrowth = $prevAov > 0 ? (($aov - $prevAov) / $prevAov) * 100 : null;

        $visits = 0;
        try {
            souq_ensure_analytics_tables($pdo);
            $vst = $pdo->prepare("SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) sessions, SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) orphans FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND created_at >= ? AND created_at <= ?");
            $vst->execute([$storeId, $start, $now]);
            $vr = $vst->fetch(PDO::FETCH_ASSOC) ?: [];
            $visits = (int)($vr['sessions'] ?? 0) + (int)($vr['orphans'] ?? 0);
        } catch (Throwable) {
            $visits = 0;
        }
        $conversion = $visits > 0 ? round(($cur['orders'] / $visits) * 100, 2) : 0.0;

        $newCustomers = 0;
        $prevCustomers = 0;
        try {
            $cst = $pdo->prepare('SELECT COUNT(*) c FROM customers WHERE store_id = ? AND created_at >= ? AND created_at <= ?');
            $cst->execute([$storeId, $start, $now]);
            $newCustomers = (int)$cst->fetchColumn();
            $cst->execute([$storeId, $prevStart, $prevEnd]);
            $prevCustomers = (int)$cst->fetchColumn();
        } catch (Throwable) {
            /* ignore */
        }
        $custGrowth = $prevCustomers > 0 ? (($newCustomers - $prevCustomers) / $prevCustomers) * 100 : null;

        $daily = [];
        try {
            $dst = $pdo->prepare("SELECT DATE(created_at) d, COUNT(*) o, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) r FROM orders WHERE store_id = ? AND created_at >= ? AND created_at <= ? GROUP BY DATE(created_at) ORDER BY d ASC");
            $dst->execute([$storeId, $start, $now]);
            while ($r = $dst->fetch(PDO::FETCH_ASSOC)) {
                $daily[] = [
                    'date' => (string)$r['d'],
                    'label' => date('M d', strtotime((string)$r['d'])),
                    'revenue' => (float)$r['r'],
                    'orders' => (int)$r['o'],
                ];
            }
        } catch (Throwable) {
            $daily = [];
        }

        $sources = [];
        try {
            $sst = $pdo->prepare("SELECT COALESCE(NULLIF(TRIM(source), ''), 'Direct') source, COUNT(*) c, COALESCE(SUM(total_amount), 0) revenue FROM orders WHERE store_id = ? AND created_at >= ? AND created_at <= ? GROUP BY source");
            $sst->execute([$storeId, $start, $now]);
            while ($r = $sst->fetch(PDO::FETCH_ASSOC)) {
                $sources[] = [
                    'source' => (string)$r['source'],
                    'orders' => (int)$r['c'],
                    'revenue' => (float)$r['revenue'],
                    'percentage' => $cur['orders'] > 0 ? round(((int)$r['c'] / $cur['orders']) * 100, 1) : 0.0,
                ];
            }
        } catch (Throwable) {
            $sources = [];
        }

        $topProducts = [];
        try {
            $pst = $pdo->prepare('SELECT product_id, product_name, SUM(quantity) units, SUM(subtotal) revenue FROM order_items WHERE store_id = ? GROUP BY product_id, product_name ORDER BY revenue DESC LIMIT 5');
            $pst->execute([$storeId]);
            $rank = 0;
            while ($r = $pst->fetch(PDO::FETCH_ASSOC)) {
                $rank++;
                $topProducts[] = [
                    'rank' => $rank,
                    'product_id' => (string)$r['product_id'],
                    'name' => (string)$r['product_name'],
                    'units_sold' => (int)$r['units'],
                    'revenue' => (float)$r['revenue'],
                    'orders' => (int)$r['units'],
                    'conversion_rate' => $cur['orders'] > 0 ? round((min((int)$r['units'], $cur['orders']) / $cur['orders']) * 100, 1) . '%' : '0%',
                ];
            }
        } catch (Throwable) {
            $topProducts = [];
        }

        $payload = [
            'store_id' => $storeId,
            'period' => [
                'start' => substr($start, 0, 10),
                'end' => substr($now, 0, 10),
                'range' => $range,
            ],
            'kpis' => [
                'total_revenue' => $cur['revenue'],
                'revenue_growth' => souq_fmt_growth($revGrowth),
                'prev_revenue' => $prev['revenue'],
                'total_orders' => $cur['orders'],
                'orders_growth' => souq_fmt_growth($ordGrowth),
                'prev_orders' => $prev['orders'],
                'conversion_rate' => $conversion . '%',
                'conversion_rate_numeric' => $conversion,
                'aov' => $aov,
                'aov_growth' => souq_fmt_growth($aovGrowth),
                'prev_aov' => $prevAov,
                'new_customers' => $newCustomers,
                'customers_growth' => souq_fmt_growth($custGrowth),
                'prev_customers' => $prevCustomers,
                'net_profit_estimated' => null,
                'profit_growth' => null,
            ],
            'revenue_orders_trend' => $daily,
            'source_distribution' => $sources,
            'top_products' => $topProducts,
            'funnel' => [
                'site_visits' => $visits,
                'product_views' => 0,
                'add_to_cart' => 0,
                'checkout_started' => 0,
                'orders_placed' => $cur['orders'],
            ],
        ];
        if ($uri === '/analytics/sales-revenue') {
            $payload['sales'] = [
                'revenue' => $cur['revenue'],
                'orders' => $cur['orders'],
                'aov' => $aov,
                'trend' => $daily,
            ];
        }
        echo json_encode($payload);
        return true;
    }

    // ── UTM saved links (per store_id) ──
    if ($uri === '/utm-links' && in_array($method, ['GET', 'POST'], true)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        try {
            souq_ensure_utm_schema($pdo);
            souq_ensure_analytics_tables($pdo);
        } catch (Throwable) {
            /* continue */
        }
        if ($method === 'GET') {
            $rows = [];
            try {
                $st = $pdo->prepare('SELECT * FROM store_utm_links WHERE store_id = ? ORDER BY created_at DESC LIMIT 200');
                $st->execute([$storeId]);
                while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
                    $campaign = strtolower(trim((string)($r['utm_campaign'] ?? '')));
                    $medium = strtolower(trim((string)($r['utm_medium'] ?? '')));
                    $srcRaw = strtolower(trim((string)($r['utm_source'] ?? '')));
                    $sessions = 0;
                    $orders = 0;
                    $revenue = 0.0;
                    try {
                        $hasCamp = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'campaign');
                        if ($hasCamp && $campaign !== '') {
                            $es = $pdo->prepare("SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) c FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND LOWER(COALESCE(campaign,'')) = ? AND LOWER(COALESCE(medium,'')) = ?");
                            $es->execute([$storeId, $campaign, $medium]);
                            $sessions = (int)$es->fetchColumn();
                        }
                        $os = $pdo->prepare("SELECT COUNT(*) c, COALESCE(SUM(total_amount),0) revenue FROM orders WHERE store_id = ? AND status != 'cancelled' AND LOWER(COALESCE(campaign,'')) = ? AND LOWER(COALESCE(medium,'')) = ?");
                        $os->execute([$storeId, $campaign, $medium]);
                        $or = $os->fetch(PDO::FETCH_ASSOC) ?: [];
                        $orders = (int)($or['c'] ?? 0);
                        $revenue = (float)($or['revenue'] ?? 0);
                    } catch (Throwable) {
                        /* stats optional */
                    }
                    $rows[] = [
                        'id' => (string)$r['id'],
                        'name' => (string)$r['name'],
                        'platform_key' => $r['platform_key'] ?? null,
                        'target_path' => $r['target_path'] ?? null,
                        'product_id' => $r['product_id'] ?? null,
                        'url' => (string)$r['target_url'],
                        'source' => (string)($r['utm_source'] ?? $srcRaw),
                        'medium' => (string)($r['utm_medium'] ?? $medium),
                        'campaign' => (string)($r['utm_campaign'] ?? $campaign),
                        'term' => $r['utm_term'] ?? null,
                        'content' => $r['utm_content'] ?? null,
                        'created_at' => $r['created_at'] ?? null,
                        'clicks' => $sessions,
                        'conversions' => $orders,
                        'revenue' => $revenue,
                    ];
                }
            } catch (Throwable $e) {
                $rows = [];
            }
            echo json_encode(['store_id' => $storeId, 'data' => $rows]);
            return true;
        }

        // POST create
        $name = trim((string)($input['name'] ?? ''));
        $targetUrl = trim((string)($input['target_url'] ?? ''));
        $utmSource = strtolower(trim((string)($input['utm_source'] ?? '')));
        $utmMedium = strtolower(trim((string)($input['utm_medium'] ?? '')));
        $utmCampaign = strtolower(trim((string)($input['utm_campaign'] ?? '')));
        if ($name === '' || $targetUrl === '' || $utmSource === '' || $utmMedium === '' || $utmCampaign === '') {
            http_response_code(422);
            echo json_encode(['message' => 'name, target_url, utm_source, utm_medium, utm_campaign required.']);
            return true;
        }
        $id = 'utm-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        try {
            $pdo->prepare(
                'INSERT INTO store_utm_links (id, store_id, name, platform_key, target_path, product_id, target_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, click_sessions, conversion_count, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)'
            )->execute([
                $id,
                $storeId,
                mb_substr($name, 0, 191),
                ($input['platform_key'] ?? null) !== null && (string)$input['platform_key'] !== '' ? mb_substr((string)$input['platform_key'], 0, 64) : null,
                ($input['target_path'] ?? null) !== null && (string)$input['target_path'] !== '' ? mb_substr((string)$input['target_path'], 0, 512) : null,
                ($input['product_id'] ?? null) !== null && (string)$input['product_id'] !== '' ? mb_substr((string)$input['product_id'], 0, 64) : null,
                mb_substr($targetUrl, 0, 1024),
                mb_substr($utmSource, 0, 128),
                mb_substr($utmMedium, 0, 128),
                mb_substr($utmCampaign, 0, 191),
                ($input['utm_term'] ?? null) !== null && trim((string)$input['utm_term']) !== '' ? mb_substr(trim((string)$input['utm_term']), 0, 128) : null,
                ($input['utm_content'] ?? null) !== null && trim((string)$input['utm_content']) !== '' ? mb_substr(strtolower(trim((string)$input['utm_content'])), 0, 128) : null,
                $now,
                $now,
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to save UTM link.', 'error' => $e->getMessage()]);
            return true;
        }
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $id]);
        return true;
    }

    if (preg_match('#^/utm-links/([^/]+)$#', $uri, $utmM) && $method === 'DELETE') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $linkId = (string)$utmM[1];
        try {
            souq_ensure_utm_schema($pdo);
            $del = $pdo->prepare('DELETE FROM store_utm_links WHERE id = ? AND store_id = ?');
            $del->execute([$linkId, $storeId]);
            if ($del->rowCount() < 1) {
                http_response_code(404);
                echo json_encode(['message' => 'Not found.']);
                return true;
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Delete failed.']);
            return true;
        }
        echo json_encode(['success' => true]);
        return true;
    }

    // ── Souq internal marketing analytics (events + orders; not GA4) ──
    if ($uri === '/analytics/marketing' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        try {
            souq_ensure_analytics_tables($pdo);
            souq_ensure_utm_schema($pdo);
        } catch (Throwable) {
            /* optional */
        }

        $fromQ = trim((string)($_GET['from'] ?? ''));
        $toQ = trim((string)($_GET['to'] ?? ''));
        $range = (string)($_GET['range'] ?? '30d');
        if ($fromQ !== '' && $toQ !== '' && preg_match('/^\d{4}-\d{2}-\d{2}/', $fromQ) && preg_match('/^\d{4}-\d{2}-\d{2}/', $toQ)) {
            $start = substr($fromQ, 0, 10) . ' 00:00:00';
            $end = substr($toQ, 0, 10) . ' 23:59:59';
        } else {
            $days = match ($range) {
                'today' => 0,
                'yesterday' => 1,
                '7d' => 7,
                '90d' => 90,
                default => 30,
            };
            if ($range === 'today') {
                $start = date('Y-m-d') . ' 00:00:00';
                $end = date('Y-m-d H:i:s');
            } elseif ($range === 'yesterday') {
                $start = date('Y-m-d', strtotime('-1 day')) . ' 00:00:00';
                $end = date('Y-m-d', strtotime('-1 day')) . ' 23:59:59';
            } else {
                $end = date('Y-m-d H:i:s');
                $start = date('Y-m-d H:i:s', strtotime("-{$days} days"));
            }
        }

        $sessions = 0;
        $pageViews = 0;
        $productViews = 0;
        $addToCart = 0;
        $beginCheckout = 0;
        $purchases = 0;
        $uniqueVisitors = 0;
        $newVisitors = 0;
        $returningVisitors = 0;
        $trafficBySource = [];
        $trafficByMedium = [];
        $productVisitors = [];

        try {
            $st = $pdo->prepare("SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) sessions FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND created_at >= ? AND created_at <= ?");
            $st->execute([$storeId, $start, $end]);
            $sessions = (int)$st->fetchColumn();

            $ec = $pdo->prepare('SELECT event_name, COUNT(*) c FROM analytics_events WHERE store_id = ? AND created_at >= ? AND created_at <= ? GROUP BY event_name');
            $ec->execute([$storeId, $start, $end]);
            while ($r = $ec->fetch(PDO::FETCH_ASSOC)) {
                $n = (string)$r['event_name'];
                $c = (int)$r['c'];
                if ($n === 'page_view') $pageViews = $c;
                if ($n === 'product_view') $productViews = $c;
                if ($n === 'add_to_cart') $addToCart = $c;
                if ($n === 'begin_checkout') $beginCheckout = $c;
                if ($n === 'purchase') $purchases = $c;
            }

            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'visitor_key')) {
                $vs = $pdo->prepare("SELECT visitor_key, COUNT(DISTINCT session_key) sess_cnt FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND created_at >= ? AND created_at <= ? AND visitor_key IS NOT NULL AND visitor_key != '' GROUP BY visitor_key");
                $vs->execute([$storeId, $start, $end]);
                while ($r = $vs->fetch(PDO::FETCH_ASSOC)) {
                    $uniqueVisitors++;
                    if ((int)($r['sess_cnt'] ?? 0) > 1) {
                        $returningVisitors++;
                    } else {
                        $newVisitors++;
                    }
                }
            }
            if ($uniqueVisitors <= 0) {
                $uniqueVisitors = $sessions;
                $newVisitors = $sessions;
            }

            $ss = $pdo->prepare("SELECT COALESCE(NULLIF(TRIM(source), ''), 'Direct') src, COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) sessions FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND created_at >= ? AND created_at <= ? GROUP BY src ORDER BY sessions DESC LIMIT 30");
            $ss->execute([$storeId, $start, $end]);
            while ($r = $ss->fetch(PDO::FETCH_ASSOC)) {
                $trafficBySource[] = ['source' => (string)$r['src'], 'sessions' => (int)$r['sessions']];
            }

            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'analytics_events', 'medium')) {
                $ms = $pdo->prepare("SELECT COALESCE(NULLIF(TRIM(medium), ''), 'none') med, COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) sessions FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND created_at >= ? AND created_at <= ? GROUP BY med ORDER BY sessions DESC LIMIT 30");
                $ms->execute([$storeId, $start, $end]);
                while ($r = $ms->fetch(PDO::FETCH_ASSOC)) {
                    $trafficByMedium[] = ['medium' => (string)$r['med'], 'sessions' => (int)$r['sessions']];
                }
            }

            $pv = $pdo->prepare("SELECT path, COUNT(*) views FROM analytics_events WHERE store_id = ? AND event_name = 'product_view' AND created_at >= ? AND created_at <= ? GROUP BY path ORDER BY views DESC LIMIT 25");
            $pv->execute([$storeId, $start, $end]);
            while ($r = $pv->fetch(PDO::FETCH_ASSOC)) {
                $productVisitors[] = [
                    'product_id' => (string)$r['path'],
                    'views' => (int)$r['views'],
                    'orders' => 0,
                    'conv_rate' => 0.0,
                ];
            }
        } catch (Throwable) {
            /* empty analytics */
        }

        $totalOrders = 0;
        $totalRevenue = 0.0;
        $campaignRows = [];
        $revenueBySource = [];
        try {
            $oq = $pdo->prepare("SELECT COUNT(*) c, COALESCE(SUM(total_amount),0) revenue FROM orders WHERE store_id = ? AND status != 'cancelled' AND created_at >= ? AND created_at <= ?");
            $oq->execute([$storeId, $start, $end]);
            $or = $oq->fetch(PDO::FETCH_ASSOC) ?: [];
            $totalOrders = (int)($or['c'] ?? 0);
            $totalRevenue = (float)($or['revenue'] ?? 0);

            $cq = $pdo->prepare("SELECT campaign, COALESCE(NULLIF(source,''), 'Unknown') channel, COUNT(*) orders, COALESCE(SUM(total_amount),0) revenue FROM orders WHERE store_id = ? AND status != 'cancelled' AND created_at >= ? AND created_at <= ? AND campaign IS NOT NULL AND campaign != '' GROUP BY campaign, channel ORDER BY revenue DESC LIMIT 50");
            $cq->execute([$storeId, $start, $end]);
            while ($r = $cq->fetch(PDO::FETCH_ASSOC)) {
                $campaignRows[] = [
                    'campaign' => (string)$r['campaign'],
                    'channel' => (string)$r['channel'],
                    'orders' => (int)$r['orders'],
                    'revenue' => (float)$r['revenue'],
                    'conv_rate' => $sessions > 0 ? round(((int)$r['orders'] / $sessions) * 100, 2) : 0.0,
                ];
            }

            $rq = $pdo->prepare("SELECT COALESCE(NULLIF(source,''), 'Direct') src, COUNT(*) orders, COALESCE(SUM(total_amount),0) revenue FROM orders WHERE store_id = ? AND status != 'cancelled' AND created_at >= ? AND created_at <= ? GROUP BY src ORDER BY revenue DESC");
            $rq->execute([$storeId, $start, $end]);
            while ($r = $rq->fetch(PDO::FETCH_ASSOC)) {
                $revenueBySource[] = [
                    'source' => (string)$r['src'],
                    'orders' => (int)$r['orders'],
                    'revenue' => (float)$r['revenue'],
                ];
            }
        } catch (Throwable) {
            /* empty orders */
        }

        $aov = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0.0;
        $convRate = $sessions > 0 ? round(($totalOrders / $sessions) * 100, 2) : 0.0;
        $cartRate = $sessions > 0 ? round(($addToCart / $sessions) * 100, 2) : 0.0;
        $checkoutAbandon = $beginCheckout > 0
            ? round((max(0, $beginCheckout - $totalOrders) / $beginCheckout) * 100, 2)
            : 0.0;

        echo json_encode([
            'store_id' => $storeId,
            'source' => 'souq_internal',
            'range' => ['from' => $start, 'to' => $end],
            'kpis' => [
                'sessions' => $sessions,
                'unique_visitors' => $uniqueVisitors,
                'page_views' => $pageViews,
                'new_visitors' => $newVisitors,
                'returning_visitors' => $returningVisitors,
                'total_orders' => $totalOrders,
                'revenue' => $totalRevenue,
                'conversion_rate' => $convRate,
                'average_order_value' => $aov,
                'add_to_cart_rate' => $cartRate,
                'checkout_abandonment_rate' => $checkoutAbandon,
                'product_views' => $productViews,
                'add_to_cart' => $addToCart,
                'checkouts_started' => $beginCheckout,
                'purchase_events' => $purchases,
            ],
            'traffic_by_source' => $trafficBySource,
            'traffic_by_medium' => $trafficByMedium,
            'campaign_performance' => $campaignRows,
            'revenue_by_source' => $revenueBySource,
            'product_analytics' => $productVisitors,
        ]);
        return true;
    }

    // ── Storefront SEO bootstrap (host / store_id) ──
    if ($uri === '/storefront/seo-bootstrap' && $method === 'GET') {
        $host = strtolower(trim((string)($_GET['host'] ?? '')));
        $host = preg_replace('/:\d+$/', '', $host) ?? $host;
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }
        $sid = $storeId !== '' ? $storeId : trim((string)($_GET['store_id'] ?? ''));
        $storeRow = null;
        if ($sid !== '') {
            $st = $pdo->prepare('SELECT * FROM stores WHERE id = ? LIMIT 1');
            $st->execute([$sid]);
            $storeRow = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        }
        if (!$storeRow && $host !== '') {
            $st = $pdo->prepare('SELECT * FROM stores WHERE LOWER(domain) = ? OR LOWER(custom_domain) = ? OR LOWER(demo_domain) = ? LIMIT 1');
            $st->execute([$host, $host, $host]);
            $storeRow = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        }
        if (!$storeRow) {
            http_response_code(404);
            echo json_encode(['resolved' => false, 'host' => $host]);
            return true;
        }
        $sid = (string)$storeRow['id'];
        $seo = [];
        try {
            $sst = $pdo->prepare('SELECT * FROM seo_configs WHERE store_id = ? LIMIT 1');
            $sst->execute([$sid]);
            $seo = $sst->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (Throwable) {
            try {
                $sst = $pdo->prepare('SELECT * FROM seo WHERE store_id = ? LIMIT 1');
                $sst->execute([$sid]);
                $seo = $sst->fetch(PDO::FETCH_ASSOC) ?: [];
            } catch (Throwable) {
                $seo = [];
            }
        }
        $origin = 'https://' . ($storeRow['custom_domain'] ?: $storeRow['domain'] ?: $host ?: 'localhost');
        echo json_encode([
            'resolved' => true,
            'host' => $host !== '' ? $host : null,
            'store_id' => $sid,
            'meta_title' => (string)($seo['meta_title'] ?? $storeRow['name'] ?? ''),
            'meta_description' => (string)($seo['meta_description'] ?? ''),
            'keywords' => (string)($seo['keywords'] ?? ''),
            'canonical_url' => rtrim((string)($seo['canonical_url'] ?? $origin), '/') . '/',
            'ga4_measurement_id' => (string)($seo['ga4_measurement_id'] ?? ''),
            'gtm_container_id' => (string)($seo['gtm_container_id'] ?? ''),
            'og_image' => (string)($storeRow['logo'] ?? ''),
            'locale' => (string)($storeRow['locale'] ?? 'ar'),
        ]);
        return true;
    }

    return false;
}
