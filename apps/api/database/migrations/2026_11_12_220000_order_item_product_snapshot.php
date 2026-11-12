<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'sku')) {
                $table->string('sku', 100)->nullable()->after('product_name');
            }
            if (! Schema::hasColumn('order_items', 'brand')) {
                $table->string('brand', 191)->nullable()->after('sku');
            }
            if (! Schema::hasColumn('order_items', 'category')) {
                $table->string('category', 191)->nullable()->after('brand');
            }
            if (! Schema::hasColumn('order_items', 'image_url')) {
                $table->text('image_url')->nullable()->after('category');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) {
            foreach (['sku', 'brand', 'category', 'image_url'] as $col) {
                if (Schema::hasColumn('order_items', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
