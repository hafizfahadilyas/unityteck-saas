<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::find('user-store-coffee-1');
if (! $user) {
    fwrite(STDERR, "no coffee user\n");
    exit(1);
}

$token = $user->createToken('local-smoke', ['*'])->plainTextToken;
$out = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'unityteck_smoke_token.txt';
file_put_contents($out, $token);

$orderId = App\Models\Order::withoutGlobalScopes()
    ->where('store_id', 'store-coffee')
    ->value('id');

echo "TOKEN_FILE={$out}\n";
echo 'TOKEN_LEN=' . strlen($token) . "\n";
echo 'ORDER_ID=' . ($orderId ?: '') . "\n";
