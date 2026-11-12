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
                session_key VARCHAR(64) NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_analytics_store (store_id),
                KEY idx_analytics_session (store_id, event_name, session_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS store_metrics (
                store_id VARCHAR(64) NOT NULL PRIMARY KEY,
                visitors_count INT UNSIGNED NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        return;
    }
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id TEXT NOT NULL,
            event_name TEXT NOT NULL,
            path TEXT,
            source TEXT,
            session_key TEXT,
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_store ON analytics_events(store_id);
        CREATE TABLE IF NOT EXISTS store_metrics (
            store_id TEXT PRIMARY KEY,
            visitors_count INTEGER DEFAULT 0,
            updated_at TEXT
        );
    ");
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
    foreach ([
        'cod_status', 'cod_notes', 'refund_status', 'refund_amount', 'return_reason', 'return_notes',
        'delivery_mode', 'driver_id', 'bank_account_id', 'payment_plan', 'amount_paid', 'remaining_balance',
        'payment_transaction_id', 'is_archived', 'archived_at', 'estimated_delivery_at',
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
        $upd = $pdo->prepare('UPDATE customers SET name = ?, email = ?, phone = ?, city = COALESCE(NULLIF(?, \'\'), city), total_orders = ?, total_spend = ?, avg_order_value = ?, last_order_date = ?, status = ?, `group` = ?, acquisition_source = COALESCE(acquisition_source, ?) WHERE id = ? AND store_id = ?');
        $upd->execute([$name, $nextEmail, $phone, $city, $orders, $spend, $avg, $now, $status, $group, $source, $found['id'], $storeId]);
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
            $pdo->prepare('UPDATE customers SET name = ?, email = ?, phone = ?, city = COALESCE(NULLIF(?, \'\'), city), total_orders = ?, total_spend = ?, avg_order_value = ?, last_order_date = ?, status = ?, `group` = ? WHERE id = ? AND store_id = ?')
                ->execute([$name, $emailValue, $phone, $city, $orders, $spend, $avg, $now, $status, $group, $legacy['id'], $storeId]);
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
    return match ($host) {
        'mieraf-ksa.com' => 'store-coffee',
        'giftshop-sa.com' => 'store-1',
        'tanjeedmakkah.com' => 'store-bleco',
        default => '',
    };
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
    ];
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
            $location !== '' ? $location : null, 'pending', $methodName, 'Pending', 'pending',
            substr($now, 0, 10), $now,
        ];
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'orders', 'coupon_code')) {
            $cols[] = 'coupon_code';
            $vals[] = $couponCode !== '' ? $couponCode : null;
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

            $pdo->prepare('INSERT INTO analytics_events (store_id, event_name, path, source, session_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$storeId, $name, $path, $source, $sessionKey !== '' ? $sessionKey : null, $now]);
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
        echo json_encode(['data' => souq_order_row($pdo, $fresh->fetch() ?: $row)]);
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
        $st = $pdo->prepare('SELECT * FROM shipping_methods WHERE store_id = ? AND is_active = 1 ORDER BY sort_order, created_at');
        $st->execute([$sid]);
        $methods = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $options = [];
        foreach ($methods as $m) {
            $base = (float)($m['base_rate'] ?? 0);
            $threshold = $m['free_shipping_threshold'] !== null && $m['free_shipping_threshold'] !== ''
                ? (float)$m['free_shipping_threshold']
                : null;
            $isFree = $threshold !== null && $threshold > 0 && $orderTotal >= $threshold;
            $rate = $isFree ? 0.0 : $base;
            $options[] = [
                'id' => (string)$m['id'],
                'name' => (string)$m['name'],
                'name_ar' => (string)($m['name_ar'] ?? $m['name']),
                'type' => (string)($m['type'] ?? 'flat_rate'),
                'rate' => $rate,
                'is_free' => $isFree,
                'estimated_delivery' => (string)($m['estimated_delivery'] ?? '2-4 Days'),
                'is_cod_allowed' => (bool)(int)($m['is_cod_allowed'] ?? 1),
                'city' => $city !== '' ? $city : null,
            ];
        }
        $best = $options[0] ?? null;
        echo json_encode([
            'store_id' => $sid,
            'city' => $city !== '' ? $city : null,
            'order_total' => $orderTotal,
            'rate' => $best['rate'] ?? 0,
            'is_free' => $best['is_free'] ?? false,
            'estimated_delivery' => $best['estimated_delivery'] ?? null,
            'cod_available' => $best['is_cod_allowed'] ?? true,
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
