<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Product lists sort by updated_at inside one store.
 * Keeps a page of 20 fast when a store grows past 100,000 rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }
        $existing = array_map(
            static fn (array $idx): string => (string) ($idx['name'] ?? ''),
            Schema::getIndexes('products'),
        );
        if (in_array('products_store_updated_idx', $existing, true)) {
            return;
        }
        Schema::table('products', function (Blueprint $table) {
            $table->index(['store_id', 'updated_at'], 'products_store_updated_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_store_updated_idx');
        });
    }
};
