<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Support\Facades\Http;

$emails = [
    'p4pakistan098@gmail.com',
    'tariq@wardalmakkah.sa',
    'master@unityteck.com',
];

foreach ($emails as $email) {
    $user = User::query()->where('email', $email)->first();
    echo "USER {$email}: " . ($user ? "{$user->id} role={$user->role}" : 'MISSING') . "\n";
    if ($user) {
        $m = StoreUser::query()->where('user_id', $user->id)->get(['store_id', 'role']);
        echo '  memberships: ' . $m->toJson() . "\n";
    }
}

$user = User::query()->where('email', 'tariq@wardalmakkah.sa')->first()
    ?: User::query()->where('email', 'p4pakistan098@gmail.com')->first()
    ?: User::query()->where('id', 'user-store-1')->first();

if (! $user) {
    fwrite(STDERR, "No store user to probe\n");
    exit(1);
}

$token = $user->createToken('probe', ['portal:store', 'store:store-1'])->plainTextToken;

$res = Http::withToken($token)
    ->withHeaders(['X-Store-Id' => 'store-1', 'Accept' => 'application/json'])
    ->get('http://127.0.0.1:8010/api/orders', ['all' => 1, 'lean' => 1]);

echo "HTTP {$res->status()}\n";
$json = $res->json();
$count = is_array($json['data'] ?? null) ? count($json['data']) : -1;
echo "orders_count={$count}\n";
if ($count > 0) {
    echo json_encode(array_map(fn ($o) => [
        'order_number' => $o['order_number'] ?? null,
        'customer_name' => $o['customer_name'] ?? null,
        'status' => $o['status'] ?? null,
    ], array_slice($json['data'], 0, 5)), JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo substr($res->body(), 0, 500) . "\n";
}

$cust = Http::withToken($token)
    ->withHeaders(['X-Store-Id' => 'store-1', 'Accept' => 'application/json'])
    ->get('http://127.0.0.1:8010/api/customers');
echo "customers_http={$cust->status()} count=" . (is_array($cust->json('data')) ? count($cust->json('data')) : -1) . "\n";

$home = Http::withToken($token)
    ->withHeaders(['X-Store-Id' => 'store-1', 'Accept' => 'application/json'])
    ->get('http://127.0.0.1:8010/api/analytics/dashboard-home');
echo "dashboard_home_http={$home->status()} visitors=" . ($home->json('visitors_count') ?? 'n/a') . "\n";
