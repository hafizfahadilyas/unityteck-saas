<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$deleted = Illuminate\Support\Facades\DB::table('personal_access_tokens')
    ->whereIn('name', ['local-smoke', 'kernel-smoke'])
    ->delete();

$open = null;
try {
    $row = Illuminate\Support\Facades\DB::selectOne('SHOW STATUS LIKE "Threads_connected"');
    $open = $row->Value ?? ($row->value ?? null);
} catch (Throwable $e) {
    $open = 'n/a: '.$e->getMessage();
}

echo json_encode([
    'deleted_smoke_tokens' => $deleted,
    'threads_connected' => $open,
    'stores' => App\Models\Store::count(),
    'orders' => App\Models\Order::count(),
], JSON_PRETTY_PRINT) . PHP_EOL;
