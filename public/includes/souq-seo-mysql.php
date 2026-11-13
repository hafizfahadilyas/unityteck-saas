<?php
/**
 * Hostinger MySQL SEO helper for storefront-shell / sitemap / robots.
 * Credentials: public/seo-db.local.php (gitignored) OR apps/api/.env on same host.
 * Never invents meta; missing store → platform defaults only.
 */
declare(strict_types=1);

function souq_seo_normalize_host(?string $host): string
{
    $host = strtolower((string) preg_replace('/:\d+$/', '', (string) $host));
    if (str_starts_with($host, 'www.')) {
        $host = substr($host, 4);
    }
    return $host;
}

function souq_seo_load_db_config(): ?array
{
    $local = dirname(__DIR__) . '/seo-db.local.php';
    if (is_file($local)) {
        $cfg = require $local;
        if (is_array($cfg) && !empty($cfg['host']) && !empty($cfg['database'])) {
            return $cfg;
        }
    }

    $envPaths = [
        dirname(__DIR__, 2) . '/apps/api/.env',
        dirname(__DIR__) . '/../apps/api/.env',
        dirname(__DIR__) . '/.env',
    ];
    foreach ($envPaths as $envPath) {
        if (!is_file($envPath)) {
            continue;
        }
        $vars = [];
        foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            $v = trim($v, " \t\"'");
            $vars[$k] = $v;
        }
        if (($vars['DB_CONNECTION'] ?? '') === 'sqlite') {
            continue;
        }
        if (!empty($vars['DB_HOST']) && !empty($vars['DB_DATABASE'])) {
            return [
                'host' => $vars['DB_HOST'],
                'port' => (int) ($vars['DB_PORT'] ?? 3306),
                'database' => $vars['DB_DATABASE'],
                'username' => $vars['DB_USERNAME'] ?? '',
                'password' => $vars['DB_PASSWORD'] ?? '',
            ];
        }
    }

    return null;
}

