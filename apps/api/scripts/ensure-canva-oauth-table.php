<?php

/**
 * Hostinger one-shot: canva_oauth_connections (Official Canva Connect — Master testing).
 * Usage: php scripts/ensure-canva-oauth-table.php
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

if (! Schema::hasTable('canva_oauth_connections')) {
    Schema::create('canva_oauth_connections', function (Blueprint $table) {
        $table->string('id', 64)->primary();
        $table->string('owner_key', 128)->unique();
        $table->boolean('is_connected')->default(false);
        $table->string('display_name', 191)->nullable();
        $table->text('access_token')->nullable();
        $table->text('refresh_token')->nullable();
        $table->timestamp('token_expires_at')->nullable();
        $table->text('granted_scopes')->nullable();
        $table->string('last_error', 500)->nullable();
        $table->timestamps();
    });
    echo "OK: created canva_oauth_connections\n";
} else {
    echo "OK: canva_oauth_connections exists\n";
}
