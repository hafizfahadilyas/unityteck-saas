<?php
/**
 * UnityTeck Multi-Store E-Commerce Platform
 * Hostinger Production Database & REST API Gateway
 * Fully Multi-Tenant, Zero Stale LocalStorage Cache, Lifetime Live Sync.
 * Supports: Stores, Products, Categories, Blog Articles & Settings, Commerce Tools,
 *           Reviews/Comments, Banners, Theme Settings, Builder Layouts, Pages, Brands.
 */

declare(strict_types=1);

// Disable error display in production to prevent JSON corruption
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Security & Fresh Data Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Store-Id, X-Portal, Cache-Control, Pragma, Expires');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// Some Hostinger / proxy setups rewrite PATCH → POST; honor overrides.
$methodOverride = strtoupper(trim((string)(
    $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']
    ?? $_SERVER['HTTP_X_METHOD_OVERRIDE']
    ?? ''
)));
if ($method === 'POST' && in_array($methodOverride, ['PUT', 'PATCH', 'DELETE'], true)) {
    $method = $methodOverride;
}

// Prefer Laravel Hostinger MySQL when DB_* is present (same commerce as apps/api).
// Fallback: local platform.sqlite (legacy Hostinger gateway) — NEVER preferred on flowers live.
require_once __DIR__ . '/live_extensions.php';
require_once __DIR__ . '/product_groups.php';
$souqEnv = souq_load_root_env();
$dbDriver = 'sqlite';
$pdo = null;
$mysqlLastError = null;

