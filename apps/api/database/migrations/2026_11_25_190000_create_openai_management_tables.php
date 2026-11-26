<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Isolated OpenAI AI Management (Master). Does NOT touch Gemini / store_ai_* tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('openai_global_configs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->boolean('enabled')->default(false);
            $table->boolean('emergency_disabled')->default(false);
            $table->string('default_text_model', 80)->default('gpt-5.4-mini');
            $table->boolean('prompt_caching_enabled')->default(false);
            $table->unsignedInteger('platform_daily_request_cap')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('openai_model_pricings', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('model', 80);
            $table->string('modality', 20)->default('text'); // text|image
            $table->decimal('input_per_1m_usd', 12, 6)->default(0);
            $table->decimal('output_per_1m_usd', 12, 6)->default(0);
            $table->decimal('cached_input_per_1m_usd', 12, 6)->nullable();
            $table->decimal('image_per_unit_usd', 12, 6)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['model', 'modality']);
            $table->index(['active', 'model']);
        });

        Schema::create('store_openai_configs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->boolean('enabled')->default(false);
            $table->string('intelligence_level', 16)->default('medium'); // low|medium|high
            $table->string('text_model', 80)->nullable();
            $table->string('reasoning_effort', 16)->nullable(); // low|medium|high|null
            $table->boolean('prompt_caching_enabled')->nullable();
            $table->unsignedInteger('daily_token_limit')->default(50000);
            $table->unsignedInteger('monthly_token_limit')->default(500000);
            $table->unsignedInteger('max_input_tokens')->default(4000);
            $table->unsignedInteger('max_output_tokens')->default(2048);
            $table->unsignedInteger('daily_request_limit')->default(100);
            $table->unsignedInteger('monthly_request_limit')->default(2000);
            $table->decimal('daily_budget_usd', 12, 4)->default(5);
            $table->decimal('monthly_budget_usd', 12, 4)->default(50);
            $table->decimal('max_cost_per_request_usd', 12, 4)->default(1);
            $table->unsignedTinyInteger('warning_threshold_pct')->default(80); // 50|80|90
            $table->boolean('auto_stop_at_budget')->default(true);
            $table->boolean('allow_admin_override')->default(true);
            $table->boolean('payment_required_for_usage')->default(true);
            $table->boolean('usage_unlocked')->default(false); // paid / Master unlock for current period
            $table->string('payment_status', 32)->default('unpaid'); // unpaid|paid|comped|overdue
            $table->timestamp('usage_unlocked_until')->nullable();
            $table->boolean('store_isolation_enforced')->default(true);
            $table->boolean('audit_logging_enabled')->default(true);
            $table->unsignedInteger('rate_limit_per_minute')->default(20);
            $table->string('config_status', 32)->default('draft'); // draft|active|paused|emergency
            $table->json('level_overrides')->nullable();
            $table->timestamps();

            $table->unique('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->index(['enabled', 'store_id']);
        });

        Schema::create('store_openai_usage_logs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('user_id', 64)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->string('model', 80)->nullable();
            $table->string('intelligence_level', 16)->nullable();
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->unsignedInteger('cached_tokens')->default(0);
            $table->unsignedInteger('total_tokens')->default(0);
            $table->decimal('estimated_cost_usd', 12, 6)->default(0);
            $table->decimal('actual_cost_usd', 12, 6)->default(0);
            $table->string('status', 24)->default('pending'); // success|failed|blocked|payment_required
            $table->string('error_code', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->index(['store_id', 'created_at']);
            $table->index(['store_id', 'status']);
            $table->index(['model', 'created_at']);
        });

        Schema::create('store_openai_budget_periods', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('period_type', 8); // day|month
            $table->string('period_key', 16); // YYYY-MM-DD or YYYY-MM (Asia/Riyadh)
            $table->unsignedInteger('tokens_used')->default(0);
            $table->unsignedInteger('requests_used')->default(0);
            $table->decimal('cost_usd', 12, 6)->default(0);
            $table->boolean('warning_sent')->default(false);
            $table->boolean('hard_stopped')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'period_type', 'period_key'], 'openai_budget_period_unique');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('store_openai_config_histories', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('actor_user_id', 64)->nullable();
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->string('action', 40)->default('update');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->index(['store_id', 'created_at']);
        });

        Schema::create('store_openai_audit_logs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->nullable();
            $table->string('actor_user_id', 64)->nullable();
            $table->string('action', 64);
            $table->string('severity', 24)->default('info'); // info|warning|security|error
            $table->text('message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['store_id', 'created_at']);
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_openai_audit_logs');
        Schema::dropIfExists('store_openai_config_histories');
        Schema::dropIfExists('store_openai_budget_periods');
        Schema::dropIfExists('store_openai_usage_logs');
        Schema::dropIfExists('store_openai_configs');
        Schema::dropIfExists('openai_model_pricings');
        Schema::dropIfExists('openai_global_configs');
    }
};
