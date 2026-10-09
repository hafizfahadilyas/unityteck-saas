<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'weight_kg')) {
                $table->decimal('weight_kg', 8, 3)->nullable()->after('price');
            }
        });

        Schema::table('shipping_zones', function (Blueprint $table) {
            if (! Schema::hasColumn('shipping_zones', 'rate_per_kg')) {
                $table->decimal('rate_per_kg', 10, 2)->default(0)->after('rate');
            }
            if (! Schema::hasColumn('shipping_zones', 'min_weight_kg')) {
                $table->decimal('min_weight_kg', 8, 3)->default(0)->after('rate_per_kg');
            }
            if (! Schema::hasColumn('shipping_zones', 'max_weight_kg')) {
                $table->decimal('max_weight_kg', 8, 3)->nullable()->after('min_weight_kg');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'weight_kg')) {
                $table->dropColumn('weight_kg');
            }
        });
        Schema::table('shipping_zones', function (Blueprint $table) {
            foreach (['rate_per_kg', 'min_weight_kg', 'max_weight_kg'] as $col) {
                if (Schema::hasColumn('shipping_zones', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
