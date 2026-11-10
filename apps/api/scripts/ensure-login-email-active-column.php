<?php

/**
 * One-shot Hostinger: add stores.login_email_active if missing.
 * Usage (from apps/api): php scripts/ensure-login-email-active-column.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (! Schema::hasTable('stores')) {
    echo "stores table missing\n";
    exit(1);
}

if (Schema::hasColumn('stores', 'login_email_active')) {
    echo "OK: login_email_active already exists\n";
    exit(0);
}

Schema::table('stores', function (Blueprint $table) {
    $table->boolean('login_email_active')->default(true)->after('email');
});

echo "OK: added stores.login_email_active (default true)\n";
