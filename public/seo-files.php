<?php
/**
 * Per-host sitemap and robots. Uses this host's store only.
 * Missing store still publishes the homepage. It never copies another store.
 */
declare(strict_types=1);

function souq_seo_host(): string
{
    $host = strtolower((string)preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? 'localhost'));
    return str_starts_with($host, 'www.') ? substr($host, 4) : $host;
}

function souq_seo_origin(string $host): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ($https ? 'https://' : 'http://') . $host;
}

function souq_seo_store(string $host): ?array
{
    $db = __DIR__ . '/api/data/platform.sqlite';
    if (!is_file($db)) {
        return null;
    }
    try {
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $rows = $pdo->query('SELECT id, name, slug, domain, data FROM stores')->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return null;
    }
    $aliases = [
        'mieraf-ksa.com' => 'store-coffee',
        'giftshop-sa.com' => 'store-1',
        'tanjeedmakkah.com' => 'store-bleco',
    ];
    foreach ($rows as $row) {
        $data = json_decode((string)($row['data'] ?? ''), true);
        if (!is_array($data)) {
            $data = [];
        }
        $domains = [];
        foreach (['domain', 'custom_domain', 'demo_domain'] as $field) {
            $value = strtolower(trim((string)($row[$field] ?? $data[$field] ?? '')));
            $value = preg_replace('#^https?://#', '', $value) ?? $value;
            $value = explode('/', $value)[0];
            if (str_starts_with($value, 'www.')) {
                $value = substr($value, 4);
            }
            if ($value !== '') {
                $domains[] = $value;
            }
        }
        if (in_array($host, $domains, true) || (($aliases[$host] ?? '') === (string)$row['id'])) {
            $row['parsed'] = $data;
            return $row;
        }
    }
    return null;
}

function souq_seo_products(string $storeId): array
{
    $db = __DIR__ . '/api/data/platform.sqlite';
    if ($storeId === '' || !is_file($db)) {
        return [];
    }
    try {
        $pdo = new PDO('sqlite:' . $db, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $st = $pdo->prepare("SELECT id, name, updated_at FROM products WHERE store_id = ? AND (status IS NULL OR status != 'archived') ORDER BY updated_at DESC LIMIT 5000");
        $st->execute([$storeId]);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return [];
    }
}

function souq_write_sitemap(): void
{
    $host = souq_seo_host();
    $origin = souq_seo_origin($host);
    $store = souq_seo_store($host);
    $storeId = $store ? (string)$store['id'] : '';
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    $pages = ['/', '/products'];
    foreach ($pages as $path) {
        echo "  <url><loc>" . htmlspecialchars($origin . $path, ENT_QUOTES) . "</loc></url>\n";
    }
    foreach (souq_seo_products($storeId) as $product) {
        $id = rawurlencode((string)$product['id']);
        echo "  <url><loc>" . htmlspecialchars($origin . '/product/' . $id, ENT_QUOTES) . "</loc></url>\n";
    }
    echo "</urlset>\n";
}

function souq_write_robots(): void
{
    $host = souq_seo_host();
    $origin = souq_seo_origin($host);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo "User-agent: *\n";
    echo "Allow: /\n";
    echo "Disallow: /admin\n";
    echo "Disallow: /master\n";
    echo "Sitemap: {$origin}/sitemap.xml\n";
}
