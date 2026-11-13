<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** SOUQ PLUS Phase 1 — Master onboarding invites + platform identity settings. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_invites', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('token', 128)->unique();
            $table->string('store_id', 64)->unique();
            $table->string('plan', 32)->default('pro');
            $table->string('label', 191)->default('');
            $table->string('locale', 8)->default('en');
            $table->string('text_dir', 8)->default('ltr');
            $table->string('currency', 8)->default('SAR');
            $table->string('timezone', 64)->default('Asia/Riyadh');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('redeemed_store_id', 64)->nullable();
            $table->string('created_by_user_id', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['expires_at', 'used_at']);
        });

        Schema::create('platform_settings', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->json('settings')->nullable();
            $table->string('updated_by_user_id', 64)->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('onboarding_invites');
    }
};
