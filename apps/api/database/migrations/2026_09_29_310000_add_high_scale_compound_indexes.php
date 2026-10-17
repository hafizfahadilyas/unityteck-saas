<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['store_id', 'category_id'], 'products_store_id_category_id_index');
            $table->index(['store_id', 'status', 'created_at'], 'products_store_id_status_created_at_index');
            $table->index(['store_id', 'created_at'], 'products_store_id_created_at_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['store_id', 'status', 'created_at'], 'orders_store_id_status_created_at_index');
            $table->index(['store_id', 'created_at'], 'orders_store_id_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_store_id_category_id_index');
            $table->dropIndex('products_store_id_status_created_at_index');
            $table->dropIndex('products_store_id_created_at_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_store_id_status_created_at_index');
            $table->dropIndex('orders_store_id_created_at_index');
        });
    }
};
