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

// Restore pre-smoke production-looking values (same store row).
$order->customer_email = 'rayan.sulaiman@gmail.com';
$order->payment_transaction_id = null;
// Keep delivery_location if merchant-owned; only clear smoke marker.
if (str_contains((string) $order->delivery_location, 'Smoke Test')) {
    $order->delivery_location = 'Makkah';
}
$order->save();

echo json_encode([
    'restored' => true,
    'id' => $order->id,
    'customer_email' => $order->customer_email,
    'delivery_location' => $order->delivery_location,
    'payment_transaction_id' => $order->payment_transaction_id,
], JSON_UNESCAPED_UNICODE) . PHP_EOL;
