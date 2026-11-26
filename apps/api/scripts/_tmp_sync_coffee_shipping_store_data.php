<?php

/**
 * Mirror store-coffee shipping_zones into store_extras so live commerce.php
 * souq_store_data() returns Makkah zones immediately.
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';
$zones = DB::table('shipping_zones')->where('store_id', $storeId)->orderBy('name')->get();

$payload = [];
foreach ($zones as $z) {
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
        'free_above' => $z->free_above !== null ? (float) $z->free_above : null,
        'estimated_delivery' => $z->estimated_delivery,
        'min_delivery_days' => (int) $z->min_delivery_days,
        'max_delivery_days' => (int) $z->max_delivery_days,
        'city_names' => $cities,
        'status' => ((int) $z->is_active === 1) ? 'active' : 'inactive',
        'is_active' => (bool) $z->is_active,
        'cod_available' => (bool) $z->cod_available,
    ];
}

$existing = DB::table('store_extras')->where('store_id', $storeId)->value('data');
$data = [];
if (is_string($existing) && $existing !== '') {
    $decoded = json_decode($existing, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}

$data['shipping'] = $payload;
$data['shipping_zones'] = $payload;
$json = json_encode($data, JSON_UNESCAPED_UNICODE);

DB::table('store_extras')->updateOrInsert(
    ['store_id' => $storeId],
    ['data' => $json, 'updated_at' => now()]
);

echo 'synced store_extras shipping zones='.count($payload).PHP_EOL;
