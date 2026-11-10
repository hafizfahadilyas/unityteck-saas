<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function lap(string $label, float $t0): float
{
    $now = microtime(true);
    echo sprintf("%-28s %dms\n", $label, (int) (($now - $t0) * 1000));

    return $now;
}

$t = microtime(true);
$storeId = 'store-coffee';
$id = 'ord-cof-101';

$order = App\Models\Order::query()->withoutGlobalScope('store')->forStore($storeId)->with('items')->where('id', $id)->firstOrFail();
$t = lap('load order+items', $t);

$prevStatus = $order->status;
$data = [
    'delivery_location' => 'Riyadh',
    'customer_email' => 'step.test@example.sa',
];

Illuminate\Support\Facades\DB::transaction(function () use ($order, $data, $prevStatus) {
    $order->status = $data['status'] ?? $prevStatus;
    if (array_key_exists('customer_email', $data)) {
        $order->customer_email = $data['customer_email'];
    }
    if (array_key_exists('delivery_location', $data)) {
        $order->delivery_location = $data['delivery_location'];
    }
    $order->save();
});
$t = lap('transaction save', $t);

$fresh = $order->fresh(['items', 'customer', 'returns']);
$t = lap('fresh relations', $t);

echo json_encode([
    'email' => $fresh->customer_email,
    'loc' => $fresh->delivery_location,
], JSON_UNESCAPED_UNICODE) . PHP_EOL;

$order->customer_email = 'rayan.sulaiman@gmail.com';
$order->delivery_location = 'Makkah';
$order->save();
lap('restore', $t);
