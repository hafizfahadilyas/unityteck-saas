<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Support\Facades\Http;

$email = 'mieraf.sa8@gmail.com';
$user = User::query()->where('email', $email)->first();
echo 'user=' . ($user ? $user->id . ' role=' . $user->role : 'MISSING') . PHP_EOL;
if ($user) {
    echo 'memberships=' . StoreUser::query()->where('user_id', $user->id)->get(['store_id', 'role'])->toJson() . PHP_EOL;
}
echo 'clerk_secret=' . (config('services.clerk.secret') ? 'yes' : 'NO') . PHP_EOL;

$t0 = microtime(true);
try {
    $res = Http::timeout(8)->get('http://127.0.0.1:8010/api/health');
    echo 'health_http=' . $res->status() . ' ms=' . (int) ((microtime(true) - $t0) * 1000) . PHP_EOL;
} catch (Throwable $e) {
    echo 'health_fail=' . $e->getMessage() . PHP_EOL;
}

$secret = (string) config('services.clerk.secret', '');
if ($secret !== '') {
    $t1 = microtime(true);
    try {
        $r = Http::withToken($secret)->acceptJson()->timeout(10)->get('https://api.clerk.com/v1/users?limit=1');
        echo 'clerk_api_http=' . $r->status() . ' ms=' . (int) ((microtime(true) - $t1) * 1000) . PHP_EOL;
    } catch (Throwable $e) {
        echo 'clerk_api_fail=' . $e->getMessage() . PHP_EOL;
    }
}
