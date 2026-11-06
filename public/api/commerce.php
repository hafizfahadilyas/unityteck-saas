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
            created_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_events_store ON analytics_events(store_id);
    ");
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

function souq_loyalty_rate(PDO $pdo, string $storeId): float
{
    $st = $pdo->prepare('SELECT data FROM stores WHERE id = ?');
    $st->execute([$storeId]);
    $data = json_decode((string)$st->fetchColumn(), true);
    if (!is_array($data)) {
        return 0.0;
    }
    $loyalty = $data['loyalty'] ?? $data['loyaltyProgram'] ?? null;
    if (!is_array($loyalty)) {
        return 0.0;
    }
    $rate = $loyalty['pointsPerSar'] ?? $loyalty['points_per_sar'] ?? 0;
    return max(0, (float)$rate);
}

function souq_commerce_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if ($storeId === '' && !in_array($uri, ['/storefront/events'], true)) {
        $needsStore = str_starts_with($uri, '/storefront/') || in_array($uri, ['/orders', '/customers', '/coupons', '/seo', '/reports/overview', '/gift-cards'], true);
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
        $ins = $pdo->prepare('INSERT INTO orders (id, store_id, order_number, customer_id, customer_name, customer_email, customer_phone, items_count, items_summary, total_amount, currency, source, source_details, delivery_location, status, payment_method, payment_status, order_date, coupon_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $ins->execute([
            $orderId, $storeId, $number, $customer['id'], $name, $email, $phone,
            count($items) ?: 1, $summary, $charged, 'SAR', $source, $details !== '' ? $details : $source,
            $location, 'pending', $methodName, 'Pending', substr($now, 0, 10), $couponCode !== '' ? $couponCode : null, $now,
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
        $name = trim((string)($input['event'] ?? ''));
        $allowed = ['page_view', 'add_to_cart', 'begin_checkout'];
        if (!in_array($name, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Unknown event.']);
            return true;
        }
        $pdo->prepare('INSERT INTO analytics_events (store_id, event_name, path, source, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute([$storeId, $name, substr((string)($input['path'] ?? ''), 0, 180), souq_normalize_source($input['source'] ?? null), date('c')]);
        echo json_encode(['ok' => true]);
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
        echo json_encode(['data' => [
            'store_id' => $storeId,
            'google_connected' => false,
            'meta_title' => (string)($seo['metaTitle'] ?? $data['metaTitle'] ?? $data['meta_title'] ?? ''),
            'meta_description' => (string)($seo['metaDescription'] ?? $data['metaDescription'] ?? $data['meta_description'] ?? ''),
            'keywords' => $seo['keywords'] ?? $data['keywords'] ?? [],
            'sitemap_url' => $row && !empty($row['domain']) ? 'https://' . $row['domain'] . '/sitemap.xml' : '',
            'indexed_urls_count' => 0,
            'total_search_clicks' => 0,
            'total_search_impressions' => 0,
            'avg_ctr' => 0,
            'avg_position' => 0,
            'top_queries' => [],
            'extra' => new stdClass(),
        ]]);
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

    return false;
}
