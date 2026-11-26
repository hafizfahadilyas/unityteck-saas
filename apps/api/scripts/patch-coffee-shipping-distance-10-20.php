<?php

/**
 * Patch store-coffee local Makkah delivery to 10–20 SAR by distance (per_km).
 * Does NOT delete other methods/zones — only updates the local + Makkah City zone.
 *
 * Usage: php scripts/patch-coffee-shipping-distance-10-20.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';

echo "Patching distance 10–20 SAR for {$storeId}...\n";

$zones = ShippingZone::query()
    ->withoutGlobalScopes()
    ->where('store_id', $storeId)
    ->where(function ($q) {
        $q->where('name', 'like', '%Makkah City%')
            ->orWhere('name', 'like', '%مكة%');
    })
    ->get();

if ($zones->isEmpty()) {
    $zones = ShippingZone::query()
        ->withoutGlobalScopes()
        ->where('store_id', $storeId)
        ->orderBy('id')
        ->limit(1)
        ->get();
}

foreach ($zones as $z) {
    $z->fill([
        'rate' => 10.00,
        'rate_mode' => 'per_km',
        'rate_per_kg' => 0,
        'per_km_rate' => 1.00,
        'estimated_delivery' => 'Same day – 1 day (Makkah) · 10–20 SAR by distance',
        'is_active' => true,
        'status' => 'active',
    ])->save();
    echo "  zone updated: {$z->name}\n";
}

$local = ShippingMethod::query()
    ->withoutGlobalScopes()
    ->where('store_id', $storeId)
    ->where(function ($q) {
        $q->where('name', 'like', '%Local Makkah%')
            ->orWhere('name_ar', 'like', '%توصيل محلي%')
            ->orWhere('fulfillment_mode', 'own_delivery');
    })
    ->where('type', '!=', 'local_pickup')
    ->orderBy('sort_order')
    ->first();

if ($local) {
    $local->fill([
        'base_rate' => 10.00,
        'per_kg_rate' => 0,
        'per_km_rate' => 1.00,
        'estimated_delivery' => 'Same day (Makkah) · 10–20 SAR by distance',
        'is_active' => true,
        'logo_url' => $local->courier_code === 'spl' ? null : $local->logo_url,
    ])->save();
    echo "  method updated: {$local->name} base=10 per_km=1\n";
} else {
    echo "  WARN: local Makkah method not found\n";
}

// Clear broken SPL logo if present
ShippingMethod::query()
    ->withoutGlobalScopes()
    ->where('store_id', $storeId)
    ->where(function ($q) {
        $q->where('logo_url', 'like', '%spl.png%')
            ->orWhere('courier_code', 'spl');
    })
    ->update(['logo_url' => null]);

echo "DONE\n";
