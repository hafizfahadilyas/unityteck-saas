<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. AI Subscription Plans (Monthly & Yearly: Basic, Advanced, Most Popular)
        if (!Schema::hasTable('ai_subscription_plans')) {
            Schema::create('ai_subscription_plans', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('code', 40)->unique();
                $table->string('name_en', 100);
                $table->string('name_ar', 100);
                $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
                $table->enum('tier', ['basic', 'advanced', 'popular'])->default('basic');
                $table->decimal('price_sar', 10, 2)->default(0.00);
                $table->unsignedInteger('credits_allowance')->default(100);
                $table->unsignedInteger('daily_limit')->default(20);
                $table->unsignedInteger('monthly_limit')->default(500);
                $table->unsignedInteger('image_limit')->default(100);
                $table->unsignedInteger('calling_minutes')->default(0);
                $table->unsignedInteger('bonus_credits')->default(0);
                $table->json('allowed_models')->nullable();
                $table->json('included_features')->nullable();
                $table->boolean('is_popular')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['billing_cycle', 'tier', 'is_active']);
            });
        }

        // 2. Merchant AI Subscriptions (Store-level / Merchant-level AI subscriptions)
        if (!Schema::hasTable('merchant_ai_subscriptions')) {
            Schema::create('merchant_ai_subscriptions', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('merchant_id', 64)->nullable()->index();
                $table->string('plan_id', 64)->index();
                $table->enum('status', ['active', 'trial', 'expired', 'suspended', 'cancelled'])->default('trial');
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->timestamp('trial_ends_at')->nullable();
                $table->json('custom_limits')->nullable();
                $table->string('assigned_by_user_id', 64)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->foreign('plan_id')->references('id')->on('ai_subscription_plans')->restrictOnDelete();
            });
        }

        // 3. Central AI Feature Registry
        if (!Schema::hasTable('ai_feature_registry')) {
            Schema::create('ai_feature_registry', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('code', 64)->unique();
                $table->string('name_en', 100);
                $table->string('name_ar', 100);
                $table->string('category', 64)->default('general'); // advisor, seo, image, content, social, voice, agent, automation
                $table->text('description_en')->nullable();
                $table->text('description_ar')->nullable();
                $table->unsignedInteger('credit_cost')->default(1);
                $table->unsignedInteger('daily_limit')->default(50);
                $table->unsignedInteger('monthly_limit')->default(1000);
                $table->string('default_provider', 64)->default('gemini');
                $table->string('default_model', 80)->default('gemini-2.5-flash-image');
                $table->enum('global_status', ['enabled', 'disabled', 'maintenance'])->default('enabled');
                $table->boolean('is_active')->default(true);
                $table->string('page_route', 128)->nullable();
                $table->timestamps();

                $table->index(['category', 'global_status', 'is_active']);
            });
        }

        // 4. Merchant & Store AI Feature Overrides
        if (!Schema::hasTable('merchant_feature_overrides')) {
            Schema::create('merchant_feature_overrides', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('merchant_id', 64)->nullable()->index();
                $table->string('feature_code', 64)->index();
                $table->boolean('is_enabled')->default(true);
                $table->unsignedInteger('custom_credit_cost')->nullable();
                $table->unsignedInteger('custom_daily_limit')->nullable();
                $table->unsignedInteger('custom_monthly_limit')->nullable();
                $table->text('notes')->nullable();
                $table->string('updated_by_user_id', 64)->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'feature_code'], 'store_feature_override_unique');
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 5. Dashboard Page Registry
        if (!Schema::hasTable('dashboard_page_registry')) {
            Schema::create('dashboard_page_registry', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('route_key', 64)->unique();
                $table->string('name_en', 100);
                $table->string('name_ar', 100);
                $table->string('category', 64)->default('core'); // core, commerce, ai, marketing, logistics, settings
                $table->string('icon_name', 64)->default('LayoutDashboard');
                $table->boolean('default_visibility')->default(true);
                $table->boolean('global_visibility')->default(true);
                $table->string('required_store_plan', 32)->nullable();
                $table->string('required_ai_plan', 32)->nullable();
                $table->timestamps();

                $table->index(['category', 'global_visibility']);
            });
        }

        // 6. Merchant & Store Page Visibility Overrides
        if (!Schema::hasTable('merchant_page_visibility')) {
            Schema::create('merchant_page_visibility', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('merchant_id', 64)->nullable()->index();
                $table->string('route_key', 64)->index();
                $table->boolean('is_visible')->default(true);
                $table->string('updated_by_user_id', 64)->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'route_key'], 'store_page_visibility_unique');
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 7. UI Component Registry
        if (!Schema::hasTable('ui_component_registry')) {
            Schema::create('ui_component_registry', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('component_key', 64)->unique();
                $table->string('name_en', 100);
                $table->string('name_ar', 100);
                $table->string('component_type', 64)->default('card'); // card, box, button, section, table, widget
                $table->string('parent_page_key', 64)->nullable()->index();
                $table->boolean('default_visibility')->default(true);
                $table->boolean('global_visibility')->default(true);
                $table->integer('display_order')->default(0);
                $table->json('allowed_settings')->nullable();
                $table->timestamps();

                $table->index(['component_type', 'global_visibility']);
            });
        }

        // 8. Merchant & Store Component Overrides
        if (!Schema::hasTable('merchant_component_overrides')) {
            Schema::create('merchant_component_overrides', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('merchant_id', 64)->nullable()->index();
                $table->string('component_key', 64)->index();
                $table->boolean('is_visible')->default(true);
                $table->string('custom_title_en', 128)->nullable();
                $table->string('custom_title_ar', 128)->nullable();
                $table->integer('display_order')->nullable();
                $table->json('settings')->nullable();
                $table->string('updated_by_user_id', 64)->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'component_key'], 'store_component_override_unique');
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 9. Master Central Audit Logs
        if (!Schema::hasTable('master_central_audit_logs')) {
            Schema::create('master_central_audit_logs', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('admin_id', 64)->nullable()->index();
                $table->string('admin_name', 128)->nullable();
                $table->string('admin_email', 128)->nullable();
                $table->enum('scope', ['global', 'bulk', 'merchant', 'store'])->default('global');
                $table->string('action', 128)->index();
                $table->string('target_type', 64)->index();
                $table->string('target_id', 64)->nullable()->index();
                $table->json('before_state')->nullable();
                $table->json('after_state')->nullable();
                $table->text('reason')->nullable();
                $table->string('ip_address', 64)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['created_at', 'action']);
            });
        }

        // 10. Global Platform Configurations (Versioned for Instant Sync)
        if (!Schema::hasTable('global_platform_configurations')) {
            Schema::create('global_platform_configurations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('config_key', 64)->unique();
                $table->json('config_value')->nullable();
                $table->string('category', 64)->default('general');
                $table->unsignedBigInteger('version')->default(1);
                $table->string('updated_by_user_id', 64)->nullable();
                $table->timestamps();

                $table->index(['category', 'version']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('global_platform_configurations');
        Schema::dropIfExists('master_central_audit_logs');
        Schema::dropIfExists('merchant_component_overrides');
        Schema::dropIfExists('ui_component_registry');
        Schema::dropIfExists('merchant_page_visibility');
        Schema::dropIfExists('dashboard_page_registry');
        Schema::dropIfExists('merchant_feature_overrides');
        Schema::dropIfExists('ai_feature_registry');
        Schema::dropIfExists('merchant_ai_subscriptions');
        Schema::dropIfExists('ai_subscription_plans');
    }
};
