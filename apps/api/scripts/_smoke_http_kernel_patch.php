<?php

/**
 * Simulate authenticated PATCH /orders/{id} via Laravel HTTP kernel (diagnose hang).
 */
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::find('user-store-coffee-1');
$token = $user->createToken('kernel-smoke', ['*'])->plainTextToken;

$request = Illuminate\Http\Request::create(
    '/api/orders/ord-cof-101',
    'PATCH',
    [],
    [],
    [],
    [
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        'HTTP_X_STORE_ID' => 'store-coffee',
        'CONTENT_TYPE' => 'application/json',
    ],
    json_encode([
        'customer_email' => 'kernel.patch@example.sa',
        'delivery_location' => 'Dammam - Smoke',
    ], JSON_UNESCAPED_UNICODE)
);

$started = microtime(true);
$response = $kernel->handle($request);
$ms = (int) ((microtime(true) - $started) * 1000);

echo 'STATUS='.$response->getStatusCode().PHP_EOL;
echo 'MS='.$ms.PHP_EOL;
echo substr($response->getContent(), 0, 500).PHP_EOL;

$kernel->terminate($request, $response);

// cleanup smoke email
$order = App\Models\Order::query()->withoutGlobalScope('store')->find('ord-cof-101');
if ($order) {
    $order->customer_email = 'rayan.sulaiman@gmail.com';
    if (str_contains((string) $order->delivery_location, 'Smoke')) {
        $order->delivery_location = 'Makkah';
    }
    $order->save();
    echo "restored\n";
}
