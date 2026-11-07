<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_methods', function (Blueprint $table) {
            if (! Schema::hasColumn('shipping_methods', 'logo_url')) {
                $table->string('logo_url', 512)->nullable()->after('courier_code');
            }
            if (! Schema::hasColumn('shipping_methods', 'vehicle_type')) {
                $table->string('vehicle_type', 32)->nullable()->after('logo_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shipping_methods', function (Blueprint $table) {
            if (Schema::hasColumn('shipping_methods', 'vehicle_type')) {
                $table->dropColumn('vehicle_type');
            }
            if (Schema::hasColumn('shipping_methods', 'logo_url')) {
                $table->dropColumn('logo_url');
            }
        });
    }
};
