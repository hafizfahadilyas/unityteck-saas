<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'brand')) {
                $table->string('brand', 191)->nullable()->after('category_ar');
            }
            if (! Schema::hasColumn('products', 'product_type')) {
                $table->string('product_type', 100)->nullable()->after('brand');
            }
            if (! Schema::hasColumn('products', 'google_taxonomy')) {
                $table->string('google_taxonomy', 500)->nullable()->after('product_type');
            }
            if (! Schema::hasColumn('products', 'sales_channels')) {
                $table->json('sales_channels')->nullable()->after('google_taxonomy');
            }
            if (! Schema::hasColumn('products', 'discount_start_at')) {
                $table->date('discount_start_at')->nullable()->after('original_price');
            }
            if (! Schema::hasColumn('products', 'discount_end_at')) {
                $table->date('discount_end_at')->nullable()->after('discount_start_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach ([
                'brand',
                'product_type',
                'google_taxonomy',
                'sales_channels',
                'discount_start_at',
                'discount_end_at',
            ] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
