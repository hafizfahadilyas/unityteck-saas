<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-store AI image/video generation monthly meters (zero cross-tenant).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_ai_generation_usage', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('period_key', 16); // YYYY-MM (Asia/Riyadh)
            $table->unsignedInteger('images_used')->default(0);
            $table->unsignedInteger('videos_used')->default(0);
            $table->timestamps();

            $table->unique(['store_id', 'period_key']);
            $table->index(['store_id', 'period_key']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_ai_generation_usage');
    }
};
