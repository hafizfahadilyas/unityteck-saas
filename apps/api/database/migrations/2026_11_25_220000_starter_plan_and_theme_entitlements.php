<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * CT-2 / CT-3 — Souq Starter (100 SAR) + store_theme_entitlements + marketplace columns.
 * docs/36-souq-common-theme-subscription-marketplace.md
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (Schema::hasTable('stores') && $driver === 'mysql') {
            DB::statement("ALTER TABLE stores MODIFY COLUMN plan ENUM('free','paid','starter','pro','premium','custom') NOT NULL DEFAULT 'free'");
        }

        if (Schema::hasTable('plans')) {
            $now = now();
            $starter = [
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
                'created_at' => $now,
                'updated_at' => $now,
            ];
            if (Schema::hasColumn('plans', 'price_sar')) {
                $starter['price_sar'] = 100;
            }

            $exists = DB::table('plans')->where('code', 'starter')->exists();
            if (! $exists) {
                DB::table('plans')->insert($starter);
            } else {
                $update = [
                    'name' => 'Starter',
                    'product_limit' => 250,
                    'storage_mb' => 2048,
                    'team_seats' => 2,
                    'features' => $starter['features'],
                    'is_active' => 1,
                    'updated_at' => $now,
                ];
                if (Schema::hasColumn('plans', 'price_sar')) {
                    $update['price_sar'] = 100;
                }
                DB::table('plans')->where('code', 'starter')->update($update);
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

            // Default commerce starter → included on all paid/subscription tiers
            if (Schema::hasColumn('themes_catalog', 'included_in_tiers')) {
                DB::table('themes_catalog')->where('id', 'theme-commerce-starter')->update([
                    'name_ar' => 'بداية التجارة',
                    'price_sar' => 0,
                    'included_in_tiers' => json_encode(['starter', 'pro', 'premium', 'custom', 'free', 'paid']),
                    'is_active' => 1,
                    'updated_at' => now(),
                ]);
            }
        }

        if (! Schema::hasTable('store_theme_entitlements')) {
            Schema::create('store_theme_entitlements', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('theme_id', 64);
                $table->string('source', 32)->default('purchase'); // subscription|purchase|master_grant
                $table->unsignedInteger('price_sar')->nullable();
                $table->timestamp('granted_at')->nullable();
                $table->string('granted_by', 64)->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'theme_id'], 'ste_store_theme_uq');
                $table->index(['store_id', 'source']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->foreign('theme_id')->references('id')->on('themes_catalog')->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('store_theme_entitlements');

        if (Schema::hasTable('themes_catalog')) {
            Schema::table('themes_catalog', function (Blueprint $table) {
                foreach (['name_ar', 'price_sar', 'included_in_tiers', 'is_active'] as $col) {
                    if (Schema::hasColumn('themes_catalog', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('plans')) {
            DB::table('plans')->where('code', 'starter')->delete();
        }

        if (Schema::hasTable('stores') && Schema::getConnection()->getDriverName() === 'mysql') {
            DB::table('stores')->where('plan', 'starter')->update(['plan' => 'free']);
            DB::statement("ALTER TABLE stores MODIFY COLUMN plan ENUM('free','paid','pro','premium','custom') NOT NULL DEFAULT 'free'");
        }
    }
};
