<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-store AI brand identity for brand-consistent image generation (zero cross-tenant).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_ai_brand_profiles', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->unique();
            /** @var list of hex colors e.g. ["#1A2B3C","#E0E0E0"] */
            $table->json('palette_hex')->nullable();
            $table->string('persona', 40)->default('modern');
            $table->boolean('brand_lock_default')->default(true);
            $table->boolean('logo_overlay_enabled')->default(false);
            $table->string('logo_overlay_position', 20)->default('bottom_end');
            $table->string('logo_url', 500)->nullable();
            /** Style reference photo URLs (10–15 target) — used as multimodal style guidance, not fake LoRA. */
            $table->json('style_reference_urls')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_ai_brand_profiles');
    }
};
