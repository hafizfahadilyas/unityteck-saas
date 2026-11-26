<?php
declare(strict_types=1);

$root = dirname(__DIR__, 3);
require $root . '/public/api/live_extensions.php';
require $root . '/public/api/product_groups.php';

$env = souq_load_root_env();
$host = (string) ($env['DB_HOST'] ?? getenv('DB_HOST') ?: '');
$name = (string) ($env['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: '');
$user = (string) ($env['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: '');
$pass = (string) ($env['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '');
$port = (string) ($env['DB_PORT'] ?? getenv('DB_PORT') ?: '3306');

$pdo = null;
foreach (array_values(array_unique([$host, 'localhost', '127.0.0.1'])) as $h) {
    if ($h === '') {
        continue;
    }
    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $h, $port, $name),
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        echo "connected via {$h}\n";
        break;
    } catch (Throwable $e) {
        echo "fail {$h}: ".$e->getMessage()."\n";
    }
}

if (!$pdo instanceof PDO) {
    fwrite(STDERR, "no db\n");
    exit(1);
}

$result = souq_seed_hibrew_cf_group($pdo, 'store-coffee');
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";

$st = $pdo->prepare(
    "SELECT id, sku, name, image_url FROM products
     WHERE store_id = ?
       AND (id LIKE 'prod-grp-%cfdemo' OR sku LIKE 'GRP-CF-%')
     ORDER BY id"
);
$st->execute(['store-coffee']);
foreach ($st->fetchAll() as $row) {
    echo $row['id'].' | '.$row['sku'].' | '.$row['name'].' | '.$row['image_url']."\n";
}
