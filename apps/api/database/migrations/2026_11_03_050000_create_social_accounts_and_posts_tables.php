<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Step 2 — Real per-store social accounts + scheduled posts (Meta IG/FB first).
 * Never mark connected without a live Graph test. No engagement fake columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('platform', 32); // instagram|facebook|tiktok|snapchat|x
            $table->string('account_name', 191)->nullable();
            $table->string('page_id', 64)->nullable();
            $table->string('ig_user_id', 64)->nullable();
            $table->text('access_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->boolean('is_connected')->default(false);
            $table->timestamp('last_tested_at')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'platform']);
            $table->index(['store_id', 'is_connected']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('social_posts', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('platform', 32);
            $table->string('media_id', 64)->nullable();
            $table->string('image_url', 1024);
            $table->text('caption')->nullable();
            $table->timestamp('scheduled_for')->nullable();
            $table->string('status', 32)->default('draft'); // draft|scheduled|publishing|published|failed|cancelled
            $table->string('meta_container_id', 128)->nullable();
            $table->string('external_post_id', 128)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status', 'scheduled_for']);
            $table->index(['status', 'scheduled_for']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_posts');
        Schema::dropIfExists('social_accounts');
    }
};
