<?php

/**
 * One-shot: unlock coffee (store-coffee) AI suite for testing (Master comp).
 * Images + text + automation · 30 days · testing quotas.
 * Usage: php scripts/unlock-coffee-ai-suite.php
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Store;
use App\Services\OpenAi\OpenAiAutomationService;
use App\Services\OpenAi\OpenAiConfigService;
use App\Services\OpenAi\OpenAiImageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$storeId = 'store-coffee';
$store = Store::query()->find($storeId);
if (! $store) {
    fwrite(STDERR, "Store not found: {$storeId}\n");
    exit(1);
}

$until = now()->addDays(30)->toDateTimeString();
$payStatus = 'comped';

$configs = app(OpenAiConfigService::class);
$images = app(OpenAiImageService::class);
$automation = app(OpenAiAutomationService::class);

if (! $configs->storeIsProEligible($store)) {
    // Ensure Pro eligibility for pilot testing (master grant flag / plan).
    try {
        DB::table('stores')->where('id', $storeId)->update([
            'plan' => 'pro',
            'master_granted_pro' => 1,
            'updated_at' => now(),
        ]);
    } catch (Throwable $e) {
        // Some hosts keep plan only in JSON data column.
    }
    try {
        $row = DB::table('stores')->where('id', $storeId)->first();
        if ($row && property_exists($row, 'data')) {
            $data = json_decode((string) ($row->data ?? '{}'), true);
            if (! is_array($data)) {
                $data = [];
            }
            $data['plan'] = 'pro';
            $data['masterGrantedPro'] = true;
            $data['master_granted_pro'] = true;
            DB::table('stores')->where('id', $storeId)->update([
                'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ]);
        }
    } catch (Throwable $e) {
        fwrite(STDERR, "Could not grant Pro: ".$e->getMessage()."\n");
        exit(1);
    }
    $store = Store::query()->find($storeId);
}

$configs->updateStoreConfig($store, [
    'enabled' => true,
    'usage_unlocked' => true,
    'payment_status' => $payStatus,
    'usage_unlocked_until' => $until,
    'config_status' => 'active',
    'daily_token_limit' => 80000,
    'monthly_token_limit' => 800000,
    'daily_request_limit' => 150,
    'monthly_request_limit' => 3000,
    'intelligence_level' => 'medium',
], null);

$images->update($store, [
    'enabled' => true,
    'usage_unlocked' => true,
    'payment_status' => $payStatus,
    'usage_unlocked_until' => $until,
    'config_status' => 'active',
    'monthly_image_quota' => 60,
    'payment_required_for_usage' => true,
], null);

$automation->update($store, [
    'enabled' => true,
    'usage_unlocked' => true,
    'payment_status' => $payStatus,
    'usage_unlocked_until' => $until,
    'config_status' => 'active',
    'daily_question_quota' => 30,
    'monthly_question_quota' => 200,
    'intelligence_level' => 'medium',
], null);

$configs->audit($storeId, null, 'suite_unlock', 'security', 'Coffee AI suite unlocked for testing (comp)', [
    'method' => 'comp',
    'days' => 30,
    'scope' => 'store',
    'script' => 'unlock-coffee-ai-suite.php',
]);

echo json_encode([
    'ok' => true,
    'store_id' => $storeId,
    'until' => $until,
    'payment_status' => $payStatus,
    'limits' => [
        'images_monthly_plan' => 60,
        'images_daily_plan' => 5,
        'text_daily_tokens' => 80000,
        'text_monthly_tokens' => 800000,
        'automation_daily_questions' => 30,
        'automation_monthly_questions' => 200,
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
