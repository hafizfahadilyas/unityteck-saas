<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$order = App\Models\Order::query()
    ->withoutGlobalScope('store')
    ->where('store_id', 'store-coffee')
    ->where('id', 'ord-cof-101')
    ->first();

if (! $order) {
    fwrite(STDERR, "order not found\n");
    exit(1);
}

$tx = 'SMOKE-DIRECT-' . time();
$order->customer_email = 'smoke.local@example.sa';
$order->delivery_location = 'Riyadh - Smoke Test District';
$order->payment_transaction_id = $tx;
$order->save();

$fresh = App\Models\Order::query()
    ->withoutGlobalScope('store')
    ->where('id', 'ord-cof-101')
    ->first(['id', 'customer_email', 'delivery_location', 'payment_transaction_id', 'store_id']);

echo json_encode([
    'ok' => true,
    'id' => $fresh->id,
    'store_id' => $fresh->store_id,
    'customer_email' => $fresh->customer_email,
    'delivery_location' => $fresh->delivery_location,
    'payment_transaction_id' => $fresh->payment_transaction_id,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
