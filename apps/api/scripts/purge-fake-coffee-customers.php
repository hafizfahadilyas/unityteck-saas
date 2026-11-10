<?php

/**
 * Zero-mock: remove seeded HiBrew demo customers + #COF-* orders from store-coffee.
 * Keeps only real checkout-linked rows; resets store KPI counters from remaining orders.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';

$fakeCustomerIds = [
    'cust-cof-1',
    'cust-cof-2',
    'cust-cof-3',
    'cust-cof-4',
    'cust-cof-5',
    'cust-cof-6',
    'cust-cof-7',
    'cust-cof-8',
    'cust-cof-fahad',
];

$fakeEmails = [
    'rayan.sulaiman@gmail.com',
    'noura.qahtani@saudimail.com',
    'sultan.ghamdi@outlook.sa',
    'bader.otaibi@aramco.com',
    'a.shammari@gmail.com',
    'hind.tamimi@yahoo.com',
    'meshal.dossary@gmail.com',
    'ahmed.zahrani@hotmail.com',
    'customer_7893@store.sa',
];

DB::transaction(function () use ($storeId, $fakeCustomerIds, $fakeEmails) {
    $fakeOrders = Order::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->where(function ($q) {
            $q->where('order_number', 'like', '#COF-%')
                ->orWhere('id', 'like', 'ord-cof-%');
        })
        ->get();

    foreach ($fakeOrders as $order) {
        if (Schema::hasTable('order_items')) {
            OrderItem::withoutGlobalScope('store')->where('order_id', $order->id)->delete();
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()
                ->where('store_id', $storeId)
                ->where('order_id', $order->id)
                ->delete();
        }
        $order->delete();
        echo "DELETED order {$order->order_number}\n";
    }

    $fakes = Customer::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->where(function ($q) use ($fakeCustomerIds, $fakeEmails) {
            $q->whereIn('id', $fakeCustomerIds)
                ->orWhereIn('email', $fakeEmails);
        })
        ->get();

    foreach ($fakes as $cust) {
        $linked = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('customer_id', $cust->id)
            ->exists();
        if ($linked) {
            echo "SKIP linked {$cust->id} {$cust->email}\n";
            continue;
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $cust->id)
                ->delete();
        }
        $cust->delete();
        echo "DELETED customer {$cust->id} {$cust->name}\n";
    }

    // Recalc remaining customers from real orders only (1 order → total_orders=1).
    $remaining = Customer::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->get();

    foreach ($remaining as $cust) {
        $stats = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('customer_id', $cust->id)
            ->whereNotIn('status', ['cancelled', 'canceled'])
            ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as spend, MAX(order_date) as last_dt')
            ->first();

        $cnt = (int) ($stats->cnt ?? 0);
        $spend = (float) ($stats->spend ?? 0);
        $cust->total_orders = $cnt;
        $cust->total_spend = $spend;
        $cust->avg_order_value = $cnt > 0 ? round($spend / $cnt, 2) : 0;
        $cust->last_order_date = $stats->last_dt ?: null;
        if ($cnt === 0) {
            $cust->status = $cust->status === 'VIP' ? 'New' : ($cust->status ?: 'New');
        }
        $cust->save();
        echo "SYNC customer {$cust->id} orders={$cnt} spend={$spend}\n";
    }

    $orderCount = (int) Order::withoutGlobalScope('store')->where('store_id', $storeId)->count();
    $revenue = (float) Order::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->whereNotIn('status', ['cancelled', 'canceled'])
        ->sum('total_amount');

    Store::query()->where('id', $storeId)->update([
        'orders_count' => $orderCount,
        'revenue' => $revenue,
        'visitors_count' => 0,
    ]);
    echo "STORE KPIs orders={$orderCount} revenue={$revenue}\n";
});

echo json_encode([
    'customers' => Customer::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->get(['id', 'name', 'email', 'phone', 'total_orders', 'total_spend']),
    'orders' => Order::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->get(['order_number', 'customer_name', 'status', 'total_amount']),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
