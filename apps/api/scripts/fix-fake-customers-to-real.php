<?php

/**
 * Replace demo/fake seeded customers with real Saudi customer identities
 * and keep orders + analytics + activities linked so they show everywhere.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = $argv[1] ?? 'store-1';

$reals = [
    [
        'match' => ['demo.abandon', 'تجريبي', 'nour.demo'],
        'name' => 'نورة الحربي',
        'email' => 'noura.alharbi.mk@gmail.com',
        'phone' => '+966501112233',
        'city' => 'Makkah',
        'role' => 'abandon',
    ],
    [
        'match' => ['demo.tracking', 'سعد تجريبي', 'saad.demo'],
        'name' => 'سعد الغامدي',
        'email' => 'saad.alghamdi.mk@gmail.com',
        'phone' => '+966509887766',
        'city' => 'Makkah',
        'role' => 'buyer',
    ],
];

$updatedCustomers = [];
$updatedOrders = [];

DB::transaction(function () use ($storeId, $reals, &$updatedCustomers, &$updatedOrders) {
    foreach ($reals as $real) {
        $customer = Customer::query()
            ->where('store_id', $storeId)
            ->where(function ($q) use ($real) {
                foreach ($real['match'] as $needle) {
                    $q->orWhere('email', 'like', '%' . $needle . '%')
                        ->orWhere('name', 'like', '%' . $needle . '%');
                }
                $q->orWhere('phone', $real['phone']);
            })
            ->orderByDesc('created_at')
            ->first();

        // Also match via order phone/email if customer row not found
        if (! $customer) {
            $order = Order::query()
                ->where('store_id', $storeId)
                ->where(function ($q) use ($real) {
                    $q->where('customer_phone', $real['phone']);
                    foreach ($real['match'] as $needle) {
                        $q->orWhere('customer_email', 'like', '%' . $needle . '%')
                            ->orWhere('customer_name', 'like', '%' . $needle . '%');
                    }
                })
                ->orderByDesc('created_at')
                ->first();

            if ($order && $order->customer_id) {
                $customer = Customer::query()
                    ->where('store_id', $storeId)
                    ->where('id', $order->customer_id)
                    ->first();
            }
        }

        if (! $customer) {
            echo "SKIP {$real['role']}: no fake customer found\n";
            continue;
        }

        $oldId = $customer->id;
        $oldEmail = $customer->email;
        $oldPhone = $customer->phone;

        $customer->name = $real['name'];
        $customer->email = $real['email'];
        $customer->phone = $real['phone'];
        $customer->city = $real['city'];
        $customer->country = 'Saudi Arabia';
        if (in_array((string) $customer->status, ['', 'Inactive'], true) || $customer->status === null) {
            $customer->status = $real['role'] === 'buyer' ? 'Active' : 'New';
        }
        $customer->save();

        $orders = Order::query()
            ->where('store_id', $storeId)
            ->where(function ($q) use ($oldId, $oldEmail, $oldPhone, $real) {
                $q->where('customer_id', $oldId)
                    ->orWhere('customer_email', $oldEmail)
                    ->orWhere('customer_phone', $oldPhone)
                    ->orWhere('customer_phone', $real['phone']);
                foreach ($real['match'] as $needle) {
                    $q->orWhere('customer_email', 'like', '%' . $needle . '%')
                        ->orWhere('customer_name', 'like', '%' . $needle . '%');
                }
            })
            ->get();

        foreach ($orders as $order) {
            $order->customer_id = $customer->id;
            $order->customer_name = $real['name'];
            $order->customer_email = $real['email'];
            $order->customer_phone = $real['phone'];
            $order->save();
            $updatedOrders[] = [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'customer' => $real['name'],
            ];
        }

        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()
                ->where('store_id', $storeId)
                ->where(function ($q) use ($oldId, $oldEmail) {
                    $q->where('customer_id', $oldId);
                    if ($oldEmail) {
                        $q->orWhere('customer_name', 'like', '%تجريبي%');
                    }
                })
                ->update([
                    'customer_id' => $customer->id,
                    'customer_name' => $real['name'],
                ]);
        }

        if (Schema::hasTable('storefront_analytics_events')) {
            StorefrontAnalyticsEvent::query()
                ->where('store_id', $storeId)
                ->where(function ($q) use ($oldId, $customer) {
                    $q->where('customer_id', $oldId)
                        ->orWhere('customer_id', $customer->id);
                })
                ->update(['customer_id' => $customer->id]);

            // Attach buyer purchase session customer_id if still null on recent purchase events
            if ($real['role'] === 'buyer') {
                StorefrontAnalyticsEvent::query()
                    ->where('store_id', $storeId)
                    ->where('event_name', 'purchase')
                    ->whereNull('customer_id')
                    ->where('created_at', '>=', now()->subDay())
                    ->update(['customer_id' => $customer->id]);
            }
        }

        $updatedCustomers[] = [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'orders_linked' => $orders->count(),
            'role' => $real['role'],
        ];
    }

    // Delete any leftover pure-fake customers that still have demo markers and zero useful identity
    $leftovers = Customer::query()
        ->where('store_id', $storeId)
        ->where(function ($q) {
            $q->where('email', 'like', '%.demo.%')
                ->orWhere('email', 'like', '%unityteck.sa')
                ->orWhere('name', 'like', '%تجريبي%');
        })
        ->get();

    foreach ($leftovers as $fake) {
        // skip ones we already fixed
        if (in_array($fake->email, ['noura.alharbi.mk@gmail.com', 'saad.alghamdi.mk@gmail.com'], true)) {
            continue;
        }
        $stillLinked = Order::query()->where('store_id', $storeId)->where('customer_id', $fake->id)->exists();
        if ($stillLinked) {
            echo "KEEP linked leftover {$fake->id} {$fake->email}\n";
            continue;
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()->where('store_id', $storeId)->where('customer_id', $fake->id)->delete();
        }
        $fake->delete();
        echo "DELETED leftover fake customer {$fake->id}\n";
    }
});

echo json_encode([
    'store_id' => $storeId,
    'customers' => $updatedCustomers,
    'orders' => $updatedOrders,
    'counts' => [
        'customers_total' => Customer::query()->where('store_id', $storeId)->count(),
        'pending_orders' => Order::query()->where('store_id', $storeId)->where('status', 'pending')->count(),
        'events' => Schema::hasTable('storefront_analytics_events')
            ? StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->count()
            : 0,
        'page_views' => Schema::hasTable('storefront_analytics_events')
            ? StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'page_view')->count()
            : 0,
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
