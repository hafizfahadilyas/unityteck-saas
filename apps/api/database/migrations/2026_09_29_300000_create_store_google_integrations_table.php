<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_google_integrations', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->unique();
            $table->boolean('is_connected')->default(false);
            $table->string('google_account_email')->nullable();
            $table->string('google_account_name')->nullable();
            $table->string('google_account_picture')->nullable();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->text('granted_scopes')->nullable();

            // Connected Properties
            $table->string('ga4_property_id')->nullable();
            $table->string('ga4_property_name')->nullable();
            $table->string('ga4_measurement_id')->nullable();
            $table->string('gsc_site_url')->nullable();
            $table->string('gtm_account_id')->nullable();
            $table->string('gtm_container_id')->nullable();
            $table->string('google_ads_customer_id')->nullable();
            $table->string('google_ads_account_name')->nullable();

            // Synchronization
            $table->enum('sync_status', ['not_connected', 'connected', 'syncing', 'synced', 'error'])->default('not_connected');
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();

            // Live Snapshots (Real data from Google APIs)
            $table->json('analytics_snapshot')->nullable();
            $table->json('search_console_snapshot')->nullable();
            $table->json('pagespeed_mobile_snapshot')->nullable();
            $table->json('pagespeed_desktop_snapshot')->nullable();
            $table->json('google_ads_snapshot')->nullable();
            $table->json('gtm_snapshot')->nullable();

            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        // Add attribution columns to orders if not existing
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'medium')) {
                    $table->string('medium', 64)->nullable()->after('source');
                }
                if (!Schema::hasColumn('orders', 'campaign')) {
                    $table->string('campaign', 128)->nullable()->after('medium');
                }
                if (!Schema::hasColumn('orders', 'utm_term')) {
                    $table->string('utm_term', 128)->nullable()->after('campaign');
                }
                if (!Schema::hasColumn('orders', 'utm_content')) {
                    $table->string('utm_content', 128)->nullable()->after('utm_term');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('store_google_integrations');

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $columns = ['medium', 'campaign', 'utm_term', 'utm_content'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
