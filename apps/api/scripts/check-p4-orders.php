<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Order;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Support\Facades\Http;

$user = User::query()->where('email', 'p4pakistan098@gmail.com')->first();
echo 'user=' . ($user ? $user->id . ' role=' . $user->role : 'MISSING') . PHP_EOL;

if ($user) {
    $m = StoreUser::query()->where('user_id', $user->id)->get(['store_id', 'role']);
    echo 'memberships=' . $m->toJson() . PHP_EOL;
}

echo 'orders=' . Order::query()->where('store_id', 'store-1')->count() . PHP_EOL;
echo Order::query()->where('store_id', 'store-1')->get(['order_number', 'customer_name', 'status'])->toJson(JSON_UNESCAPED_UNICODE) . PHP_EOL;

if (! $user) {
    exit(1);
}

$token = $user->createToken('probe', ['portal:store', 'store:store-1'])->plainTextToken;
$res = Http::withToken($token)
    ->withHeaders(['X-Store-Id' => 'store-1', 'Accept' => 'application/json'])
    ->get('http://127.0.0.1:8010/api/orders', ['all' => 1, 'lean' => 1]);

echo 'http=' . $res->status() . ' count=' . count($res->json('data') ?? []) . PHP_EOL;
echo 'token_sample=' . substr($token, 0, 20) . '... has_pipe=' . (str_contains($token, '|') ? 'yes' : 'no') . PHP_EOL;
