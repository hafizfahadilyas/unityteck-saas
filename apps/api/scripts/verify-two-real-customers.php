<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\Order;
use App\Models\StorefrontAnalyticsEvent;

$storeId = $argv[1] ?? 'store-1';

$emails = ['noura.alharbi.mk@gmail.com', 'saad.alghamdi.mk@gmail.com'];
$customers = Customer::query()->where('store_id', $storeId)->whereIn('email', $emails)->get();
$fakeLeft = Customer::query()
    ->where('store_id', $storeId)
    ->where(function ($q) {
        $q->where('email', 'like', '%.demo.%')
            ->orWhere('email', 'like', '%@unityteck.sa')
            ->orWhere('name', 'like', '%تجريبي%');
    })
    ->count();

echo json_encode([
    'two_customers' => $customers->map(fn ($c) => $c->only(['id', 'name', 'email', 'phone', 'total_orders', 'total_spend', 'status'])),
    'fake_customers_left' => $fakeLeft,
    'orders' => Order::query()->where('store_id', $storeId)->whereIn('order_number', ['#107', '#108'])->get(['order_number', 'status', 'customer_name', 'customer_email', 'customer_phone', 'payment_method', 'tracking_number']),
    'funnel' => [
        'page_view' => StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'page_view')->count(),
        'add_to_cart' => StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'add_to_cart')->count(),
        'begin_checkout' => StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'begin_checkout')->count(),
        'purchase' => StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'purchase')->count(),
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
