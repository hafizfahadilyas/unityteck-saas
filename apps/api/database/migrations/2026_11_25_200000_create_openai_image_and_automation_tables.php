<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * OpenAI Image + Automation (store Q&A) — Master-owned limits.
 * Separate from Gemini store_ai_* and from OpenAI text tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_openai_image_configs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->boolean('enabled')->default(false);
            $table->string('default_model', 80)->default('gpt-image-2.6-flare');
            $table->string('default_quality', 16)->default('medium'); // low|medium|high
            $table->unsignedInteger('monthly_image_quota')->default(50);
            // No daily quota by design — all 50 may be used in one day.
            $table->decimal('monthly_budget_usd', 12, 4)->default(25);
            $table->decimal('max_cost_per_image_usd', 12, 4)->default(1);
            $table->unsignedTinyInteger('warning_threshold_pct')->default(80);
            $table->boolean('auto_stop_at_quota')->default(true);
            $table->boolean('payment_required_for_usage')->default(true);
            $table->boolean('usage_unlocked')->default(false);
            $table->string('payment_status', 32)->default('unpaid');
            $table->timestamp('usage_unlocked_until')->nullable();
            $table->string('config_status', 32)->default('draft');
            $table->timestamps();

            $table->unique('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('store_openai_image_usage', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('period_key', 16); // YYYY-MM Asia/Riyadh
            $table->unsignedInteger('images_success')->default(0);
            $table->unsignedInteger('images_failed')->default(0);
            $table->decimal('cost_usd', 12, 6)->default(0);
            $table->boolean('warning_sent')->default(false);
            $table->boolean('hard_stopped')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'period_key']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('store_openai_image_events', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('user_id', 64)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->string('model', 80)->nullable();
            $table->string('quality', 16)->nullable();
            $table->string('status', 24)->default('pending');
            $table->decimal('actual_cost_usd', 12, 6)->default(0);
            $table->string('media_id', 64)->nullable();
            $table->string('error_code', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->index(['store_id', 'created_at']);
        });

        /**
         * Automation = limited store Q&A about THIS store only.
         * Limits owned by Master + payment — not end-customer self-serve.
         */
        Schema::create('store_openai_automation_configs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->boolean('enabled')->default(false);
            $table->string('intelligence_level', 16)->default('medium');
            $table->string('text_model', 80)->nullable();
            $table->unsignedInteger('monthly_question_quota')->default(100);
            $table->unsignedInteger('daily_question_quota')->default(20);
            $table->unsignedInteger('max_output_tokens')->default(1024);
            $table->boolean('own_store_data_only')->default(true);
            $table->boolean('block_cross_store')->default(true);
            $table->boolean('block_sql_and_secrets')->default(true);
            $table->boolean('payment_required_for_usage')->default(true);
            $table->boolean('usage_unlocked')->default(false);
            $table->string('payment_status', 32)->default('unpaid');
            $table->timestamp('usage_unlocked_until')->nullable();
            $table->string('config_status', 32)->default('draft');
            $table->timestamps();

            $table->unique('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('store_openai_automation_usage', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('period_type', 8); // day|month
            $table->string('period_key', 16);
            $table->unsignedInteger('questions_used')->default(0);
            $table->unsignedInteger('tokens_used')->default(0);
            $table->decimal('cost_usd', 12, 6)->default(0);
            $table->boolean('hard_stopped')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'period_type', 'period_key'], 'openai_auto_usage_unique');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_openai_automation_usage');
        Schema::dropIfExists('store_openai_automation_configs');
        Schema::dropIfExists('store_openai_image_events');
        Schema::dropIfExists('store_openai_image_usage');
        Schema::dropIfExists('store_openai_image_configs');
    }
};
