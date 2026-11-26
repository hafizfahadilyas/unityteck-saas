<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Complete Gemini & Multi-Provider AI Architecture for Souq Platform.
 * Supports: Super Admin Gemini Settings (9 Tabs) + Merchant AI Image Studio.
 * Zero dummy data, strict store isolation, and verified official Gemini capabilities.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. AI Providers (Gemini, etc.)
        if (! Schema::hasTable('ai_providers')) {
            Schema::create('ai_providers', function (Blueprint $table) {
                $table->string('id', 64)->primary(); // e.g. 'provider-gemini'
                $table->string('slug', 32)->unique(); // 'gemini'
                $table->string('name', 80); // 'Google Gemini'
                $table->string('display_name_ar', 100)->nullable();
                $table->string('display_name_en', 100)->nullable();
                $table->string('status', 24)->default('active'); // active|disabled|maintenance
                $table->boolean('is_default')->default(true);
                $table->string('api_endpoint', 255)->default('https://generativelanguage.googleapis.com/v1beta');
                $table->timestamp('last_connection_test_at')->nullable();
                $table->string('connection_status', 24)->default('untested'); // connected|failed|untested
                $table->text('last_connection_error')->nullable();
                $table->timestamps();
            });
        }

        // 2. AI Provider Configurations (Secure Super Admin settings per provider)
        if (! Schema::hasTable('ai_provider_configurations')) {
            Schema::create('ai_provider_configurations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('provider_id', 64);
                $table->boolean('enabled')->default(true);
                $table->string('default_model', 80)->default('gemini-2.5-flash-image');
                $table->string('default_text_model', 80)->default('gemini-3.8-flash');
                $table->string('default_image_model', 80)->default('gemini-2.5-flash-image');
                $table->string('default_language', 16)->default('ar'); // ar|en|auto
                $table->string('default_image_quality', 16)->default('balanced'); // standard|balanced|pro
                $table->string('default_aspect_ratio', 16)->default('1:1'); // 1:1, 4:5, 16:9, etc.
                $table->string('max_image_resolution', 8)->default('2K'); // 1K|2K|4K
                $table->string('default_generation_mode', 32)->default('text_to_image');
                // Features
                $table->boolean('feature_text_to_image')->default(true);
                $table->boolean('feature_image_to_image')->default(true);
                $table->boolean('feature_product_photography')->default(true);
                $table->boolean('feature_background_replacement')->default(true);
                $table->boolean('feature_lifestyle_scenes')->default(true);
                $table->boolean('feature_promotional_banners')->default(true);
                $table->boolean('feature_social_creatives')->default(true);
                $table->boolean('feature_product_variations')->default(true);
                // Storage & output
                $table->json('allowed_aspect_ratios')->nullable();
                $table->string('output_format', 16)->default('webp'); // webp|png|jpeg
                $table->string('storage_location', 32)->default('public_disk');
                $table->unsignedTinyInteger('compression_quality')->default(90); // 1-100
                $table->unsignedInteger('max_upload_size_mb')->default(10);
                // Limits & quotas
                $table->boolean('all_merchants_enabled')->default(true);
                $table->unsignedInteger('default_daily_image_limit')->default(25);
                $table->unsignedInteger('default_monthly_image_limit')->default(200);
                $table->unsignedInteger('default_daily_credit_allowance')->default(25);
                $table->unsignedInteger('default_monthly_credit_allowance')->default(200);
                $table->unsignedInteger('max_images_per_request')->default(2);
                $table->decimal('monthly_spending_limit_usd', 12, 4)->default(100.0000);
                // Advanced Networking & Fault tolerance
                $table->unsignedInteger('api_timeout_seconds')->default(60);
                $table->boolean('retry_enabled')->default(true);
                $table->unsignedTinyInteger('max_retries')->default(3);
                $table->unsignedInteger('request_concurrency_limit')->default(5);
                $table->unsignedInteger('rate_limit_per_minute')->default(60);
                $table->boolean('provider_fallback_enabled')->default(true);
                $table->string('fallback_model', 80)->default('gemini-3.1-flash-lite-image');
                $table->boolean('failure_alerts_enabled')->default(true);
                $table->boolean('global_maintenance_mode')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('provider_id')->references('id')->on('ai_providers')->cascadeOnDelete();
                $table->index('provider_id');
            });
        }

        // 3. AI Models (Catalog of official Gemini and other supported models)
        if (! Schema::hasTable('ai_models')) {
            Schema::create('ai_models', function (Blueprint $table) {
                $table->string('id', 64)->primary(); // e.g. 'gemini-2.5-flash-image'
                $table->string('provider_id', 64);
                $table->string('model_id', 80); // official id
                $table->string('name_en', 100);
                $table->string('name_ar', 100);
                $table->text('description_en')->nullable();
                $table->text('description_ar')->nullable();
                $table->string('tier', 24)->default('standard'); // standard|balanced|pro
                $table->json('capabilities')->nullable(); // ['text-to-image', 'image-to-image', etc.]
                $table->boolean('supports_image_generation')->default(true);
                $table->boolean('supports_image_editing')->default(true);
                $table->json('input_modalities')->nullable(); // ['text', 'image']
                $table->json('output_modalities')->nullable(); // ['image']
                $table->string('availability_status', 24)->default('available'); // available|preview|deprecated
                $table->boolean('is_enabled')->default(true);
                $table->boolean('is_default')->default(false);
                $table->unsignedInteger('priority')->default(1);
                // Official pricing
                $table->decimal('input_token_price_per_1m_usd', 12, 6)->default(0.000000);
                $table->decimal('output_token_price_per_1m_usd', 12, 6)->default(0.000000);
                $table->decimal('image_generation_price_usd', 12, 6)->default(0.030000);
                $table->timestamps();

                $table->unique(['provider_id', 'model_id']);
                $table->foreign('provider_id')->references('id')->on('ai_providers')->cascadeOnDelete();
                $table->index(['is_enabled', 'priority']);
            });
        }

        // 4. AI Merchant Limits (Per-store / per-merchant isolation)
        if (! Schema::hasTable('ai_merchant_limits')) {
            Schema::create('ai_merchant_limits', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('merchant_id', 64)->nullable(); // user_id or store_owner
                $table->string('provider_id', 64)->default('provider-gemini');
                $table->boolean('ai_enabled')->default(true);
                $table->boolean('is_paused')->default(false);
                $table->string('plan_code', 32)->default('starter');
                $table->unsignedInteger('daily_image_limit')->default(25);
                $table->unsignedInteger('monthly_image_limit')->default(200);
                $table->unsignedInteger('daily_credits_allowance')->default(25);
                $table->unsignedInteger('monthly_credits_allowance')->default(200);
                $table->integer('remaining_credits')->default(200);
                $table->unsignedInteger('max_images_per_request')->default(2);
                $table->json('allowed_models')->nullable(); // null means all enabled
                $table->text('pause_reason')->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'provider_id']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['ai_enabled', 'is_paused']);
            });
        }

        // 5. AI Credit Transactions (Credit adjustments, consumption, grants)
        if (! Schema::hasTable('ai_credit_transactions')) {
            Schema::create('ai_credit_transactions', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('merchant_id', 64)->nullable();
                $table->string('provider_id', 64)->default('provider-gemini');
                $table->string('transaction_type', 32); // 'grant'|'deduction'|'refund'|'adjustment'|'plan_reset'
                $table->integer('amount'); // +50 or -1
                $table->integer('balance_after');
                $table->string('reason', 255)->nullable();
                $table->string('reference_id', 64)->nullable(); // e.g. generation history id
                $table->string('created_by_user_id', 64)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'created_at']);
            });
        }

        // 6. AI Generation History (Real records of generated and edited images)
        if (! Schema::hasTable('ai_generation_history')) {
            Schema::create('ai_generation_history', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('merchant_id', 64)->nullable();
                $table->string('provider_id', 64)->default('provider-gemini');
                $table->string('model_id', 80);
                $table->string('action_type', 32)->default('text_to_image'); // text_to_image|edit|remove_bg|replace_bg|banner|lifestyle
                $table->text('prompt');
                $table->text('revised_prompt')->nullable();
                $table->string('aspect_ratio', 16)->default('1:1');
                $table->string('image_size', 16)->default('1K');
                $table->string('style', 32)->nullable();
                $table->string('media_id', 64)->nullable(); // reference to media table
                $table->string('image_url', 500)->nullable();
                $table->unsignedInteger('size_bytes')->default(0);
                $table->string('mime_type', 32)->default('image/webp');
                $table->unsignedInteger('execution_time_ms')->default(0);
                $table->string('status', 24)->default('success'); // success|failed
                $table->text('error_message')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'created_at']);
                $table->index(['provider_id', 'model_id']);
                $table->index('status');
            });
        }

        // 7. AI Usage Logs (Super Admin API audit & performance logs)
        if (! Schema::hasTable('ai_usage_logs')) {
            Schema::create('ai_usage_logs', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('request_id', 64)->nullable();
                $table->string('store_id', 64)->nullable();
                $table->string('merchant_id', 64)->nullable();
                $table->string('provider_id', 64)->default('provider-gemini');
                $table->string('model_id', 80);
                $table->string('endpoint', 100)->nullable();
                $table->unsignedInteger('input_tokens')->default(0);
                $table->unsignedInteger('output_tokens')->default(0);
                $table->decimal('cost_usd', 12, 6)->default(0.000000);
                $table->unsignedInteger('response_time_ms')->default(0);
                $table->unsignedSmallInteger('http_status')->default(200);
                $table->string('status', 24)->default('success'); // success|failed|blocked
                $table->string('error_code', 64)->nullable();
                $table->text('error_message')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['store_id', 'created_at']);
                $table->index(['provider_id', 'created_at']);
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('ai_generation_history');
        Schema::dropIfExists('ai_credit_transactions');
        Schema::dropIfExists('ai_merchant_limits');
        Schema::dropIfExists('ai_models');
        Schema::dropIfExists('ai_provider_configurations');
        Schema::dropIfExists('ai_providers');
    }
};
