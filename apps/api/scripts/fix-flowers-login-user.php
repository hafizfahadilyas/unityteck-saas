<?php

/**
 * Ensure flowers login email (p4pakistan098@gmail.com) exists as store-1 manager
 * so Clerk OTP → Sanctum exchange can load real orders/customers/analytics.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

$storeId = 'store-1';
$loginEmail = 'p4pakistan098@gmail.com';

DB::transaction(function () use ($storeId, $loginEmail) {
    $user = User::query()->where('email', $loginEmail)->first();
    if (! $user) {
        $user = User::query()->create([
            'id' => 'user-store-1-p4',
            'name' => 'Makkah Flowers Owner',
            'email' => $loginEmail,
            'password' => Hash::make(Str::random(32)),
            'role' => 'manager',
        ]);
        echo "CREATED user {$user->id}\n";
    } else {
        $user->role = 'manager';
        $user->save();
        echo "UPDATED existing user {$user->id}\n";
    }

    $membership = StoreUser::query()
        ->where('user_id', $user->id)
        ->where('store_id', $storeId)
        ->first();

    if (! $membership) {
        StoreUser::query()->create([
            'id' => 'su-' . (string) Str::uuid(),
            'store_id' => $storeId,
            'user_id' => $user->id,
            'role' => 'manager',
        ]);
        echo "CREATED store_user membership store-1\n";
    } else {
        $membership->role = 'manager';
        $membership->save();
        echo "OK membership already exists\n";
    }

    // Keep store contact email aligned with login email used in portal
    $store = Store::query()->where('id', $storeId)->first();
    if ($store) {
        $store->email = $loginEmail;
        if (empty($store->owner_name)) {
            $store->owner_name = 'Makkah Flowers Owner';
        }
        $store->save();
        echo "UPDATED stores.email → {$loginEmail}\n";
    }

    // Remove seeded mock customers that have NO real orders (INITIAL_CUSTOMERS leak)
    $mockIds = ['cust-mkk-1', 'cust-mkk-2', 'cust-mkk-3', 'cust-mkk-naser'];
    foreach ($mockIds as $cid) {
        $cust = Customer::query()->where('store_id', $storeId)->where('id', $cid)->first();
        if (! $cust) {
            continue;
        }
        $hasOrder = Order::query()->where('store_id', $storeId)->where('customer_id', $cid)->exists();
        if ($hasOrder) {
            echo "KEEP {$cid} (has orders)\n";
            continue;
        }
        if (Schema::hasTable('customer_activities')) {
            CustomerActivity::query()->where('store_id', $storeId)->where('customer_id', $cid)->delete();
        }
        $cust->delete();
        echo "DELETED mock customer {$cid} {$cust->email}\n";
    }
});

$token = User::query()->where('email', $loginEmail)->first()
    ->createToken('verify', ['portal:store', 'store:store-1'])
    ->plainTextToken;

$ch = curl_init('http://127.0.0.1:8010/api/orders?all=1&lean=1');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
        'X-Store-Id: store-1',
    ],
    CURLOPT_TIMEOUT => 30,
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$json = json_decode((string) $body, true);
$count = is_array($json['data'] ?? null) ? count($json['data']) : -1;

echo json_encode([
    'verify_http' => $code,
    'orders_visible_to_p4' => $count,
    'customers_left' => Customer::query()->where('store_id', $storeId)->count(),
    'real_customers' => Customer::query()->where('store_id', $storeId)->whereIn('email', [
        'noura.alharbi.mk@gmail.com',
        'saad.alghamdi.mk@gmail.com',
    ])->pluck('name'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
