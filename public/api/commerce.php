<?php
/**
 * Store-scoped commerce on the live SQLite gateway.
 * Orders, customers, coupons, loyalty, gift cards, and reports.
 * Empty tables stay empty. Payment is Pending until a real capture exists.
 */

declare(strict_types=1);

function souq_commerce_schema(PDO $pdo): void
{
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
    $now = date('c');
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
    if (str_contains($s, 'referral')) return 'Referral';
    if ($s === 'direct') return 'Direct';
    return 'Direct';
}

function souq_payment_method(?string $raw): string
{
    $s = strtolower(trim((string)$raw));
    if (str_contains($s, 'apple')) return 'Apple Pay';
    if (str_contains($s, 'tabby')) return 'Tabby';
    if (str_contains($s, 'tamara')) return 'Tamara';
    if (str_contains($s, 'stc')) return 'stc pay';
    if (str_contains($s, 'visa') || str_contains($s, 'master') || str_contains($s, 'card')) return 'Visa/MC';
    if (str_contains($s, 'cod') || str_contains($s, 'cash')) return 'COD';
    if (str_contains($s, 'mada')) return 'Mada';
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

function souq_order_row(PDO $pdo, array $row): array
{
    $itemsSt = $pdo->prepare('SELECT product_id, product_name, quantity, unit_price, subtotal FROM order_items WHERE order_id = ? AND store_id = ?');
    $itemsSt->execute([$row['id'], $row['store_id']]);
    $items = [];
    while ($it = $itemsSt->fetch()) {
        $items[] = [
            'product_id' => $it['product_id'],
            'product_name' => $it['product_name'],
            'name' => $it['product_name'],
            'quantity' => (int)$it['quantity'],
            'unit_price' => (float)$it['unit_price'],
            'price' => (float)$it['unit_price'],
            'subtotal' => (float)$it['subtotal'],
        ];
    }
    return [
        'id' => $row['id'],
        'store_id' => $row['store_id'],
        'order_number' => $row['order_number'],
        'customer_id' => $row['customer_id'],
        'customer_name' => $row['customer_name'],
        'customer_email' => $row['customer_email'],
        'customer_phone' => $row['customer_phone'],
        'items_count' => (int)$row['items_count'],
        'items_summary' => $row['items_summary'],
        'items' => $items,
        'total_amount' => (float)$row['total_amount'],
        'currency' => $row['currency'] ?: 'SAR',
        'source' => $row['source'] ?: 'Direct',
        'source_details' => $row['source_details'],
        'delivery_location' => $row['delivery_location'],
        'status' => $row['status'] ?: 'pending',
        'payment_method' => $row['payment_method'],
        'payment_status' => $row['payment_status'] ?: 'Pending',
        'shipping_status' => $row['shipping_status'],
        'tracking_number' => $row['tracking_number'],
        'courier_code' => $row['courier_code'],
        'order_date' => $row['order_date'],
        'coupon_code' => $row['coupon_code'],
    ];
}

function souq_customer_row(array $row): array
{
    return [
        'id' => $row['id'],
        'store_id' => $row['store_id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'city' => $row['city'] ?: '',
        'country' => $row['country'] ?: 'Saudi Arabia',
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
    $st = $pdo->prepare('SELECT * FROM customers WHERE store_id = ?');
    $st->execute([$storeId]);
    $found = null;
    while ($row = $st->fetch()) {
        $emailMatch = $email && strcasecmp((string)$row['email'], $email) === 0;
        if ($emailMatch || souq_phones_match((string)$row['phone'], $phone)) {
            $found = $row;
            break;
        }
    }
    $now = date('c');
    if ($found) {
        $orders = (int)$found['total_orders'] + 1;
        $spend = (float)$found['total_spend'] + $total;
        $avg = $orders > 0 ? round($spend / $orders, 2) : $total;
        $status = ($spend >= 1500 || $orders >= 3) ? 'VIP' : (($found['status'] === 'Inactive' || $found['status'] === 'New') ? 'Active' : $found['status']);
        $group = $status === 'VIP' ? 'VIP' : ($found['group'] ?: 'Regular');
        $upd = $pdo->prepare('UPDATE customers SET name = ?, email = COALESCE(NULLIF(?, \'\'), email), phone = ?, city = COALESCE(NULLIF(?, \'\'), city), total_orders = ?, total_spend = ?, avg_order_value = ?, last_order_date = ?, status = ?, `group` = ?, acquisition_source = COALESCE(acquisition_source, ?) WHERE id = ? AND store_id = ?');
        $upd->execute([$name, (string)$email, $phone, $city, $orders, $spend, $avg, $now, $status, $group, $source, $found['id'], $storeId]);
        $found['name'] = $name;
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
    $ins = $pdo->prepare('INSERT INTO customers (id, store_id, name, email, phone, city, country, acquisition_source, `group`, status, total_orders, total_spend, avg_order_value, last_order_date, created_at, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0)');
    $ins->execute([$id, $storeId, $name, $email, $phone, $city, 'Saudi Arabia', $source, $status === 'VIP' ? 'VIP' : 'Regular', $status, $total, $total, $now, $now]);
    return [
        'id' => $id,
        'store_id' => $storeId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'city' => $city,
        'country' => 'Saudi Arabia',
        'acquisition_source' => $source,
        'group' => $status === 'VIP' ? 'VIP' : 'Regular',
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
    return match ($host) {
        'mieraf-ksa.com' => 'store-coffee',
        'giftshop-sa.com' => 'store-1',
        'tanjeedmakkah.com' => 'store-bleco',
        default => '',
    };
}

function souq_store_data(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT data FROM stores WHERE id = ?');
    $st->execute([$storeId]);
    $data = json_decode((string)$st->fetchColumn(), true);
    return is_array($data) ? $data : [];
}

function souq_save_store_data(PDO $pdo, string $storeId, array $data): void
{
    $pdo->prepare('UPDATE stores SET data = ? WHERE id = ?')->execute([
        json_encode($data, JSON_UNESCAPED_UNICODE),
        $storeId,
    ]);
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
        $items = is_array($input['items'] ?? null) ? $input['items'] : [];
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
        if ($rate > 0) {
            $pts = (int)floor($charged * $rate);
            if ($pts > 0) {
                $pdo->prepare('UPDATE customers SET points = points + ? WHERE id = ? AND store_id = ?')->execute([$pts, $customer['id'], $storeId]);
                $customer['points'] = (int)($customer['points'] ?? 0) + $pts;
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
        $now = date('c');
        $methodName = souq_payment_method($input['payment_method'] ?? null);
        $ins = $pdo->prepare('INSERT INTO orders (id, store_id, order_number, customer_id, customer_name, customer_email, customer_phone, items_count, items_summary, total_amount, currency, source, source_details, delivery_location, status, payment_method, payment_status, shipping_status, order_date, coupon_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $ins->execute([
            $orderId, $storeId, $number, $customer['id'], $name, $email, $phone,
            count($items) ?: 1, $summary, $charged, 'SAR', $source, $details !== '' ? $details : $source,
            $location, 'pending', $methodName, 'Pending', 'pending', substr($now, 0, 10), $couponCode !== '' ? $couponCode : null, $now,
        ]);
        $itemIns = $pdo->prepare('INSERT INTO order_items (order_id, store_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stock = $pdo->prepare('UPDATE products SET stock = CASE WHEN stock - ? < 0 THEN 0 ELSE stock - ? END, updated_at = datetime(\'now\') WHERE id = ? AND store_id = ?');
        foreach ($items as $item) {
            $qty = max(1, (int)($item['quantity'] ?? 1));
            $price = (float)($item['price'] ?? 0);
            $pid = (string)($item['product_id'] ?? '');
            $itemIns->execute([$orderId, $storeId, $pid, (string)($item['name'] ?? ''), $qty, $price, $qty * $price]);
            if ($pid !== '') {
                $stock->execute([$qty, $qty, $pid, $storeId]);
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
        ]]);
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
        $allowed = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase', 'search'];
        if (!in_array($name, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Unknown event.']);
            return true;
        }
        $sessionKey = substr(trim((string)($input['session_key'] ?? '')), 0, 64);
        $path = substr((string)($input['path'] ?? ''), 0, 180);
        $source = souq_normalize_source($input['source'] ?? null);
        $now = date('c');

        if ($name === 'page_view') {
            $shouldIncrement = true;
            if ($sessionKey !== '') {
                $dup = $pdo->prepare(
                    "SELECT 1 FROM analytics_events WHERE store_id = ? AND event_name = 'page_view' AND session_key = ? AND created_at >= datetime('now', '-1 day') LIMIT 1",
                );
                $dup->execute([$storeId, $sessionKey]);
                $shouldIncrement = $dup->fetchColumn() === false;
            }
            if ($shouldIncrement) {
                $pdo->prepare(
                    'INSERT INTO store_metrics (store_id, visitors_count, updated_at) VALUES (?, 1, ?) ON CONFLICT(store_id) DO UPDATE SET visitors_count = visitors_count + 1, updated_at = excluded.updated_at',
                )->execute([$storeId, $now]);
            }
        }

        $pdo->prepare('INSERT INTO analytics_events (store_id, event_name, path, source, session_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$storeId, $name, $path, $source, $sessionKey !== '' ? $sessionKey : null, $now]);
        echo json_encode(['ok' => true, 'success' => true]);
        return true;
    }

    if ($uri === '/orders' && $method === 'GET') {
        $st = $pdo->prepare('SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC');
        $st->execute([$storeId]);
        $rows = [];
        while ($row = $st->fetch()) {
            $rows[] = souq_order_row($pdo, $row);
        }
        echo json_encode(['data' => $rows, 'meta' => ['total' => count($rows), 'page' => 1, 'per_page' => max(1, count($rows)), 'last_page' => 1]]);
        return true;
    }

    if ($uri === '/customers' && $method === 'GET') {
        $st = $pdo->prepare('SELECT * FROM customers WHERE store_id = ? ORDER BY created_at DESC');
        $st->execute([$storeId]);
        $rows = [];
        while ($row = $st->fetch()) {
            $rows[] = souq_customer_row($row);
        }
        echo json_encode(['data' => $rows]);
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
        $st = $pdo->prepare('SELECT id, name, domain, data FROM stores WHERE id = ?');
        $st->execute([$storeId]);
        $row = $st->fetch();
        $data = $row ? (json_decode((string)$row['data'], true) ?: []) : [];
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
            $g['supported_methods'] = json_decode((string)($g['supported_methods'] ?? '[]'), true) ?: [];
            $g['masked_secret_key'] = '';
            $rows[] = $g;
        }
        echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);
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
        $st = $pdo->prepare('SELECT provider FROM payment_gateways WHERE store_id = ? AND is_enabled = 1 AND status = ?');
        $st->execute([$sid, 'connected']);
        $connected = [];
        while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
            $connected[$r['provider']] = true;
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
        $methods = [];
        foreach ($catalog as $row) {
            if (!isset($connected[$row['provider']])) {
                continue;
            }
            $row['is_enabled'] = true;
            $methods[] = $row;
        }
        echo json_encode([
            'success' => true,
            'store_id' => $sid,
            'currency' => 'SAR',
            'methods' => $methods,
            'gateways_configured' => count($connected),
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
        $ref = strtoupper($provider) . '-' . strtoupper(bin2hex(random_bytes(5)));
        echo json_encode([
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
        ]);
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
        // COD / bank: pending until merchant confirms. Card gateways need real Moyasar capture — never fake paid.
        $status = in_array($provider, ['cod', 'bank_transfer'], true) ? 'pending' : 'failed';
        $verified = false;
        if ($provider === 'cod') {
            $status = 'pending';
            $verified = true; // order may proceed; cash collected later
        }
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
            $st = $pdo->prepare('SELECT id, name, domain, data FROM stores WHERE id = ?');
            $st->execute([$sidFilter]);
            $storeRows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } else {
            $storeRows = $pdo->query('SELECT id, name, domain, data FROM stores')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        foreach ($storeRows as $row) {
            $sid = (string)($row['id'] ?? '');
            $data = json_decode((string)($row['data'] ?? '{}'), true);
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

    // ── Shipping zones (store_data only — empty → []) ──
    if ($uri === '/shipping' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $data = souq_store_data($pdo, $storeId);
        $zones = $data['shipping'] ?? $data['shipping_zones'] ?? [];
        if (!is_array($zones)) {
            $zones = [];
        }
        $out = [];
        foreach ($zones as $z) {
            if (!is_array($z)) {
                continue;
            }
            $out[] = array_merge($z, [
                'id' => (string)($z['id'] ?? ('ship-' . bin2hex(random_bytes(4)))),
                'store_id' => $storeId,
            ]);
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

    return false;
}
