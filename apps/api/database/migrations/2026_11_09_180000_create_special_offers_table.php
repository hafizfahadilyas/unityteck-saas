<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Special / promotional offers (per store_id) with customer banner color + image.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('special_offers')) {
            return;
        }

        Schema::create('special_offers', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('title_ar', 255)->nullable();
            $table->string('title_en', 255)->nullable();
            $table->string('offer_type', 32)->default('percentage');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->decimal('min_order_value', 12, 2)->nullable();
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->string('message', 500)->nullable();
            $table->enum('status', ['active', 'inactive', 'draft'])->default('draft');
            $table->string('product_scope', 16)->default('specific');
            $table->json('product_ids')->nullable();
            $table->string('banner_bg_color', 32)->nullable();
            $table->string('banner_image_url', 2048)->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_offers');
    }
};
