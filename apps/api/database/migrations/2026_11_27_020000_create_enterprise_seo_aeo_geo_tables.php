<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enterprise Multi-Tenant AI SEO, AEO, GEO & Technical SEO Migration.
 * Strict store_id tenant isolation across all tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Store SEO Settings & Automation Preferences
        if (! Schema::hasTable('seo_settings')) {
            Schema::create('seo_settings', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->unique();
                $table->string('primary_language', 8)->default('ar');
                $table->string('secondary_language', 8)->default('en');
                $table->string('automation_mode', 32)->default('approval_required'); // manual, approval_required, pre_approved
                $table->boolean('auto_generate_products')->default(false);
                $table->boolean('auto_generate_categories')->default(false);
                $table->boolean('auto_generate_images_alt')->default(false);
                $table->boolean('weekly_audit_enabled')->default(true);
                $table->boolean('broken_link_monitor_enabled')->default(true);
                $table->boolean('sitemap_auto_ping')->default(true);
                $table->string('target_region', 16)->default('SA');
                $table->string('city', 64)->default('Riyadh');
                $table->json('social_profiles')->nullable();
                $table->json('competitor_domains')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 2. SEO Audits (Live crawling and database audit runs)
        if (! Schema::hasTable('seo_audits')) {
            Schema::create('seo_audits', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('target_domain', 255);
                $table->string('audit_type', 32)->default('full'); // full, technical, speed, aeo_geo, product
                $table->unsignedTinyInteger('health_score')->default(0);
                $table->unsignedTinyInteger('technical_score')->default(0);
                $table->unsignedTinyInteger('product_seo_score')->default(0);
                $table->unsignedTinyInteger('meta_completion_score')->default(0);
                $table->unsignedTinyInteger('aeo_readiness_score')->default(0);
                $table->unsignedTinyInteger('geo_readiness_score')->default(0);
                $table->unsignedTinyInteger('speed_mobile_score')->default(0);
                $table->unsignedTinyInteger('speed_desktop_score')->default(0);
                $table->unsignedInteger('pages_crawled')->default(0);
                $table->unsignedInteger('indexed_pages_count')->default(0);
                $table->unsignedInteger('broken_links_count')->default(0);
                $table->unsignedInteger('backlinks_count')->default(0);
                $table->unsignedInteger('issues_count')->default(0);
                $table->string('status', 24)->default('completed'); // pending, running, completed, failed
                $table->json('audit_summary')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'created_at']);
            });
        }

        // 3. SEO Audit Issues (Granular issues with AI recommendation & cost)
        if (! Schema::hasTable('seo_audit_issues')) {
            Schema::create('seo_audit_issues', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('audit_id', 64)->nullable();
                $table->string('store_id', 64);
                $table->string('category', 32); // technical, meta, speed, content, link, schema, aeo, geo, mobile
                $table->string('severity', 16); // critical, warning, info
                $table->string('affected_url', 500);
                $table->string('title_en', 255);
                $table->string('title_ar', 255);
                $table->text('issue_description_en');
                $table->text('issue_description_ar');
                $table->text('why_it_matters_en');
                $table->text('why_it_matters_ar');
                $table->text('suggested_solution_en');
                $table->text('suggested_solution_ar');
                $table->unsignedInteger('ai_credits_cost')->default(1);
                $table->boolean('auto_fixable')->default(true);
                $table->string('status', 24)->default('open'); // open, in_progress, resolved, ignored
                $table->json('proposed_payload')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'status']);
                $table->index(['store_id', 'severity']);
            });
        }

        // 4. SEO Metadata (Page-level, product-level, category-level meta tags)
        if (! Schema::hasTable('seo_metadata')) {
            Schema::create('seo_metadata', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('entity_type', 32); // store, product, category, page, blog
                $table->string('entity_id', 64);
                $table->string('url_path', 255);
                $table->string('title_ar', 255)->nullable();
                $table->string('title_en', 255)->nullable();
                $table->text('meta_description_ar')->nullable();
                $table->text('meta_description_en')->nullable();
                $table->string('canonical_url', 255)->nullable();
                $table->string('robots_meta', 64)->default('index, follow');
                $table->string('og_title_ar', 255)->nullable();
                $table->string('og_title_en', 255)->nullable();
                $table->text('og_description_ar')->nullable();
                $table->text('og_description_en')->nullable();
                $table->string('og_image_url', 500)->nullable();
                $table->string('twitter_card', 32)->default('summary_large_image');
                $table->string('focus_keyword', 100)->nullable();
                $table->json('secondary_keywords')->nullable();
                $table->string('search_intent', 64)->nullable();
                $table->json('schema_jsonld')->nullable();
                $table->json('faq_items')->nullable();
                $table->string('status', 24)->default('published'); // draft, approved, published
                $table->timestamps();

                $table->unique(['store_id', 'entity_type', 'entity_id']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'url_path']);
            });
        }

        // 5. SEO Keywords (Rank tracking & research)
        if (! Schema::hasTable('seo_keywords')) {
            Schema::create('seo_keywords', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('keyword', 191);
                $table->string('language', 8)->default('ar');
                $table->string('keyword_type', 32)->default('primary'); // primary, secondary, long_tail, commercial, informational, local_saudi
                $table->string('search_intent', 32)->default('commercial');
                $table->unsignedInteger('search_volume')->nullable(); // null if not retrieved from reliable source
                $table->unsignedTinyInteger('difficulty_score')->nullable();
                $table->decimal('cpc_sar', 8, 2)->nullable();
                $table->unsignedInteger('ranking_position')->nullable();
                $table->string('target_url', 500)->nullable();
                $table->string('source', 64)->default('manual');
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'language']);
                $table->index(['store_id', 'keyword']);
            });
        }

        // 6. SEO Recommendations (AI proposed changes)
        if (! Schema::hasTable('seo_recommendations')) {
            Schema::create('seo_recommendations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('issue_id', 64)->nullable();
                $table->string('type', 32); // meta_fix, content_expansion, alt_text, schema_markup, speed_patch, aeo_faq, geo_entity, sitemap
                $table->string('target_url', 500);
                $table->string('title_ar', 255);
                $table->string('title_en', 255);
                $table->text('explanation_ar');
                $table->text('explanation_en');
                $table->json('proposed_payload');
                $table->unsignedInteger('estimated_credits')->default(1);
                $table->string('status', 24)->default('pending'); // pending, approved, declined, implemented, rolled_back
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'status']);
            });
        }

        // 7. SEO Implementations (Applied fixes with rollback tracking)
        if (! Schema::hasTable('seo_implementations')) {
            Schema::create('seo_implementations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('recommendation_id', 64)->nullable();
                $table->string('target_url', 500);
                $table->string('action_type', 32);
                $table->string('executed_by_user_id', 64)->nullable();
                $table->unsignedInteger('credits_consumed')->default(1);
                $table->json('before_state');
                $table->json('after_state');
                $table->string('live_validation_status', 32)->default('verified_live'); // verified_live, mismatch_detected, pending_cache
                $table->timestamp('rolled_back_at')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'created_at']);
            });
        }

        // 8. SEO Backlinks (Verified profile & genuine opportunities)
        if (! Schema::hasTable('seo_backlinks')) {
            Schema::create('seo_backlinks', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('source_url', 500);
                $table->string('target_url', 500);
                $table->string('anchor_text', 255)->nullable();
                $table->boolean('is_verified')->default(false);
                $table->string('link_type', 32)->default('editorial'); // editorial, directory, partnership, broken_link_opportunity, competitor_link
                $table->string('outreach_status', 32)->default('not_contacted'); // not_contacted, email_sent, in_discussion, placed, rejected
                $table->text('outreach_notes')->nullable();
                $table->text('outreach_template')->nullable();
                $table->timestamp('first_detected_at')->nullable();
                $table->timestamp('last_verified_at')->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'is_verified']);
            });
        }

        // 9. SEO Content History (Audit trail of every metadata and content shift)
        if (! Schema::hasTable('seo_content_history')) {
            Schema::create('seo_content_history', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('entity_type', 32);
                $table->string('entity_id', 64);
                $table->string('field_name', 64);
                $table->mediumText('old_value')->nullable();
                $table->mediumText('new_value');
                $table->string('changed_by', 64)->default('merchant_manual'); // ai_agent, merchant_manual, automation
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'entity_type', 'entity_id']);
            });
        }

        // 10. SEO Integrations (Search Console, Bing, IndexNow)
        if (! Schema::hasTable('seo_integrations')) {
            Schema::create('seo_integrations', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('provider', 32); // google_gsc, google_pagespeed, bing_webmaster, indexnow
                $table->boolean('is_connected')->default(false);
                $table->text('credentials_encrypted')->nullable();
                $table->string('property_url', 255)->nullable();
                $table->string('api_key_masked', 64)->nullable();
                $table->string('indexnow_key', 64)->nullable();
                $table->timestamp('last_sync_at')->nullable();
                $table->string('last_status', 64)->nullable();
                $table->text('error_details')->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'provider']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 11. SEO Search Performance (Aggregated from real GSC / Bing API)
        if (! Schema::hasTable('seo_search_performance')) {
            Schema::create('seo_search_performance', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->date('date');
                $table->string('source', 32)->default('google_search_console');
                $table->unsignedInteger('clicks')->default(0);
                $table->unsignedInteger('impressions')->default(0);
                $table->decimal('ctr', 6, 4)->default(0.0000);
                $table->decimal('avg_position', 6, 2)->default(0.00);
                $table->json('top_queries')->nullable();
                $table->json('top_pages')->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'source', 'date']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        // 12. SEO Reports (Exportable reports with historical diffs)
        if (! Schema::hasTable('seo_reports')) {
            Schema::create('seo_reports', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('report_type', 32); // daily, weekly, monthly, technical, speed, aeo_geo
                $table->date('period_start');
                $table->date('period_end');
                $table->json('metrics_comparison');
                $table->string('pdf_path', 255)->nullable();
                $table->string('csv_path', 255)->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'report_type', 'period_end']);
            });
        }

        // 13. SEO Automation Rules
        if (! Schema::hasTable('seo_automation_rules')) {
            Schema::create('seo_automation_rules', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('rule_code', 64);
                $table->string('action_type', 64);
                $table->string('mode', 32)->default('approval_required'); // manual, approval_required, pre_approved
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_triggered_at')->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'rule_code']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_automation_rules');
        Schema::dropIfExists('seo_reports');
        Schema::dropIfExists('seo_search_performance');
        Schema::dropIfExists('seo_integrations');
        Schema::dropIfExists('seo_content_history');
        Schema::dropIfExists('seo_backlinks');
        Schema::dropIfExists('seo_implementations');
        Schema::dropIfExists('seo_recommendations');
        Schema::dropIfExists('seo_keywords');
        Schema::dropIfExists('seo_metadata');
        Schema::dropIfExists('seo_audit_issues');
        Schema::dropIfExists('seo_audits');
        Schema::dropIfExists('seo_settings');
    }
};
