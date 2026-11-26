<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('store_utm_links')) {
            Schema::create('store_utm_links', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('name', 191);
                $table->string('platform_key', 64)->nullable();
                $table->string('target_path', 512)->nullable();
                $table->string('product_id', 64)->nullable();
                $table->string('target_url', 1024);
                $table->string('utm_source', 128);
                $table->string('utm_medium', 128);
                $table->string('utm_campaign', 191);
                $table->string('utm_term', 128)->nullable();
                $table->string('utm_content', 128)->nullable();
                $table->unsignedInteger('click_sessions')->default(0);
                $table->unsignedInteger('conversion_count')->default(0);
                $table->timestamps();

                $table->index(['store_id', 'created_at'], 'sul_store_created_idx');
                $table->index(['store_id', 'utm_campaign'], 'sul_store_campaign_idx');
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $cols = [
                    'first_touch_source' => 64,
                    'first_touch_medium' => 128,
                    'first_touch_campaign' => 191,
                    'first_touch_utm_term' => 128,
                    'first_touch_utm_content' => 128,
                    'landing_page' => 512,
                    'referral_host' => 191,
                ];
                foreach ($cols as $col => $len) {
                    if (! Schema::hasColumn('orders', $col)) {
                        $table->string($col, $len)->nullable();
                    }
                }
            });
        }

        if (Schema::hasTable('storefront_analytics_events')) {
            Schema::table('storefront_analytics_events', function (Blueprint $table) {
                if (! Schema::hasColumn('storefront_analytics_events', 'visitor_key')) {
                    $table->string('visitor_key', 64)->nullable()->after('session_key');
                    $table->index(['store_id', 'visitor_key', 'created_at'], 'sfae_store_visitor_created_idx');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefront_analytics_events') && Schema::hasColumn('storefront_analytics_events', 'visitor_key')) {
            Schema::table('storefront_analytics_events', function (Blueprint $table) {
                $table->dropIndex('sfae_store_visitor_created_idx');
                $table->dropColumn('visitor_key');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                foreach ([
                    'first_touch_source',
                    'first_touch_medium',
                    'first_touch_campaign',
                    'first_touch_utm_term',
                    'first_touch_utm_content',
                    'landing_page',
                    'referral_host',
                ] as $col) {
                    if (Schema::hasColumn('orders', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        Schema::dropIfExists('store_utm_links');
    }
};