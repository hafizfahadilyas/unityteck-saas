<?php
/**
 * store-coffee only: point white-marble / golden almari rows at new black-gold PNG
 * (new filename busts Hostinger immutable CDN cache on old white marble assets).
 */
declare(strict_types=1);

$root = dirname(__DIR__, 3);
require $root . '/public/api/live_extensions.php';
$env = souq_load_root_env();
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $env['DB_HOST'], $env['DB_PORT'] ?? '3306', $env['DB_DATABASE']),
    $env['DB_USERNAME'],
    $env['DB_PASSWORD'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

$storeId = 'store-coffee';
$img = '/images/hb_jeddah_blackgold_cut_1125.png';
$nameEn = 'Jeddah Black Gold Coffee Almari';
$nameAr = 'دولاب قهوة أسود وذهبي لجدة';
$subtitleEn = 'Matte black · brushed-gold trim · dual storage doors';
$subtitleAr = 'أسود مطفي · إطار ذهبي مصقول · بابان للتخزين';
$descEn = 'Luxury coffee almari for Jeddah apartments: matte black carcass, brushed-gold trim and handles, open machine niche, and dual lower doors for cups and accessories.';

$cols = [];
foreach ($pdo->query('SHOW COLUMNS FROM products')->fetchAll() as $c) {
    $cols[$c['Field']] = true;
}

$set = [];
$params = [];
$add = static function (string $col, $val) use (&$set, &$params, $cols) {
    if (!isset($cols[$col])) {
        return;
    }
    $set[] = "{$col} = ?";
    $params[] = $val;
};

$add('name', $nameEn);
$add('name_ar', $nameAr);
$add('subtitle', $subtitleEn);
$add('subtitle_ar', $subtitleAr);
$add('description', $descEn);
$add('description_ar', 'دولاب قهوة فاخر يناسب شقق جدة: هيكل أسود مطفي، إطار ومقابض ذهبية مصقولة، ركن مفتوح للماكينة، وبابان سفليان للأكواب والمستلزمات.');
$add('image_url', $img);
$add('gallery_urls', json_encode([$img], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
$add('slug', 'jeddah-black-gold-coffee-almari');
if (isset($cols['updated_at'])) {
    $set[] = 'updated_at = NOW()';
}

$sql = 'UPDATE products SET ' . implode(', ', $set) . ' WHERE store_id = ? AND id = ?';
$params[] = $storeId;
$params[] = 'hb-almari-white-marble';
$upd = $pdo->prepare($sql);
$upd->execute($params);
echo "products hb-almari-white-marble rows={$upd->rowCount()}\n";

$goldIds = ['prod-grp-cfdemo', 'prod-grp-c1-cfdemo'];
$gUpd = $pdo->prepare(
    'UPDATE products SET image_url = ?, gallery_urls = ?, updated_at = NOW() WHERE store_id = ? AND id = ?'
);
foreach ($goldIds as $id) {
    $gUpd->execute([
        $img,
        json_encode([$img], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $storeId,
        $id,
    ]);
    echo "products {$id} rows={$gUpd->rowCount()}\n";
}

if ($pdo->query("SHOW TABLES LIKE 'product_group_members'")->fetch()) {
    $m = $pdo->prepare(
        "UPDATE product_group_members SET selector_image_url = ?
         WHERE store_id = ? AND child_product_id = 'prod-grp-c1-cfdemo'"
    );
    $m->execute([$img, $storeId]);
    echo "group member c1 rows={$m->rowCount()}\n";
}

$check = $pdo->prepare(
    "SELECT id, name, image_url FROM products
     WHERE store_id = ? AND id IN ('hb-almari-white-marble','prod-grp-cfdemo','prod-grp-c1-cfdemo')"
);
$check->execute([$storeId]);
foreach ($check->fetchAll() as $row) {
    echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
}

echo "OK black-gold almari image patch\n";