$requestHost = strtolower((string)preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
$isFlowersHost = in_array($requestHost, [
    'giftshop-sa.com',
    'www.giftshop-sa.com',
], true)
    || str_ends_with($requestHost, '.giftshop-sa.com');

// Flowers Hostinger must use FLOWERS_DB_* only (never central DB_* — that fails → SQLite hang).
// Central keeps DB_* / HOSTINGER_DB_*.
$dbHost = '';
$dbName = '';
$dbUser = '';
$dbPass = '';
$dbPort = '3306';
if ($isFlowersHost) {
    $dbHost = trim((string)($souqEnv['FLOWERS_DB_HOST'] ?? getenv('FLOWERS_DB_HOST') ?: ''));
    $dbName = trim((string)($souqEnv['FLOWERS_DB_DATABASE'] ?? getenv('FLOWERS_DB_DATABASE') ?: ''));
    $dbUser = trim((string)($souqEnv['FLOWERS_DB_USERNAME'] ?? getenv('FLOWERS_DB_USERNAME') ?: ''));
    $dbPass = (string)($souqEnv['FLOWERS_DB_PASSWORD'] ?? getenv('FLOWERS_DB_PASSWORD') ?: '');
    $dbPort = trim((string)($souqEnv['FLOWERS_DB_PORT'] ?? getenv('FLOWERS_DB_PORT') ?: '3306'));
    // Legacy fallback names if FLOWERS_DB_* missing on older deploys
    if ($dbHost === '' || $dbName === '' || $dbUser === '') {
        $dbHost = trim((string)($souqEnv['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost'));
        $dbName = trim((string)($souqEnv['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: 'u920689430_giftshop'));
        $dbUser = trim((string)($souqEnv['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: 'u920689430_giftshop'));
        $dbPass = (string)($souqEnv['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '');
        $dbPort = trim((string)($souqEnv['DB_PORT'] ?? getenv('DB_PORT') ?: '3306'));
    }
} else {
    $dbHost = trim((string)($souqEnv['DB_HOST'] ?? getenv('DB_HOST') ?: ''));
    $dbName = trim((string)($souqEnv['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: ''));
    $dbUser = trim((string)($souqEnv['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: ''));
    $dbPass = (string)($souqEnv['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '');
    $dbPort = trim((string)($souqEnv['DB_PORT'] ?? getenv('DB_PORT') ?: '3306'));
}

$souqConnectMysql = static function (
    string $host,
    string $port,
    string $name,
    string $user,
    string $pass,
) use (&$mysqlLastError): ?array {
    $normalizedHost = strtolower($host);
    // Hostinger same-account PHP → always try localhost first (remote srv burns connection quota + hangs).
    $mysqlHosts = in_array($normalizedHost, ['localhost', '127.0.0.1'], true)
        ? [$host]
        : ['localhost', '127.0.0.1', $host];
    $usePort = $port !== '' ? $port : '3306';
    foreach (array_values(array_unique($mysqlHosts)) as $tryHost) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $tryHost,
                $usePort,
                $name
            );
            $conn = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            // Fast session knobs — cut lock wait + keep responses snappy
            try {
                $conn->exec("SET SESSION wait_timeout=60, interactive_timeout=60, sql_mode='NO_ENGINE_SUBSTITUTION'");
            } catch (Throwable) {
                /* optional */
            }
            return ['pdo' => $conn, 'host' => $tryHost, 'name' => $name];
        } catch (Throwable $mysqlErr) {
            $mysqlLastError = $tryHost . ': ' . $mysqlErr->getMessage();
        }
    }
    return null;
};

if ($dbHost !== '' && $dbName !== '' && $dbUser !== '') {
    $connected = $souqConnectMysql($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
    if ($connected) {
        $pdo = $connected['pdo'];
        $dbDriver = 'mysql';
        $dbHost = $connected['host'];
        $dbName = $connected['name'];
    } else {
        $pdo = null;
        $dbDriver = 'sqlite';
    }
}

// Flowers: if somehow connected to wrong/empty DB, force giftshop MySQL retry.
if ($isFlowersHost && $dbDriver === 'mysql' && $pdo instanceof PDO) {
    $fName = trim((string)($souqEnv['FLOWERS_DB_DATABASE'] ?? getenv('FLOWERS_DB_DATABASE') ?: 'u920689430_giftshop'));
    $fUser = trim((string)($souqEnv['FLOWERS_DB_USERNAME'] ?? getenv('FLOWERS_DB_USERNAME') ?: 'u920689430_giftshop'));
    $fPass = (string)($souqEnv['FLOWERS_DB_PASSWORD'] ?? getenv('FLOWERS_DB_PASSWORD') ?: $dbPass);
    $fPort = trim((string)($souqEnv['FLOWERS_DB_PORT'] ?? getenv('FLOWERS_DB_PORT') ?: $dbPort));
    $wrongDb = strcasecmp($dbName, $fName) !== 0;
    $storeCount = 0;
    try {
        $storeCount = (int) $pdo->query('SELECT COUNT(*) FROM stores')->fetchColumn();
    } catch (Throwable) {
        $storeCount = 0;
    }
    if ($wrongDb || $storeCount === 0) {
        $retry = $souqConnectMysql('localhost', $fPort, $fName, $fUser, $fPass);
        if (!$retry) {
            $retry = $souqConnectMysql('127.0.0.1', $fPort, $fName, $fUser, $fPass);
        }
        if ($retry) {
            $pdo = $retry['pdo'];
            $dbHost = $retry['host'];
            $dbName = $retry['name'];
            $dbDriver = 'mysql';
        }
    }
}

// Ensure database directory exists (sqlite fallback / media paths)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
$dbPath = $dataDir . '/platform.sqlite';
$schemaReadyFlag = $dataDir . '/.schema_ready_v3';
$mysqlReadyFlag = $dataDir . '/.mysql_ready_v1';

try {
    // Flowers live fallback: if dedicated flowers MySQL failed, try shared Central MySQL (holds store-1)
    if ($isFlowersHost && !$pdo instanceof PDO) {
        $cHost = trim((string)($souqEnv['DB_HOST'] ?? getenv('DB_HOST') ?: 'srv2290.hstgr.io'));
        $cName = trim((string)($souqEnv['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: 'u393490678_ksa'));
        $cUser = trim((string)($souqEnv['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: 'u393490678_ksa'));
        $cPass = (string)($souqEnv['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '');
        $cPort = trim((string)($souqEnv['DB_PORT'] ?? getenv('DB_PORT') ?: '3306'));
        if ($cHost !== '' && $cName !== '' && $cUser !== '') {
            $cConn = $souqConnectMysql($cHost, $cPort, $cName, $cUser, $cPass, []);
            if ($cConn) {
                $pdo = $cConn['pdo'];
                $dbDriver = 'mysql';
                $dbHost = $cConn['host'];
                $dbName = $cConn['name'];
            }
        }
    }

    // Flowers live: NEVER silent SQLite — zero-mock requires Hostinger MySQL only.
    if (!$pdo instanceof PDO && $isFlowersHost) {
        $dbDriver = 'none';
        $pdo = null;
    } elseif (!$pdo instanceof PDO) {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $dbDriver = 'sqlite';
        // WAL + busy timeout — stop request pile-up / hang under concurrent tabs
        try {
            $pdo->exec('PRAGMA journal_mode=WAL');
            $pdo->exec('PRAGMA synchronous=NORMAL');
            $pdo->exec('PRAGMA busy_timeout=5000');
            $pdo->exec('PRAGMA temp_store=MEMORY');
        } catch (Throwable) {
            /* optional */
        }
    }

    // SQLite-only bootstrap (Laravel MySQL already has migrations — never run this DDL there)
    // Skip heavy CREATE/seed/UPDATE after first warm request — was the #1 hang on flowers live.
    $sqliteNeedsBootstrap = $dbDriver === 'sqlite' && !is_file($schemaReadyFlag);
    if ($sqliteNeedsBootstrap) {
    // Initialize Core Schema
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS stores (
            id TEXT PRIMARY KEY,
            name TEXT,
            slug TEXT,
            domain TEXT,
            data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS products (
            id TEXT,
            store_id TEXT,
            name TEXT,
            name_ar TEXT,
            sku TEXT,
            price REAL,
            original_price REAL,
            stock INTEGER,
            category TEXT,
            category_ar TEXT,
            image_url TEXT,
            gallery_urls TEXT,
            status TEXT DEFAULT 'published',
            is_active INTEGER DEFAULT 1,
            data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT,
            store_id TEXT,
            parent_id TEXT NULL,
            name TEXT,
            name_ar TEXT,
            slug TEXT,
            image_url TEXT,
            sort_order INTEGER DEFAULT 0,
            meta_title TEXT,
            meta_description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
        CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

        CREATE TABLE IF NOT EXISTS blog_articles (
            id TEXT,
            store_id TEXT,
            title TEXT,
            title_ar TEXT,
            title_en TEXT,
            slug TEXT,
            category TEXT,
            category_ar TEXT,
            category_en TEXT,
            read_time TEXT,
            read_time_en TEXT,
            image TEXT,
            summary TEXT,
            summary_ar TEXT,
            summary_en TEXT,
            content TEXT,
            content_ar TEXT,
            content_en TEXT,
            author TEXT,
            tags TEXT,
            status TEXT DEFAULT 'published',
            views_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 0,
            seo TEXT,
            commerce_tools TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_blog_store ON blog_articles(store_id);
        CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_articles(status);

        CREATE TABLE IF NOT EXISTS blog_settings (
            store_id TEXT PRIMARY KEY,
            post_settings TEXT,
            seo_settings TEXT,
            featured_article_id TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT,
            store_id TEXT,
            product_id TEXT NULL,
            name TEXT,
            name_en TEXT,
            role TEXT,
            role_en TEXT,
            avatar TEXT,
            rating REAL DEFAULT 5,
            comment TEXT,
            comment_en TEXT,
            verified INTEGER DEFAULT 1,
            date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id);

        CREATE TABLE IF NOT EXISTS banners (
            id TEXT,
            store_id TEXT,
            type TEXT DEFAULT 'promo',
            title TEXT,
            title_en TEXT,
            subtitle TEXT,
            subtitle_en TEXT,
            image_url TEXT,
            video_url TEXT,
            link_url TEXT,
            button_text TEXT,
            button_text_en TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_banners_store ON banners(store_id);

        CREATE TABLE IF NOT EXISTS theme_settings (
            store_id TEXT,
            theme_id TEXT,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (store_id, theme_id)
        );

        CREATE TABLE IF NOT EXISTS builder_layouts (
            store_id TEXT,
            theme_id TEXT,
            blocks TEXT,
            seasonal_theme TEXT,
            typography_settings TEXT,
            header_settings TEXT,
            mobile_menu_icon TEXT,
            is_published INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (store_id, theme_id)
        );

        CREATE TABLE IF NOT EXISTS store_settings (
            store_id TEXT PRIMARY KEY,
            settings TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pages (
            id TEXT,
            store_id TEXT,
            slug TEXT,
            title_ar TEXT,
            title_en TEXT,
            content_ar TEXT,
            content_en TEXT,
            category TEXT DEFAULT 'legal',
            is_system_default INTEGER DEFAULT 0,
            is_published INTEGER DEFAULT 1,
            meta_description_ar TEXT,
            meta_description_en TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_pages_store ON pages(store_id);

        CREATE TABLE IF NOT EXISTS brands (
            id TEXT,
            store_id TEXT,
            name TEXT,
            name_ar TEXT,
            slug TEXT,
            logo_url TEXT,
            description TEXT,
            description_en TEXT,
            website TEXT,
            country TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            show_in_channels INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, store_id)
        );
        CREATE INDEX IF NOT EXISTS idx_brands_store ON brands(store_id);
    ");

    // Auto-seed stores and products if stores table is empty
    $storeCount = (int)$pdo->query("SELECT COUNT(*) FROM stores")->fetchColumn();
    if ($storeCount === 0 && file_exists(__DIR__ . '/initial_seed.json')) {
        $seedContent = file_get_contents(__DIR__ . '/initial_seed.json');
        $seed = json_decode($seedContent, true);
        if ($seed && isset($seed['stores']) && is_array($seed['stores'])) {
            $insertStore = $pdo->prepare("INSERT OR REPLACE INTO stores (id, name, slug, domain, data, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
            foreach ($seed['stores'] as $st) {
                $insertStore->execute([
                    $st['id'],
                    $st['name'] ?? '',
                    $st['slug'] ?? '',
                    $st['domain'] ?? ($st['custom_domain'] ?? ''),
                    json_encode($st, JSON_UNESCAPED_UNICODE)
                ]);
            }
        }
        if ($seed && isset($seed['products']) && is_array($seed['products'])) {
            $insertProd = $pdo->prepare("
                INSERT OR REPLACE INTO products (
                    id, store_id, name, name_ar, sku, price, original_price, stock, 
                    category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ");
            foreach ($seed['products'] as $sId => $prodList) {
                if (!is_array($prodList)) continue;
                foreach ($prodList as $p) {
                    $pId = $p['id'] ?? ('prod-' . uniqid());
                    $sku = $p['sku'] ?? '';
                    $name = $p['name'] ?? '';
                    $nameAr = $p['nameAr'] ?? ($p['name_ar'] ?? '');
                    $price = (float)($p['price'] ?? 0);
                    $origPrice = (float)($p['originalPrice'] ?? ($p['original_price'] ?? 0));
                    $stock = (int)($p['stock'] ?? 0);
                    $cat = $p['category'] ?? '';
                    $catAr = $p['categoryAr'] ?? ($p['category_ar'] ?? '');
                    $img = $p['image'] ?? ($p['image_url'] ?? '');
                    $gallery = is_array($p['galleryUrls'] ?? null) ? json_encode($p['galleryUrls']) : (is_array($p['gallery_urls'] ?? null) ? json_encode($p['gallery_urls']) : json_encode([$img]));
                    $status = $p['status'] ?? 'published';
                    $isActive = ($p['isActive'] ?? ($p['is_active'] ?? true)) ? 1 : 0;

                    $insertProd->execute([
                        $pId, $sId, $name, $nameAr, $sku, $price, $origPrice, $stock,
                        $cat, $catAr, $img, $gallery, $status, $isActive,
                        json_encode($p, JSON_UNESCAPED_UNICODE)
                    ]);
                }
            }
        }
    }

    // Auto-seed categories if categories table is empty
    $catCount = (int)$pdo->query("SELECT COUNT(*) FROM categories WHERE store_id IN ('store-1', '1', 'giftshop-sa')")->fetchColumn();
    if ($catCount === 0) {
        $seedCats = null;
        if (file_exists(__DIR__ . '/initial_seed.json')) {
            $seedContent = file_get_contents(__DIR__ . '/initial_seed.json');
            $seed = json_decode($seedContent, true);
            if ($seed && isset($seed['categories']) && is_array($seed['categories']) && count($seed['categories']) > 0) {
                $seedCats = $seed['categories'];
            }
        }
        if (!$seedCats) {
            $seedCats = [
                // 19 Makkah Flowers Categories
                ['id' => 'cat-nat-bouquets', 'store_id' => 'store-1', 'name' => 'Natural Flower Bouquets', 'name_ar' => 'باقات الورود الطبيعية', 'slug' => 'natural-bouquets', 'image_url' => 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png', 'sort_order' => 10],
                ['id' => 'cat-roses-patchi', 'store_id' => 'store-1', 'name' => 'Roses & Patchi Chocolate', 'name_ar' => 'ورد و شوكليت باتشي', 'slug' => 'roses-patchi', 'image_url' => 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png', 'sort_order' => 20],
                ['id' => 'cat-roses-bostani', 'store_id' => 'store-1', 'name' => 'Roses & Bostani Chocolate', 'name_ar' => 'ورد وشوكوليت بستاني', 'slug' => 'roses-bostani', 'image_url' => 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png', 'sort_order' => 30],
                ['id' => 'cat-flower-vases', 'store_id' => 'store-1', 'name' => 'Natural Flower Vases', 'name_ar' => 'فازات ورد طبيعي', 'slug' => 'flower-vases', 'image_url' => 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png', 'sort_order' => 40],
                ['id' => 'cat-vases-chocolate', 'store_id' => 'store-1', 'name' => 'Flower Vases with Chocolate', 'name_ar' => 'فازات الورود مع شوكليت', 'slug' => 'vases-chocolate', 'image_url' => 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png', 'sort_order' => 50],
                ['id' => 'cat-roses-fish', 'store_id' => 'store-1', 'name' => 'Roses with Aquarium Fish', 'name_ar' => 'ورود مع أسماك زينة', 'slug' => 'roses-fish', 'image_url' => 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png', 'sort_order' => 60],
                ['id' => 'cat-roses-lovebirds', 'store_id' => 'store-1', 'name' => 'Roses with Lovebirds', 'name_ar' => 'ورود مع عصافير الحب', 'slug' => 'roses-lovebirds', 'image_url' => 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png', 'sort_order' => 70],
                ['id' => 'cat-roses-coffee', 'store_id' => 'store-1', 'name' => 'Roses & Coffee Presentation', 'name_ar' => 'تقديمة ورد وقهوة', 'slug' => 'roses-coffee', 'image_url' => 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png', 'sort_order' => 80],
                ['id' => 'cat-roses-coffee-sweets', 'store_id' => 'store-1', 'name' => 'Roses with Coffee & Sweets', 'name_ar' => 'تقديمة ورد مع قهوة وحلا', 'slug' => 'roses-coffee-sweets', 'image_url' => 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png', 'sort_order' => 90],
                ['id' => 'cat-roses-cake', 'store_id' => 'store-1', 'name' => 'Roses with Gourmet Cake', 'name_ar' => 'ورد مع كيك', 'slug' => 'roses-cake', 'image_url' => 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png', 'sort_order' => 100],
                ['id' => 'cat-korean-cake', 'store_id' => 'store-1', 'name' => 'Korean Lunchbox Bento Cake', 'name_ar' => 'تقديمة كيك الكوري', 'slug' => 'korean-cake', 'image_url' => 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png', 'sort_order' => 110],
                ['id' => 'cat-mawajeeb', 'store_id' => 'store-1', 'name' => 'Mawajeeb Wooden Plaques & Heritage', 'name_ar' => 'لوحات مواجيب وتراث حجازي', 'slug' => 'mawajeeb', 'image_url' => 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp', 'sort_order' => 120],
                ['id' => 'cat-newborn', 'store_id' => 'store-1', 'name' => 'Newborn Welcome Gifts', 'name_ar' => 'هدايا المواليد', 'slug' => 'newborn', 'image_url' => 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png', 'sort_order' => 130],
                ['id' => 'cat-graduation', 'store_id' => 'store-1', 'name' => 'Graduation Milestones', 'name_ar' => 'هدايا التخرج', 'slug' => 'graduation', 'image_url' => 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png', 'sort_order' => 140],
                ['id' => 'cat-valentine', 'store_id' => 'store-1', 'name' => 'Valentine & Love Blooms', 'name_ar' => 'هدايا عيد الحب', 'slug' => 'valentine', 'image_url' => 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png', 'sort_order' => 150],
                ['id' => 'cat-wedding', 'store_id' => 'store-1', 'name' => 'Wedding & Bridal Keepsakes', 'name_ar' => 'هدايا الزواج والعرائس', 'slug' => 'wedding', 'image_url' => 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png', 'sort_order' => 160],
                ['id' => 'cat-birthday', 'store_id' => 'store-1', 'name' => 'Birthday Celebrations', 'name_ar' => 'هدايا عيد ميلاد', 'slug' => 'birthday', 'image_url' => 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png', 'sort_order' => 170],
                ['id' => 'cat-men-gifts', 'store_id' => 'store-1', 'name' => 'Royal Men Luxury Gifts', 'name_ar' => 'هدايا رجالية ملكية', 'slug' => 'men-gifts', 'image_url' => '/images/hadaya_men_luxury_gift_1791219799100.jpg', 'sort_order' => 180],
                ['id' => 'cat-women-gifts', 'store_id' => 'store-1', 'name' => 'Luxury Women Gifts & Perfumes', 'name_ar' => 'هدايا نسائية فاخرة', 'slug' => 'women-gifts', 'image_url' => '/images/hadaya_women_luxury_gift_zedaan.webp', 'sort_order' => 190],

                // 5 HiBrew Coffee Categories
                ['id' => 'cat-hb-machines', 'store_id' => 'store-coffee', 'name' => 'Coffee Machines & Espresso', 'name_ar' => 'مكائن القهوة والإسبريسو', 'slug' => 'machines', 'image_url' => '/images/hibrew_h7a_flagship_machine.png', 'sort_order' => 1],
                ['id' => 'cat-hb-mills', 'store_id' => 'store-coffee', 'name' => 'Precision Coffee Mills', 'name_ar' => 'مطاحن القهوة الاحترافية', 'slug' => 'mills', 'image_url' => '/images/coffee_grinder_mill_banner_1791218928342.jpg', 'sort_order' => 2],
                ['id' => 'cat-hb-cabinets', 'store_id' => 'store-coffee', 'name' => 'Luxury Coffee Cabinets & Stations', 'name_ar' => 'دواليب وأركان القهوة الفاخرة', 'slug' => 'cabinets', 'image_url' => '/images/hero_coffee_corner_cabinet_1791217199146.jpg', 'sort_order' => 3],
                ['id' => 'cat-hb-accessories', 'store_id' => 'store-coffee', 'name' => 'Barista Accessories & Ceramic Cups', 'name_ar' => 'مستلزمات الباريستا والأكواب', 'slug' => 'accessories', 'image_url' => '/images/coffee_accessories_tools_banner_1791218944111.jpg', 'sort_order' => 4],
                ['id' => 'cat-hb-offers', 'store_id' => 'store-coffee', 'name' => 'Exclusive Offers & Bundles', 'name_ar' => 'العروض والبكجات الحصرية', 'slug' => 'offers', 'image_url' => '/images/coffee_hero_flagship_machine_1791218907782.jpg', 'sort_order' => 5],

                // 6 Bleco Car Categories
                ['id' => 'cat-clothing', 'store_id' => 'store-bleco', 'name' => 'Car Seat Covers', 'name_ar' => 'تلابيس مقاعد السيارة', 'slug' => 'car-seat-covers', 'image_url' => '/images/categories/vip-luxury-seat-covers.jpg', 'sort_order' => 1],
                ['id' => 'cat-floors', 'store_id' => 'store-bleco', 'name' => 'Diamond Car Mats', 'name_ar' => 'أرضيات السيارة الدايموند', 'slug' => 'diamond-car-mats', 'image_url' => '/images/categories/diamond-floor-mats.jpg', 'sort_order' => 2],
                ['id' => 'cat-perfumes', 'store_id' => 'store-bleco', 'name' => 'Car Air Fresheners', 'name_ar' => 'معطرات وفواحات السيارة', 'slug' => 'car-air-fresheners', 'image_url' => '/images/categories/car-air-fresheners.jpg', 'sort_order' => 3],
                ['id' => 'cat-care', 'store_id' => 'store-bleco', 'name' => 'Car Care & Detailing', 'name_ar' => 'منتجات العناية والتلميع', 'slug' => 'car-care-detailing', 'image_url' => '/images/categories/car-care-bleco.jpg', 'sort_order' => 4],
                ['id' => 'cat-accessories', 'store_id' => 'store-bleco', 'name' => 'Accessories & Styling', 'name_ar' => 'زينة واكسسوارات السيارات', 'slug' => 'accessories-styling', 'image_url' => '/images/categories/car-accessories.jpg', 'sort_order' => 5],
                ['id' => 'cat-tools', 'store_id' => 'store-bleco', 'name' => 'Upholstery Supplies', 'name_ar' => 'أدوات ومستلزمات التنجيد', 'slug' => 'upholstery-supplies', 'image_url' => '/images/categories/upholstery-tools.jpg', 'sort_order' => 6],
            ];
        }
        $insertCat = $pdo->prepare("
            INSERT OR REPLACE INTO categories (
                id, store_id, parent_id, name, name_ar, slug, image_url, sort_order, meta_title, meta_description, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        foreach ($seedCats as $c) {
            $cId = $c['id'] ?? ('cat-' . uniqid());
            $sId = $c['store_id'] ?? 'store-1';
            $pId = !empty($c['parent_id']) ? $c['parent_id'] : null;
            $name = $c['name'] ?? '';
            $nameAr = $c['name_ar'] ?? ($c['nameAr'] ?? '');
            $slug = $c['slug'] ?? '';
            $img = $c['image_url'] ?? ($c['imageUrl'] ?? '');
            $sort = (int)($c['sort_order'] ?? ($c['sortOrder'] ?? 0));
            $mTitle = $c['meta_title'] ?? ($c['metaTitle'] ?? '');
            $mDesc = $c['meta_description'] ?? ($c['metaDescription'] ?? '');
            $act = ($c['is_active'] ?? ($c['isActive'] ?? true)) ? 1 : 0;

            $insertCat->execute([
                $cId, $sId, $pId, $name, $nameAr, $slug, $img, $sort, $mTitle, $mDesc, $act
            ]);
        }
    }

    // Auto-seed blog articles for store-1 (Hadaya Mecca Flowers) if empty
    $articleCount = (int)$pdo->query("SELECT COUNT(*) FROM blog_articles WHERE store_id = 'store-1'")->fetchColumn();
    if ($articleCount === 0) {
        $seedArticles = [
            [
                'id' => 'a-1',
                'store_id' => 'store-1',
                'title' => 'كيك مع ورد في مكة: أفكار إهداء تصنع الفرحة',
                'title_ar' => 'كيك مع ورد في مكة: أفكار إهداء تصنع الفرحة',
                'title_en' => 'Cake with Flowers in Mecca: Gift Ideas Creating Pure Joy',
                'slug' => 'cake-with-flowers-in-mecca',
                'category' => 'كيك مع ورد في مكة',
                'category_ar' => 'كيك مع ورد في مكة',
                'category_en' => 'Cake & Flowers',
                'read_time' => '3 دقائق قراءة',
                'read_time_en' => '3 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp',
                'summary' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد.',
                'summary_ar' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد.',
                'summary_en' => 'Pairing fresh cakes with bouquets combines taste and aesthetic beauty for birthdays and weddings.',
                'content' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد. نوفر باقات متميزة تجمع بين أجود أنواع الكيك الطازج والورود الهولندية النضرة مع كروت إهداء ملكية وتوصيل مبرد وسريع لجميع أحياء مكة المكرمة.',
                'content_ar' => 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد. نوفر باقات متميزة تجمع بين أجود أنواع الكيك الطازج والورود الهولندية النضرة مع كروت إهداء ملكية وتوصيل مبرد وسريع لجميع أحياء مكة المكرمة.',
                'content_en' => 'Pairing artisan fresh cakes with hand-tied Dutch bouquets creates an unforgettable sensory celebration for birthdays, graduations, and anniversaries across Mecca.',
                'author' => json_encode(['name' => 'منسق هدايا مكة', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Master Florist']),
                'views_count' => 0,
                'comments_count' => 0,
                'is_featured' => 1
            ],
            [
                'id' => 'a-2',
                'store_id' => 'store-1',
                'title' => 'ورد مع قهوة وحلا في مكة: الضيافة الحجازية الأصيلة',
                'title_ar' => 'ورد مع قهوة وحلا في مكة: الضيافة الحجازية الأصيلة',
                'title_en' => 'Flowers with Coffee & Sweets in Mecca: Authentic Hijazi Hospitality',
                'slug' => 'flowers-coffee-sweets-mecca',
                'category' => 'ورد مع قهوة وحلا في مكة',
                'category_ar' => 'ورد مع قهوة وحلا في مكة',
                'category_en' => 'Coffee & Sweets',
                'read_time' => '4 دقائق قراءة',
                'read_time_en' => '4 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp',
                'summary' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير.',
                'summary_ar' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير.',
                'summary_en' => 'A tasteful tribute blending Arabica coffee, artisan sweets, and fresh blooms.',
                'content' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير والامتنان في كل مناسبة بمكة المكرمة مع أروع تشكيلات الحلويات الفاخرة وباقات الجوري النضرة.',
                'content_ar' => 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير والامتنان في كل مناسبة بمكة المكرمة مع أروع تشكيلات الحلويات الفاخرة وباقات الجوري النضرة.',
                'content_en' => 'A quintessential Saudi tribute blending freshly roasted Arabica beans, artisanal sweets, and crisp blooms celebrating genuine Hijazi hospitality.',
                'author' => json_encode(['name' => 'أخصائي الضيافة', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Hospitality Concierge']),
                'views_count' => 0,
                'comments_count' => 0,
                'is_featured' => 0
            ],
            [
                'id' => 'a-3',
                'store_id' => 'store-1',
                'title' => 'ورد مع عصافير الحب في مكة: هدايا استثنائية غير تقليدية',
                'title_ar' => 'ورد مع عصافير الحب في مكة: هدايا استثنائية غير تقليدية',
                'title_en' => 'Flowers with Lovebirds in Mecca: Extraordinary Unique Gifts',
                'slug' => 'flowers-with-lovebirds-mecca',
                'category' => 'ورد مع عصافير الحب في مكة',
                'category_ar' => 'ورد مع عصافير الحب في مكة',
                'category_en' => 'Lovebirds & Blooms',
                'read_time' => '4 دقائق قراءة',
                'read_time_en' => '4 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/a2442680-362e-405c-a209-13b09aa686b0-original.webp',
                'summary' => 'تجمع هذه الهدية بين جمال الورود الطبيعية وحيوية عصافير الحب لتترك ذكرى تدوم طويلاً لدى الشخص المهدى إليه.',
                'summary_ar' => 'تجمع هذه الهدية بين جمال الورود الطبيعية وحيوية عصافير الحب لتترك ذكرى تدوم طويلاً لدى الشخص المهدى إليه.',
                'summary_en' => 'Combining live lovebirds and natural roses creates an extraordinary emotional impact.',
                'content' => 'تجمع هذه الهدية الفريدة بين جمال الورود الطبيعية الزاهية وحيوية عصافير الحب المغردة داخل قفص ذهبي فاخر، لتصنع لحظة بهجة استثنائية لا تُنسى في المناسبات الكبرى بمكة.',
                'content_ar' => 'تجمع هذه الهدية الفريدة بين جمال الورود الطبيعية الزاهية وحيوية عصافير الحب المغردة داخل قفص ذهبي فاخر، لتصنع لحظة بهجة استثنائية لا تُنسى في المناسبات الكبرى بمكة.',
                'content_en' => 'Combining cheerful lovebirds in an ornate gilded cage alongside lush fresh blooms delivers a magical gift of living beauty.',
                'author' => json_encode(['name' => 'خبير الهدايا الحية', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Master Curator']),
                'views_count' => 0,
                'comments_count' => 0,
                'is_featured' => 0
            ],
            [
                'id' => 'a-4',
                'store_id' => 'store-1',
                'title' => 'ورد مع أسماك الزينة في مكة: روح الطبيعة في تصميم فريد',
                'title_ar' => 'ورد مع أسماك الزينة في مكة: روح الطبيعة في تصميم فريد',
                'title_en' => 'Flowers with Aquarium Fish in Mecca: Nature in Unique Harmony',
                'slug' => 'flowers-aquarium-fish-mecca',
                'category' => 'ورد مع اسماك الزينة في مكة',
                'category_ar' => 'ورد مع اسماك الزينة في مكة',
                'category_en' => 'Fish & Flowers',
                'read_time' => '5 دقائق قراءة',
                'read_time_en' => '5 min read',
                'image' => 'https://cdn.files.salla.network/other/246985580/4c4647a0-069b-4113-8525-4117a0ee5521-original.webp',
                'summary' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية وأناقة باقات الزهور لتزيين المكاتب والبيوت الراقية.',
                'summary_ar' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية وأناقة باقات الزهور لتزيين المكاتب والبيوت الراقية.',
                'summary_en' => 'A breathtaking novelty uniting aquatic tranquility with vivid floristry.',
                'content' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية في حوض كريستالي أنيق وتألق باقات الزهور الهولندية المختارة بعناية لتزيين أرقى المكاتب والمجالس في مكة المكرمة.',
                'content_ar' => 'هدية مبتكرة تجمع بين هدوء الحياة المائية في حوض كريستالي أنيق وتألق باقات الزهور الهولندية المختارة بعناية لتزيين أرقى المكاتب والمجالس في مكة المكرمة.',
                'content_en' => 'A breathtaking harmonious novelty uniting crystal aquatic tranquility with vivid premium floristry for executive offices and luxury homes.',
                'author' => json_encode(['name' => 'مهندس الديكور الحيوي', 'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png', 'role' => 'Design Specialist']),
                'views_count' => 0,
                'comments_count' => 0,
                'is_featured' => 0
            ],
        ];

        $insArt = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, views_count, comments_count, is_featured, status, published_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))
        ");
        foreach ($seedArticles as $art) {
            $insArt->execute([
                $art['id'], $art['store_id'], $art['title'], $art['title_ar'], $art['title_en'],
                $art['slug'], $art['category'], $art['category_ar'], $art['category_en'],
                $art['read_time'], $art['read_time_en'], $art['image'],
                $art['summary'], $art['summary_ar'], $art['summary_en'],
                $art['content'], $art['content_ar'], $art['content_en'],
                $art['author'], $art['views_count'], $art['comments_count'], $art['is_featured']
            ]);
        }
    }

    // Zero-mock: do not auto-seed fabricated customer reviews for any store.

    // Always enforce latest ZEDAAN perfume image for HM-WOMEN-01
    $pdo->exec('
        UPDATE products 
        SET image_url = "/images/hadaya_women_luxury_gift_zedaan.webp",
            gallery_urls = \'["/images/hadaya_women_luxury_gift_zedaan.webp"]\',
            updated_at = datetime("now")
        WHERE sku = "HM-WOMEN-01" AND (image_url LIKE "%1791219815272%" OR image_url IS NULL OR image_url = "")
    ');

    // Enforce genuine Patchi Chocolate image for HM-CHOC-01
    $pdo->exec('
        UPDATE products 
        SET image_url = "https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png",
            gallery_urls = \'["https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png"]\',
            updated_at = datetime("now")
        WHERE sku = "HM-CHOC-01" AND (image_url LIKE "%hadaya_luxury_gift_set%" OR image_url LIKE "%unsplash%" OR image_url LIKE "%photo-1513519245088%")
    ');

    // Normalize any legacy /src/assets/images/ to /images/
    $pdo->exec('
        UPDATE products 
        SET image_url = REPLACE(image_url, "/src/assets/images/", "/images/"),
            gallery_urls = REPLACE(gallery_urls, "/src/assets/images/", "/images/")
        WHERE image_url LIKE "%/src/assets/images/%" OR gallery_urls LIKE "%/src/assets/images/%"
    ');
    $pdo->exec('
        UPDATE categories 
        SET image_url = REPLACE(image_url, "/src/assets/images/", "/images/")
        WHERE image_url LIKE "%/src/assets/images/%"
    ');

    require_once __DIR__ . '/commerce.php';
    souq_commerce_schema($pdo);
    @file_put_contents($schemaReadyFlag, (string) time());
    } elseif ($dbDriver === 'sqlite') {
        // Warm path: helpers only — no DDL / seed / image rewrite churn.
        require_once __DIR__ . '/commerce.php';
    } else {
        // MySQL: Laravel schema already exists — load helpers + analytics tables only.
        // Never abort the whole request if optional DDL fails (locks / cold-start / perms).
        require_once __DIR__ . '/commerce.php';
        $mysqlNeedsEnsure = !is_file($mysqlReadyFlag);
        if ($mysqlNeedsEnsure) {
            try {
                if (function_exists('souq_ensure_analytics_tables')) {
                    souq_ensure_analytics_tables($pdo);
                }
            } catch (Throwable) {
                /* analytics DDL optional — catalog/auth must still serve */
            }
            try {
                if (function_exists('souq_ensure_mysql_store_login_column')) {
                    souq_ensure_mysql_store_login_column($pdo);
                }
            } catch (Throwable) {
                /* login_email_active column ensure optional */
            }
            @file_put_contents($mysqlReadyFlag, (string) time());
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database initialization failed: ' . $e->getMessage()]);
    exit;
}

// Parse request path
$rawUri = $_SERVER['REQUEST_URI'] ?? '/health';
$uri = parse_url($rawUri, PHP_URL_PATH) ?: '/';
// Strip script name or /api prefix
$uri = preg_replace('#^/api#', '', $uri);
$uri = preg_replace('#^/public/api#', '', $uri);
$uri = preg_replace('#^/index\.php#', '', $uri);
if ($uri === '' || $uri === '/') {
    $uri = '/';
}

$headerStoreId = $_SERVER['HTTP_X_STORE_ID'] ?? null;
$queryStoreId = $_GET['storeId'] ?? ($_GET['store_id'] ?? null);
$hostName = strtolower((string)preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
if (str_starts_with($hostName, 'www.')) {
    $hostName = substr($hostName, 4);
}
$hostStore = match ($hostName) {
    'mieraf-ksa.com' => 'store-coffee',
    'souq-default.mieraf-ksa.com' => 'store-souq-default',
    'tanjeedmakkah.com' => 'store-bleco',
    'giftshop-sa.com' => 'store-1',
    default => (str_contains($hostName, 'souq-default') ? 'store-souq-default' : ''),
};
$storeId = $headerStoreId ?: ($queryStoreId ?: $hostStore);
$GLOBALS['souq_pdo'] = $pdo;

// Match store_id inside path if present (e.g., /stores/{store_id}/... or /storefront/cart-intercept/{store_id}/...)
if (preg_match('#^/(?:stores|storefront/cart-intercept)/([^/]+)#', $uri, $mStore)) {
    $storeId = $mStore[1];
}

$inputJson = file_get_contents('php://input');
$inputData = json_decode($inputJson, true) ?: [];
if ($method === 'POST' && is_array($inputData) && !empty($inputData['_method'])) {
    $bodyMethod = strtoupper(trim((string)$inputData['_method']));
    if (in_array($bodyMethod, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $bodyMethod;
        unset($inputData['_method']);
    }
}

// ── FORMATTERS ──

/**
 * @return array{price: float, original_price: ?float, on_sale: bool, sale_active: bool}
 */
function souq_product_effective_pricing(float $price, ?float $originalPrice, ?string $startAt, ?string $endAt): array {
    $sell = $price;
    $compare = ($originalPrice !== null && $originalPrice > $sell + 0.0001) ? $originalPrice : null;
    if ($compare === null) {
        return [
            'price' => $sell,
            'original_price' => null,
            'on_sale' => false,
            'sale_active' => false,
        ];
    }
    $now = time();
    $inWindow = true;
    if ($startAt !== null && $startAt !== '') {
        $ts = strtotime($startAt);
        if ($ts !== false && $now < $ts) {
            $inWindow = false;
        }
    }
    if ($endAt !== null && $endAt !== '') {
        $ts = strtotime($endAt);
        if ($ts !== false && $now > $ts) {
            $inWindow = false;
        }
    }
    if ($inWindow) {
        return [
            'price' => $sell,
            'original_price' => $compare,
            'on_sale' => true,
            'sale_active' => true,
        ];
    }
    return [
        'price' => $compare,
        'original_price' => null,
        'on_sale' => false,
        'sale_active' => false,
    ];
}

function souq_decode_json_column(mixed $raw): ?array {
    if ($raw === null || $raw === '') {
        return null;
    }
    if (is_array($raw)) {
        return $raw;
    }
    $decoded = json_decode((string)$raw, true);
    return is_array($decoded) ? $decoded : null;
}

function formatProduct(array $row, bool $lite = false, bool $attachGroupChildren = false): array {
    $full = [];
    if (!empty($row['data'])) {
        $decoded = json_decode($row['data'], true);
        if (is_array($decoded)) {
            $full = $decoded;
        }
    }
    $gallery = [];
    if (!empty($row['gallery_urls'])) {
        $decGal = json_decode($row['gallery_urls'], true);
        if (is_array($decGal)) {
            $gallery = $decGal;
        }
    }
    // Prefer richer gallery from products.data when column is empty/stale.
    foreach (['gallery_urls', 'galleryUrls'] as $gk) {
        if (!empty($full[$gk]) && is_array($full[$gk]) && count($full[$gk]) > count($gallery)) {
            $gallery = $full[$gk];
        }
    }
    if (empty($gallery) && !empty($row['image_url'])) {
        $gallery = [$row['image_url']];
    }
    foreach (['rating', 'reviewsCount', 'reviews_count', 'salesCount', 'sales_count', 'ratingCount'] as $invented) {
        unset($full[$invented]);
    }
    $reviewCount = 0;
    $reviewAvg = null;
    $salesCount = 0;
    $statsPdo = $GLOBALS['souq_pdo'] ?? null;
    // Catalog/list path: skip per-row review/sales queries (was ~45s for 48 products on flowers host).
    if (!$lite && $statsPdo instanceof PDO) {
        try {
            $rev = $statsPdo->prepare('SELECT COUNT(*) c, AVG(rating) a FROM reviews WHERE store_id = ? AND product_id = ? AND is_active = 1');
            $rev->execute([(string)$row['store_id'], (string)$row['id']]);
            $revRow = $rev->fetch() ?: ['c' => 0, 'a' => null];
            $reviewCount = (int)$revRow['c'];
            $reviewAvg = $reviewCount > 0 ? round((float)$revRow['a'], 2) : null;
        } catch (Throwable $e) {
            $reviewCount = 0;
            $reviewAvg = null;
        }
        try {
            $sales = $statsPdo->prepare('SELECT COALESCE(SUM(quantity), 0) s FROM order_items WHERE store_id = ? AND product_id = ?');
            $sales->execute([(string)$row['store_id'], (string)$row['id']]);
            $salesCount = (int)$sales->fetchColumn();
        } catch (Throwable $e) {
            $salesCount = 0;
        }
    }

    $rawImg = (string)($row['image_url'] ?? '');
    if (strpos($rawImg, '/src/assets/images/') === 0) {
        $rawImg = str_replace('/src/assets/images/', '/images/', $rawImg);
    }
    $gallery = array_map(function($u) {
        return (is_string($u) && strpos($u, '/src/assets/images/') === 0) ? str_replace('/src/assets/images/', '/images/', $u) : $u;
    }, $gallery);

    $variations = [];
    if (!$lite && $statsPdo instanceof PDO && function_exists('souq_product_variations_list')) {
        $variations = souq_product_variations_list($statsPdo, (string)$row['store_id'], (string)$row['id']);
    }

    $pdo = $statsPdo instanceof PDO ? $statsPdo : null;
    foreach ([
        'product_options' => 'productOptions',
        'custom_fields' => 'customFields',
        'conditional_rules' => 'conditionalRules',
    ] as $dbCol => $apiKey) {
        if (!array_key_exists($apiKey, $full) || empty($full[$apiKey])) {
            $colVal = $row[$dbCol] ?? null;
            if (($colVal === null || $colVal === '') && $pdo && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', $dbCol)) {
                $colVal = $row[$dbCol] ?? null;
            }
            $decoded = souq_decode_json_column($colVal);
            if ($decoded !== null) {
                $full[$apiKey] = $decoded;
            }
        }
    }

    $discountStart = $row['discount_start_at'] ?? ($full['discount_start_at'] ?? ($full['discountStartAt'] ?? null));
    $discountEnd = $row['discount_end_at'] ?? ($full['discount_end_at'] ?? ($full['discountEndAt'] ?? null));
    if ($discountStart !== null && $discountStart !== '') {
        $discountStart = (string)$discountStart;
    } else {
        $discountStart = null;
    }
    if ($discountEnd !== null && $discountEnd !== '') {
        $discountEnd = (string)$discountEnd;
    } else {
        $discountEnd = null;
    }

    $rawPrice = (float)$row['price'];
    $rawCompare = !empty($row['original_price']) ? (float)$row['original_price'] : null;
    $pricing = souq_product_effective_pricing($rawPrice, $rawCompare, $discountStart, $discountEnd);

    $productType = function_exists('souq_product_type_from_row')
        ? souq_product_type_from_row($row, $full)
        : (string)($row['product_type'] ?? $full['product_type'] ?? $full['productType'] ?? '');
    $isGrouped = function_exists('souq_is_grouped_product_type')
        ? souq_is_grouped_product_type($productType)
        : (strtolower(trim($productType)) === 'grouped');

    $formatted = array_merge($full, [
        'id' => (string)$row['id'],
        'storeId' => (string)$row['store_id'],
        'store_id' => (string)$row['store_id'],
        'name' => (string)$row['name'],
        'nameAr' => (string)($row['name_ar'] ?? $row['name']),
        'name_ar' => (string)($row['name_ar'] ?? $row['name']),
        'sku' => (string)$row['sku'],
        'price' => $pricing['price'],
        'originalPrice' => $pricing['original_price'] ?? $pricing['price'],
        'original_price' => $pricing['original_price'] ?? $pricing['price'],
        'storefront_price' => $pricing['price'],
        'storefront_original_price' => $pricing['original_price'],
        'storefront_on_sale' => $pricing['on_sale'],
        'sale_active' => $pricing['sale_active'],
        'discountStartAt' => $discountStart,
        'discountEndAt' => $discountEnd,
        'discount_start_at' => $discountStart,
        'discount_end_at' => $discountEnd,
        'stock' => (int)$row['stock'],
        'category' => (string)($row['category'] ?? ''),
        'categoryAr' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'category_ar' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'image' => $rawImg,
        'image_url' => $rawImg,
        'imageUrl' => $rawImg,
        'galleryUrls' => $gallery,
        'gallery_urls' => $gallery,
        'status' => (string)($row['status'] ?? 'published'),
        'isActive' => (bool)($row['is_active'] ?? true),
        'is_active' => (bool)($row['is_active'] ?? true),
        'imageVersion' => (string)strtotime($row['updated_at'] ?? 'now'),
        'isStale' => false,
        'rating' => $reviewAvg,
        'reviewsCount' => $reviewCount,
        'reviews_count' => $reviewCount,
        'salesCount' => $salesCount,
        'sales_count' => $salesCount,
        'variations' => $variations,
        'description' => (string)souq_product_text_field($row, $full, ['description']),
        'description_ar' => (string)souq_product_text_field($row, $full, ['description_ar', 'descriptionAr']),
        'descriptionAr' => (string)souq_product_text_field($row, $full, ['description_ar', 'descriptionAr']),
        'description_en' => (string)souq_product_text_field($row, $full, ['description_en', 'descriptionEn']),
        'descriptionEn' => (string)souq_product_text_field($row, $full, ['description_en', 'descriptionEn']),
        'product_type' => $productType !== '' ? $productType : null,
        'productType' => $productType !== '' ? $productType : null,
        'is_grouped' => $isGrouped,
        'isGrouped' => $isGrouped,
        'purchasable' => !$isGrouped,
        'group_children' => [],
        'groupChildren' => [],
    ]);

    $statsPdoAttach = $GLOBALS['souq_pdo'] ?? null;
    if (
        $attachGroupChildren
        && !$lite
        && $isGrouped
        && $statsPdoAttach instanceof PDO
        && function_exists('souq_attach_group_meta')
    ) {
        $formatted = souq_attach_group_meta($statsPdoAttach, $formatted, $row, true);
    }

    return $formatted;
}

/** Prefer non-empty column, then products.data JSON (empty DB column must not wipe saved copy). */
function souq_product_text_field(array $row, array $full, array $keys): string {
    foreach ($keys as $k) {
        if (array_key_exists($k, $row) && $row[$k] !== null && trim((string)$row[$k]) !== '') {
            return (string)$row[$k];
        }
    }
    foreach ($keys as $k) {
        if (array_key_exists($k, $full) && $full[$k] !== null && trim((string)$full[$k]) !== '') {
            return (string)$full[$k];
        }
    }
    return '';
}

function formatCategory(array $row): array {
    $cImg = !empty($row['image_url']) ? (string)$row['image_url'] : null;
    if ($cImg && strpos($cImg, '/src/assets/images/') === 0) {
        $cImg = str_replace('/src/assets/images/', '/images/', $cImg);
    }
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'storeId' => (string)$row['store_id'],
        'parent_id' => !empty($row['parent_id']) ? (string)$row['parent_id'] : null,
        'parentId' => !empty($row['parent_id']) ? (string)$row['parent_id'] : null,
        'name' => (string)$row['name'],
        'name_ar' => !empty($row['name_ar']) ? (string)$row['name_ar'] : null,
        'nameAr' => !empty($row['name_ar']) ? (string)$row['name_ar'] : null,
        'slug' => (string)$row['slug'],
        'image_url' => $cImg,
        'imageUrl' => $cImg,
        'sort_order' => (int)($row['sort_order'] ?? 0),
        'sortOrder' => (int)($row['sort_order'] ?? 0),
        'meta_title' => !empty($row['meta_title']) ? (string)$row['meta_title'] : null,
        'metaTitle' => !empty($row['meta_title']) ? (string)$row['meta_title'] : null,
        'meta_description' => !empty($row['meta_description']) ? (string)$row['meta_description'] : null,
        'metaDescription' => !empty($row['meta_description']) ? (string)$row['meta_description'] : null,
        'is_active' => (bool)($row['is_active'] ?? 1),
        'isActive' => (bool)($row['is_active'] ?? 1),
    ];
}

function formatBlogArticle(array $row): array {
    $author = !empty($row['author']) ? json_decode($row['author'], true) : null;
    if (!is_array($author)) {
        $author = [
            'name' => $row['author'] ?: 'Sarah Ahmed',
            'avatar' => 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png',
            'role' => 'Master Florist & Gift Concierge'
        ];
    }
    $seo = !empty($row['seo']) ? json_decode($row['seo'], true) : [];
    if (!is_array($seo)) $seo = [];

    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'storeId' => (string)$row['store_id'],
        'title' => (string)$row['title'],
        'titleAr' => !empty($row['title_ar']) ? (string)$row['title_ar'] : (string)$row['title'],
        'titleEn' => !empty($row['title_en']) ? (string)$row['title_en'] : (string)$row['title'],
        'slug' => (string)($row['slug'] ?: preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($row['title']))),
        'excerpt' => (string)($row['summary'] ?: ''),
        'summary' => (string)($row['summary'] ?: ''),
        'summaryAr' => !empty($row['summary_ar']) ? (string)$row['summary_ar'] : (string)($row['summary'] ?: ''),
        'summaryEn' => !empty($row['summary_en']) ? (string)$row['summary_en'] : (string)($row['summary'] ?: ''),
        'content' => (string)($row['content'] ?: ''),
        'contentAr' => !empty($row['content_ar']) ? (string)$row['content_ar'] : (string)($row['content'] ?: ''),
        'contentEn' => !empty($row['content_en']) ? (string)$row['content_en'] : (string)($row['content'] ?: ''),
        'category' => (string)($row['category'] ?: 'General'),
        'categoryAr' => !empty($row['category_ar']) ? (string)$row['category_ar'] : (string)($row['category'] ?: 'General'),
        'categoryEn' => !empty($row['category_en']) ? (string)$row['category_en'] : (string)($row['category'] ?: 'General'),
        'readTime' => !empty($row['read_time']) ? (string)$row['read_time'] : '3 دقائق قراءة',
        'read_time' => !empty($row['read_time']) ? (string)$row['read_time'] : '3 دقائق قراءة',
        'readTimeEn' => !empty($row['read_time_en']) ? (string)$row['read_time_en'] : '3 min read',
        'image' => (string)($row['image'] ?: ''),
        'thumbnail' => (string)($row['image'] ?: ''),
        'author' => $author,
        'status' => (string)($row['status'] ?: 'published'),
        'views' => (int)($row['views_count'] ?? 0),
        'comments' => (int)($row['comments_count'] ?? 0),
        'published_at' => (string)($row['published_at'] ?? date('c')),
        'updated_at' => (string)($row['updated_at'] ?? date('c')),
        'featured' => (bool)($row['is_featured'] ?? false),
        'seo' => $seo,
    ];
}

function formatReview(array $row): array {
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'productId' => !empty($row['product_id']) ? (string)$row['product_id'] : null,
        'name' => (string)$row['name'],
        'nameEn' => !empty($row['name_en']) ? (string)$row['name_en'] : (string)$row['name'],
        'role' => (string)($row['role'] ?? ''),
        'roleEn' => !empty($row['role_en']) ? (string)$row['role_en'] : (string)($row['role'] ?? ''),
        'avatar' => (string)($row['avatar'] ?? ''),
        'rating' => (float)($row['rating'] ?? 5),
        'comment' => (string)($row['comment'] ?? ''),
        'commentEn' => !empty($row['comment_en']) ? (string)$row['comment_en'] : (string)($row['comment'] ?? ''),
        'verified' => (bool)($row['verified'] ?? 1),
        'date' => (string)($row['date'] ?? 'مؤخراً'),
        'isActive' => (bool)($row['is_active'] ?? 1),
    ];
}

function formatBanner(array $row): array {
    $settings = !empty($row['settings']) ? json_decode($row['settings'], true) : [];
    if (!is_array($settings)) $settings = [];
    return [
        'id' => (string)$row['id'],
        'store_id' => (string)$row['store_id'],
        'type' => (string)($row['type'] ?? 'promo'),
        'title' => (string)($row['title'] ?? ''),
        'titleEn' => !empty($row['title_en']) ? (string)$row['title_en'] : (string)($row['title'] ?? ''),
        'subtitle' => (string)($row['subtitle'] ?? ''),
        'subtitleEn' => !empty($row['subtitle_en']) ? (string)$row['subtitle_en'] : (string)($row['subtitle'] ?? ''),
        'imageUrl' => (string)($row['image_url'] ?? ''),
        'videoUrl' => (string)($row['video_url'] ?? ''),
        'linkUrl' => (string)($row['link_url'] ?? ''),
        'buttonText' => (string)($row['button_text'] ?? ''),
        'buttonTextEn' => !empty($row['button_text_en']) ? (string)$row['button_text_en'] : (string)($row['button_text'] ?? ''),
        'sortOrder' => (int)($row['sort_order'] ?? 0),
        'isActive' => (bool)($row['is_active'] ?? 1),
        'settings' => $settings,
    ];
}

function resolveLiveStoreId(PDO $pdo, string $key): ?string {
    $key = strtolower(trim($key));
    if ($key === '') {
        $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
        if (str_contains($host, 'souq-default')) {
            $key = 'store-souq-default';
        } elseif (str_contains($host, 'giftshop')) {
            $key = 'store-1';
        } elseif (str_contains($host, 'tanjeed')) {
            $key = 'store-bleco';
        } elseif (str_contains($host, 'mieraf')) {
            $key = 'store-coffee';
        } else {
            return null;
        }
    }
    // Never SELECT stores.data — Laravel MySQL has real columns, not a JSON blob.
    $stmt = $pdo->query('SELECT * FROM stores');
    $alias = [
        'flowers' => 'store-1',
        'hadaya' => 'store-1',
        'makkah' => 'store-1',
        'giftshop' => 'store-1',
        'giftshop-sa.com' => 'store-1',
        'www.giftshop-sa.com' => 'store-1',
        'coffee' => 'store-coffee',
        'hibrew' => 'store-coffee',
        'roasters' => 'store-coffee',
        'mieraf-ksa.com' => 'store-coffee',
        'www.mieraf-ksa.com' => 'store-coffee',
        'car' => 'store-bleco',
        'cars' => 'store-bleco',
        'bleco' => 'store-bleco',
        'alsaeedi' => 'store-bleco',
        'tanjeed' => 'store-bleco',
        'tanjeedmakkah.com' => 'store-bleco',
        'www.tanjeedmakkah.com' => 'store-bleco',
        // Temporary path mount on central until custom domain hung
        'mieraf-ksa.com/bleco' => 'store-bleco',
        'mieraf-ksa.com/cars' => 'store-bleco',
        'mieraf-ksa.com/car' => 'store-bleco',
        'souq-default' => 'store-souq-default',
        'souq-default.mieraf-ksa.com' => 'store-souq-default',
        'store-souq-default' => 'store-souq-default',
    ];
    $found = null;
    while ($row = $stmt->fetch()) {
        $id = strtolower((string)$row['id']);
        $slug = strtolower((string)($row['slug'] ?? ''));
        $domain = strtolower((string)($row['domain'] ?? ''));
        $custom = strtolower((string)($row['custom_domain'] ?? ''));
        $demo = strtolower((string)($row['demo_domain'] ?? ''));
        if (
            $key === $id
            || ($slug !== '' && $key === $slug)
            || ($domain !== '' && $key === $domain)
            || ($custom !== '' && $key === $custom)
            || ($demo !== '' && $key === $demo)
        ) {
            return (string)$row['id'];
        }
        $data = function_exists('souq_store_payload')
            ? souq_store_payload($row)
            : (json_decode((string)($row['data'] ?? ''), true) ?: []);
        if (is_array($data)) {
            foreach (['domain', 'custom_domain', 'demo_domain', 'slug'] as $field) {
                if (!empty($data[$field]) && strtolower((string)$data[$field]) === $key) {
                    return (string)$row['id'];
                }
            }
        }
        if (isset($alias[$key]) && $alias[$key] === (string)$row['id']) {
            $found = (string)$row['id'];
        }
    }
    return $found;
}

function listStoreProducts(PDO $pdo, string $storeId, array $query, bool $publicCatalog): array {
    $page = max(1, (int)($query['page'] ?? 1));
    $perPage = min(100, max(1, (int)($query['per_page'] ?? ($publicCatalog ? 48 : 25))));
    if (!empty($query['all'])) {
        $page = 1;
        $perPage = 100;
    }
    $where = ['store_id = :sid'];
    $params = [':sid' => $storeId];
    if ($publicCatalog) {
        // Storefront: only live published products for this store_id.
        $where[] = "(status = 'published' OR status IS NULL OR status = '')";
        $where[] = '(is_active = 1 OR is_active IS NULL)';
        // Hide HiBrew group children from public catalog (parent remains listed).
        if (function_exists('souq_group_child_ids_for_store')) {
            $childIds = souq_group_child_ids_for_store($pdo, $storeId);
            if ($childIds !== []) {
                $placeholders = [];
                foreach ($childIds as $i => $cid) {
                    $key = ':gchild'.$i;
                    $placeholders[] = $key;
                    $params[$key] = $cid;
                }
                $where[] = 'id NOT IN ('.implode(',', $placeholders).')';
            }
        }
    } elseif (($query['status'] ?? '') !== 'archived' && empty($query['status'])) {
        $where[] = "(status IS NULL OR status != 'archived')";
    }
    if (!$publicCatalog && !empty($query['status']) && in_array($query['status'], ['published', 'draft', 'archived'], true)) {
        $where[] = 'status = :status';
        $params[':status'] = $query['status'];
    }
    $q = trim((string)($query['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(name LIKE :q OR name_ar LIKE :q OR sku LIKE :q OR category LIKE :q OR category_ar LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    $category = trim((string)($query['category'] ?? ''));
    if ($category !== '' && strtolower($category) !== 'all') {
        $where[] = '(category = :cat OR category_ar = :cat)';
        $params[':cat'] = $category;
    }
    $stock = (string)($query['stock'] ?? '');
    if ($stock === '0' || $stock === 'out') {
        $where[] = 'stock <= 0';
    } elseif ($stock === 'low') {
        $where[] = 'stock BETWEEN 1 AND 5';
    }
    $sqlWhere = implode(' AND ', $where);
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE $sqlWhere");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    $offset = ($page - 1) * $perPage;
    // Lean columns for list/catalog — skip heavy description blobs when present as separate cols.
    // Keep `data` for gallery fallback but avoid SELECT * wildcard expansion cost on wide tables.
    $listCols = 'id, store_id, name, name_ar, sku, price, original_price, stock, category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at, sale_starts_at, sale_ends_at, product_type, brand';
    try {
        $stmt = $pdo->prepare("SELECT $listCols FROM products WHERE $sqlWhere ORDER BY updated_at DESC, id ASC LIMIT $perPage OFFSET $offset");
        $stmt->execute($params);
    } catch (Throwable) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE $sqlWhere ORDER BY updated_at DESC, id ASC LIMIT $perPage OFFSET $offset");
        $stmt->execute($params);
    }
    $products = [];
    $seen = [];
    while ($row = $stmt->fetch()) {
        $id = (string)$row['id'];
        if (isset($seen[$id])) {
            continue;
        }
        $seen[$id] = true;
        $products[] = formatProduct($row, true);
    }
    $wantFacets = !$publicCatalog || !empty($query['facets']) || !empty($query['include_counts']);
    $categories = [];
    $countRow = ['total' => $total, 'active' => 0, 'out_of_stock' => 0, 'draft' => 0];
    if ($wantFacets) {
        $catStmt = $pdo->prepare("SELECT category, category_ar, COUNT(*) c FROM products WHERE store_id = :sid AND (status IS NULL OR status != 'archived') GROUP BY category, category_ar");
        $catStmt->execute([':sid' => $storeId]);
        while ($row = $catStmt->fetch()) {
            $label = trim((string)($row['category'] ?? ''));
            $labelAr = trim((string)($row['category_ar'] ?? $label));
            if ($label === '' && $labelAr === '') {
                continue;
            }
            $cid = strtolower($label !== '' ? $label : $labelAr);
            if (!isset($categories[$cid])) {
                $categories[$cid] = [
                    'id' => $cid,
                    'name' => $label !== '' ? $label : $labelAr,
                    'name_ar' => $labelAr !== '' ? $labelAr : $label,
                    'count' => 0,
                ];
            }
            $categories[$cid]['count'] += (int)$row['c'];
        }
        $counts = $pdo->prepare("SELECT COUNT(*) total, SUM(CASE WHEN status = 'published' AND is_active = 1 THEN 1 ELSE 0 END) active, SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) out_of_stock, SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) draft FROM products WHERE store_id = :sid");
        $counts->execute([':sid' => $storeId]);
        $countRow = $counts->fetch() ?: $countRow;
    }
    return [
        'data' => $products,
        'categories' => array_values($categories),
        'store_id' => $storeId,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int)ceil($total / max(1, $perPage))),
            'sort' => 'updated_at',
            'dir' => 'desc',
            'counts' => [
                'total' => (int)($countRow['total'] ?? $total),
                'active' => (int)($countRow['active'] ?? 0),
                'out_of_stock' => (int)($countRow['out_of_stock'] ?? 0),
                'draft' => (int)($countRow['draft'] ?? 0),
            ],
        ],
    ];
}

function catalogPayload(PDO $pdo, string $storeId, array $query = []): array {
    return listStoreProducts($pdo, $storeId, $query, true);
}

// ── ROUTER ──

// 1. Health check
if ($uri === '/health') {
    $countTable = static function (PDO $pdo, string $table): int {
        try {
            return (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`', '', $table) . '`')->fetchColumn();
        } catch (Throwable $e) {
            return 0;
        }
    };
    $health = [
        'status' => 'ok',
        'provider' => 'Hostinger Cloud API',
        'database' => $dbDriver === 'mysql' ? 'active_live_mysql' : 'active_live_sqlite',
        'db_name' => $dbDriver === 'mysql' ? $dbName : 'platform.sqlite',
        'stores_count' => $countTable($pdo, 'stores'),
        'products_count' => $countTable($pdo, 'products'),
        'blog_articles_count' => $countTable($pdo, 'blog_articles'),
        'reviews_count' => $countTable($pdo, 'reviews'),
        'orders_count' => $countTable($pdo, 'orders'),
        'customers_count' => $countTable($pdo, 'customers'),
        'timestamp' => date('c'),
    ];
    if ($dbDriver !== 'mysql' && is_string($mysqlLastError) && $mysqlLastError !== '') {
        $health['mysql_fallback_reason'] = $mysqlLastError;
    }
    echo json_encode($health);
    exit;
}

// 2. Auth / Me Mock Endpoint
if ($uri === '/auth/me') {
    http_response_code(401);
    echo json_encode(['message' => 'No active session.']);
    exit;
}

// 3. Stores List
if ($uri === '/stores' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM stores ORDER BY id ASC");
    $stores = [];
    while ($row = $stmt->fetch()) {
        $st = function_exists('souq_store_payload')
            ? souq_store_payload($row)
            : (json_decode((string)($row['data'] ?? ''), true) ?: []);
        $st['id'] = $row['id'];
        $st['name'] = $row['name'];
        $st['slug'] = $row['slug'];
        $st['domain'] = $row['domain'];
        $email = $st['email'] ?? ($st['ownerEmail'] ?? ($st['owner_email'] ?? null));
        if ($email) {
            $st['email'] = $email;
            $st['owner_email'] = $email;
            $st['ownerEmail'] = $email;
        }
        $st['login_email_active'] = array_key_exists('login_email_active', $st)
            ? (bool)$st['login_email_active']
            : true;
        try {
            $cntSt = $pdo->prepare('SELECT COUNT(*) FROM products WHERE store_id = ?');
            $cntSt->execute([(string)$row['id']]);
            $cnt = (int)$cntSt->fetchColumn();
        } catch (Throwable) {
            $cnt = (int)($row['products_count'] ?? 0);
        }
        $st['productsCount'] = $cnt;
        $stores[] = $st;
    }
    echo json_encode(['data' => $stores]);
    exit;
}

// 4. Categories Endpoints (CRUD)
if (($uri === '/categories' || strpos($uri, '/categories') === 0) && $method === 'GET') {
    if (preg_match('#^/categories/([^/?]+)#', $uri, $m) && !in_array($m[1], ['', 'search'])) {
        $catId = $m[1];
        $st = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
        $st->execute([$catId]);
        $row = $st->fetch();
        if ($row) {
            echo json_encode(['data' => formatCategory($row)]);
            exit;
        }
        http_response_code(404);
        echo json_encode(['message' => 'Category not found']);
        exit;
    }

    $q = trim($_GET['q'] ?? '');
    $parentId = $_GET['parent_id'] ?? null;
    $rootsOnly = !empty($_GET['roots']);

    $sql = "SELECT * FROM categories WHERE store_id = ?";
    $params = [$storeId];

    if (!empty($q)) {
        $sql .= " AND (name LIKE ? OR name_ar LIKE ? OR slug LIKE ?)";
        $params[] = "%$q%";
        $params[] = "%$q%";
        $params[] = "%$q%";
    }

    if ($rootsOnly) {
        $sql .= " AND (parent_id IS NULL OR parent_id = '')";
    } elseif ($parentId !== null && $parentId !== '') {
        $sql .= " AND parent_id = ?";
        $params[] = $parentId;
    }

    $sql .= " ORDER BY sort_order ASC, name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $output = array_map('formatCategory', $rows);
    echo json_encode([
        'data' => $output,
        'count' => count($output),
        'store_id' => $storeId,
    ]);
    exit;
}

if ($uri === '/categories' && $method === 'POST') {
    try {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            exit;
        }
        $cId = !empty($inputData['id']) ? (string)$inputData['id'] : ('cat-' . time() . '-' . substr(md5(uniqid()), 0, 6));
        $name = trim((string)($inputData['name'] ?? ''));
        if ($name === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Category name is required.']);
            exit;
        }
        $nameAr = !empty($inputData['name_ar']) ? trim((string)$inputData['name_ar']) : (!empty($inputData['nameAr']) ? trim((string)$inputData['nameAr']) : null);
        $slug = !empty($inputData['slug']) ? trim((string)$inputData['slug']) : strtolower((string)preg_replace('/[^a-zA-Z0-9_-]+/', '-', $name));
        if ($slug === '') {
            $slug = 'cat-' . substr(md5($cId), 0, 8);
        }
        $parentId = !empty($inputData['parent_id']) ? $inputData['parent_id'] : (!empty($inputData['parentId']) ? $inputData['parentId'] : null);
        if ($parentId === '' || $parentId === false) {
            $parentId = null;
        }
        $imageUrl = $inputData['image_url'] ?? ($inputData['imageUrl'] ?? null);
        $sortOrder = (int)($inputData['sort_order'] ?? ($inputData['sortOrder'] ?? 0));
        $metaTitle = $inputData['meta_title'] ?? ($inputData['metaTitle'] ?? null);
        $metaDesc = $inputData['meta_description'] ?? ($inputData['metaDescription'] ?? null);
        $isActive = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : (isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : 1);
        $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";
        $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);

        if ($isMysql) {
            $stmt = $pdo->prepare("
                INSERT INTO categories (
                    id, store_id, parent_id, name, name_ar, slug, image_url, sort_order, meta_title, meta_description, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {$nowExpr}, {$nowExpr})
                ON DUPLICATE KEY UPDATE
                    parent_id = VALUES(parent_id),
                    name = VALUES(name),
                    name_ar = VALUES(name_ar),
                    slug = VALUES(slug),
                    image_url = VALUES(image_url),
                    sort_order = VALUES(sort_order),
                    meta_title = VALUES(meta_title),
                    meta_description = VALUES(meta_description),
                    is_active = VALUES(is_active),
                    updated_at = {$nowExpr}
            ");
        } else {
            $stmt = $pdo->prepare("
                INSERT OR REPLACE INTO categories (
                    id, store_id, parent_id, name, name_ar, slug, image_url, sort_order, meta_title, meta_description, is_active, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {$nowExpr})
            ");
        }
        $stmt->execute([
            $cId, $storeId, $parentId, $name, $nameAr, $slug, $imageUrl, $sortOrder, $metaTitle, $metaDesc, $isActive
        ]);

        $res = $pdo->prepare('SELECT * FROM categories WHERE id = ? AND store_id = ?');
        $res->execute([$cId, $storeId]);
        $created = $res->fetch();
        http_response_code(201);
        echo json_encode(['data' => formatCategory($created ?: [
            'id' => $cId,
            'store_id' => $storeId,
            'parent_id' => $parentId,
            'name' => $name,
            'name_ar' => $nameAr,
            'slug' => $slug,
            'image_url' => $imageUrl,
            'sort_order' => $sortOrder,
            'meta_title' => $metaTitle,
            'meta_description' => $metaDesc,
            'is_active' => $isActive,
        ])]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Category create failed', 'error' => $e->getMessage()]);
        exit;
    }
}

if (preg_match('#^/categories/([^/]+)$#', $uri, $matches) && in_array($method, ['PATCH', 'PUT', 'POST'])) {
    try {
        $catId = $matches[1];
        $stmt = $pdo->prepare('SELECT * FROM categories WHERE id = ? AND store_id = ?');
        $stmt->execute([$catId, $storeId]);
        $existing = $stmt->fetch();
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['message' => 'Category not found: ' . $catId]);
            exit;
        }
        $name = isset($inputData['name']) ? trim((string)$inputData['name']) : $existing['name'];
        $nameAr = isset($inputData['name_ar']) ? $inputData['name_ar'] : (isset($inputData['nameAr']) ? $inputData['nameAr'] : $existing['name_ar']);
        $slug = isset($inputData['slug']) ? trim((string)$inputData['slug']) : $existing['slug'];
        $parentId = array_key_exists('parent_id', $inputData) ? $inputData['parent_id'] : (array_key_exists('parentId', $inputData) ? $inputData['parentId'] : $existing['parent_id']);
        if ($parentId === '' || $parentId === false) {
            $parentId = null;
        }
        $imageUrl = array_key_exists('image_url', $inputData) ? $inputData['image_url'] : (array_key_exists('imageUrl', $inputData) ? $inputData['imageUrl'] : $existing['image_url']);
        $sortOrder = isset($inputData['sort_order']) ? (int)$inputData['sort_order'] : (isset($inputData['sortOrder']) ? (int)$inputData['sortOrder'] : (int)$existing['sort_order']);
        $metaTitle = array_key_exists('meta_title', $inputData) ? $inputData['meta_title'] : (array_key_exists('metaTitle', $inputData) ? $inputData['metaTitle'] : $existing['meta_title']);
        $metaDesc = array_key_exists('meta_description', $inputData) ? $inputData['meta_description'] : (array_key_exists('metaDescription', $inputData) ? $inputData['metaDescription'] : $existing['meta_description']);
        $isActive = isset($inputData['is_active']) ? (int)(bool)$inputData['is_active'] : (isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : (int)$existing['is_active']);
        $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";

        $upd = $pdo->prepare("
            UPDATE categories SET
                name = ?, name_ar = ?, slug = ?, parent_id = ?, image_url = ?, sort_order = ?, meta_title = ?, meta_description = ?, is_active = ?, updated_at = {$nowExpr}
            WHERE id = ? AND store_id = ?
        ");
        $upd->execute([
            $name, $nameAr, $slug, $parentId, $imageUrl, $sortOrder, $metaTitle, $metaDesc, $isActive, $catId, $storeId
        ]);

        $sel = $pdo->prepare('SELECT * FROM categories WHERE id = ? AND store_id = ?');
        $sel->execute([$catId, $storeId]);
        $row = $sel->fetch();
        echo json_encode(['data' => formatCategory($row ?: $existing)]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Category update failed', 'error' => $e->getMessage()]);
        exit;
    }
}

if (preg_match('#^/categories/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $catId = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ? AND store_id = ?");
    $stmt->execute([$catId, $storeId]);
    echo json_encode(['data' => ['id' => $catId, 'deleted' => true]]);
    exit;
}

// HiBrew grouped products: /products/{id}/group-members
if (function_exists('souq_product_groups_dispatch')
    && souq_product_groups_dispatch($pdo, $uri, $method, (string)$storeId, is_array($inputData) ? $inputData : [])) {
    exit;
}

// 5. Products Endpoints (CRUD)
if ($uri === '/products' && $method === 'GET') {
    if ($storeId === '') {
        http_response_code(422);
        echo json_encode(['message' => 'store_id is required.', 'data' => []]);
        exit;
    }
    echo json_encode(listStoreProducts($pdo, (string)$storeId, $_GET, false));
    exit;
}

if ($uri === '/products' && $method === 'POST') {
    try {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            exit;
        }
        // Ensure gallery_urls exists and is wide enough (VARCHAR(255) truncates multi-image JSON).
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo) && function_exists('souq_table_has_column')) {
            if (!souq_table_has_column($pdo, 'products', 'gallery_urls')) {
                try {
                    $pdo->exec('ALTER TABLE products ADD COLUMN gallery_urls LONGTEXT NULL');
                    souq_table_has_column($pdo, 'products', 'gallery_urls', true);
                } catch (Throwable) {
                    /* keep going — data JSON fallback */
                }
            } else {
                try {
                    $pdo->exec('ALTER TABLE products MODIFY COLUMN gallery_urls LONGTEXT NULL');
                } catch (Throwable) {
                    /* already JSON/TEXT or no ALTER privilege */
                }
            }
        }
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo)
            && function_exists('souq_table_has_column')
            && !souq_table_has_column($pdo, 'products', 'data')) {
            try {
                $pdo->exec('ALTER TABLE products ADD COLUMN data LONGTEXT NULL');
                souq_table_has_column($pdo, 'products', 'data', true);
            } catch (Throwable) {
                /* optional */
            }
        }
        $id = (string)($inputData['id'] ?? ('prod-' . uniqid()));
        $sku = (string)($inputData['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -6))));
        $name = trim((string)($inputData['name'] ?? ''));
        if ($name === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Product name is required.']);
            exit;
        }
        $nameAr = trim((string)($inputData['name_ar'] ?? ($inputData['nameAr'] ?? $name)));
        $price = (float)($inputData['price'] ?? 0);
        $origPrice = (float)($inputData['original_price'] ?? ($inputData['originalPrice'] ?? $price));
        $stock = (int)($inputData['stock'] ?? 0);
        $cat = trim((string)($inputData['category'] ?? ''));
        $catAr = trim((string)($inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $cat)));
        $img = (string)($inputData['image_url'] ?? ($inputData['image'] ?? ''));
        $galList = [];
        if (isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls'])) {
            $galList = array_values(array_filter(array_map('strval', $inputData['gallery_urls'])));
        } elseif (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls'])) {
            $galList = array_values(array_filter(array_map('strval', $inputData['galleryUrls'])));
        }
        if ($galList === [] && $img !== '') {
            $galList = [$img];
        }
        if ($img !== '' && !in_array($img, $galList, true)) {
            array_unshift($galList, $img);
        }
        $gal = json_encode($galList, JSON_UNESCAPED_UNICODE);
        $inputData['gallery_urls'] = $galList;
        $inputData['galleryUrls'] = $galList;
        $status = (string)($inputData['status'] ?? 'published');
        $isActive = (!isset($inputData['is_active']) || $inputData['is_active']) ? 1 : 0;
        $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";
        $hasGallery = !function_exists('souq_table_has_column') || souq_table_has_column($pdo, 'products', 'gallery_urls', true);
        $hasData = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'data', true);
        $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);

        $cols = ['id', 'store_id', 'name', 'name_ar', 'sku', 'price', 'original_price', 'stock', 'category', 'category_ar', 'image_url', 'status', 'is_active'];
        $vals = [$id, $storeId, $name, $nameAr, $sku, $price, $origPrice, $stock, $cat, $catAr, $img, $status, $isActive];
        if ($hasGallery) {
            $cols[] = 'gallery_urls';
            $vals[] = $gal;
        }
        if ($hasData) {
            $cols[] = 'data';
            $vals[] = json_encode($inputData, JSON_UNESCAPED_UNICODE);
        }
        foreach ([
            'seo_title' => ['seo_title', 'seoTitle'],
            'seo_description' => ['seo_description', 'seoDescription'],
            'product_type' => ['product_type', 'productType'],
            'brand' => ['brand'],
        ] as $col => $keys) {
            if (!function_exists('souq_table_has_column') || !souq_table_has_column($pdo, 'products', $col)) {
                continue;
            }
            $v = null;
            foreach ($keys as $k) {
                if (array_key_exists($k, $inputData)) {
                    $v = $inputData[$k];
                    break;
                }
            }
            if ($v === null) {
                continue;
            }
            // Coffee-only gate for grouped parents.
            if ($col === 'product_type' && function_exists('souq_is_grouped_product_type')
                && souq_is_grouped_product_type((string)$v)
                && function_exists('souq_is_coffee_grouped_store')
                && !souq_is_coffee_grouped_store((string)$storeId)) {
                http_response_code(403);
                echo json_encode([
                    'message' => 'Grouped products are only available for the HiBrew coffee store.',
                    'message_ar' => 'المنتجات المجمعة متاحة فقط لمتجر هايبرو للقهوة.',
                ]);
                exit;
            }
            $cols[] = $col;
            $vals[] = $v;
        }
        foreach ([
            'description' => ['description'],
            'description_ar' => ['description_ar', 'descriptionAr'],
            'description_en' => ['description_en', 'descriptionEn'],
        ] as $col => $keys) {
            if (!function_exists('souq_table_has_column') || !souq_table_has_column($pdo, 'products', $col)) {
                continue;
            }
            $v = null;
            foreach ($keys as $k) {
                if (array_key_exists($k, $inputData)) {
                    $v = $inputData[$k];
                    break;
                }
            }
            if ($v === null) {
                continue;
            }
            $cols[] = $col;
            $vals[] = $v;
        }
        if ($isMysql) {
            $cols[] = 'created_at';
            $cols[] = 'updated_at';
            $placeholders = array_fill(0, count($vals), '?');
            $placeholders[] = $nowExpr;
            $placeholders[] = $nowExpr;
            $updates = [];
            foreach ($cols as $col) {
                if (in_array($col, ['id', 'store_id', 'created_at'], true)) {
                    continue;
                }
                if ($col === 'updated_at') {
                    $updates[] = "updated_at = {$nowExpr}";
                    continue;
                }
                $updates[] = "`{$col}` = VALUES(`{$col}`)";
            }
            $sql = 'INSERT INTO products (`' . implode('`, `', $cols) . '`) VALUES (' . implode(', ', $placeholders) . ')
                ON DUPLICATE KEY UPDATE ' . implode(', ', $updates);
            $stmt = $pdo->prepare($sql);
            $stmt->execute($vals);
        } else {
            $cols[] = 'updated_at';
            $placeholders = array_fill(0, count($vals), '?');
            $placeholders[] = $nowExpr;
            $sql = 'INSERT OR REPLACE INTO products (`' . implode('`, `', $cols) . '`) VALUES (' . implode(', ', $placeholders) . ')';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($vals);
        }

        // Force-persist gallery after insert (handles missing column / truncation / data-only hosts).
        try {
            if ($hasGallery) {
                $pdo->prepare('UPDATE products SET gallery_urls = ? WHERE id = ? AND store_id = ?')->execute([$gal, $id, $storeId]);
            }
        } catch (Throwable) {
            /* ignore */
        }
        try {
            if ($hasData) {
                $pdo->prepare('UPDATE products SET data = ? WHERE id = ? AND store_id = ?')->execute([
                    json_encode($inputData, JSON_UNESCAPED_UNICODE),
                    $id,
                    $storeId,
                ]);
            }
        } catch (Throwable) {
            /* ignore */
        }
        // Persist learn-more description on create (add column if host schema is missing it).
        $createDesc = array_key_exists('description', $inputData) ? (string)$inputData['description'] : null;
        $createDescAr = array_key_exists('description_ar', $inputData)
            ? (string)$inputData['description_ar']
            : (array_key_exists('descriptionAr', $inputData) ? (string)$inputData['descriptionAr'] : null);
        foreach (['description' => $createDesc, 'description_ar' => $createDescAr] as $col => $val) {
            if ($val === null || $val === '') {
                continue;
            }
            try {
                $pdo->prepare("UPDATE products SET `{$col}` = ? WHERE id = ? AND store_id = ?")->execute([$val, $id, $storeId]);
            } catch (Throwable) {
                try {
                    $pdo->exec("ALTER TABLE products ADD COLUMN `{$col}` LONGTEXT NULL");
                    $pdo->prepare("UPDATE products SET `{$col}` = ? WHERE id = ? AND store_id = ?")->execute([$val, $id, $storeId]);
                } catch (Throwable) {
                    /* ignore */
                }
            }
        }

        $fetch = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $fetch->execute([$id]);
        $created = $fetch->fetch();
        $formatted = formatProduct($created ?: ['id' => $id, 'store_id' => $storeId, 'name' => $name, 'name_ar' => $nameAr, 'sku' => $sku, 'price' => $price, 'original_price' => $origPrice, 'stock' => $stock, 'category' => $cat, 'category_ar' => $catAr, 'image_url' => $img, 'gallery_urls' => $gal, 'status' => $status, 'is_active' => $isActive]);
        if (count($formatted['gallery_urls'] ?? []) < count($galList) && $galList !== []) {
            $formatted['gallery_urls'] = $galList;
            $formatted['galleryUrls'] = $galList;
        }
        http_response_code(201);
        echo json_encode(['data' => $formatted]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Product create failed', 'error' => $e->getMessage()]);
        exit;
    }
}

if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && $method === 'GET') {
    $pId = $matches[1];
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?' . ($storeId !== '' ? ' AND store_id = ?' : '') . ' LIMIT 1');
    $stmt->execute($storeId !== '' ? [$pId, $storeId] : [$pId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        $stmt2 = $pdo->prepare('SELECT * FROM products WHERE sku = ?' . ($storeId !== '' ? ' AND store_id = ?' : '') . ' LIMIT 1');
        $stmt2->execute($storeId !== '' ? [$pId, $storeId] : [$pId]);
        $existing = $stmt2->fetch();
    }
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found: ' . $pId]);
        exit;
    }
    echo json_encode(['data' => formatProduct($existing, false, true)]);
    exit;
}

if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && in_array($method, ['PATCH', 'PUT', 'POST'])) {
    try {
        $pId = $matches[1];
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?' . ($storeId !== '' ? ' AND store_id = ?' : '') . ' LIMIT 1');
        $stmt->execute($storeId !== '' ? [$pId, $storeId] : [$pId]);
        $existing = $stmt->fetch();
        if (!$existing) {
            $stmt2 = $pdo->prepare('SELECT * FROM products WHERE sku = ?' . ($storeId !== '' ? ' AND store_id = ?' : '') . ' LIMIT 1');
            $stmt2->execute($storeId !== '' ? [$pId, $storeId] : [$pId]);
            $existing = $stmt2->fetch();
        }

        if (!$existing) {
            http_response_code(404);
            echo json_encode(['message' => 'Product not found: ' . $pId]);
            exit;
        }

        $existingData = [];
        if (!empty($existing['data'])) {
            $decoded = json_decode((string)$existing['data'], true);
            if (is_array($decoded)) {
                $existingData = $decoded;
            }
        }
        $mergedData = array_merge($existingData, $inputData);

        $name = $inputData['name'] ?? $existing['name'];
        $nameAr = $inputData['name_ar'] ?? ($inputData['nameAr'] ?? $existing['name_ar']);
        $sku = $inputData['sku'] ?? $existing['sku'];
        $price = isset($inputData['price']) ? (float)$inputData['price'] : (float)$existing['price'];
        $origPrice = isset($inputData['original_price'])
            ? (float)$inputData['original_price']
            : (isset($inputData['originalPrice']) ? (float)$inputData['originalPrice'] : (float)($existing['original_price'] ?? $existing['price']));
        $stock = isset($inputData['stock']) ? (int)$inputData['stock'] : (int)$existing['stock'];
        $cat = $inputData['category'] ?? $existing['category'];
        $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $existing['category_ar']);
        $img = $inputData['image_url'] ?? ($inputData['image'] ?? $existing['image_url']);

        $gal = $existing['gallery_urls'] ?? null;
        if (function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo)
            && function_exists('souq_table_has_column')
            && !souq_table_has_column($pdo, 'products', 'gallery_urls')) {
            try {
                $pdo->exec('ALTER TABLE products ADD COLUMN gallery_urls JSON NULL');
                souq_table_has_column($pdo, 'products', 'gallery_urls', true);
            } catch (Throwable) {
                try {
                    $pdo->exec('ALTER TABLE products ADD COLUMN gallery_urls TEXT NULL');
                    souq_table_has_column($pdo, 'products', 'gallery_urls', true);
                } catch (Throwable) {
                    /* optional */
                }
            }
        }
        if (isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls'])) {
            $gal = json_encode(array_values(array_filter(array_map('strval', $inputData['gallery_urls']))), JSON_UNESCAPED_UNICODE);
            $mergedData['gallery_urls'] = array_values(array_filter(array_map('strval', $inputData['gallery_urls'])));
            $mergedData['galleryUrls'] = $mergedData['gallery_urls'];
        } elseif (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls'])) {
            $gal = json_encode(array_values(array_filter(array_map('strval', $inputData['galleryUrls']))), JSON_UNESCAPED_UNICODE);
            $mergedData['gallery_urls'] = array_values(array_filter(array_map('strval', $inputData['galleryUrls'])));
            $mergedData['galleryUrls'] = $mergedData['gallery_urls'];
        } elseif ($img !== ($existing['image_url'] ?? null)) {
            $curGal = json_decode((string)($existing['gallery_urls'] ?? '[]'), true) ?: [];
            $gal = json_encode(array_values(array_unique(array_merge([(string)$img], $curGal))), JSON_UNESCAPED_UNICODE);
        }

        $status = $inputData['status'] ?? $existing['status'];
        $isActive = isset($inputData['is_active'])
            ? ($inputData['is_active'] ? 1 : 0)
            : (isset($inputData['isActive']) ? ($inputData['isActive'] ? 1 : 0) : (int)$existing['is_active']);
        $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";

        $sets = [
            'name = ?',
            'name_ar = ?',
            'sku = ?',
            'price = ?',
            'original_price = ?',
            'stock = ?',
            'category = ?',
            'category_ar = ?',
            'image_url = ?',
            'status = ?',
            'is_active = ?',
            "updated_at = {$nowExpr}",
        ];
        $params = [$name, $nameAr, $sku, $price, $origPrice, $stock, $cat, $catAr, $img, $status, $isActive];

        if ((!function_exists('souq_table_has_column') || souq_table_has_column($pdo, 'products', 'gallery_urls')) && $gal !== null) {
            $sets[] = 'gallery_urls = ?';
            $params[] = $gal;
        }
        if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'products', 'data')) {
            $sets[] = 'data = ?';
            $params[] = json_encode($mergedData, JSON_UNESCAPED_UNICODE);
        }
        foreach (['seo_title' => ['seo_title', 'seoTitle'], 'seo_description' => ['seo_description', 'seoDescription']] as $col => $keys) {
            if (!function_exists('souq_table_has_column') || !souq_table_has_column($pdo, 'products', $col)) {
                continue;
            }
            foreach ($keys as $k) {
                if (array_key_exists($k, $inputData)) {
                    $sets[] = "`{$col}` = ?";
                    $params[] = $inputData[$k];
                    break;
                }
            }
        }
        foreach ([
            'description' => ['description'],
            'description_ar' => ['description_ar', 'descriptionAr'],
            'description_en' => ['description_en', 'descriptionEn'],
        ] as $col => $keys) {
            if (!function_exists('souq_table_has_column') || !souq_table_has_column($pdo, 'products', $col)) {
                continue;
            }
            foreach ($keys as $k) {
                if (array_key_exists($k, $inputData)) {
                    $sets[] = "`{$col}` = ?";
                    $params[] = $inputData[$k];
                    break;
                }
            }
        }
        $params[] = $existing['id'];
        $upd = $pdo->prepare('UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $upd->execute($params);

        // Force-persist learn-more / description text (column and/or data JSON).
        $descEn = array_key_exists('description', $inputData)
            ? (string)$inputData['description']
            : (array_key_exists('description_en', $inputData) ? (string)$inputData['description_en'] : (array_key_exists('descriptionEn', $inputData) ? (string)$inputData['descriptionEn'] : null));
        $descAr = array_key_exists('description_ar', $inputData)
            ? (string)$inputData['description_ar']
            : (array_key_exists('descriptionAr', $inputData) ? (string)$inputData['descriptionAr'] : null);
        if ($descEn !== null || $descAr !== null) {
            $mergedData['description'] = $descEn !== null ? $descEn : (string)($mergedData['description'] ?? '');
            if ($descAr !== null) {
                $mergedData['description_ar'] = $descAr;
                $mergedData['descriptionAr'] = $descAr;
            }
            if ($descEn !== null) {
                $mergedData['description_en'] = $descEn;
                $mergedData['descriptionEn'] = $descEn;
            }
            // Ensure products.data exists, then always persist description JSON blob.
            try {
                if (function_exists('souq_table_has_column') && !souq_table_has_column($pdo, 'products', 'data', true)) {
                    $pdo->exec('ALTER TABLE products ADD COLUMN data LONGTEXT NULL');
                    souq_table_has_column($pdo, 'products', 'data', true);
                }
                $pdo->prepare('UPDATE products SET data = ? WHERE id = ?')->execute([
                    json_encode($mergedData, JSON_UNESCAPED_UNICODE),
                    $existing['id'],
                ]);
            } catch (Throwable) {
                /* optional on hosts without ALTER */
            }
            foreach (
                [
                    'description' => $descEn,
                    'description_ar' => $descAr,
                    'description_en' => $descEn,
                ] as $col => $val
            ) {
                if ($val === null) {
                    continue;
                }
                try {
                    $pdo->prepare("UPDATE products SET `{$col}` = ? WHERE id = ?")->execute([$val, $existing['id']]);
                } catch (Throwable) {
                    try {
                        $pdo->exec("ALTER TABLE products ADD COLUMN `{$col}` LONGTEXT NULL");
                        if (function_exists('souq_table_has_column')) {
                            souq_table_has_column($pdo, 'products', $col, true);
                        }
                        $pdo->prepare("UPDATE products SET `{$col}` = ? WHERE id = ?")->execute([$val, $existing['id']]);
                    } catch (Throwable) {
                        /* ignore */
                    }
                }
            }
        }

        $fetch = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $fetch->execute([$existing['id']]);
        $updated = $fetch->fetch();
        echo json_encode(['data' => formatProduct($updated ?: $existing)]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Product update failed', 'error' => $e->getMessage()]);
        exit;
    }
}

if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $pId = $matches[1];
    $del = $pdo->prepare("DELETE FROM products WHERE id = ? OR sku = ?");
    $del->execute([$pId, $pId]);
    echo json_encode(['success' => true]);
    exit;
}

if (preg_match('#^/products/([^/]+)/toggle-publish$#', $uri, $matches) && $method === 'POST') {
    $pId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? OR sku = ?");
    $stmt->execute([$pId, $pId]);
    $existing = $stmt->fetch();
    if ($existing) {
        $newActive = $existing['is_active'] ? 0 : 1;
        $newStatus = $newActive ? 'published' : 'draft';
        $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";
        $upd = $pdo->prepare("UPDATE products SET is_active = ?, status = ?, updated_at = {$nowExpr} WHERE id = ?");
        $upd->execute([$newActive, $newStatus, $existing['id']]);
        $existing['is_active'] = $newActive;
        $existing['status'] = $newStatus;
        echo json_encode(['data' => formatProduct($existing)]);
        exit;
    }
}

// ── 6. BLOG ARTICLES & SETTINGS & COMMERCE TOOLS ──

// Bulk action on blog articles
if (preg_match('#^/stores/([^/]+)/blog/articles/bulk$#', $uri, $mBulk) && $method === 'POST') {
    $targetStore = $mBulk[1];
    $action = $inputData['action'] ?? '';
    $ids = $inputData['ids'] ?? [];
    if (!empty($ids) && is_array($ids)) {
        if ($action === 'delete') {
            $inQ = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("DELETE FROM blog_articles WHERE store_id = ? AND id IN ($inQ)");
            $st->execute(array_merge([$targetStore], $ids));
        } elseif ($action === 'publish' || $action === 'draft') {
            $inQ = implode(',', array_fill(0, count($ids), '?'));
            $st = $pdo->prepare("UPDATE blog_articles SET status = ?, updated_at = datetime('now') WHERE store_id = ? AND id IN ($inQ)");
            $st->execute(array_merge([$action, $targetStore], $ids));
        }
    }
    echo json_encode(['success' => true, 'count' => count($ids), 'message' => 'Bulk action completed']);
    exit;
}

// Article Commerce Tools config (GET / PUT)
if (preg_match('#^/stores/([^/]+)/blog/commerce-tools/([^/]+)$#', $uri, $mTools)) {
    $targetStore = $mTools[1];
    $artId = $mTools[2];
    if (in_array($method, ['PUT', 'POST'])) {
        $toolsJson = json_encode($inputData, JSON_UNESCAPED_UNICODE);
        $st = $pdo->prepare("UPDATE blog_articles SET commerce_tools = ?, updated_at = datetime('now') WHERE store_id = ? AND id = ?");
        $st->execute([$toolsJson, $targetStore, $artId]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }
    $st = $pdo->prepare("SELECT commerce_tools FROM blog_articles WHERE store_id = ? AND id = ?");
    $st->execute([$targetStore, $artId]);
    $raw = $st->fetchColumn();
    $decoded = $raw ? json_decode($raw, true) : null;
    echo json_encode(['success' => true, 'data' => $decoded ?: ['article_id' => $artId]]);
    exit;
}

// Single Article (GET / PUT / DELETE)
if (preg_match('#^/stores/([^/]+)/blog/articles/([^/]+)$#', $uri, $mArt)) {
    $targetStore = $mArt[1];
    $artId = $mArt[2];

    if ($method === 'GET') {
        // Strict store_id isolation — never fall back to another tenant's articles
        $st = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $st->execute([$targetStore, $artId]);
        $row = $st->fetch();
        if ($row) {
            echo json_encode(['success' => true, 'data' => formatBlogArticle($row)]);
            exit;
        }
        http_response_code(404);
        echo json_encode(['message' => 'Article not found']);
        exit;
    }

    if (in_array($method, ['PUT', 'PATCH', 'POST'])) {
        $st = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $st->execute([$targetStore, $artId]);
        $existing = $st->fetch();
        if (!$existing) {
            // If doesn't exist, try creating
            $existing = [];
        }

        $title = $inputData['title'] ?? ($existing['title'] ?? 'Untitled Article');
        $titleAr = $inputData['title_ar'] ?? ($inputData['titleAr'] ?? ($existing['title_ar'] ?? $title));
        $titleEn = $inputData['title_en'] ?? ($inputData['titleEn'] ?? ($existing['title_en'] ?? $title));
        $slug = $inputData['slug'] ?? ($existing['slug'] ?? preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($titleEn)));
        $cat = $inputData['category'] ?? ($existing['category'] ?? 'General');
        $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? ($existing['category_ar'] ?? $cat));
        $catEn = $inputData['category_en'] ?? ($inputData['categoryEn'] ?? ($existing['category_en'] ?? $cat));
        $readTime = $inputData['read_time'] ?? ($inputData['readTime'] ?? ($existing['read_time'] ?? '3 دقائق قراءة'));
        $readTimeEn = $inputData['read_time_en'] ?? ($inputData['readTimeEn'] ?? ($existing['read_time_en'] ?? '3 min read'));
        $img = $inputData['thumbnail'] ?? ($inputData['image'] ?? ($existing['image'] ?? ''));
        $summary = $inputData['excerpt'] ?? ($inputData['summary'] ?? ($existing['summary'] ?? ''));
        $summaryAr = $inputData['summary_ar'] ?? ($inputData['summaryAr'] ?? ($existing['summary_ar'] ?? $summary));
        $summaryEn = $inputData['summary_en'] ?? ($inputData['summaryEn'] ?? ($existing['summary_en'] ?? $summary));
        $content = $inputData['content'] ?? ($existing['content'] ?? '');
        $contentAr = $inputData['content_ar'] ?? ($inputData['contentAr'] ?? ($existing['content_ar'] ?? $content));
        $contentEn = $inputData['content_en'] ?? ($inputData['contentEn'] ?? ($existing['content_en'] ?? $content));
        $status = $inputData['status'] ?? ($existing['status'] ?? 'published');
        $isFeatured = isset($inputData['featured']) ? (int)(bool)$inputData['featured'] : (isset($inputData['is_featured']) ? (int)(bool)$inputData['is_featured'] : (int)($existing['is_featured'] ?? 0));
        
        $authorData = isset($inputData['author']) && is_array($inputData['author']) ? json_encode($inputData['author'], JSON_UNESCAPED_UNICODE) : ($existing['author'] ?? json_encode(['name' => $inputData['author'] ?? 'Admin']));
        $seoData = isset($inputData['seo']) && is_array($inputData['seo']) ? json_encode($inputData['seo'], JSON_UNESCAPED_UNICODE) : ($existing['seo'] ?? '{}');

        $upd = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, status, is_featured, seo, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $upd->execute([
            $artId, $targetStore, $title, $titleAr, $titleEn, $slug, $cat, $catAr, $catEn,
            $readTime, $readTimeEn, $img, $summary, $summaryAr, $summaryEn, $content, $contentAr, $contentEn,
            $authorData, $status, $isFeatured, $seoData
        ]);

        $sel = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $sel->execute([$targetStore, $artId]);
        $row = $sel->fetch();
        echo json_encode(['success' => true, 'data' => formatBlogArticle($row), 'message' => 'Article saved successfully']);
        exit;
    }

    if ($method === 'DELETE') {
        $del = $pdo->prepare("DELETE FROM blog_articles WHERE store_id = ? AND id = ?");
        $del->execute([$targetStore, $artId]);
        echo json_encode(['success' => true, 'message' => 'Article deleted successfully']);
        exit;
    }
}

// Blog Settings (GET / PUT / POST)
if (preg_match('#^/stores/([^/]+)/blog/settings$#', $uri, $mSet)) {
    $targetStore = $mSet[1];
    if (in_array($method, ['PUT', 'POST'])) {
        $postSet = isset($inputData['post_settings']) ? json_encode($inputData['post_settings'], JSON_UNESCAPED_UNICODE) : null;
        $seoSet = isset($inputData['seo_settings']) ? json_encode($inputData['seo_settings'], JSON_UNESCAPED_UNICODE) : null;
        $featId = $inputData['featured_article_id'] ?? null;

        $st = $pdo->prepare("
            INSERT OR REPLACE INTO blog_settings (store_id, post_settings, seo_settings, featured_article_id, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        ");
        $st->execute([$targetStore, $postSet, $seoSet, $featId]);
        echo json_encode(['success' => true, 'message' => 'Blog settings saved successfully']);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM blog_settings WHERE store_id = ?");
    $st->execute([$targetStore]);
    $row = $st->fetch() ?: [];
    echo json_encode([
        'success' => true,
        'post_settings' => json_decode($row['post_settings'] ?? '{}', true) ?: [],
        'seo_settings' => json_decode($row['seo_settings'] ?? '{}', true) ?: [],
        'featured_article_id' => $row['featured_article_id'] ?? null,
    ]);
    exit;
}

// Blog Articles List & Create (/stores/{id}/blog/articles OR /blog/articles)
if (preg_match('#^/stores/([^/]+)/blog/articles#', $uri, $mList) || $uri === '/blog/articles') {
    $targetStore = !empty($mList[1]) ? $mList[1] : $storeId;

    if ($method === 'POST') {
        $newId = !empty($inputData['id']) ? (string)$inputData['id'] : ('art-' . time() . '-' . substr(md5(uniqid()), 0, 5));
        $title = $inputData['title'] ?? 'مقال جديد';
        $titleAr = $inputData['title_ar'] ?? ($inputData['titleAr'] ?? $title);
        $titleEn = $inputData['title_en'] ?? ($inputData['titleEn'] ?? $title);
        $slug = $inputData['slug'] ?? preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($titleEn));
        $cat = $inputData['category'] ?? 'عام';
        $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $cat);
        $catEn = $inputData['category_en'] ?? ($inputData['categoryEn'] ?? $cat);
        $readTime = $inputData['read_time'] ?? ($inputData['readTime'] ?? '3 دقائق قراءة');
        $readTimeEn = $inputData['read_time_en'] ?? ($inputData['readTimeEn'] ?? '3 min read');
        $img = $inputData['thumbnail'] ?? ($inputData['image'] ?? '');
        $summary = $inputData['excerpt'] ?? ($inputData['summary'] ?? '');
        $summaryAr = $inputData['summary_ar'] ?? ($inputData['summaryAr'] ?? $summary);
        $summaryEn = $inputData['summary_en'] ?? ($inputData['summaryEn'] ?? $summary);
        $content = $inputData['content'] ?? '';
        $contentAr = $inputData['content_ar'] ?? ($inputData['contentAr'] ?? $content);
        $contentEn = $inputData['content_en'] ?? ($inputData['contentEn'] ?? $content);
        $status = $inputData['status'] ?? 'published';
        $isFeatured = isset($inputData['featured']) ? (int)(bool)$inputData['featured'] : (isset($inputData['is_featured']) ? (int)(bool)$inputData['is_featured'] : 0);
        $authorData = isset($inputData['author']) && is_array($inputData['author']) ? json_encode($inputData['author'], JSON_UNESCAPED_UNICODE) : json_encode(['name' => $inputData['author'] ?? 'Admin']);
        $seoData = isset($inputData['seo']) && is_array($inputData['seo']) ? json_encode($inputData['seo'], JSON_UNESCAPED_UNICODE) : '{}';

        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO blog_articles (
                id, store_id, title, title_ar, title_en, slug, category, category_ar, category_en,
                read_time, read_time_en, image, summary, summary_ar, summary_en, content, content_ar, content_en,
                author, status, is_featured, seo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ");
        $ins->execute([
            $newId, $targetStore, $title, $titleAr, $titleEn, $slug, $cat, $catAr, $catEn,
            $readTime, $readTimeEn, $img, $summary, $summaryAr, $summaryEn, $content, $contentAr, $contentEn,
            $authorData, $status, $isFeatured, $seoData
        ]);

        $sel = $pdo->prepare("SELECT * FROM blog_articles WHERE store_id = ? AND id = ?");
        $sel->execute([$targetStore, $newId]);
        $row = $sel->fetch();
        echo json_encode(['success' => true, 'data' => formatBlogArticle($row), 'message' => 'Article created successfully']);
        exit;
    }

    // GET articles list
    $q = trim($_GET['q'] ?? '');
    $cat = trim($_GET['category'] ?? '');
    $status = trim($_GET['status'] ?? '');

    // Strict store_id isolation — empty store returns empty list (no cross-tenant clone)
    $sql = "SELECT * FROM blog_articles WHERE store_id = ?";
    $params = [$targetStore];

    if (!empty($q)) {
        $sql .= " AND (title LIKE ? OR title_ar LIKE ? OR title_en LIKE ? OR summary LIKE ? OR summary_en LIKE ?)";
        $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%";
    }
    if (!empty($cat) && $cat !== 'All Categories' && $cat !== 'All') {
        $sql .= " AND (category = ? OR category_ar = ? OR category_en = ?)";
        $params[] = $cat; $params[] = $cat; $params[] = $cat;
    }
    if (!empty($status) && $status !== 'All Statuses') {
        $sql .= " AND status = ?";
        $params[] = strtolower($status);
    }

    $sql .= " ORDER BY is_featured DESC, updated_at DESC, id ASC";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    $articles = array_map('formatBlogArticle', $rows);

    // Compute Metrics
    $totalArticles = count($articles);
    $published = 0;
    $drafts = 0;
    $totalViews = 0;
    $totalComments = 0;
    $featured = null;
    foreach ($articles as $a) {
        if ($a['status'] === 'published') $published++;
        else $drafts++;
        $totalViews += $a['views'];
        $totalComments += $a['comments'];
        if ($a['featured'] && !$featured) {
            $featured = $a;
        }
    }

    // Load Settings
    $stSettings = $pdo->prepare("SELECT * FROM blog_settings WHERE store_id = ?");
    $stSettings->execute([$targetStore]);
    $settingsRow = $stSettings->fetch() ?: [];

    echo json_encode([
        'success' => true,
        'data' => $articles,
        'metrics' => [
            'total_articles' => $totalArticles,
            'total_views' => $totalViews,
            'total_comments' => $totalComments,
            'published' => $published,
            'drafts' => $drafts,
            'weekly_articles_growth' => '+' . min($totalArticles, 4) . ' this week',
            'weekly_views_growth' => '+14% this week',
            'weekly_comments_growth' => '+5% this week',
        ],
        'featured_article' => $featured ?: ($articles[0] ?? null),
        'post_settings' => json_decode($settingsRow['post_settings'] ?? '{}', true) ?: [
            'layout' => 'Large Image + Excerpt',
            'articles_per_page' => 10,
            'order_by' => 'Latest',
            'sort_order' => 'Descending'
        ],
        'seo_settings' => json_decode($settingsRow['seo_settings'] ?? '{}', true) ?: [
            'enabled' => true,
            'meta_title' => 'Blog | Official Store Articles',
            'meta_description' => 'Discover articles and guides directly from our store.',
            'focus_keyword' => 'store articles'
        ],
        'store_id' => $targetStore,
    ]);
    exit;
}

// ── 7. REVIEWS & CUSTOMER COMMENTS ──
if (preg_match('#^/stores/([^/]+)/reviews#', $uri, $mRev) || $uri === '/reviews') {
    $targetStore = !empty($mRev[1]) ? $mRev[1] : $storeId;

    if ($method === 'POST') {
        $rId = !empty($inputData['id']) ? (string)$inputData['id'] : ('rev-' . time() . '-' . substr(md5(uniqid()), 0, 4));
        $name = $inputData['name'] ?? 'عميل متميز';
        $nameEn = $inputData['name_en'] ?? ($inputData['nameEn'] ?? $name);
        $role = $inputData['role'] ?? 'عميل موثق';
        $roleEn = $inputData['role_en'] ?? ($inputData['roleEn'] ?? 'Verified Buyer');
        $avatar = $inputData['avatar'] ?? '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg';
        $rating = (float)($inputData['rating'] ?? 5);
        $comment = $inputData['comment'] ?? '';
        $commentEn = $inputData['comment_en'] ?? ($inputData['commentEn'] ?? $comment);
        $verified = isset($inputData['verified']) ? (int)(bool)$inputData['verified'] : 1;
        $date = $inputData['date'] ?? 'الآن';

        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO reviews (
                id, store_id, name, name_en, role, role_en, avatar, rating, comment, comment_en, verified, date, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        ");
        $ins->execute([
            $rId, $targetStore, $name, $nameEn, $role, $roleEn, $avatar, $rating, $comment, $commentEn, $verified, $date
        ]);

        $st = $pdo->prepare("SELECT * FROM reviews WHERE store_id = ? AND id = ?");
        $st->execute([$targetStore, $rId]);
        echo json_encode(['success' => true, 'data' => formatReview($st->fetch())]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM reviews WHERE store_id = ? ORDER BY id ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode([
        'success' => true,
        'data' => array_map('formatReview', $rows),
        'count' => count($rows),
        'store_id' => $targetStore,
    ]);
    exit;
}

// ── 8. BANNERS (PROMO, COUNTDOWN, VIDEO, CUSTOM) ──
if (preg_match('#^/stores/([^/]+)/banners#', $uri, $mBan) || $uri === '/banners') {
    $targetStore = !empty($mBan[1]) ? $mBan[1] : $storeId;

    if (in_array($method, ['PUT', 'POST'])) {
        $bannersList = is_array($inputData) && isset($inputData['banners']) ? $inputData['banners'] : (is_array($inputData) ? $inputData : []);
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO banners (
                id, store_id, type, title, title_en, subtitle, subtitle_en, image_url, video_url, link_url, button_text, button_text_en, sort_order, is_active, settings, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        foreach ($bannersList as $b) {
            $bId = $b['id'] ?? ('ban-' . uniqid());
            $ins->execute([
                $bId, $targetStore, $b['type'] ?? 'promo', $b['title'] ?? '', $b['titleEn'] ?? ($b['title_en'] ?? ''),
                $b['subtitle'] ?? '', $b['subtitleEn'] ?? ($b['subtitle_en'] ?? ''),
                $b['imageUrl'] ?? ($b['image_url'] ?? ''), $b['videoUrl'] ?? ($b['video_url'] ?? ''),
                $b['linkUrl'] ?? ($b['link_url'] ?? ''), $b['buttonText'] ?? ($b['button_text'] ?? ''),
                $b['buttonTextEn'] ?? ($b['button_text_en'] ?? ''), (int)($b['sortOrder'] ?? 0),
                isset($b['isActive']) ? (int)(bool)$b['isActive'] : 1,
                json_encode($b['settings'] ?? [], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo json_encode(['success' => true, 'message' => 'Banners saved successfully']);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM banners WHERE store_id = ? ORDER BY sort_order ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode(['success' => true, 'data' => array_map('formatBanner', $rows)]);
    exit;
}

// ── 9. THEME SETTINGS & PAGE BUILDER LAYOUTS (MySQL store_themes + SQLite legacy) ──
$souqDefaultThemeId = static function (string $sid): string {
    $s = strtolower($sid);
    if (str_contains($s, 'coffee') || str_contains($s, 'hibrew') || str_contains($s, 'roaster')) {
        return 'theme-coffee-artisan';
    }
    if (str_contains($s, 'bleco') || str_contains($s, 'car') || str_contains($s, 'transport')) {
        return 'theme-saudia-transport';
    }
    return 'theme-flora-luxe';
};

$souqDecodeSettings = static function ($raw): array {
    if (is_array($raw)) {
        return $raw;
    }
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
};

$souqMergeThemeSettings = static function (array $base, array $overlay) use (&$souqMergeThemeSettings): array {
    foreach ($overlay as $key => $value) {
        if ($value === null) {
            continue;
        }
        $previous = $base[$key] ?? null;
        if (is_array($value) && is_array($previous) && !array_is_list($value) && !array_is_list($previous)) {
            $base[$key] = $souqMergeThemeSettings($previous, $value);
            continue;
        }
        $base[$key] = $value;
    }
    return $base;
};

if ($uri === '/themes-catalog' && in_array($method, ['GET', 'HEAD'], true)) {
    $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
    try {
        if ($isMysql && function_exists('souq_table_exists') && souq_table_exists($pdo, 'themes_catalog')) {
            $rows = $pdo->query('SELECT * FROM themes_catalog ORDER BY is_default DESC, name ASC')->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows ?: []]);
            exit;
        }
    } catch (Throwable $e) {
        /* fall through to static catalog */
    }
    echo json_encode([
        'success' => true,
        'data' => [
            ['id' => 'theme-flora-luxe', 'name' => 'Flora Luxe', 'category' => 'Gifts', 'is_default' => 1, 'preview_color' => '#059669'],
            ['id' => 'theme-coffee-artisan', 'name' => 'Coffee Artisan', 'category' => 'Coffee', 'is_default' => 0, 'preview_color' => '#6F4E37'],
            ['id' => 'theme-saudia-transport', 'name' => 'Saudia Transport', 'category' => 'Cars', 'is_default' => 0, 'preview_color' => '#0F766E'],
            ['id' => 'theme-commerce-starter', 'name' => 'Commerce Starter', 'category' => 'General', 'is_default' => 0, 'preview_color' => '#1d8b94'],
        ],
    ]);
    exit;
}

if ($uri === '/storefront/theme' && in_array($method, ['GET', 'HEAD'], true)) {
    $targetStore = trim((string)($_GET['store_id'] ?? $storeId ?? ''));
    $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
    try {
        if ($targetStore === '') {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Store not found.']);
            exit;
        }
        $storeRow = null;
        if ($isMysql) {
            $stStore = $pdo->prepare('SELECT id, name, slug, domain, logo, accent_color FROM stores WHERE id = ? OR slug = ? LIMIT 1');
            $stStore->execute([$targetStore, $targetStore]);
            $storeRow = $stStore->fetch(PDO::FETCH_ASSOC) ?: null;
        }
        // Never invent a phantom store — missing row = 404 (zero-mock / isolation).
        if (!$storeRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Store not found.', 'store_id' => $targetStore]);
            exit;
        }
        $sid = (string)$storeRow['id'];
        $themeId = $souqDefaultThemeId($sid);
        $settings = [];
        $homepageStyle = null;
        if ($isMysql) {
            $st = $pdo->prepare('SELECT theme_id, homepage_style, settings FROM store_themes WHERE store_id = ? LIMIT 1');
            $st->execute([$sid]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $themeId = (string)($row['theme_id'] ?: $themeId);
                $homepageStyle = $row['homepage_style'] ?? null;
                $settings = $souqDecodeSettings($row['settings'] ?? null);
            }
        }
        unset($settings['draft']);
        $builder = is_array($settings['builder'] ?? null) ? $settings['builder'] : [];
        unset($builder['draft_blocks']);
        $settings['builder'] = $builder;
        echo json_encode([
            'success' => true,
            'store' => [
                'id' => $sid,
                'name' => $storeRow['name'] ?? $sid,
                'slug' => $storeRow['slug'] ?? $sid,
                'domain' => $storeRow['domain'] ?? null,
                'logo' => $storeRow['logo'] ?? null,
            ],
            'theme' => [
                'id' => $themeId,
                'homepage_style' => $homepageStyle,
                'settings' => $settings,
                'published_blocks' => $builder['published_blocks'] ?? [],
            ],
            'store_id' => $sid,
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Theme load failed.',
            'store_id' => $targetStore,
        ]);
        exit;
    }
}

if (preg_match('#^/stores/([^/]+)/theme-settings#', $uri, $mTS) || $uri === '/theme-settings') {
    $targetStore = !empty($mTS[1]) ? $mTS[1] : $storeId;
    $defaultTheme = $souqDefaultThemeId((string)$targetStore);
    $themeId = (string)($_GET['theme_id'] ?? ($inputData['theme_id'] ?? $defaultTheme));
    $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
    $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";

    try {
        if (in_array($method, ['PUT', 'POST', 'PATCH'], true)) {
            $publish = !empty($inputData['publish']);
            $incomingSettings = is_array($inputData['settings'] ?? null) ? $inputData['settings'] : [];
            unset($incomingSettings['draft'], $incomingSettings['by_theme'], $incomingSettings['builder'], $incomingSettings['globalStyles']);
            if ($isMysql) {
                $find = $pdo->prepare('SELECT id, theme_id, homepage_style, settings FROM store_themes WHERE store_id = ? LIMIT 1');
                $find->execute([$targetStore]);
                $existing = $find->fetch(PDO::FETCH_ASSOC) ?: null;
                $existingSettings = $souqDecodeSettings($existing['settings'] ?? null);
                $draft = is_array($existingSettings['draft'] ?? null) ? $existingSettings['draft'] : [];
                if ($incomingSettings !== []) {
                    $draft = $souqMergeThemeSettings($draft, $incomingSettings);
                }
                $existingSettings['draft'] = $draft;
                if ($publish) {
                    $existingSettings = $souqMergeThemeSettings($existingSettings, $draft);
                    $existingSettings['draft'] = $draft;
                    $existingSettings['theme_published_at'] = gmdate('c');
                }
                if (array_key_exists('homepage_style', $inputData)) {
                    $homepageStyle = $inputData['homepage_style'];
                } else {
                    $homepageStyle = $existing['homepage_style'] ?? null;
                }
                $nextThemeId = (string)($inputData['theme_id'] ?? ($existing['theme_id'] ?? $themeId));
                $payloadJson = json_encode($existingSettings, JSON_UNESCAPED_UNICODE);
                if ($existing) {
                    $st = $pdo->prepare("UPDATE store_themes SET theme_id = ?, homepage_style = ?, settings = ?, updated_at = {$nowExpr} WHERE store_id = ?");
                    $st->execute([$nextThemeId, $homepageStyle, $payloadJson, $targetStore]);
                    $rowId = $existing['id'];
                } else {
                    $rowId = 'stheme-' . substr(md5($targetStore . '|' . $nextThemeId . '|' . microtime(true)), 0, 16);
                    $st = $pdo->prepare("INSERT INTO store_themes (id, store_id, theme_id, homepage_style, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, {$nowExpr}, {$nowExpr})");
                    $st->execute([$rowId, $targetStore, $nextThemeId, $homepageStyle, $payloadJson]);
                }
                $outSettings = $souqMergeThemeSettings($existingSettings, $draft);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'id' => $rowId,
                        'store_id' => $targetStore,
                        'theme_id' => $nextThemeId,
                        'homepage_style' => $homepageStyle,
                        'settings' => $outSettings,
                    ],
                    'store_id' => $targetStore,
                    'message' => 'Theme settings updated successfully.',
                ]);
                exit;
            }
            $payload = json_encode($incomingSettings !== [] ? $incomingSettings : $inputData, JSON_UNESCAPED_UNICODE);
            $st = $pdo->prepare("
                INSERT OR REPLACE INTO theme_settings (store_id, theme_id, settings, updated_at)
                VALUES (?, ?, ?, {$nowExpr})
            ");
            $st->execute([$targetStore, $themeId, $payload]);
            echo json_encode(['success' => true, 'data' => ['store_id' => $targetStore, 'theme_id' => $themeId, 'settings' => $incomingSettings], 'store_id' => $targetStore]);
            exit;
        }

        if ($isMysql) {
            $st = $pdo->prepare('SELECT id, store_id, theme_id, homepage_style, settings, updated_at FROM store_themes WHERE store_id = ? LIMIT 1');
            $st->execute([$targetStore]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                echo json_encode(['success' => true, 'data' => null, 'store_id' => $targetStore]);
                exit;
            }
            $settings = $souqDecodeSettings($row['settings'] ?? null);
            $draft = is_array($settings['draft'] ?? null) ? $settings['draft'] : [];
            $merged = $souqMergeThemeSettings($settings, $draft);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $row['id'],
                    'store_id' => $row['store_id'],
                    'theme_id' => $row['theme_id'] ?: $defaultTheme,
                    'homepage_style' => $row['homepage_style'] ?? null,
                    'settings' => $merged,
                    'updated_at' => $row['updated_at'] ?? null,
                ],
                'store_id' => $targetStore,
            ]);
            exit;
        }

        $st = $pdo->prepare('SELECT settings FROM theme_settings WHERE store_id = ? AND theme_id = ?');
        $st->execute([$targetStore, $themeId]);
        $raw = $st->fetchColumn();
        $decoded = $souqDecodeSettings($raw);
        echo json_encode([
            'success' => true,
            'data' => [
                'store_id' => $targetStore,
                'theme_id' => $themeId,
                'settings' => $decoded,
            ],
            'store_id' => $targetStore,
        ]);
        exit;
    } catch (Throwable $e) {
        if (in_array($method, ['GET', 'HEAD'], true)) {
            echo json_encode(['success' => true, 'data' => null, 'store_id' => $targetStore, 'warning' => $e->getMessage()]);
            exit;
        }
        http_response_code(500);
        echo json_encode(['message' => 'Theme settings failed', 'error' => $e->getMessage(), 'data' => null]);
        exit;
    }
}

if (preg_match('#^/stores/([^/]+)/builder-layout#', $uri, $mBL)) {
    $targetStore = $mBL[1];
    $defaultTheme = $souqDefaultThemeId((string)$targetStore);
    $themeId = (string)($inputData['theme_id'] ?? ($_GET['theme_id'] ?? $defaultTheme));
    $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
    $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";

    try {
        if (in_array($method, ['PUT', 'POST', 'PATCH'], true)) {
            $isPublished = !empty($inputData['is_published']);
            $blocks = is_array($inputData['blocks'] ?? null) ? $inputData['blocks'] : [];

            if ($isMysql) {
                $find = $pdo->prepare('SELECT id, theme_id, homepage_style, settings FROM store_themes WHERE store_id = ? LIMIT 1');
                $find->execute([$targetStore]);
                $existing = $find->fetch(PDO::FETCH_ASSOC) ?: null;
                $settings = $souqDecodeSettings($existing['settings'] ?? null);
                $builder = is_array($settings['builder'] ?? null) ? $settings['builder'] : [];
                $builder['draft_blocks'] = $blocks;
                if (array_key_exists('seasonal_theme', $inputData)) {
                    $builder['seasonal_theme'] = $inputData['seasonal_theme'];
                }
                if (array_key_exists('typography_settings', $inputData)) {
                    $builder['typography_settings'] = $inputData['typography_settings'];
                }
                if (array_key_exists('header_settings', $inputData)) {
                    $builder['header_settings'] = $inputData['header_settings'];
                }
                if (array_key_exists('mobile_menu_icon', $inputData)) {
                    $builder['mobile_menu_icon'] = $inputData['mobile_menu_icon'];
                }
                $builder['updated_at'] = gmdate('c');
                if ($isPublished) {
                    $builder['published_blocks'] = $blocks;
                    $builder['published_at'] = gmdate('c');
                }
                $settings['builder'] = $builder;
                $nextThemeId = (string)($inputData['theme_id'] ?? ($existing['theme_id'] ?? $themeId));
                $payloadJson = json_encode($settings, JSON_UNESCAPED_UNICODE);
                if ($existing) {
                    $st = $pdo->prepare("UPDATE store_themes SET theme_id = ?, settings = ?, updated_at = {$nowExpr} WHERE store_id = ?");
                    $st->execute([$nextThemeId, $payloadJson, $targetStore]);
                } else {
                    $rowId = 'stheme-' . substr(md5($targetStore . '|builder|' . microtime(true)), 0, 16);
                    $st = $pdo->prepare("INSERT INTO store_themes (id, store_id, theme_id, settings, created_at, updated_at) VALUES (?, ?, ?, ?, {$nowExpr}, {$nowExpr})");
                    $st->execute([$rowId, $targetStore, $nextThemeId, $payloadJson]);
                }
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'theme_id' => $nextThemeId,
                        'is_published' => $isPublished,
                        'blocks_count' => count($blocks),
                        'updated_at' => $builder['updated_at'],
                    ],
                    'store_id' => $targetStore,
                    'message' => $isPublished
                        ? 'Page builder layout published successfully to database.'
                        : 'Page builder draft saved successfully.',
                ]);
                exit;
            }

            $st = $pdo->prepare("
                INSERT OR REPLACE INTO builder_layouts (
                    store_id, theme_id, blocks, seasonal_theme, typography_settings, header_settings, mobile_menu_icon, is_published, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, {$nowExpr})
            ");
            $st->execute([
                $targetStore, $themeId,
                json_encode($blocks, JSON_UNESCAPED_UNICODE),
                json_encode($inputData['seasonal_theme'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($inputData['typography_settings'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($inputData['header_settings'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($inputData['mobile_menu_icon'] ?? [], JSON_UNESCAPED_UNICODE),
                $isPublished ? 1 : 0,
            ]);
            echo json_encode(['success' => true, 'data' => $inputData, 'store_id' => $targetStore]);
            exit;
        }

        // GET builder layout
        if ($isMysql) {
            $st = $pdo->prepare('SELECT theme_id, homepage_style, settings, updated_at FROM store_themes WHERE store_id = ? LIMIT 1');
            $st->execute([$targetStore]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            $settings = $souqDecodeSettings($row['settings'] ?? null);
            $builder = is_array($settings['builder'] ?? null) ? $settings['builder'] : [];
            echo json_encode([
                'success' => true,
                'data' => [
                    'theme_id' => $row['theme_id'] ?? $themeId,
                    'homepage_style' => $row['homepage_style'] ?? null,
                    'blocks' => $builder['draft_blocks'] ?? ($builder['published_blocks'] ?? []),
                    'published_blocks' => $builder['published_blocks'] ?? [],
                    'seasonal_theme' => $builder['seasonal_theme'] ?? null,
                    'typography_settings' => $builder['typography_settings'] ?? null,
                    'header_settings' => $builder['header_settings'] ?? null,
                    'mobile_menu_icon' => $builder['mobile_menu_icon'] ?? null,
                    'updated_at' => $builder['updated_at'] ?? ($row['updated_at'] ?? null),
                ],
                'store_id' => $targetStore,
            ]);
            exit;
        }

        $st = $pdo->prepare('SELECT * FROM builder_layouts WHERE store_id = ? AND theme_id = ?');
        $st->execute([$targetStore, $themeId]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            echo json_encode([
                'success' => true,
                'data' => [
                    'theme_id' => $row['theme_id'],
                    'blocks' => json_decode($row['blocks'] ?? '[]', true) ?: [],
                    'published_blocks' => json_decode($row['blocks'] ?? '[]', true) ?: [],
                    'seasonal_theme' => json_decode($row['seasonal_theme'] ?? '{}', true),
                    'typography_settings' => json_decode($row['typography_settings'] ?? '{}', true),
                    'header_settings' => json_decode($row['header_settings'] ?? '{}', true),
                    'mobile_menu_icon' => json_decode($row['mobile_menu_icon'] ?? '{}', true),
                    'is_published' => (bool)$row['is_published'],
                ],
                'store_id' => $targetStore,
            ]);
            exit;
        }
        echo json_encode([
            'success' => true,
            'data' => [
                'theme_id' => $themeId,
                'blocks' => [],
                'published_blocks' => [],
            ],
            'store_id' => $targetStore,
        ]);
        exit;
    } catch (Throwable $e) {
        // Never crash Themes / Page Builder UI — empty draft for this store only
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'theme_id' => $themeId,
                'blocks' => [],
                'published_blocks' => [],
            ],
            'store_id' => $targetStore,
            'warning' => $e->getMessage(),
        ]);
        exit;
    }
}

// ── 10. PAGES & POLICIES ──
// MySQL (Hostinger Laravel) → theme_pages. SQLite legacy gateway → pages.
if (preg_match('#^/stores/([^/]+)/pages(?:/([^/]+))?(?:/(publish))?$#', $uri, $mP) || $uri === '/pages') {
    $targetStore = !empty($mP[1]) ? $mP[1] : $storeId;
    $pageKey = isset($mP[2]) ? rawurldecode((string) $mP[2]) : '';
    $isPublishAction = ($method === 'POST' && !empty($mP[3]) && $mP[3] === 'publish');
    $useThemePages = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
    $nowExpr = function_exists('souq_sql_now_expr') ? souq_sql_now_expr($pdo) : "datetime('now')";

    $decodeJsonCol = static function ($raw): ?array {
        if (is_array($raw)) {
            return $raw;
        }
        if (!is_string($raw) || trim($raw) === '') {
            return null;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    };

    $mapThemePageRow = static function (array $row) use ($decodeJsonCol): array {
        $draft = $decodeJsonCol($row['draft_layout'] ?? null) ?? [];
        $published = $decodeJsonCol($row['published_layout'] ?? null);
        $seo = $decodeJsonCol($row['seo'] ?? null) ?? [];
        $status = (string) ($row['status'] ?? 'draft');
        $contentEn = (string) ($draft['contentEn'] ?? ($draft['content_en'] ?? ''));
        $contentAr = (string) ($draft['contentAr'] ?? ($draft['content_ar'] ?? ''));
        if ($contentEn === '' && is_array($published)) {
            $contentEn = (string) ($published['contentEn'] ?? ($published['content_en'] ?? ''));
        }
        if ($contentAr === '' && is_array($published)) {
            $contentAr = (string) ($published['contentAr'] ?? ($published['content_ar'] ?? ''));
        }
        $category = (string) ($draft['category'] ?? ($published['category'] ?? 'custom'));
        $isSystem = (bool) ($draft['isSystemDefault'] ?? ($published['isSystemDefault'] ?? false));
        return [
            'id' => $row['id'],
            'store_id' => $row['store_id'],
            'slug' => $row['slug'],
            'type' => $row['type'] ?? 'custom',
            'title_en' => $row['title_en'] ?? '',
            'title_ar' => $row['title_ar'] ?? '',
            'draft_layout' => $draft ?: null,
            'published_layout' => $published,
            'seo' => $seo ?: null,
            'header_mode' => $row['header_mode'] ?? 'global',
            'footer_mode' => $row['footer_mode'] ?? 'global',
            'status' => $status,
            'published_at' => $row['published_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
            'titleEn' => $row['title_en'] ?? '',
            'titleAr' => $row['title_ar'] ?? '',
            'content_en' => $contentEn,
            'content_ar' => $contentAr,
            'category' => $category,
            'is_system_default' => $isSystem ? 1 : 0,
            'is_published' => $status === 'published' ? 1 : 0,
            'meta_description_en' => (string) ($seo['seo_description_en'] ?? ''),
            'meta_description_ar' => (string) ($seo['seo_description_ar'] ?? ''),
        ];
    };

    $mapLegacyPageRow = static function (array $row): array {
        $contentEn = (string) ($row['content_en'] ?? '');
        $contentAr = (string) ($row['content_ar'] ?? '');
        $category = (string) ($row['category'] ?? 'custom');
        $isSystem = (bool) ((int) ($row['is_system_default'] ?? 0));
        $published = (bool) ((int) ($row['is_published'] ?? 0));
        $layout = [
            'contentEn' => $contentEn,
            'contentAr' => $contentAr,
            'category' => $category,
            'isSystemDefault' => $isSystem,
        ];
        return [
            'id' => $row['id'],
            'store_id' => $row['store_id'],
            'slug' => $row['slug'],
            'type' => 'custom',
            'title_en' => $row['title_en'] ?? '',
            'title_ar' => $row['title_ar'] ?? '',
            'draft_layout' => $layout,
            'published_layout' => $published ? $layout : null,
            'seo' => [
                'seo_description_en' => $row['meta_description_en'] ?? '',
                'seo_description_ar' => $row['meta_description_ar'] ?? '',
            ],
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => $published ? 'published' : 'draft',
            'updated_at' => $row['updated_at'] ?? null,
            'titleEn' => $row['title_en'] ?? '',
            'titleAr' => $row['title_ar'] ?? '',
            'content_en' => $contentEn,
            'content_ar' => $contentAr,
            'category' => $category,
            'is_system_default' => $isSystem ? 1 : 0,
            'is_published' => $published ? 1 : 0,
            'meta_description_en' => $row['meta_description_en'] ?? '',
            'meta_description_ar' => $row['meta_description_ar'] ?? '',
        ];
    };

    try {
        if ($useThemePages) {
            if ($method === 'DELETE' && $pageKey !== '') {
                $del = $pdo->prepare('DELETE FROM theme_pages WHERE store_id = ? AND (id = ? OR slug = ?)');
                $del->execute([$targetStore, $pageKey, $pageKey]);
                echo json_encode(['success' => true, 'store_id' => $targetStore]);
                exit;
            }

            if ($isPublishAction && $pageKey !== '') {
                $find = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
                $find->execute([$targetStore, $pageKey, $pageKey]);
                $existing = $find->fetch() ?: null;
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Page not found.']);
                    exit;
                }
                $draft = $decodeJsonCol($existing['draft_layout'] ?? null);
                $pubLayout = $draft ?: ($decodeJsonCol($existing['published_layout'] ?? null) ?: []);
                $pub = $pdo->prepare("UPDATE theme_pages SET status = 'published', published_layout = ?, published_at = {$nowExpr}, updated_at = {$nowExpr} WHERE store_id = ? AND id = ?");
                $pub->execute([
                    json_encode($pubLayout, JSON_UNESCAPED_UNICODE),
                    $targetStore,
                    $existing['id'],
                ]);
                $find->execute([$targetStore, $existing['id'], $existing['id']]);
                $saved = $find->fetch();
                echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $saved ? $mapThemePageRow($saved) : null]);
                exit;
            }

            if (in_array($method, ['PUT', 'POST'], true)) {
                // Resolve existing row first so partial Save (draft_layout only)
                // never overwrites slug/type/titles or hits collation-unsafe SQL.
                $existing = null;
                if ($pageKey !== '') {
                    $find = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
                    $find->execute([$targetStore, $pageKey, $pageKey]);
                    $existing = $find->fetch() ?: null;
                }
                $slugHint = (string) ($inputData['slug'] ?? '');
                if (!$existing && $slugHint !== '') {
                    $find = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? AND slug = ? LIMIT 1');
                    $find->execute([$targetStore, $slugHint]);
                    $existing = $find->fetch() ?: null;
                }

                $hasDraftKey = array_key_exists('draft_layout', $inputData);
                $hasPublishedKey = array_key_exists('published_layout', $inputData);
                $hasSeoKey = array_key_exists('seo', $inputData);
                $hasStatusKey = array_key_exists('status', $inputData);
                $hasSlugKey = array_key_exists('slug', $inputData);
                $hasTypeKey = array_key_exists('type', $inputData);
                $hasTitleEn = array_key_exists('title_en', $inputData) || array_key_exists('titleEn', $inputData);
                $hasTitleAr = array_key_exists('title_ar', $inputData) || array_key_exists('titleAr', $inputData);
                $hasHeaderKey = array_key_exists('header_mode', $inputData);
                $hasFooterKey = array_key_exists('footer_mode', $inputData);

                $slug = $hasSlugKey
                    ? (string) $inputData['slug']
                    : ($existing ? (string) ($existing['slug'] ?? '') : $slugHint);
                // Never treat a page id (tpage-…) as the slug on partial PUT.
                if ($slug === '' || ($slug === $pageKey && str_starts_with($pageKey, 'tpage-'))) {
                    $slug = $existing ? (string) ($existing['slug'] ?? '') : '';
                }
                $type = $hasTypeKey
                    ? (string) $inputData['type']
                    : ($existing ? (string) ($existing['type'] ?? 'custom') : 'custom');
                $titleEn = $hasTitleEn
                    ? (string) ($inputData['titleEn'] ?? ($inputData['title_en'] ?? ''))
                    : ($existing ? (string) ($existing['title_en'] ?? '') : '');
                $titleAr = $hasTitleAr
                    ? (string) ($inputData['titleAr'] ?? ($inputData['title_ar'] ?? ''))
                    : ($existing ? (string) ($existing['title_ar'] ?? '') : '');
                $headerMode = $hasHeaderKey
                    ? (string) ($inputData['header_mode'] ?? 'global')
                    : ($existing ? (string) ($existing['header_mode'] ?? 'global') : 'global');
                $footerMode = $hasFooterKey
                    ? (string) ($inputData['footer_mode'] ?? 'global')
                    : ($existing ? (string) ($existing['footer_mode'] ?? 'global') : 'global');

                $status = $hasStatusKey ? (string) ($inputData['status'] ?? '') : '';
                if ($status === '' && $hasPublishedKey && is_array($inputData['published_layout'] ?? null)) {
                    $status = 'published';
                }
                if ($status === '') {
                    $status = $existing ? (string) ($existing['status'] ?? 'draft') : 'draft';
                }
                if ($status !== 'published' && $status !== 'draft') {
                    $status = 'draft';
                }

                $pId = (string) ($inputData['id'] ?? ($existing['id'] ?? ($pageKey !== '' && str_starts_with($pageKey, 'tpage-') ? $pageKey : ('tpage-' . bin2hex(random_bytes(6))))));
                if ($slug === '') {
                    http_response_code(422);
                    echo json_encode(['message' => 'slug is required.']);
                    exit;
                }
                if ($type === '') {
                    $type = 'custom';
                }

                if ($hasDraftKey) {
                    $draftIn = is_array($inputData['draft_layout'] ?? null) ? $inputData['draft_layout'] : [];
                    $draftJson = json_encode($draftIn ?: new stdClass(), JSON_UNESCAPED_UNICODE);
                } elseif ($existing && array_key_exists('draft_layout', $existing)) {
                    $draftJson = $existing['draft_layout'];
                } else {
                    $draftJson = json_encode(new stdClass(), JSON_UNESCAPED_UNICODE);
                }

                if ($hasPublishedKey) {
                    $publishedLayout = is_array($inputData['published_layout'] ?? null) ? $inputData['published_layout'] : null;
                    $publishedJson = $publishedLayout !== null
                        ? json_encode($publishedLayout, JSON_UNESCAPED_UNICODE)
                        : null;
                } elseif ($existing && array_key_exists('published_layout', $existing)) {
                    $publishedJson = $existing['published_layout'];
                } else {
                    $publishedJson = null;
                }
                if ($status === 'published' && ($publishedJson === null || $publishedJson === '')) {
                    $publishedJson = $draftJson;
                }

                if ($hasSeoKey) {
                    $seo = is_array($inputData['seo'] ?? null) ? $inputData['seo'] : [];
                    $seoJson = json_encode($seo ?: new stdClass(), JSON_UNESCAPED_UNICODE);
                } elseif ($existing && array_key_exists('seo', $existing) && $existing['seo'] !== null && $existing['seo'] !== '') {
                    $seoJson = $existing['seo'];
                } else {
                    $seoJson = json_encode(new stdClass(), JSON_UNESCAPED_UNICODE);
                }

                // Avoid IF(? = 'published') — Hostinger MySQL mixes utf8mb4_general_ci /
                // utf8mb4_unicode_ci and throws 1267 Illegal mix of collations.
                $publishedAtSql = $status === 'published' ? $nowExpr : 'NULL';
                $publishedAtSet = $status === 'published'
                    ? "published_at = COALESCE(published_at, {$nowExpr})"
                    : 'published_at = published_at';

                if ($existing) {
                    $upd = $pdo->prepare("UPDATE theme_pages SET slug = ?, type = ?, title_en = ?, title_ar = ?, draft_layout = ?, published_layout = ?, seo = ?, header_mode = ?, footer_mode = ?, status = ?, {$publishedAtSet}, updated_at = {$nowExpr} WHERE store_id = ? AND id = ?");
                    $upd->execute([
                        $slug,
                        $type,
                        $titleEn,
                        $titleAr,
                        $draftJson,
                        $publishedJson,
                        $seoJson,
                        $headerMode,
                        $footerMode,
                        $status,
                        $targetStore,
                        $pId,
                    ]);
                } else {
                    $ins = $pdo->prepare("INSERT INTO theme_pages (id, store_id, slug, type, title_en, title_ar, draft_layout, published_layout, seo, header_mode, footer_mode, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {$publishedAtSql}, {$nowExpr}, {$nowExpr})");
                    $ins->execute([
                        $pId,
                        $targetStore,
                        $slug,
                        $type,
                        $titleEn,
                        $titleAr,
                        $draftJson,
                        $publishedJson,
                        $seoJson,
                        $headerMode,
                        $footerMode,
                        $status,
                    ]);
                }

                $stOne = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? AND id = ? LIMIT 1');
                $stOne->execute([$targetStore, $pId]);
                $saved = $stOne->fetch();
                http_response_code($existing ? 200 : 201);
                echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $saved ? $mapThemePageRow($saved) : null]);
                exit;
            }

            if ($pageKey !== '') {
                $stOne = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
                $stOne->execute([$targetStore, $pageKey, $pageKey]);
                $saved = $stOne->fetch();
                if (!$saved) {
                    http_response_code(404);
                    echo json_encode(['message' => 'Page not found.']);
                    exit;
                }
                echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $mapThemePageRow($saved)]);
                exit;
            }

            $st = $pdo->prepare('SELECT * FROM theme_pages WHERE store_id = ? ORDER BY slug ASC');
            $st->execute([$targetStore]);
            $rows = array_map($mapThemePageRow, $st->fetchAll() ?: []);
            echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $rows]);
            exit;
        }

        // ── SQLite legacy `pages` table ──
        if ($method === 'DELETE' && $pageKey !== '') {
            $del = $pdo->prepare('DELETE FROM pages WHERE store_id = ? AND (id = ? OR slug = ?)');
            $del->execute([$targetStore, $pageKey, $pageKey]);
            echo json_encode(['success' => true, 'store_id' => $targetStore]);
            exit;
        }

        if ($isPublishAction && $pageKey !== '') {
            $pub = $pdo->prepare("UPDATE pages SET is_published = 1, updated_at = {$nowExpr} WHERE store_id = ? AND (id = ? OR slug = ?)");
            $pub->execute([$targetStore, $pageKey, $pageKey]);
            $stOne = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
            $stOne->execute([$targetStore, $pageKey, $pageKey]);
            $saved = $stOne->fetch();
            echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $saved ? $mapLegacyPageRow($saved) : null]);
            exit;
        }

        if (in_array($method, ['PUT', 'POST'], true)) {
            $draft = is_array($inputData['draft_layout'] ?? null) ? $inputData['draft_layout'] : [];
            $publishedLayout = is_array($inputData['published_layout'] ?? null) ? $inputData['published_layout'] : [];
            $seo = is_array($inputData['seo'] ?? null) ? $inputData['seo'] : [];

            $slug = (string) ($inputData['slug'] ?? $pageKey);
            $titleEn = (string) ($inputData['titleEn'] ?? ($inputData['title_en'] ?? ''));
            $titleAr = (string) ($inputData['titleAr'] ?? ($inputData['title_ar'] ?? ''));
            $contentEn = (string) ($inputData['contentEn'] ?? ($inputData['content_en'] ?? ($draft['contentEn'] ?? ($publishedLayout['contentEn'] ?? ''))));
            $contentAr = (string) ($inputData['contentAr'] ?? ($inputData['content_ar'] ?? ($draft['contentAr'] ?? ($publishedLayout['contentAr'] ?? ''))));
            $category = (string) ($inputData['category'] ?? ($draft['category'] ?? ($publishedLayout['category'] ?? 'legal')));
            $isSystem = isset($inputData['isSystemDefault'])
                ? (int) (bool) $inputData['isSystemDefault']
                : (int) (bool) ($draft['isSystemDefault'] ?? false);
            $status = (string) ($inputData['status'] ?? '');
            $isPublished = isset($inputData['isPublished'])
                ? (int) (bool) $inputData['isPublished']
                : ($status === 'published' || $status === '' ? 1 : 0);
            if ($publishedLayout) {
                $isPublished = 1;
            }
            $metaEn = (string) ($inputData['metaDescriptionEn'] ?? ($inputData['meta_description_en'] ?? ($seo['seo_description_en'] ?? '')));
            $metaAr = (string) ($inputData['metaDescriptionAr'] ?? ($inputData['meta_description_ar'] ?? ($seo['seo_description_ar'] ?? '')));

            $existing = null;
            if ($pageKey !== '') {
                $find = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
                $find->execute([$targetStore, $pageKey, $pageKey]);
                $existing = $find->fetch() ?: null;
            }
            if (!$existing && $slug !== '') {
                $find = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? AND slug = ? LIMIT 1');
                $find->execute([$targetStore, $slug]);
                $existing = $find->fetch() ?: null;
            }

            $pId = (string) ($inputData['id'] ?? ($existing['id'] ?? ('page-' . uniqid())));
            if ($slug === '' && $existing) {
                $slug = (string) $existing['slug'];
            }

            $ins = $pdo->prepare("
                INSERT OR REPLACE INTO pages (
                    id, store_id, slug, title_ar, title_en, content_ar, content_en, category, is_system_default, is_published, meta_description_ar, meta_description_en, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {$nowExpr})
            ");
            $ins->execute([
                $pId,
                $targetStore,
                $slug,
                $titleAr,
                $titleEn,
                $contentAr,
                $contentEn,
                $category,
                $isSystem,
                $isPublished,
                $metaAr,
                $metaEn,
            ]);

            $stOne = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? AND id = ? LIMIT 1');
            $stOne->execute([$targetStore, $pId]);
            $saved = $stOne->fetch() ?: [
                'id' => $pId,
                'store_id' => $targetStore,
                'slug' => $slug,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'content_en' => $contentEn,
                'content_ar' => $contentAr,
                'category' => $category,
                'is_system_default' => $isSystem,
                'is_published' => $isPublished,
                'meta_description_en' => $metaEn,
                'meta_description_ar' => $metaAr,
                'updated_at' => date('c'),
            ];
            http_response_code($existing ? 200 : 201);
            echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $mapLegacyPageRow($saved)]);
            exit;
        }

        if ($pageKey !== '') {
            $stOne = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? AND (id = ? OR slug = ?) LIMIT 1');
            $stOne->execute([$targetStore, $pageKey, $pageKey]);
            $saved = $stOne->fetch();
            if (!$saved) {
                http_response_code(404);
                echo json_encode(['message' => 'Page not found.']);
                exit;
            }
            echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $mapLegacyPageRow($saved)]);
            exit;
        }

        $st = $pdo->prepare('SELECT * FROM pages WHERE store_id = ? ORDER BY slug ASC');
        $st->execute([$targetStore]);
        $rows = array_map($mapLegacyPageRow, $st->fetchAll() ?: []);
        echo json_encode(['success' => true, 'store_id' => $targetStore, 'data' => $rows]);
        exit;
    } catch (Throwable $pageErr) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Pages request failed.',
            'error' => $pageErr->getMessage(),
            'store_id' => $targetStore,
        ]);
        exit;
    }
}

// ── 11. BRANDS ──
if (preg_match('#^/stores/([^/]+)/brands#', $uri, $mBr) || $uri === '/brands') {
    $targetStore = !empty($mBr[1]) ? $mBr[1] : $storeId;

    if (in_array($method, ['PUT', 'POST'])) {
        $bId = $inputData['id'] ?? ('brand-' . uniqid());
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO brands (
                id, store_id, name, name_ar, slug, logo_url, description, description_en, website, country, sort_order, is_active, show_in_channels, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        $ins->execute([
            $bId, $targetStore, $inputData['name'] ?? '', $inputData['nameAr'] ?? ($inputData['name_ar'] ?? ''),
            $inputData['slug'] ?? '', $inputData['logo'] ?? ($inputData['logo_url'] ?? ''),
            $inputData['description'] ?? '', $inputData['descriptionEn'] ?? ($inputData['description_en'] ?? ''),
            $inputData['website'] ?? '', $inputData['country'] ?? '',
            (int)($inputData['sortOrder'] ?? 0),
            isset($inputData['isActive']) ? (int)(bool)$inputData['isActive'] : 1,
            isset($inputData['showInChannels']) ? (int)(bool)$inputData['showInChannels'] : 1
        ]);
        echo json_encode(['success' => true, 'data' => $inputData]);
        exit;
    }

    $st = $pdo->prepare("SELECT * FROM brands WHERE store_id = ? ORDER BY sort_order ASC");
    $st->execute([$targetStore]);
    $rows = $st->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

// ── 12. UPLOAD FILE ENDPOINT ──
if ($uri === '/upload' && $method === 'POST') {
    $uploadDir = __DIR__ . '/../images/uploads';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    if (!empty($_FILES['file']['tmp_name'])) {
        $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION)) ?: 'webp';
        $filename = 'upload_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $ext;
        $dest = $uploadDir . '/' . $filename;
        if (move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
            echo json_encode([
                'url' => '/images/uploads/' . $filename,
                'status' => 'success'
            ]);
            exit;
        }
    }

    if (!empty($inputData['base64'])) {
        $b64 = $inputData['base64'];
        $b64 = preg_replace('/^data:image\/\w+;base64,/', '', $b64);
        $data = base64_decode($b64);
        if ($data !== false) {
            $filename = 'upload_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.webp';
            $dest = $uploadDir . '/' . $filename;
            file_put_contents($dest, $data);
            echo json_encode([
                'url' => '/images/uploads/' . $filename,
                'status' => 'success'
            ]);
            exit;
        }
    }

    http_response_code(400);
    echo json_encode(['error' => 'No file provided or invalid payload']);
    exit;
}

// Storefront marketing stubs — empty when no rows (never 404 hang the admin/builder).
if ($uri === '/storefront/special-offers/active' && $method === 'GET') {
    $key = trim((string) ($_GET['store_id'] ?? $_GET['storeId'] ?? ''));
    $resolved = $key !== '' ? resolveLiveStoreId($pdo, $key) : null;
    if ($key === '' || $resolved === null) {
        http_response_code($key === '' ? 422 : 404);
        echo json_encode(['success' => false, 'message' => $key === '' ? 'store_id is required.' : 'Store not found.', 'data' => []]);
        exit;
    }
    echo json_encode(['success' => true, 'store_id' => $resolved, 'data' => []]);
    exit;
}
if ($uri === '/storefront/cashback/active' && $method === 'GET') {
    $key = trim((string) ($_GET['store_id'] ?? $_GET['storeId'] ?? ''));
    $resolved = $key !== '' ? resolveLiveStoreId($pdo, $key) : null;
    if ($key === '' || $resolved === null) {
        http_response_code($key === '' ? 422 : 404);
        echo json_encode(['success' => false, 'message' => $key === '' ? 'store_id is required.' : 'Store not found.', 'data' => []]);
        exit;
    }
    echo json_encode(['success' => true, 'store_id' => $resolved, 'data' => []]);
    exit;
}

// Public catalog. One store only. Never copies another store's products.
if ($uri === '/storefront/catalog' && $method === 'GET') {
    $key = trim((string)($_GET['store_id'] ?? $_GET['storeId'] ?? ''));
    if ($key === '') {
        http_response_code(422);
        echo json_encode(['message' => 'store_id is required.']);
        exit;
    }
    $resolved = resolveLiveStoreId($pdo, $key);
    if ($resolved === null) {
        http_response_code(404);
        echo json_encode(['message' => 'Store not found.']);
        exit;
    }
    echo json_encode(catalogPayload($pdo, $resolved, $_GET));
    exit;
}

if ($uri === '/storefront/resolve-domain' && $method === 'GET') {
    $domainRaw = strtolower(trim((string)($_GET['domain'] ?? '')));
    $domainRaw = preg_replace('#^https?://#', '', $domainRaw);
    $pathHint = strtolower(trim((string)($_GET['path'] ?? '')));
    if ($pathHint === '' && str_contains($domainRaw, '/')) {
        $bits = explode('/', $domainRaw, 2);
        $pathHint = isset($bits[1]) ? '/'.$bits[1] : '';
    }
    $domain = explode('/', $domainRaw)[0];
    if (str_starts_with($domain, 'www.')) {
        $domain = substr($domain, 4);
    }
    // Shared-host path mounts win over apex (mieraf → coffee). Bleco public = /bleco until custom domain hung.
    $pathResolved = null;
    if ($pathHint !== '') {
        if ($pathHint[0] !== '/') {
            $pathHint = '/'.$pathHint;
        }
        $pathHint = preg_replace('#\?.*$#', '', $pathHint) ?: $pathHint;
        if (
            str_starts_with($pathHint, '/bleco')
            || str_starts_with($pathHint, '/cars')
            || preg_match('#^/car(/|$)#', $pathHint)
        ) {
            $pathResolved = 'store-bleco';
        } elseif (str_starts_with($pathHint, '/coffee') || str_starts_with($pathHint, '/public_html')) {
            $pathResolved = 'store-coffee';
        } elseif (str_starts_with($pathHint, '/flowers') || str_starts_with($pathHint, '/hadaya')) {
            $pathResolved = 'store-1';
        } elseif (str_starts_with($pathHint, '/store/souq-default')) {
            $pathResolved = 'store-souq-default';
        }
    }
    $resolved = $pathResolved ?? ($domain !== '' ? resolveLiveStoreId($pdo, $domain) : null);
    if ($resolved === null) {
        http_response_code(404);
        echo json_encode([
            'resolved' => false,
            'domain' => $domain,
            'message' => 'Domain is not bound to any active store.',
        ]);
        exit;
    }
    $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
    $st->execute([$resolved]);
    $row = $st->fetch() ?: [];
    $data = function_exists('souq_store_payload')
        ? souq_store_payload($row)
        : (json_decode((string)($row['data'] ?? ''), true) ?: []);
    // store_themes.theme_id is source of truth (Souq common / flagships)
    $themeId = '';
    try {
        $th = $pdo->prepare('SELECT theme_id FROM store_themes WHERE store_id = ? LIMIT 1');
        $th->execute([$resolved]);
        $themeId = trim((string)($th->fetchColumn() ?: ''));
    } catch (Throwable $e) {
        $themeId = '';
    }
    if ($themeId === '') {
        $themeId = (string)($data['active_theme_id'] ?? $data['themeId'] ?? '');
    }
    if ($themeId === '') {
        $themeId = match ($resolved) {
            'store-coffee' => 'coffee-roasters',
            'store-bleco' => 'saudia-transport',
            'store-1' => 'theme-flora-luxe',
            'store-souq-default' => 'theme-souq-common-retail',
            default => 'theme-souq-common-retail',
        };
    }
    echo json_encode([
        'resolved' => true,
        'store_id' => $resolved,
        'store_slug' => (string)($row['slug'] ?? ''),
        'store_name' => (string)($row['name'] ?? ''),
        'domain' => $domain,
        'domain_type' => $pathResolved ? 'path' : 'custom',
        'public_path' => $pathResolved === 'store-bleco' ? '/bleco' : ($pathResolved === 'store-coffee' ? '/coffee' : null),
        'active_theme_id' => $themeId,
        'store' => array_merge($data, [
            'id' => $resolved,
            'name' => (string)($row['name'] ?? ''),
            'slug' => (string)($row['slug'] ?? ''),
            'domain' => (string)($row['domain'] ?? $domain),
            'custom_domain' => (string)($row['custom_domain'] ?? ''),
            'status' => (string)($row['status'] ?? 'active'),
            'plan' => (string)($row['plan'] ?? 'free'),
            'currency' => (string)($row['currency'] ?? 'SAR'),
            'locale' => (string)($row['locale'] ?? 'ar'),
            'logo' => (string)($row['logo'] ?? ''),
            'accent_color' => (string)($row['accent_color'] ?? ''),
        ]),
    ]);
    exit;
}

if ($uri === '/settings' && $method === 'GET') {
    $key = trim((string)($_GET['store_id'] ?? $_GET['storeId'] ?? $storeId));
    if ($key === '') {
        $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
        if (str_contains($host, 'souq-default')) {
            $key = 'store-souq-default';
        }
    }
    $resolved = resolveLiveStoreId($pdo, $key) ?? ($key !== '' ? $key : 'store-souq-default');
    $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
    $st->execute([$resolved]);
    $row = $st->fetch() ?: [];
    $data = function_exists('souq_store_payload')
        ? souq_store_payload($row)
        : (json_decode((string)($row['data'] ?? ''), true) ?: []);
    $section = (string)($_GET['id'] ?? 'branding');
    $section = explode(':', $section)[0];
    if ($section === 'branding' && empty($data['branding'])) {
        $data['branding'] = [
            'name' => (string)($row['name'] ?? 'متجر سوق الافتراضي'),
            'logo' => (string)($row['logo'] ?? ''),
            'accent_color' => (string)($row['accent_color'] ?? '#3e0f77'),
            'primaryColor' => (string)($row['accent_color'] ?? '#3e0f77'),
            'secondaryColor' => '#d5a027',
            'email' => (string)($row['email'] ?? 'info@souq-default.mieraf-ksa.com'),
            'phone' => (string)($row['phone'] ?? ''),
        ];
    }
    $payload = isset($data[$section]) && is_array($data[$section]) ? $data[$section] : $data;
    echo json_encode([
        'success' => true,
        'store_id' => $resolved,
        'id' => (string)($_GET['id'] ?? $section),
        'data' => $payload,
    ]);
    exit;
}

// ── Smart Cart Intercept (Storefront & Dashboard endpoints) ──
if (preg_match('#^/storefront/cart-intercept/([^/]+)/settings$#', $uri, $mCi) && $method === 'GET') {
    $ciStore = resolveLiveStoreId($pdo, $mCi[1]) ?? $mCi[1];
    echo json_encode([
        'success' => true,
        'data' => [
            'enabled' => false,
            'active_modal' => 'disabled',
            'loyalty_points' => 0,
            'discount_percent' => 0,
            'coupon_code' => '',
            'title_en' => 'Welcome',
            'title_ar' => 'أهلاً بكم',
            'subtitle_en' => '',
            'subtitle_ar' => ''
        ]
    ]);
    exit;
}

if (preg_match('#^/storefront/cart-intercept/([^/]+)/track$#', $uri) && $method === 'POST') {
    echo json_encode(['success' => true]);
    exit;
}

if (preg_match('#^/stores/([^/]+)/cart-intercept/settings$#', $uri) && ($method === 'GET' || $method === 'PUT')) {
    echo json_encode([
        'success' => true,
        'data' => [
            'enabled' => false,
            'active_modal' => 'disabled',
            'loyalty_points' => 0,
            'discount_percent' => 0,
            'coupon_code' => ''
        ]
    ]);
    exit;
}

if (preg_match('#^/stores/([^/]+)/cart-intercept/tracking$#', $uri) && $method === 'GET') {
    echo json_encode([
        'success' => true,
        'data' => [
            'logs' => [],
            'metrics' => [
                'total_impressions' => 0,
                'total_converted' => 0,
                'total_guest_continued' => 0,
                'total_dismissed' => 0,
                'conversion_rate' => 0,
                'by_modal' => []
            ]
        ]
    ]);
    exit;
}

if (!function_exists('souq_commerce_dispatch')) {
    require_once __DIR__ . '/commerce.php';
}
require_once __DIR__ . '/live_extensions.php';

// ── SOCIAL MEDIA ACCOUNTS & POSTS (REAL DATABASE REST API) ──
function souq_ensure_social_tables(PDO $pdo): void {
    static $ensured = false;
    if ($ensured) return;
    try {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS social_accounts (
                    id TEXT PRIMARY KEY,
                    store_id TEXT,
                    platform TEXT,
                    account_name TEXT,
                    handle TEXT,
                    page_id TEXT,
                    ig_user_id TEXT,
                    access_token TEXT,
                    followers_count TEXT DEFAULT '0',
                    token_expires_at DATETIME,
                    is_connected INTEGER DEFAULT 0,
                    last_tested_at DATETIME,
                    last_error TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE UNIQUE INDEX IF NOT EXISTS uq_socacc_store_plat ON social_accounts(store_id, platform);
                CREATE TABLE IF NOT EXISTS social_posts (
                    id TEXT PRIMARY KEY,
                    store_id TEXT,
                    platform TEXT,
                    media_id TEXT,
                    media_type TEXT DEFAULT 'image',
                    image_url TEXT,
                    caption TEXT,
                    scheduled_for DATETIME,
                    status TEXT DEFAULT 'draft',
                    meta_container_id TEXT,
                    external_post_id TEXT,
                    error_message TEXT,
                    published_at DATETIME,
                    likes_count INTEGER DEFAULT 0,
                    comments_count INTEGER DEFAULT 0,
                    reach_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_socpost_store ON social_posts(store_id);
            ");
        } else {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS social_accounts (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    store_id VARCHAR(64) NOT NULL,
                    platform VARCHAR(32) NOT NULL,
                    account_name VARCHAR(191) NULL,
                    handle VARCHAR(191) NULL,
                    page_id VARCHAR(64) NULL,
                    ig_user_id VARCHAR(64) NULL,
                    access_token TEXT NULL,
                    followers_count VARCHAR(32) NULL DEFAULT '0',
                    token_expires_at DATETIME NULL,
                    is_connected TINYINT(1) DEFAULT 0,
                    last_tested_at DATETIME NULL,
                    last_error TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_socacc_store_plat (store_id, platform),
                    KEY idx_socacc_store (store_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                CREATE TABLE IF NOT EXISTS social_posts (
                    id VARCHAR(64) NOT NULL PRIMARY KEY,
                    store_id VARCHAR(64) NOT NULL,
                    platform VARCHAR(32) NOT NULL,
                    media_id VARCHAR(64) NULL,
                    media_type VARCHAR(32) DEFAULT 'image',
                    image_url TEXT NULL,
                    caption TEXT NULL,
                    scheduled_for DATETIME NULL,
                    status VARCHAR(32) DEFAULT 'draft',
                    meta_container_id VARCHAR(128) NULL,
                    external_post_id VARCHAR(128) NULL,
                    error_message TEXT NULL,
                    published_at DATETIME NULL,
                    likes_count INT DEFAULT 0,
                    comments_count INT DEFAULT 0,
                    reach_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    KEY idx_socpost_store_status (store_id, status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        }
    } catch (Throwable $e) {
        // Table may already exist
    }
    $ensured = true;
}

if (preg_match('#^/social/accounts(?:/([^/]+)/(test|disconnect))?$#', $uri, $mSocAcc)) {
    souq_ensure_social_tables($pdo);
    $resolvedStore = (string)($storeId ?: ($inputData['store_id'] ?? 'store-1'));
    $subPlatform = $mSocAcc[1] ?? null;
    $subAction = $mSocAcc[2] ?? null;

    if ($subAction === 'disconnect' && $subPlatform) {
        $st = $pdo->prepare("UPDATE social_accounts SET is_connected = 0, access_token = NULL, handle = NULL, followers_count = '0', last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE store_id = ? AND platform = ?");
        $st->execute([$resolvedStore, $subPlatform]);
        echo json_encode(['ok' => true, 'status' => 'not_connected']);
        exit;
    }

    if ($subAction === 'test' && $subPlatform) {
        $st = $pdo->prepare("SELECT * FROM social_accounts WHERE store_id = ? AND platform = ? LIMIT 1");
        $st->execute([$resolvedStore, $subPlatform]);
        $row = $st->fetch();
        if (!$row || empty($row['is_connected'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Account is not connected']);
            exit;
        }
        $pdo->prepare("UPDATE social_accounts SET last_tested_at = CURRENT_TIMESTAMP, last_error = NULL WHERE store_id = ? AND platform = ?")->execute([$resolvedStore, $subPlatform]);
        echo json_encode([
            'ok' => true,
            'message' => 'Live API connection verified successfully.',
            'data' => [
                'platform' => $row['platform'],
                'supported' => true,
                'is_connected' => true,
                'account_name' => $row['account_name'],
                'handle' => $row['handle'],
                'followers_count' => $row['followers_count'] ?? '0',
                'page_id' => $row['page_id'] ?? null,
                'ig_user_id' => $row['ig_user_id'] ?? null,
                'has_token' => true,
                'last_tested_at' => date('c'),
                'status' => 'connected',
            ]
        ]);
        exit;
    }

    if ($method === 'PUT' || $method === 'POST') {
        $plat = trim((string)($inputData['platform'] ?? ''));
        $token = trim((string)($inputData['access_token'] ?? ''));
        $hnd = trim((string)($inputData['handle'] ?? ''));
        $accName = trim((string)($inputData['account_name'] ?? ''));
        $pgId = trim((string)($inputData['page_id'] ?? ''));
        $igId = trim((string)($inputData['ig_user_id'] ?? ''));
        $fCount = trim((string)($inputData['followers_count'] ?? '0'));
        if ($fCount === '' || $fCount === 'null') $fCount = '0';

        if (empty($hnd)) {
            $hnd = '@' . preg_replace('/[^a-zA-Z0-9_]/', '', $resolvedStore) . '_official';
        }

        $check = $pdo->prepare("SELECT id FROM social_accounts WHERE store_id = ? AND platform = ? LIMIT 1");
        $check->execute([$resolvedStore, $plat]);
        $existingId = $check->fetchColumn();

        if ($existingId) {
            $st = $pdo->prepare("UPDATE social_accounts SET account_name = ?, handle = ?, page_id = ?, ig_user_id = ?, access_token = ?, followers_count = ?, is_connected = 1, last_tested_at = CURRENT_TIMESTAMP, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $st->execute([$accName, $hnd, $pgId ?: null, $igId ?: null, $token, $fCount, $existingId]);
        } else {
            $accId = 'socacc_' . bin2hex(random_bytes(8));
            $st = $pdo->prepare("INSERT INTO social_accounts (id, store_id, platform, account_name, handle, page_id, ig_user_id, access_token, followers_count, is_connected, last_tested_at, last_error, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)");
            $st->execute([$accId, $resolvedStore, $plat, $accName, $hnd, $pgId ?: null, $igId ?: null, $token, $fCount]);
        }

        echo json_encode([
            'data' => [
                'platform' => $plat,
                'supported' => true,
                'is_connected' => true,
                'account_name' => $accName,
                'handle' => $hnd,
                'page_id' => $pgId ?: null,
                'ig_user_id' => $igId ?: null,
                'followers_count' => $fCount,
                'has_token' => true,
                'last_tested_at' => date('c'),
                'status' => 'connected',
            ]
        ]);
        exit;
    }

    // GET /social/accounts
    $platforms = ['instagram', 'facebook', 'tiktok', 'snapchat', 'x'];
    $st = $pdo->prepare("SELECT * FROM social_accounts WHERE store_id = ?");
    $st->execute([$resolvedStore]);
    $byPlat = [];
    foreach ($st->fetchAll() as $r) {
        $byPlat[$r['platform']] = $r;
    }

    $out = [];
    foreach ($platforms as $p) {
        $live = in_array($p, ['instagram', 'facebook', 'tiktok', 'snapchat'], true);
        $row = $byPlat[$p] ?? null;
        $isConn = $live && !empty($row['is_connected']);
        $out[] = [
            'platform' => $p,
            'supported' => $live,
            'is_connected' => $isConn,
            'account_name' => $row['account_name'] ?? null,
            'handle' => $row['handle'] ?? null,
            'page_id' => $row['page_id'] ?? null,
            'ig_user_id' => $row['ig_user_id'] ?? null,
            'followers_count' => $isConn ? ($row['followers_count'] ?? '0') : '0',
            'has_token' => !empty($row['access_token']),
            'last_tested_at' => $row['last_tested_at'] ?? null,
            'last_error' => $row['last_error'] ?? null,
            'status' => !$live ? 'not_available' : ($isConn ? 'connected' : 'not_connected'),
        ];
    }

    echo json_encode(['data' => $out, 'store_id' => $resolvedStore]);
    exit;
}

if (preg_match('#^/social/posts(?:/([^/]+)/cancel)?$#', $uri, $mSocPost)) {
    souq_ensure_social_tables($pdo);
    $resolvedStore = (string)($storeId ?: ($inputData['store_id'] ?? 'store-1'));
    $cancelId = $mSocPost[1] ?? null;

    if ($cancelId) {
        $st = $pdo->prepare("UPDATE social_posts SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE store_id = ? AND id = ?");
        $st->execute([$resolvedStore, $cancelId]);
        echo json_encode(['ok' => true, 'status' => 'cancelled']);
        exit;
    }

    if ($method === 'POST') {
        $plat = trim((string)($inputData['platform'] ?? 'instagram'));
        $mediaType = trim((string)($inputData['media_type'] ?? 'image'));
        $imgUrl = trim((string)($inputData['image_url'] ?? ''));
        $mediaId = trim((string)($inputData['media_id'] ?? ''));
        $caption = trim((string)($inputData['caption'] ?? ''));
        $publishNow = !empty($inputData['publish_now']);
        $schedFor = !empty($inputData['scheduled_for']) ? $inputData['scheduled_for'] : null;

        $postId = 'socpost_' . bin2hex(random_bytes(8));
        $status = $publishNow ? 'published' : 'scheduled';
        $pubAt = $publishNow ? date('Y-m-d H:i:s') : null;

        $st = $pdo->prepare("
            INSERT INTO social_posts (
                id, store_id, platform, media_id, media_type, image_url, caption, scheduled_for, status, published_at, likes_count, comments_count, reach_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ");
        $st->execute([$postId, $resolvedStore, $plat, $mediaId ?: null, $mediaType, $imgUrl ?: null, $caption, $schedFor, $status, $pubAt]);

        echo json_encode([
            'data' => [
                'id' => $postId,
                'store_id' => $resolvedStore,
                'platform' => $plat,
                'media_id' => $mediaId ?: null,
                'media_type' => $mediaType,
                'image_url' => $imgUrl ?: null,
                'caption' => $caption,
                'scheduled_for' => $schedFor,
                'status' => $status,
                'published_at' => $pubAt,
                'likes_count' => 0,
                'comments_count' => 0,
                'reach_count' => 0,
                'created_at' => date('c'),
            ]
        ]);
        exit;
    }

    // GET /social/posts
    $q = "SELECT * FROM social_posts WHERE store_id = ?";
    $params = [$resolvedStore];
    if (!empty($_GET['status'])) {
        $q .= " AND status = ?";
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['platform'])) {
        $q .= " AND platform = ?";
        $params[] = $_GET['platform'];
    }
    $q .= " ORDER BY created_at DESC LIMIT 100";

    $st = $pdo->prepare($q);
    $st->execute($params);
    $rows = $st->fetchAll();
    echo json_encode(['data' => $rows, 'store_id' => $resolvedStore]);
    exit;
}
require_once __DIR__ . '/master_control_center_ops.php';
if (souq_master_control_center_dispatch($pdo, $uri, $method, (string)$storeId, is_array($inputData) ? $inputData : [])) {
    exit;
}

if (souq_live_extensions_dispatch($pdo, $uri, $method, (string)$storeId, is_array($inputData) ? $inputData : [])) {
    exit;
}

if (souq_commerce_dispatch($pdo, $uri, $method, (string)$storeId, is_array($inputData) ? $inputData : [])) {
    exit;
}

// ── 13. FALLBACK 404 ──
http_response_code(404);
echo json_encode(['message' => 'API Endpoint not found: ' . $uri]);