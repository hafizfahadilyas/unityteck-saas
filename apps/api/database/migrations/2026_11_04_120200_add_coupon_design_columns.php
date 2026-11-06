<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->enum('design_type', ['solid_color', 'image_based', 'image_only'])
                ->default('solid_color')
                ->after('expires_at');
            $table->string('design_color', 32)->nullable()->after('design_type');
            $table->text('design_image_url')->nullable()->after('design_color');
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn(['design_type', 'design_color', 'design_image_url']);
        });
    }
};
