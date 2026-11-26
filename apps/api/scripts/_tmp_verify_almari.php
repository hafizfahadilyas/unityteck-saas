<?php
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
$st = $pdo->prepare("SELECT id,name,image_url,sku FROM products WHERE store_id='store-coffee' AND id IN ('prod-grp-cfdemo','prod-grp-c1-cfdemo','prod-grp-c2-cfdemo','prod-grp-c3-cfdemo')");
$st->execute();
foreach ($st->fetchAll() as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}
$m = $pdo->prepare('SELECT child_product_id, selector_image_url FROM product_group_members WHERE store_id=? AND parent_product_id=? ORDER BY sort_order');
$m->execute(['store-coffee', 'prod-grp-cfdemo']);
foreach ($m->fetchAll() as $r) {
    echo 'member '.json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}
