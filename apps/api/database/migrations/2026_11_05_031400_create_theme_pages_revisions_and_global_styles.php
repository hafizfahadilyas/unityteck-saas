<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Presentation only. Does not alter products, orders, customers, or SEO tables.
 * Global design tokens live only in theme_global_styles (one row per store_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theme_pages', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('slug', 191);
            $table->string('type', 32);
            $table->string('title_en', 255)->nullable();
            $table->string('title_ar', 255)->nullable();
            $table->json('draft_layout')->nullable();
            $table->json('published_layout')->nullable();
            $table->json('seo')->nullable();
            $table->string('header_mode', 16)->default('global');
            $table->string('footer_mode', 16)->default('global');
            $table->string('status', 16)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->string('updated_by', 64)->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'slug']);
            $table->index(['store_id', 'status']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('theme_revisions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('page_id', 64)->nullable();
            $table->json('snapshot')->nullable();
            $table->string('created_by', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['store_id', 'created_at']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('page_id')->references('id')->on('theme_pages')->nullOnDelete();
        });

        Schema::create('theme_global_styles', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->json('styles')->nullable();
            $table->string('updated_by', 64)->nullable();
            $table->timestamps();

            $table->unique('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theme_revisions');
        Schema::dropIfExists('theme_global_styles');
        Schema::dropIfExists('theme_pages');
    }
};
