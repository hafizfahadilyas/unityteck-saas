<?php
$out = [];
$log = function (string $line) use (&$out): void {
    $out[] = $line;
    echo $line . "\n";
};
try {
    require __DIR__ . '/vendor/autoload.php';
    $app = require __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    foreach (['store-1', 'store-coffee'] as $sid) {
        $orders = App\Models\Order::query()->withoutGlobalScope('store')->forStore($sid)->count();
        $customers = App\Models\Customer::query()->withoutGlobalScope('store')->where('store_id', $sid)->count();
        $log("{$sid} orders={$orders} customers={$customers}");
    }

    $user = App\Models\User::query()->where('email', 'like', '%admin%')->orWhere('role', 'super_admin')->first();
    if (!$user) {
        $user = App\Models\User::query()->first();
    }
    $log('user=' . ($user ? ($user->id . ' ' . $user->email) : 'NONE'));
    if ($user) {
        $token = $user->createToken('probe-orders')->plainTextToken;
        foreach (['store-1', 'store-coffee'] as $sid) {
            $ch = curl_init('http://127.0.0.1:8010/api/orders?all=1&lean=1');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                    'Authorization: Bearer ' . $token,
                    'X-Store-Id: ' . $sid,
                ],
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            $json = json_decode((string) $body, true);
            $n = is_array($json['data'] ?? null) ? count($json['data']) : -1;
            $log("API {$sid} http={$code} count={$n} err={$err}");
            if ($n > 0) {
                $log(' first=' . json_encode($json['data'][0]['order_number'] ?? $json['data'][0]['id'] ?? null));
            } else {
                $log(' body=' . substr((string) $body, 0, 300));
            }
        }
    }
    $log('DONE');
} catch (Throwable $e) {
    $log('ERR ' . $e->getMessage());
}
file_put_contents(__DIR__ . '/tmp_orders_probe_out.txt', implode("\n", $out) . "\n");
