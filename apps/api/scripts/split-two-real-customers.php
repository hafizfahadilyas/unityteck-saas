<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

$storeId = $argv[1] ?? 'store-1';

DB::transaction(function () use ($storeId) {
    $noura = Customer::query()
        ->where('store_id', $storeId)
        ->where('email', 'noura.alharbi.mk@gmail.com')
        ->first();

    if (! $noura) {
        $noura = Customer::query()->create([
            'id' => 'cust-' . (string) Str::uuid(),
            'store_id' => $storeId,
            'name' => 'نورة الحربي',
            'email' => 'noura.alharbi.mk@gmail.com',
            'phone' => '+966501112233',
            'city' => 'Makkah',
            'country' => 'Saudi Arabia',
            'acquisition_source' => 'Organic Search',
            'group' => 'Regular',
            'status' => 'New',
            'total_orders' => 0,
            'total_spend' => 0,
            'avg_order_value' => 0,
        ]);
    } else {
        $noura->name = 'نورة الحربي';
        $noura->phone = '+966501112233';
        $noura->city = 'Makkah';
        $noura->country = 'Saudi Arabia';
        $noura->save();
    }

    $saad = Customer::query()
        ->where('store_id', $storeId)
        ->where('email', 'saad.alghamdi.mk@gmail.com')
        ->first();

    if (! $saad) {
        $saad = Customer::query()->create([
            'id' => 'cust-' . (string) Str::uuid(),
            'store_id' => $storeId,
            'name' => 'سعد الغامدي',
            'email' => 'saad.alghamdi.mk@gmail.com',
            'phone' => '+966509887766',
            'city' => 'Makkah',
            'country' => 'Saudi Arabia',
            'acquisition_source' => 'Direct',
            'group' => 'Regular',
            'status' => 'Active',
            'total_orders' => 0,
            'total_spend' => 0,
            'avg_order_value' => 0,
        ]);
    } else {
        $saad->name = 'سعد الغامدي';
        $saad->phone = '+966509887766';
        $saad->city = 'Makkah';
        $saad->country = 'Saudi Arabia';
        $saad->status = 'Active';
        $saad->save();
    }

    $pending = Order::query()
        ->where('store_id', $storeId)
        ->where('order_number', '#107')
        ->first();

    $cod = Order::query()
        ->where('store_id', $storeId)
        ->where('order_number', '#108')
        ->first();

    if ($pending) {
        $pending->customer_id = $noura->id;
        $pending->customer_name = $noura->name;
        $pending->customer_email = $noura->email;
        $pending->customer_phone = $noura->phone;
        $pending->save();
    }

    if ($cod) {
        $cod->customer_id = $saad->id;
        $cod->customer_name = $saad->name;
        $cod->customer_email = $saad->email;
        $cod->customer_phone = $saad->phone;
        $cod->save();
    }

    // Recalc totals from linked orders only
    foreach ([$noura, $saad] as $cust) {
        $rows = Order::query()
            ->where('store_id', $storeId)
            ->where('customer_id', $cust->id)
            ->where('status', '!=', 'cancelled')
            ->get(['total_amount', 'order_date', 'created_at']);
        $count = $rows->count();
        $spend = (float) $rows->sum('total_amount');
        $cust->total_orders = $count;
        $cust->total_spend = $spend;
        $cust->avg_order_value = $count > 0 ? round($spend / $count, 2) : 0;
        $cust->last_order_date = $rows->max('order_date') ?: $rows->max('created_at');
        $cust->save();
    }

    if (Schema::hasTable('customer_activities')) {
        if ($pending) {
            CustomerActivity::query()
                ->where('store_id', $storeId)
                ->where('order_id', $pending->id)
                ->update([
                    'customer_id' => $noura->id,
                    'customer_name' => $noura->name,
                ]);
        }
        if ($cod) {
            CustomerActivity::query()
                ->where('store_id', $storeId)
                ->where('order_id', $cod->id)
                ->update([
                    'customer_id' => $saad->id,
                    'customer_name' => $saad->name,
                ]);
        }
    }

    if (Schema::hasTable('storefront_analytics_events') && $cod) {
        StorefrontAnalyticsEvent::query()
            ->where('store_id', $storeId)
            ->where('event_name', 'purchase')
            ->where(function ($q) use ($cod, $saad) {
                $q->where('customer_id', $saad->id)
                    ->orWhere('meta->order_id', $cod->id)
                    ->orWhereNull('customer_id');
            })
            ->where('created_at', '>=', now()->subDays(2))
            ->update(['customer_id' => $saad->id]);
    }

    // Remove leftover fake markers still in customers table
    Customer::query()
        ->where('store_id', $storeId)
        ->where(function ($q) {
            $q->where('email', 'like', '%.demo.%')
                ->orWhere('email', 'like', '%@unityteck.sa')
                ->orWhere('name', 'like', '%تجريبي%');
        })
        ->whereNotIn('id', [$noura->id, $saad->id])
        ->each(function (Customer $fake) use ($storeId) {
            $linked = Order::query()->where('store_id', $storeId)->where('customer_id', $fake->id)->exists();
            if ($linked) {
                return;
            }
            if (Schema::hasTable('customer_activities')) {
                CustomerActivity::query()->where('store_id', $storeId)->where('customer_id', $fake->id)->delete();
            }
            $fake->delete();
            echo "DELETED {$fake->id}\n";
        });

    echo json_encode([
        'noura' => $noura->only(['id', 'name', 'email', 'phone', 'total_orders', 'total_spend']),
        'saad' => $saad->only(['id', 'name', 'email', 'phone', 'total_orders', 'total_spend']),
        'order_107' => $pending?->only(['order_number', 'status', 'customer_name', 'customer_phone']),
        'order_108' => $cod?->only(['order_number', 'status', 'customer_name', 'customer_phone', 'payment_method', 'tracking_number']),
        'page_views' => StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->where('event_name', 'page_view')->count(),
        'pending_abandoned' => Order::query()->where('store_id', $storeId)->where('status', 'pending')->count(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
});
