<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Per-variant MRP. Selling price stays in product_variations.price. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_variations')) {
            return;
        }

        Schema::table('product_variations', function (Blueprint $table) {
            if (! Schema::hasColumn('product_variations', 'compare_at_price')) {
                $table->decimal('compare_at_price', 12, 2)->nullable()->after('price');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('product_variations') || ! Schema::hasColumn('product_variations', 'compare_at_price')) {
            return;
        }

        Schema::table('product_variations', function (Blueprint $table) {
            $table->dropColumn('compare_at_price');
        });
    }
};
