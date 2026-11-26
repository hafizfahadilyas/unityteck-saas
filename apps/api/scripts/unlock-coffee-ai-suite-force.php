<?php

/**
 * Force-unlock coffee AI (no limit changes — avoids auto-relock on quota raise).
 * Usage: php scripts/unlock-coffee-ai-suite-force.php
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';
$until = now()->addDays(30)->toDateTimeString();
$status = 'comped';

$n1 = DB::update(
    'UPDATE store_openai_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?',
    [$status, $until, 'active', $storeId]
);
$n2 = DB::update(
    'UPDATE store_openai_image_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?',
    [$status, $until, 'active', $storeId]
);
$n3 = DB::update(
    'UPDATE store_openai_automation_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?',
    [$status, $until, 'active', $storeId]
);

$row = DB::selectOne(
    'SELECT usage_unlocked, payment_status, usage_unlocked_until, enabled FROM store_openai_image_configs WHERE store_id = ?',
    [$storeId]
);

echo json_encode([
    'ok' => true,
    'updated' => ['text' => $n1, 'images' => $n2, 'automation' => $n3],
    'image_row' => $row,
    'until' => $until,
], JSON_PRETTY_PRINT)."\n";
