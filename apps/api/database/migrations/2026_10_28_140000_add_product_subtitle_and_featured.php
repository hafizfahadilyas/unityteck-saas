<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'subtitle')) {
                $table->string('subtitle', 500)->nullable()->after('description');
            }
            if (! Schema::hasColumn('products', 'subtitle_ar')) {
                $table->string('subtitle_ar', 500)->nullable()->after('subtitle');
            }
            if (! Schema::hasColumn('products', 'badge_en')) {
                $table->string('badge_en', 64)->nullable()->after('badge');
            }
            if (! Schema::hasColumn('products', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_active');
                $table->index(['store_id', 'is_featured']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'is_featured')) {
                $table->dropIndex(['store_id', 'is_featured']);
                $table->dropColumn('is_featured');
            }
            if (Schema::hasColumn('products', 'badge_en')) {
                $table->dropColumn('badge_en');
            }
            if (Schema::hasColumn('products', 'subtitle_ar')) {
                $table->dropColumn('subtitle_ar');
            }
            if (Schema::hasColumn('products', 'subtitle')) {
                $table->dropColumn('subtitle');
            }
        });
    }
};
