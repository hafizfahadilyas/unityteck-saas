<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Variant commerce fields: barcode, weight, low-stock, unlimited inventory.
 * Soft-archive friendly — keep rows for historical order integrity.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_variations')) {
            return;
        }

        Schema::table('product_variations', function (Blueprint $table) {
            if (! Schema::hasColumn('product_variations', 'barcode')) {
                $table->string('barcode', 128)->nullable()->after('sku');
            }
            if (! Schema::hasColumn('product_variations', 'weight')) {
                $table->decimal('weight', 12, 3)->nullable()->after('stock');
            }
            if (! Schema::hasColumn('product_variations', 'weight_unit')) {
                $table->string('weight_unit', 16)->nullable()->default('kg')->after('weight');
            }
            if (! Schema::hasColumn('product_variations', 'low_stock_alert')) {
                $table->unsignedInteger('low_stock_alert')->nullable()->after('weight_unit');
            }
            if (! Schema::hasColumn('product_variations', 'unlimited_stock')) {
                $table->boolean('unlimited_stock')->default(false)->after('low_stock_alert');
            }
        });

        if (Schema::hasTable('order_items') && ! Schema::hasColumn('order_items', 'variation_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('variation_id', 64)->nullable()->after('product_id');
                $table->json('selected_options')->nullable()->after('variation_id');
                $table->index(['store_id', 'variation_id']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (Schema::hasColumn('order_items', 'selected_options')) {
                    $table->dropColumn('selected_options');
                }
                if (Schema::hasColumn('order_items', 'variation_id')) {
                    $table->dropColumn('variation_id');
                }
            });
        }

        if (! Schema::hasTable('product_variations')) {
            return;
        }

        Schema::table('product_variations', function (Blueprint $table) {
            foreach (['unlimited_stock', 'low_stock_alert', 'weight_unit', 'weight', 'barcode'] as $col) {
                if (Schema::hasColumn('product_variations', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
