<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stores') && Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stores MODIFY COLUMN plan ENUM('free','paid','pro','premium','custom') NOT NULL DEFAULT 'free'");
        }

        if (Schema::hasTable('plans') && ! Schema::hasColumn('plans', 'price_sar')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->unsignedInteger('price_sar')->nullable()->after('name');
            });
        }

        if (! Schema::hasTable('plans')) {
            return;
        }

        $now = now();
        $rows = [
            ['id' => 'plan-free', 'code' => 'free', 'name' => 'Free', 'price_sar' => 0],
            ['id' => 'plan-paid', 'code' => 'paid', 'name' => 'Paid', 'price_sar' => null],
            ['id' => 'plan-pro', 'code' => 'pro', 'name' => 'Pro', 'price_sar' => 300],
            [
                'id' => 'plan-premium',
                'code' => 'premium',
                'name' => 'Premium',
                'price_sar' => 500,
                'product_limit' => null,
                'storage_mb' => 102400,
                'team_seats' => 50,
                'features' => json_encode([
                    'catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'reports',
                    'themes_basic', 'themes', 'media_studio', 'custom_domain',
                    'backups', 'zatca', 'ai', 'api_access', 'advanced_seo', 'advanced_analytics',
                ]),
                'is_active' => 1,
            ],
            ['id' => 'plan-custom', 'code' => 'custom', 'name' => 'Custom', 'price_sar' => null],
        ];

        foreach ($rows as $row) {
            $code = $row['code'];
            if ($code === 'premium') {
                $exists = DB::table('plans')->where('code', 'premium')->exists();
                if (! $exists) {
                    DB::table('plans')->insert(array_merge($row, [
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]));
                } else {
                    DB::table('plans')->where('code', 'premium')->update([
                        'name' => 'Premium',
                        'price_sar' => 500,
                        'updated_at' => $now,
                    ]);
                }
                continue;
            }
            if (Schema::hasColumn('plans', 'price_sar')) {
                DB::table('plans')->where('code', $code)->update([
                    'price_sar' => $row['price_sar'],
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('plans')) {
            DB::table('plans')->where('code', 'premium')->delete();
            if (Schema::hasColumn('plans', 'price_sar')) {
                Schema::table('plans', function (Blueprint $table) {
                    $table->dropColumn('price_sar');
                });
            }
        }

        if (Schema::hasTable('stores') && Schema::getConnection()->getDriverName() === 'mysql') {
            DB::table('stores')->where('plan', 'premium')->update(['plan' => 'pro']);
            DB::statement("ALTER TABLE stores MODIFY COLUMN plan ENUM('free','paid','pro','custom') NOT NULL DEFAULT 'free'");
        }
    }
};
