<?php
declare(strict_types=1);

$candidates = [
    dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'mieraf-ksa.com' . DIRECTORY_SEPARATOR . 'public_html' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'index.php',
    '/home/u393490678/domains/mieraf-ksa.com/public_html/api/index.php',
];

$target = null;
foreach ($candidates as $path) {
    if (is_file($path)) {
        $target = $path;
        break;
    }
}

if ($target === null) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Souq default API bridge: central api/index.php not found', 'tried' => $candidates]);
    exit;
}

require $target;
