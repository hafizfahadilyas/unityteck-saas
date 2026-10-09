<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('code', 64);
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->unsignedInteger('usage_count')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->enum('status', ['active', 'expired', 'scheduled'])->default('active');
            $table->boolean('is_active')->default(true);
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'code']);
            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name');
            $table->string('region', 100);
            $table->decimal('rate', 10, 2)->default(0);
            $table->unsignedInteger('min_delivery_days')->default(1);
            $table->unsignedInteger('max_delivery_days')->default(2);
            $table->string('estimated_delivery')->nullable();
            $table->decimal('free_above', 10, 2)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('seo_configs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->unique();
            $table->string('brand_name')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->default('Saudi Arabia');
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('keywords')->nullable();
            $table->string('canonical_url')->nullable();
            $table->string('search_console_tag')->nullable();
            $table->string('ga4_measurement_id', 64)->nullable();
            $table->string('gtm_container_id', 64)->nullable();
            $table->boolean('sitemap_enabled')->default(true);
            $table->text('robots_txt')->nullable();
            $table->boolean('google_connected')->default(false);
            $table->string('google_account_email')->nullable();
            $table->timestamp('google_connected_at')->nullable();
            $table->boolean('search_console_connected')->default(false);
            $table->boolean('indexing_api_enabled')->default(false);
            $table->string('sitemap_url')->nullable();
            $table->json('extra')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('domains', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('domain_name')->unique();
            $table->boolean('is_primary')->default(false);
            $table->enum('ssl_status', ['active', 'issuing', 'provisioning', 'expired', 'failed'])->default('active');
            $table->boolean('dns_configured')->default(false);
            $table->boolean('dns_verified')->default(false);
            $table->string('hosting_tier')->nullable();
            $table->decimal('monthly_fee', 10, 2)->nullable();
            $table->boolean('payment_received')->default(false);
            $table->enum('status', ['active', 'pending_payment', 'dns_propagation', 'suspended'])->default('active');
            $table->json('nameservers')->nullable();
            $table->date('registered_date')->nullable();
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('acquisition_channels', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name', 100);
            $table->string('channel_type', 64)->nullable();
            $table->unsignedInteger('traffic_share')->default(0);
            $table->unsignedInteger('visits')->default(0);
            $table->unsignedInteger('add_to_cart')->default(0);
            $table->unsignedInteger('orders_count')->default(0);
            $table->decimal('conversion_rate', 8, 2)->default(0);
            $table->decimal('revenue', 12, 2)->default(0);
            $table->decimal('roas', 8, 2)->nullable();
            $table->string('roi', 32)->default('0%');
            $table->decimal('cac', 10, 2)->default(0);
            $table->string('icon', 64)->default('Globe');
            $table->json('trend_sparkline')->nullable();
            $table->decimal('trend_change', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('zatca_invoices', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('order_id', 64);
            $table->string('invoice_number', 64);
            $table->text('qr_code_payload');
            $table->string('cryptographic_stamp');
            $table->string('xml_hash', 128);
            $table->enum('status', ['REPORTED', 'CLEARED', 'REJECTED'])->default('REPORTED');
            $table->timestamps();

            $table->unique('order_id');
            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zatca_invoices');
        Schema::dropIfExists('acquisition_channels');
        Schema::dropIfExists('domains');
        Schema::dropIfExists('seo_configs');
        Schema::dropIfExists('shipping_zones');
        Schema::dropIfExists('coupons');
    }
};
