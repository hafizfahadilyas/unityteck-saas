<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\Order;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Support\Facades\DB;

$storeId = $argv[1] ?? 'store-1';

$mockEmails = [
    'sara.sharif@gmail.com',
    'm.anas@outlook.sa',
    'fatima.shehri@outlook.com',
    'naser.hakami@gmail.com',
];

echo json_encode([
    'connection' => [
        'host' => config('database.connections.mysql.host'),
        'database' => config('database.connections.mysql.database'),
    ],
    'orders' => [
        'total' => Order::where('store_id', $storeId)->count(),
        'latest' => Order::where('store_id', $storeId)->orderByDesc('created_at')->limit(5)->get([
            'order_number', 'customer_name', 'status', 'total_amount', 'payment_method', 'created_at',
        ]),
    ],
    'customers' => [
        'total' => Customer::where('store_id', $storeId)->count(),
        'real_two' => Customer::where('store_id', $storeId)->whereIn('email', [
            'noura.alharbi.mk@gmail.com',
            'saad.alghamdi.mk@gmail.com',
        ])->get(['name', 'email', 'phone']),
        'mock_named_in_db' => Customer::where('store_id', $storeId)->where(function ($q) use ($mockEmails) {
            foreach ($mockEmails as $e) {
                $q->orWhere('email', $e);
            }
            $q->orWhere('name', 'like', '%فاطمة%')
                ->orWhere('name', 'like', '%سارة%')
                ->orWhere('name', 'like', '%محمد أنس%')
                ->orWhere('name', 'like', '%Fatima%')
                ->orWhere('name', 'like', '%Sarah%');
        })->get(['id', 'name', 'email', 'phone', 'created_at']),
    ],
    'analytics' => [
        'page_view' => StorefrontAnalyticsEvent::where('store_id', $storeId)->where('event_name', 'page_view')->count(),
        'all_events' => StorefrontAnalyticsEvent::where('store_id', $storeId)->count(),
        'unique_sessions' => StorefrontAnalyticsEvent::where('store_id', $storeId)
            ->where('event_name', 'page_view')
            ->where('created_at', '>=', now()->startOfMonth())
            ->distinct('session_key')
            ->count('session_key'),
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
