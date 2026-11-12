<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'category_list')) {
                $table->json('category_list')->nullable()->after('category_ar');
            }
            if (! Schema::hasColumn('products', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('status');
            }
        });

        if (Schema::hasColumn('products', 'discount_start_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dateTime('discount_start_at')->nullable()->change();
                $table->dateTime('discount_end_at')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'category_list')) {
                $table->dropColumn('category_list');
            }
            if (Schema::hasColumn('products', 'published_at')) {
                $table->dropColumn('published_at');
            }
        });
    }
};
