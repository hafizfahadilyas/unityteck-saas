<?php

/**
 * Align store-coffee categories with live products (dashboard = storefront).
 * Keeps / creates cabinets (+ all), removes empty legacy machines/mills/accessories rows
 * that have zero products.
 *
 * Run: php apps/api/scripts/sync-coffee-categories-to-catalog.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';

if (!Schema::hasTable('categories') && !Schema::hasTable('store_categories')) {
    fwrite(STDERR, "NO_CATEGORIES_TABLE\n");
    exit(1);
}

$catTable = Schema::hasTable('store_categories') ? 'store_categories' : 'categories';
$prodTable = Schema::hasTable('products') ? 'products' : null;
if (!$prodTable) {
    fwrite(STDERR, "NO_PRODUCTS_TABLE\n");
    exit(1);
}

$products = DB::table($prodTable)->where('store_id', $storeId)->get(['id', 'category', 'category_id', 'status']);
$used = [];
foreach ($products as $p) {
    $status = strtolower((string) ($p->status ?? 'active'));
    if (in_array($status, ['archived', 'draft'], true)) {
        continue;
    }
    foreach ([$p->category ?? null, $p->category_id ?? null] as $raw) {
        $k = strtolower(trim((string) $raw));
        if ($k !== '') {
            $used[$k] = true;
        }
    }
}

echo 'PRODUCTS=' . count($products) . ' USED_CATS=' . implode(',', array_keys($used)) . PHP_EOL;

$keepIds = ['cabinets', 'all', 'cat-hb-cabinets'];
if (!empty($used)) {
    foreach (array_keys($used) as $k) {
        $keepIds[] = $k;
    }
}
$keepIds = array_values(array_unique($keepIds));

$cats = DB::table($catTable)->where('store_id', $storeId)->get();
$removed = 0;
foreach ($cats as $cat) {
    $id = (string) ($cat->id ?? '');
    $slug = strtolower((string) ($cat->slug ?? $cat->id ?? ''));
    $name = strtolower((string) ($cat->name ?? ''));
    $keep =
        in_array($id, $keepIds, true) ||
        in_array($slug, $keepIds, true) ||
        isset($used[$id]) ||
        isset($used[$slug]) ||
        str_contains($slug, 'cabinet') ||
        str_contains($name, 'cabinet') ||
        str_contains($name, 'دولاب') ||
        str_contains($name, 'أركان');

    // Drop empty legacy HiBrew machine/mill/accessory taxonomy when unused by products.
    $legacyEmpty =
        preg_match('/machine|mill|grind|accessor|offer|espresso|مكائن|مطاحن|مستلزم|عروض/i', $id . ' ' . $slug . ' ' . $name) &&
        !isset($used[$id]) &&
        !isset($used[$slug]);

    if ($legacyEmpty || !$keep) {
        DB::table($catTable)->where('store_id', $storeId)->where('id', $id)->delete();
        $removed++;
        echo "REMOVED {$id}\n";
    }
}

$hasCabinets = DB::table($catTable)
    ->where('store_id', $storeId)
    ->where(function ($q) {
        $q->where('id', 'cabinets')
            ->orWhere('id', 'cat-hb-cabinets')
            ->orWhere('slug', 'cabinets')
            ->orWhere('slug', 'like', '%cabinet%');
    })
    ->exists();

if (!$hasCabinets) {
    $row = [
        'id' => 'cabinets',
        'store_id' => $storeId,
        'name' => 'Coffee Cabinets',
        'name_ar' => 'دواليب وأركان القهوة',
        'slug' => 'cabinets',
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ];
    if (Schema::hasColumn($catTable, 'is_active')) {
        $row['is_active'] = 1;
    }
    DB::table($catTable)->insert($row);
    echo "INSERTED cabinets\n";
}

echo "REMOVED_COUNT={$removed}\nDONE\n";
