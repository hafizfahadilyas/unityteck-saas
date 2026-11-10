<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$storeId = $argv[1] ?? 'store-1';
$ids = \App\Models\StorefrontAnalyticsEvent::query()
    ->where('store_id', $storeId)
    ->where('campaign', 'unityteck-demo-tracking')
    ->orderBy('created_at')
    ->limit(9)
    ->pluck('id');

$deleted = \App\Models\StorefrontAnalyticsEvent::query()->whereIn('id', $ids)->delete();
echo "deleted {$deleted} duplicate events\n";
