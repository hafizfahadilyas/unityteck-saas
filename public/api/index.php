<?php
/**
 * UnityTeck Multi-Store E-Commerce Platform
 * Hostinger Production Database & REST API Gateway
 * Fully Multi-Tenant, Zero Stale LocalStorage Cache, Lifetime Live Sync.
 */

declare(strict_types=1);

// Disable error display in production to prevent JSON corruption
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Security & Lifetime Fresh Data Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Store-Id, X-Portal, Cache-Control, Pragma');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: 0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure database directory exists
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0777, true);
}
$dbPath = $dataDir . '/platform.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize Schema
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
    ");

    // Auto-seed if stores table is empty
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

    // Always enforce latest ZEDAAN perfume image for HM-WOMEN-01
    $pdo->exec("
        UPDATE products 
        SET image_url = '/images/hadaya_women_luxury_gift_zedaan.webp',
            gallery_urls = '[\"/images/hadaya_women_luxury_gift_zedaan.webp\"]',
            updated_at = datetime('now')
        WHERE sku = 'HM-WOMEN-01' AND (image_url LIKE '%1791219815272%' OR image_url IS NULL OR image_url = '')
    ");

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

$storeId = $_SERVER['HTTP_X_STORE_ID'] ?? ($_GET['storeId'] ?? ($_GET['store_id'] ?? 'store-1'));
$inputJson = file_get_contents('php://input');
$inputData = json_decode($inputJson, true) ?: [];

// Helper: Format product row for frontend client
function formatProduct(array $row): array {
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
    if (empty($gallery) && !empty($row['image_url'])) {
        $gallery = [$row['image_url']];
    }

    $merged = array_merge($full, [
        'id' => (string)$row['id'],
        'storeId' => (string)$row['store_id'],
        'store_id' => (string)$row['store_id'],
        'name' => (string)$row['name'],
        'nameAr' => (string)($row['name_ar'] ?? $row['name']),
        'name_ar' => (string)($row['name_ar'] ?? $row['name']),
        'sku' => (string)$row['sku'],
        'price' => (float)$row['price'],
        'originalPrice' => !empty($row['original_price']) ? (float)$row['original_price'] : (float)$row['price'],
        'original_price' => !empty($row['original_price']) ? (float)$row['original_price'] : (float)$row['price'],
        'stock' => (int)$row['stock'],
        'category' => (string)($row['category'] ?? ''),
        'categoryAr' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'category_ar' => (string)($row['category_ar'] ?? $row['category'] ?? ''),
        'image' => (string)($row['image_url'] ?? ''),
        'image_url' => (string)($row['image_url'] ?? ''),
        'imageUrl' => (string)($row['image_url'] ?? ''),
        'galleryUrls' => $gallery,
        'gallery_urls' => $gallery,
        'status' => (string)($row['status'] ?? 'published'),
        'isActive' => (bool)($row['is_active'] ?? true),
        'is_active' => (bool)($row['is_active'] ?? true),
        'imageVersion' => (string)strtotime($row['updated_at'] ?? 'now'),
        'isStale' => false,
    ]);

    return $merged;
}

// ── ROUTER ──

// 1. Health check
if ($uri === '/health') {
    $prodTotal = (int)$pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    $stTotal = (int)$pdo->query("SELECT COUNT(*) FROM stores")->fetchColumn();
    echo json_encode([
        'status' => 'ok',
        'provider' => 'Hostinger Cloud API',
        'database' => 'active_live_sqlite',
        'stores_count' => $stTotal,
        'products_count' => $prodTotal,
        'timestamp' => date('c'),
    ]);
    exit;
}

// 2. Auth / Me Mock Endpoint (Returns authentic store context)
if ($uri === '/auth/me') {
    echo json_encode([
        'user' => [
            'id' => 'user-store-1',
            'name' => 'متجر هدايا',
            'email' => 'giftshop2030m@gmail.com',
            'role' => 'manager',
        ],
        'portal' => 'store',
        'store_id' => $storeId,
        'store_name' => 'متجر هدايا - مكة المكرمة',
    ]);
    exit;
}

// 3. Stores List
if ($uri === '/stores' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM stores ORDER BY id ASC");
    $stores = [];
    while ($row = $stmt->fetch()) {
        $st = json_decode($row['data'], true) ?: [];
        $st['id'] = $row['id'];
        $st['name'] = $row['name'];
        $st['slug'] = $row['slug'];
        $st['domain'] = $row['domain'];
        // Compute real product count
        $cnt = (int)$pdo->prepare("SELECT COUNT(*) FROM products WHERE store_id = ?")->execute([$row['id']]) ? $pdo->query("SELECT COUNT(*) FROM products WHERE store_id = '{$row['id']}'")->fetchColumn() : 0;
        $st['productsCount'] = $cnt;
        $stores[] = $st;
    }
    echo json_encode(['data' => $stores]);
    exit;
}

// 4. Products List
if ($uri === '/products' && $method === 'GET') {
    $effectiveStore = $storeId;
    // If no products exist for target store, clone baseline store-1 products into this store
    $count = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE store_id = " . $pdo->quote($effectiveStore))->fetchColumn();
    if ($count === 0 && $effectiveStore !== 'store-1') {
        $baseStmt = $pdo->prepare("SELECT * FROM products WHERE store_id = 'store-1'");
        $baseStmt->execute();
        $ins = $pdo->prepare("
            INSERT OR REPLACE INTO products (
                id, store_id, name, name_ar, sku, price, original_price, stock, 
                category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ");
        while ($baseRow = $baseStmt->fetch()) {
            $newId = preg_replace('/^women-gift-|^prod-/', '', $baseRow['id']) . '-' . substr(md5($effectiveStore), 0, 4);
            $ins->execute([
                $newId, $effectiveStore, $baseRow['name'], $baseRow['name_ar'], $baseRow['sku'],
                $baseRow['price'], $baseRow['original_price'], $baseRow['stock'],
                $baseRow['category'], $baseRow['category_ar'], $baseRow['image_url'],
                $baseRow['gallery_urls'], $baseRow['status'], $baseRow['is_active'],
                $baseRow['data']
            ]);
        }
    }

    $q = "SELECT * FROM products WHERE store_id = :storeId ORDER BY updated_at DESC, id ASC";
    $stmt = $pdo->prepare($q);
    $stmt->execute([':storeId' => $effectiveStore]);

    $products = [];
    while ($row = $stmt->fetch()) {
        $products[] = formatProduct($row);
    }

    echo json_encode([
        'data' => $products,
        'meta' => [
            'total' => count($products),
            'page' => 1,
            'per_page' => max(1, count($products)),
            'last_page' => 1,
        ]
    ]);
    exit;
}

// 5. Create Product
if ($uri === '/products' && $method === 'POST') {
    $id = $inputData['id'] ?? ('prod-' . uniqid());
    $sku = $inputData['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -6)));
    $name = $inputData['name'] ?? 'منتج جديد';
    $nameAr = $inputData['name_ar'] ?? ($inputData['nameAr'] ?? $name);
    $price = (float)($inputData['price'] ?? 0);
    $origPrice = (float)($inputData['original_price'] ?? ($inputData['originalPrice'] ?? $price));
    $stock = (int)($inputData['stock'] ?? 10);
    $cat = $inputData['category'] ?? 'عام';
    $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $cat);
    $img = $inputData['image_url'] ?? ($inputData['image'] ?? '/images/hadaya_women_luxury_gift_zedaan.webp');
    $gal = isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls']) 
        ? json_encode($inputData['gallery_urls']) 
        : (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls']) ? json_encode($inputData['galleryUrls']) : json_encode([$img]));
    $status = $inputData['status'] ?? 'published';
    $isActive = (!isset($inputData['is_active']) || $inputData['is_active']) ? 1 : 0;

    $stmt = $pdo->prepare("
        INSERT OR REPLACE INTO products (
            id, store_id, name, name_ar, sku, price, original_price, stock, 
            category, category_ar, image_url, gallery_urls, status, is_active, data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ");
    $stmt->execute([
        $id, $storeId, $name, $nameAr, $sku, $price, $origPrice, $stock,
        $cat, $catAr, $img, $gal, $status, $isActive,
        json_encode($inputData, JSON_UNESCAPED_UNICODE)
    ]);

    $fetch = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetch->execute([$id]);
    $created = $fetch->fetch();
    echo json_encode(['data' => formatProduct($created)]);
    exit;
}

// 6. Update Product (PATCH / PUT / POST on /products/{id})
if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && in_array($method, ['PATCH', 'PUT', 'POST'])) {
    $pId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$pId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        // Try SKU match
        $stmt2 = $pdo->prepare("SELECT * FROM products WHERE sku = ?");
        $stmt2->execute([$pId]);
        $existing = $stmt2->fetch();
    }

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found: ' . $pId]);
        exit;
    }

    $existingData = json_decode($existing['data'] ?? '{}', true) ?: [];
    $mergedData = array_merge($existingData, $inputData);

    $name = $inputData['name'] ?? $existing['name'];
    $nameAr = $inputData['name_ar'] ?? ($inputData['nameAr'] ?? $existing['name_ar']);
    $sku = $inputData['sku'] ?? $existing['sku'];
    $price = isset($inputData['price']) ? (float)$inputData['price'] : (float)$existing['price'];
    $origPrice = isset($inputData['original_price']) ? (float)$inputData['original_price'] : (isset($inputData['originalPrice']) ? (float)$inputData['originalPrice'] : (float)$existing['original_price']);
    $stock = isset($inputData['stock']) ? (int)$inputData['stock'] : (int)$existing['stock'];
    $cat = $inputData['category'] ?? $existing['category'];
    $catAr = $inputData['category_ar'] ?? ($inputData['categoryAr'] ?? $existing['category_ar']);
    $img = $inputData['image_url'] ?? ($inputData['image'] ?? $existing['image_url']);
    
    $gal = $existing['gallery_urls'];
    if (isset($inputData['gallery_urls']) && is_array($inputData['gallery_urls'])) {
        $gal = json_encode($inputData['gallery_urls']);
    } elseif (isset($inputData['galleryUrls']) && is_array($inputData['galleryUrls'])) {
        $gal = json_encode($inputData['galleryUrls']);
    } elseif ($img !== $existing['image_url']) {
        $curGal = json_decode($existing['gallery_urls'], true) ?: [];
        $gal = json_encode(array_values(array_unique(array_merge([$img], $curGal))));
    }

    $status = $inputData['status'] ?? $existing['status'];
    $isActive = isset($inputData['is_active']) ? ($inputData['is_active'] ? 1 : 0) : (isset($inputData['isActive']) ? ($inputData['isActive'] ? 1 : 0) : $existing['is_active']);

    $upd = $pdo->prepare("
        UPDATE products 
        SET name = ?, name_ar = ?, sku = ?, price = ?, original_price = ?, stock = ?,
            category = ?, category_ar = ?, image_url = ?, gallery_urls = ?, status = ?, is_active = ?,
            data = ?, updated_at = datetime('now')
        WHERE id = ?
    ");
    $upd->execute([
        $name, $nameAr, $sku, $price, $origPrice, $stock,
        $cat, $catAr, $img, $gal, $status, $isActive,
        json_encode($mergedData, JSON_UNESCAPED_UNICODE),
        $existing['id']
    ]);

    $fetch = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $fetch->execute([$existing['id']]);
    $updated = $fetch->fetch();
    echo json_encode(['data' => formatProduct($updated)]);
    exit;
}

// 7. Delete Product
if (preg_match('#^/products/([^/]+)$#', $uri, $matches) && $method === 'DELETE') {
    $pId = $matches[1];
    $del = $pdo->prepare("DELETE FROM products WHERE id = ? OR sku = ?");
    $del->execute([$pId, $pId]);
    echo json_encode(['success' => true]);
    exit;
}

// 8. Toggle Publish Product
if (preg_match('#^/products/([^/]+)/toggle-publish$#', $uri, $matches) && $method === 'POST') {
    $pId = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? OR sku = ?");
    $stmt->execute([$pId, $pId]);
    $existing = $stmt->fetch();
    if ($existing) {
        $newActive = $existing['is_active'] ? 0 : 1;
        $newStatus = $newActive ? 'published' : 'draft';
        $upd = $pdo->prepare("UPDATE products SET is_active = ?, status = ?, updated_at = datetime('now') WHERE id = ?");
        $upd->execute([$newActive, $newStatus, $existing['id']]);
        $existing['is_active'] = $newActive;
        $existing['status'] = $newStatus;
        echo json_encode(['data' => formatProduct($existing)]);
        exit;
    }
}

// 9. Upload file endpoint
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

// 10. Fallback 404 for unknown endpoints
http_response_code(404);
echo json_encode(['message' => 'API Endpoint not found: ' . $uri]);
