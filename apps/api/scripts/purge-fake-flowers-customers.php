<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-1';
$keepEmails = [
    'noura.alharbi.mk@gmail.com',
    'saad.alghamdi.mk@gmail.com',
];

DB::transaction(function () use ($storeId, $keepEmails) {
    // Delete seeded fake MKK demo orders (not the real #107 / #108 journey)
    $fakeOrders = Order::query()
        ->where('store_id', $storeId)
        ->where(function ($q) {
            $q->where('order_number', 'like', '#MKK-%')
                ->orWhere('id', 'like', 'ord-mkk-%');
        })
        ->get();

    foreach ($fakeOrders as $order) {
        if (Schema::hasTable('order_items')) {
            OrderItem::query()->where('order_id', $order->id)->delete();
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()->where('store_id', $storeId)->where('order_id', $order->id)->delete();
        }
        $order->delete();
        echo "DELETED order {$order->order_number}\n";
    }

    $keepIds = Customer::query()
        ->where('store_id', $storeId)
        ->whereIn('email', $keepEmails)
        ->pluck('id')
        ->all();

    $fakes = Customer::query()
        ->where('store_id', $storeId)
        ->whereNotIn('id', $keepIds)
        ->get();

    foreach ($fakes as $cust) {
        $linked = Order::query()->where('store_id', $storeId)->where('customer_id', $cust->id)->exists();
        if ($linked) {
            echo "SKIP linked {$cust->id} {$cust->email}\n";
            continue;
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()->where('store_id', $storeId)->where('customer_id', $cust->id)->delete();
        }
        $cust->delete();
        echo "DELETED customer {$cust->id} {$cust->name}\n";
    }
});

echo json_encode([
    'customers' => Customer::query()->where('store_id', $storeId)->get(['id', 'name', 'email', 'phone', 'total_orders']),
    'orders' => Order::query()->where('store_id', $storeId)->get(['order_number', 'customer_name', 'status', 'total_amount']),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
