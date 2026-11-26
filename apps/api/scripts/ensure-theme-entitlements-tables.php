<?php

/**
 * Idempotent CT-2/CT-3 ensure for Hostinger (when artisan migrate not available).
 * Usage: php apps/api/scripts/ensure-theme-entitlements-tables.php
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "CT-2/CT-3 theme entitlements ensure…\n";

$driver = Schema::getConnection()->getDriverName();
if ($driver === 'mysql' && Schema::hasTable('stores')) {
    try {
        DB::statement("ALTER TABLE stores MODIFY COLUMN plan ENUM('free','paid','starter','pro','premium','custom') NOT NULL DEFAULT 'free'");
        echo "stores.plan ENUM ok\n";
    } catch (Throwable $e) {
        echo 'stores.plan skip: '.$e->getMessage()."\n";
    }
}

if (Schema::hasTable('plans')) {
    $now = now();
    $row = [
        'id' => 'plan-starter',
        'code' => 'starter',
        'name' => 'Starter',
        'product_limit' => 250,
        'storage_mb' => 2048,
        'team_seats' => 2,
        'features' => json_encode([
            'catalog', 'orders', 'basic_seo', 'seo', 'coupons', 'shipping',
            'themes_basic', 'media_studio', 'whatsapp',
        ]),
        'is_active' => 1,
        'updated_at' => $now,
    ];
    if (Schema::hasColumn('plans', 'price_sar')) {
        $row['price_sar'] = 100;
    }
    $exists = DB::table('plans')->where('code', 'starter')->exists();
    if (! $exists) {
        $row['created_at'] = $now;
        DB::table('plans')->insert($row);
        echo "plan-starter inserted\n";
    } else {
        DB::table('plans')->where('code', 'starter')->update($row);
        echo "plan-starter updated\n";
    }
}

if (Schema::hasTable('themes_catalog')) {
    Schema::table('themes_catalog', function (Blueprint $table) {
        if (! Schema::hasColumn('themes_catalog', 'name_ar')) {
            $table->string('name_ar')->nullable()->after('name');
        }
        if (! Schema::hasColumn('themes_catalog', 'price_sar')) {
            $table->unsignedInteger('price_sar')->nullable()->after('tier');
        }
        if (! Schema::hasColumn('themes_catalog', 'included_in_tiers')) {
            $table->json('included_in_tiers')->nullable()->after('price_sar');
        }
        if (! Schema::hasColumn('themes_catalog', 'is_active')) {
            $table->boolean('is_active')->default(true)->after('is_default');
        }
    });
    DB::table('themes_catalog')->where('id', 'theme-commerce-starter')->update([
        'name_ar' => 'بداية التجارة',
        'price_sar' => 0,
        'included_in_tiers' => json_encode(['starter', 'pro', 'premium', 'custom', 'free', 'paid']),
        'is_active' => 1,
        'updated_at' => now(),
    ]);
    echo "themes_catalog marketplace columns ok\n";
}

if (! Schema::hasTable('store_theme_entitlements')) {
    Schema::create('store_theme_entitlements', function (Blueprint $table) {
        $table->string('id', 64)->primary();
        $table->string('store_id', 64);
        $table->string('theme_id', 64);
        $table->string('source', 32)->default('purchase');
        $table->unsignedInteger('price_sar')->nullable();
        $table->timestamp('granted_at')->nullable();
        $table->string('granted_by', 64)->nullable();
        $table->timestamps();
        $table->unique(['store_id', 'theme_id'], 'ste_store_theme_uq');
        $table->index(['store_id', 'source']);
        $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        $table->foreign('theme_id')->references('id')->on('themes_catalog')->restrictOnDelete();
    });
    echo "store_theme_entitlements created\n";
} else {
    Schema::table('store_theme_entitlements', function (Blueprint $table) {
        if (! Schema::hasColumn('store_theme_entitlements', 'price_sar')) {
            $table->unsignedInteger('price_sar')->nullable()->after('source');
        }
        if (! Schema::hasColumn('store_theme_entitlements', 'granted_at')) {
            $table->timestamp('granted_at')->nullable()->after('price_sar');
        }
        if (! Schema::hasColumn('store_theme_entitlements', 'granted_by')) {
            $table->string('granted_by', 64)->nullable()->after('granted_at');
        }
    });
    echo "store_theme_entitlements exists (columns ensured)\n";
}

echo "DONE\n";