function souq_seo_pdo(): ?PDO
{
    static $pdo = false;
    if ($pdo !== false) {
        return $pdo instanceof PDO ? $pdo : null;
    }
    $cfg = souq_seo_load_db_config();
    if (!$cfg) {
        $pdo = null;
        return null;
    }
    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $cfg['host'],
            $cfg['port'] ?? 3306,
            $cfg['database']
        );
        $pdo = new PDO($dsn, (string) ($cfg['username'] ?? ''), (string) ($cfg['password'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (Throwable $e) {
        $pdo = null;
        return null;
    }
}

function souq_seo_api_bootstrap(string $host): ?array
{
    $base = getenv('SOUQ_API_BASE') ?: '';
    $local = dirname(__DIR__) . '/seo-db.local.php';
    if ($base === '' && is_file($local)) {
        $cfg = require $local;
        if (is_array($cfg) && !empty($cfg['api_base'])) {
            $base = (string) $cfg['api_base'];
        }
    }
    if ($base === '') {
        return null;
    }
    $url = rtrim($base, '/') . '/storefront/seo-bootstrap?host=' . rawurlencode($host);
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 4,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\n",
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $json = json_decode($raw, true);
    return is_array($json) && !empty($json['resolved']) ? $json : null;
}

/**
 * Shared-host path/query can force a tenant (mieraf coffee + bleco).
 * Returns canonical store_id or null when host alone decides.
 */
function souq_seo_store_hint_from_request(?string $path = null, ?array $query = null): ?string
{
    $path = strtolower((string) ($path ?? ''));
    $query = is_array($query) ? $query : [];
    $s = strtolower(trim((string) ($query['store'] ?? $query['storeId'] ?? $query['store_id'] ?? '')));

    $isCar = in_array($s, ['bleco', 'store-bleco', 'cars', 'car', 'alsaeedi'], true)
        || str_starts_with($path, '/bleco')
        || str_starts_with($path, '/car');
    if ($isCar) {
        return 'store-bleco';
    }

    $isCoffee = in_array($s, ['coffee', 'store-coffee', 'roasters', 'hibrew'], true)
        || str_starts_with($path, '/coffee');
    if ($isCoffee) {
        return 'store-coffee';
    }

    return null;
}

/**
 * @return array{store_id:?string,title:string,description:string,keywords:string,canonical:string,gtm:?string,ga4:?string,gsc:?string,og_image:string,lang:string,dir:string,product_ids:array,page_slugs:array}|null
 */
function souq_seo_resolve_store(string $storeId, string $host = ''): ?array
{
    $storeId = trim($storeId);
    if ($storeId === '') {
        return null;
    }
    $host = souq_seo_normalize_host($host);
    $pdo = souq_seo_pdo();
    if (!$pdo) {
        return null;
    }

    try {
        $st = $pdo->prepare(
            'SELECT id, name, locale, text_direction, logo, custom_domain, domain, demo_domain FROM stores WHERE id = ? LIMIT 1'
        );
        $st->execute([$storeId]);
        $store = $st->fetch() ?: null;
        if (!$store) {
            return null;
        }

        $seoSt = $pdo->prepare(
            'SELECT meta_title, meta_description, keywords, canonical_url, search_console_tag,
                    ga4_measurement_id, gtm_container_id, extra
             FROM seo_configs WHERE store_id = ? LIMIT 1'
        );
        $seoSt->execute([$storeId]);
        $seo = $seoSt->fetch() ?: [];
        $extra = [];
        if (!empty($seo['extra'])) {
            $decoded = json_decode((string) $seo['extra'], true);
            if (is_array($decoded)) {
                $extra = $decoded;
            }
        }

        $isAr = strtolower((string) ($store['locale'] ?? 'ar')) === 'ar'
            || strtolower((string) ($store['text_direction'] ?? 'rtl')) === 'rtl';

        // Path/query bleco on shared coffee host: never leave coffee meta if bleco SEO row empty.
        $fallbackTitle = '';
        $fallbackDesc = '';
        if ($storeId === 'store-bleco') {
            $fallbackTitle = $isAr
                ? 'متجر السعيدي لخدمات السيارات | تنجيد وتلبيس مقاعد السيارات بمكة المكرمة'
                : 'Al-Saeedi VIP Automotive Services | Luxury Car Seat Upholstery & Floor Protection Makkah';
            $fallbackDesc = $isAr
                ? 'خدمات تنجيد وتلبيس مقاعد السيارات وتفصيل الدعاسات الفاخرة المقاومة للماء والأتربة بأعلى معايير الحرفية بمكة المكرمة'
                : 'High-precision laser cut automotive seat upholstery, luxury 5D diamond floor mats and interior restoration in Makkah, Saudi Arabia.';
        } elseif ($storeId === 'store-coffee') {
            $fallbackTitle = $isAr
                ? 'هايبرو السعودية | المتجر الرسمي لمكائن ومستلزمات القهوة المختصة'
                : 'HiBrew KSA | Official Coffee Store - Espresso Machines & Specialty Coffee Gear';
            $fallbackDesc = $isAr
                ? 'متخصصون في بيع مكائن القهوة ومستلزماتها ذات الجودة العالية | مكائن ٢٠ بار، مطاحن بن تيتانيوم، أركان ودواليب القهوة الفاخرة بالسعودية'
                : 'Official HiBrew Saudi Arabia distributor for commercial & home espresso machines, titanium conical grinders and luxury coffee bar setups.';
        }

        $title = trim((string) (
            ($isAr ? ($extra['meta_title_ar'] ?? '') : ($extra['meta_title_en'] ?? ''))
            ?: ($seo['meta_title'] ?? '')
            ?: $fallbackTitle
            ?: ($store['name'] ?? '')
        ));
        $description = trim((string) (
            ($isAr ? ($extra['meta_description_ar'] ?? '') : ($extra['meta_description_en'] ?? ''))
            ?: ($seo['meta_description'] ?? '')
            ?: $fallbackDesc
        ));
        $keywords = trim((string) (
            ($isAr ? ($extra['keywords_ar'] ?? '') : ($extra['keywords_en'] ?? ''))
            ?: ($seo['keywords'] ?? '')
        ));
        $canonical = trim((string) ($seo['canonical_url'] ?? ''));
        if ($canonical === '' && $host !== '') {
            $canonical = 'https://' . $host . '/';
            if ($storeId === 'store-bleco') {
                $canonical = 'https://' . $host . '/?store=bleco';
            }
        }

        $prodSt = $pdo->prepare(
            "SELECT id FROM products WHERE store_id = ? AND (status IS NULL OR status != 'archived') ORDER BY updated_at DESC LIMIT 5000"
        );
        $prodSt->execute([$storeId]);
        $productIds = array_column($prodSt->fetchAll() ?: [], 'id');

        $pageSlugs = [];
        try {
            $pageSt = $pdo->prepare(
                "SELECT slug FROM theme_pages WHERE store_id = ? AND status = 'published' AND published_layout IS NOT NULL"
            );
            $pageSt->execute([$storeId]);
            $pageSlugs = array_column($pageSt->fetchAll() ?: [], 'slug');
        } catch (Throwable $e) {
            $pageSlugs = [];
        }

        return [
            'store_id' => $storeId,
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'canonical' => $canonical,
            'gtm' => trim((string) ($seo['gtm_container_id'] ?? '')) ?: null,
            'ga4' => trim((string) ($seo['ga4_measurement_id'] ?? '')) ?: null,
            'gsc' => trim((string) ($seo['search_console_tag'] ?? '')) ?: null,
            'og_image' => trim((string) ($store['logo'] ?? '')),
            'lang' => $isAr ? 'ar' : 'en',
            'dir' => $isAr ? 'rtl' : 'ltr',
            'product_ids' => $productIds,
            'page_slugs' => $pageSlugs,
        ];
    } catch (Throwable $e) {
        return null;
    }
}

/**
 * @return array{store_id:?string,title:string,description:string,keywords:string,canonical:string,gtm:?string,ga4:?string,gsc:?string,og_image:string,lang:string,dir:string,product_ids:array,page_slugs:array}|null
 */
function souq_seo_resolve(string $host, ?string $path = null, ?array $query = null): ?array
{
    $host = souq_seo_normalize_host($host);
    if ($host === '') {
        return null;
    }

    $hint = souq_seo_store_hint_from_request($path, $query);
    if ($hint) {
        $byHint = souq_seo_resolve_store($hint, $host);
        if ($byHint) {
            return $byHint;
        }
    }

    $api = souq_seo_api_bootstrap($host);
    if ($api) {
        $meta = is_array($api['meta'] ?? null) ? $api['meta'] : [];
        $tracking = is_array($api['tracking'] ?? null) ? $api['tracking'] : [];
        $sitemap = is_array($api['sitemap'] ?? null) ? $api['sitemap'] : [];
        return [
            'store_id' => (string) ($api['store_id'] ?? ''),
            'title' => (string) ($meta['title'] ?? ''),
            'description' => (string) ($meta['description'] ?? ''),
            'keywords' => (string) ($meta['keywords'] ?? ''),
            'canonical' => (string) ($meta['canonical'] ?? ('https://' . $host . '/')),
            'gtm' => $tracking['gtm_container_id'] ?? null,
            'ga4' => $tracking['ga4_measurement_id'] ?? null,
            'gsc' => $tracking['search_console_tag'] ?? null,
            'og_image' => (string) ($meta['og_image'] ?? ''),
            'lang' => (string) ($api['lang'] ?? 'ar'),
            'dir' => (string) ($api['dir'] ?? 'rtl'),
            'product_ids' => array_values($sitemap['product_ids'] ?? []),
            'page_slugs' => array_values($sitemap['pages'] ?? []),
        ];
    }

    $pdo = souq_seo_pdo();
    if (!$pdo) {
        return null;
    }

    try {
        $store = null;
        $st = $pdo->prepare(
            'SELECT id, name, locale, text_direction, logo, custom_domain, domain, demo_domain
             FROM stores
             WHERE custom_domain = ? OR domain = ? OR demo_domain = ?
                OR custom_domain = ? OR domain = ?
             LIMIT 1'
        );
        $www = 'www.' . $host;
        $st->execute([$host, $host, $host, $www, $www]);
        $store = $st->fetch() ?: null;

        if (!$store) {
            $st2 = $pdo->prepare('SELECT store_id FROM domains WHERE domain_name = ? OR domain_name = ? LIMIT 1');
            $st2->execute([$host, $www]);
            $sid = $st2->fetchColumn();
            if ($sid) {
                $st3 = $pdo->prepare(
                    'SELECT id, name, locale, text_direction, logo, custom_domain, domain, demo_domain FROM stores WHERE id = ? LIMIT 1'
                );
                $st3->execute([(string) $sid]);
                $store = $st3->fetch() ?: null;
            }
        }

        if (!$store && ($host === 'mieraf-ksa.com' || $host === 'specialtycoffee.sa')) {
            $st4 = $pdo->prepare(
                'SELECT id, name, locale, text_direction, logo, custom_domain, domain, demo_domain FROM stores WHERE id = ? LIMIT 1'
            );
            $st4->execute(['store-coffee']);
            $store = $st4->fetch() ?: null;
        }

        if (!$store) {
            return null;
        }

        return souq_seo_resolve_store((string) $store['id'], $host);
    } catch (Throwable $e) {
        return null;
    }
}
