<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Autonomous AI Store Growth Advisor & Store Optimization Engine Tables.
 * Multi-tenant store-isolated tables with zero dummy data and complete audit/rollback capability.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('store_growth_recommendations')) {
            Schema::create('store_growth_recommendations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('category', 48); // upselling, cross_selling, product_recommendations, seo_optimization, abandoned_cart, whatsapp_automation, ai_chatbot, ai_calling, marketing_campaigns, social_automation, homepage_optimization, checkout_optimization, customer_retention, loyalty_programs, sales_analytics
                $table->string('feature_name', 120);
                $table->text('problem_identified');
                $table->text('reason');
                $table->json('supporting_store_data')->nullable(); // genuine DB metrics (e.g. AOV, out_of_stock_count, cart_recovery_rate)
                $table->string('expected_benefit', 255); // labeled as estimate
                $table->json('implementation_steps'); // array of step strings
                $table->unsignedInteger('required_credits')->default(10);
                $table->string('action_key', 64); // identifier for StoreGrowthExecutorService
                $table->string('manual_config_url', 255)->nullable();
                $table->string('status', 24)->default('pending'); // pending, approved, executing, completed, skipped, failed
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'status']);
                $table->index(['store_id', 'category']);
            });
        }

        if (! Schema::hasTable('store_growth_actions')) {
            Schema::create('store_growth_actions', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('recommendation_id', 64)->nullable();
                $table->string('action_type', 64);
                $table->string('merchant_user_id', 64)->nullable();
                $table->string('execution_mode', 32)->default('merchant_approval'); // recommendation_only, merchant_approval, preapproved_automation
                $table->unsignedInteger('credits_cost')->default(0);
                $table->unsignedInteger('credits_refunded')->default(0);
                $table->json('proposed_changes')->nullable();
                $table->json('before_state'); // Snapshot of DB state before changes for rollback
                $table->json('after_state')->nullable(); // Snapshot of DB state after changes
                $table->string('execution_result', 24)->default('pending'); // pending, success, failed, rolled_back
                $table->text('error_message')->nullable();
                $table->boolean('is_rolled_back')->default(false);
                $table->timestamp('rolled_back_at')->nullable();
                $table->string('rolled_back_by_user_id', 64)->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'execution_result']);
                $table->index(['store_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('store_growth_advisor_settings')) {
            Schema::create('store_growth_advisor_settings', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->unique();
                $table->string('execution_mode', 32)->default('merchant_approval'); // recommendation_only, merchant_approval, preapproved_automation
                $table->boolean('auto_daily_audit')->default(true);
                $table->boolean('auto_apply_seo')->default(false);
                $table->boolean('auto_apply_cart_recovery')->default(false);
                $table->unsignedInteger('daily_credit_limit')->default(100);
                $table->unsignedInteger('monthly_credit_limit')->default(1000);
                $table->unsignedInteger('credits_used_today')->default(0);
                $table->unsignedInteger('credits_used_month')->default(0);
                $table->timestamp('last_audited_at')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'execution_mode']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('store_growth_actions');
        Schema::dropIfExists('store_growth_recommendations');
        Schema::dropIfExists('store_growth_advisor_settings');
    }
};
