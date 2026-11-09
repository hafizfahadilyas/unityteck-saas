<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optional merchant image for cashback offer preview / storefront banner (per store_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cashback_campaigns')) {
            return;
        }

        Schema::table('cashback_campaigns', function (Blueprint $table) {
            if (! Schema::hasColumn('cashback_campaigns', 'image_url')) {
                $table->string('image_url', 2048)->nullable()->after('name');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('cashback_campaigns')) {
            return;
        }

        Schema::table('cashback_campaigns', function (Blueprint $table) {
            if (Schema::hasColumn('cashback_campaigns', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });
    }
};
