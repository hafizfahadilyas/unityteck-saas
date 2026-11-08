<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persist store-admin soft archive so archived orders do not reappear after API refresh.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'is_archived')) {
                $table->boolean('is_archived')->default(false)->after('order_date');
            }
            if (! Schema::hasColumn('orders', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('is_archived');
            }
            $table->index(['store_id', 'is_archived'], 'orders_store_id_is_archived_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropIndex('orders_store_id_is_archived_index');
            } catch (\Throwable) {
                // Index may already be absent on partial deploys.
            }
            $drop = [];
            if (Schema::hasColumn('orders', 'archived_at')) {
                $drop[] = 'archived_at';
            }
            if (Schema::hasColumn('orders', 'is_archived')) {
                $drop[] = 'is_archived';
            }
            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
