<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-product custom fields and option visibility rules.
 * Rows stay on products, which already carry store_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'custom_fields')) {
                $table->json('custom_fields')->nullable();
            }
            if (! Schema::hasColumn('products', 'conditional_rules')) {
                $table->json('conditional_rules')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'conditional_rules')) {
                $table->dropColumn('conditional_rules');
            }
            if (Schema::hasColumn('products', 'custom_fields')) {
                $table->dropColumn('custom_fields');
            }
        });
    }
};
