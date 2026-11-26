<?php

/**
 * Hostinger one-shot: Phase 3 AI developer support requests table.
 * Usage: php scripts/ensure-ai-developer-tables.php
 * Does NOT deploy. Does NOT enable auto-deploy.
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

$created = [];

if (! Schema::hasTable('store_ai_dev_requests')) {
    Schema::create('store_ai_dev_requests', function (Blueprint $table) {
        $table->string('id', 64)->primary();
        $table->string('store_id', 64)->index();
        $table->string('status', 32)->default('open')->index();
        $table->string('priority', 32)->default('medium');
        $table->string('category', 64)->default('general');
        $table->string('title', 191);
        $table->text('description');
        $table->string('requested_by_user_id', 64)->nullable();
        $table->string('assigned_master_user_id', 64)->nullable();
        $table->json('symptoms')->nullable();
        $table->json('diagnosis')->nullable();
        $table->text('master_notes')->nullable();
        $table->boolean('auto_deploy_allowed')->default(false);
        $table->timestamp('diagnosed_at')->nullable();
        $table->timestamp('closed_at')->nullable();
        $table->timestamps();
        $table->index(['store_id', 'status']);
    });
    $created[] = 'store_ai_dev_requests';
}

echo json_encode([
    'ok' => true,
    'created' => $created,
    'exists' => Schema::hasTable('store_ai_dev_requests'),
    'auto_deploy_allowed' => false,
    'note' => 'Phase 3 table ready. Run diagnose only via Master auth. No deploy from this script.',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
