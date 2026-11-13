<?php

/**
 * Hostinger one-shot: onboarding_invites + platform_settings (SOUQ PLUS Phase 1).
 * Usage (from apps/api): php scripts/ensure-platform-master-phase1-tables.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

$ok = true;

if (! Schema::hasTable('onboarding_invites')) {
    Schema::create('onboarding_invites', function (Blueprint $table) {
        $table->string('id', 64)->primary();
        $table->string('token', 128)->unique();
        $table->string('store_id', 64)->unique();
        $table->string('plan', 32)->default('pro');
        $table->string('label', 191)->default('');
        $table->string('locale', 8)->default('en');
        $table->string('text_dir', 8)->default('ltr');
        $table->string('currency', 8)->default('SAR');
        $table->string('timezone', 64)->default('Asia/Riyadh');
        $table->timestamp('expires_at');
        $table->timestamp('used_at')->nullable();
        $table->string('redeemed_store_id', 64)->nullable();
        $table->string('created_by_user_id', 64)->nullable();
        $table->timestamp('created_at')->useCurrent();
        $table->index(['expires_at', 'used_at']);
    });
    echo "OK: created onboarding_invites\n";
} else {
    echo "OK: onboarding_invites exists\n";
}

if (! Schema::hasTable('platform_settings')) {
    Schema::create('platform_settings', function (Blueprint $table) {
        $table->string('id', 32)->primary();
        $table->json('settings')->nullable();
        $table->string('updated_by_user_id', 64)->nullable();
        $table->timestamp('updated_at')->nullable();
        $table->timestamp('created_at')->nullable();
    });
    echo "OK: created platform_settings\n";
} else {
    echo "OK: platform_settings exists\n";
}

exit($ok ? 0 : 1);
