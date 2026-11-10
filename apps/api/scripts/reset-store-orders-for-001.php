<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Schema;

$storeId = $argv[1] ?? null;
if (! $storeId) {
    fwrite(STDERR, "Usage: php reset-store-orders-for-001.php store-1\n");
    exit(1);
}

$orders = Order::query()->where('store_id', $storeId)->get();
$deleted = 0;
foreach ($orders as $order) {
    if (Schema::hasTable('order_items')) {
        OrderItem::query()->where('order_id', $order->id)->delete();
    }
    if (Schema::hasTable('customer_activities')) {
        CustomerActivity::query()->where('store_id', $storeId)->where('order_id', $order->id)->delete();
    }
    $order->delete();
    $deleted++;
}

echo json_encode(['store_id' => $storeId, 'deleted_orders' => $deleted], JSON_PRETTY_PRINT) . "\n";
