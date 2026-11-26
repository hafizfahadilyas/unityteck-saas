<?php

/**
 * Clear store-coffee free-shipping thresholds so paid courier rates always show.
 *
 * Coffee AOV is high (mills ~489, stations ~2890). Old Free Above 350–550 made
 * almost every cart show FREE for SMSA/Aramex/etc.
 *
 * Pickup stays free (base_rate 0). Merchant can set Free Above later in Shipping.
 *
 * Usage: php scripts/patch-coffee-shipping-free-thresholds.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';

echo "Clearing free thresholds for {$storeId}...\n";

$methods = DB::table('shipping_methods')->where('store_id', $storeId)->get();
foreach ($methods as $m) {
    DB::table('shipping_methods')->where('id', $m->id)->update([
        'free_shipping_threshold' => null,
        'updated_at' => now(),
    ]);
    $note = ((string) ($m->type ?? '') === 'local_pickup' || (float) $m->base_rate <= 0)
        ? 'always free (base 0 / pickup)'
        : "paid base={$m->base_rate}";
    echo "  method {$m->name}: threshold=null ({$note})\n";
}

$zones = DB::table('shipping_zones')->where('store_id', $storeId)->get();
foreach ($zones as $z) {
    DB::table('shipping_zones')->where('id', $z->id)->update([
        'free_above' => null,
        'updated_at' => now(),
    ]);
    echo "  zone {$z->name}: free_above=null (rate={$z->rate})\n";
}

// Mirror zones into store_extras for commerce.php hosts.
$zoneRows = DB::table('shipping_zones')->where('store_id', $storeId)->orderBy('name')->get();
$payload = [];
foreach ($zoneRows as $z) {
    $cities = json_decode((string) ($z->city_names ?? '[]'), true);
    if (! is_array($cities)) {
        $cities = [];
    }
    $payload[] = [
        'id' => $z->id,
        'store_id' => $storeId,
        'name' => $z->name,
        'city_name' => $z->name,
        'region' => $z->region,
        'province' => $z->region,
        'rate' => (float) $z->rate,
        'rate_per_kg' => (float) $z->rate_per_kg,
        'min_weight_kg' => (float) $z->min_weight_kg,
        'max_weight_kg' => (float) $z->max_weight_kg,
        'free_above' => null,
        'estimated_delivery' => $z->estimated_delivery,
        'min_delivery_days' => (int) $z->min_delivery_days,
        'max_delivery_days' => (int) $z->max_delivery_days,
        'city_names' => $cities,
        'status' => ((int) $z->is_active === 1) ? 'active' : 'inactive',
        'is_active' => (bool) $z->is_active,
        'cod_available' => (bool) $z->cod_available,
    ];
}
$existingExtras = DB::table('store_extras')->where('store_id', $storeId)->value('data');
$data = [];
if (is_string($existingExtras) && $existingExtras !== '') {
    $decoded = json_decode($existingExtras, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
$data['shipping'] = $payload;
$data['shipping_zones'] = $payload;
DB::table('store_extras')->updateOrInsert(
    ['store_id' => $storeId],
    ['data' => json_encode($data, JSON_UNESCAPED_UNICODE), 'updated_at' => now()]
);

echo 'synced store_extras shipping zones='.count($payload)."\n";
echo "DONE\n";
