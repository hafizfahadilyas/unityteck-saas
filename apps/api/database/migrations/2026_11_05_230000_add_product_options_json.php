<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Merchant option definitions (name, type, values, swatch, image) per product.
 * Variant rows stay in product_variations. Isolated by the product's store_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'product_options')) {
                $table->json('product_options')->nullable()->after('tags');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('products') || ! Schema::hasColumn('products', 'product_options')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('product_options');
        });
    }
};
