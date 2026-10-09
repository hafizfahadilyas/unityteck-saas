<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Configurable Shipping Methods
        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name', 191);
            $table->string('name_ar', 191)->nullable();
            $table->enum('type', [
                'free',
                'flat_rate',
                'zone_based',
                'weight_based',
                'value_based',
                'same_day',
                'scheduled',
                'local_pickup',
                'cod',
            ])->default('flat_rate');
            $table->decimal('base_rate', 10, 2)->default(0);
            $table->decimal('per_kg_rate', 10, 2)->default(0);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->decimal('free_shipping_threshold', 10, 2)->nullable();
            $table->string('estimated_delivery', 100)->default('2-3 Days');
            $table->boolean('is_cod_allowed')->default(false);
            $table->decimal('cod_fee', 10, 2)->default(0);
            $table->string('courier_code', 64)->nullable(); // e.g. 'spl', 'aramex', 'smsa'
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        // 2. Extend shipping_zones table if needed
        Schema::table('shipping_zones', function (Blueprint $table) {
            if (!Schema::hasColumn('shipping_zones', 'shipping_method_id')) {
                $table->string('shipping_method_id', 64)->nullable()->after('region');
            }
            if (!Schema::hasColumn('shipping_zones', 'courier_code')) {
                $table->string('courier_code', 64)->nullable()->after('shipping_method_id');
            }
            if (!Schema::hasColumn('shipping_zones', 'cod_available')) {
                $table->boolean('cod_available')->default(true)->after('courier_code');
            }
            if (!Schema::hasColumn('shipping_zones', 'city_names')) {
                $table->json('city_names')->nullable()->after('cod_available');
            }
        });

        // 3. Courier Connections
        Schema::create('courier_connections', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->enum('provider', ['spl', 'aramex', 'smsa', 'dhl', 'fedex', 'ups'])->default('smsa');
            $table->string('account_name', 191);
            $table->string('account_number', 191)->nullable();
            $table->text('api_key');
            $table->text('api_secret')->nullable();
            $table->string('entity_pin', 100)->nullable();
            $table->boolean('is_sandbox')->default(true);
            $table->boolean('is_connected')->default(false);
            $table->enum('status', ['connected', 'disconnected', 'error'])->default('disconnected');
            $table->json('settings')->nullable();
            $table->dateTime('last_tested_at')->nullable();
            $table->dateTime('last_sync_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'provider']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        // 4. Real Shipments & AWBs
        Schema::create('shipments', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('order_id', 64);
            $table->string('courier_id', 64)->nullable();
            $table->string('provider', 64);
            $table->string('awb_number', 100)->nullable();
            $table->string('tracking_number', 100);
            $table->text('label_url')->nullable();
            $table->enum('status', [
                'pending',
                'created',
                'picked_up',
                'in_transit',
                'out_for_delivery',
                'delivered',
                'failed',
                'cancelled',
                'returned',
            ])->default('created');
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->decimal('cod_amount', 10, 2)->default(0);
            $table->dateTime('pickup_requested_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->json('origin_address')->nullable();
            $table->json('destination_address')->nullable();
            $table->json('tracking_events')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
            $table->index(['store_id', 'tracking_number']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });

        // 5. Payment Gateway Connections
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('provider', 64); // 'moyasar', 'tap', 'hyperpay', 'stripe', 'paypal', 'stcpay', 'cod'
            $table->string('title', 191);
            $table->string('title_ar', 191)->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->boolean('is_sandbox')->default(true);
            $table->text('api_key')->nullable();
            $table->text('secret_key')->nullable();
            $table->text('public_key')->nullable();
            $table->text('webhook_secret')->nullable();
            $table->json('supported_methods')->nullable(); // ['mada', 'apple_pay', 'visa', 'mastercard', 'stc_pay']
            $table->decimal('transaction_fee_percent', 5, 2)->default(1.50);
            $table->decimal('transaction_fee_fixed', 8, 2)->default(1.00);
            $table->enum('status', ['connected', 'disconnected', 'error'])->default('disconnected');
            $table->dateTime('last_tested_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'provider']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        // 6. Payment Transactions
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('order_id', 64)->nullable();
            $table->string('gateway_provider', 64);
            $table->string('payment_method', 64);
            $table->string('transaction_reference', 100)->unique();
            $table->string('gateway_transaction_id', 191)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('SAR');
            $table->decimal('fee_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->enum('status', [
                'pending',
                'authorized',
                'paid',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded',
            ])->default('pending');
            $table->string('card_brand', 50)->nullable();
            $table->string('card_last_four', 10)->nullable();
            $table->string('payer_email', 191)->nullable();
            $table->string('payer_name', 191)->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
            $table->index(['store_id', 'payment_method']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        // 7. Update orders table with operational connections
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_method_id')) {
                $table->string('shipping_method_id', 64)->nullable()->after('delivery_location');
            }
            if (!Schema::hasColumn('orders', 'shipping_zone_id')) {
                $table->string('shipping_zone_id', 64)->nullable()->after('shipping_method_id');
            }
            if (!Schema::hasColumn('orders', 'courier_code')) {
                $table->string('courier_code', 64)->nullable()->after('shipping_zone_id');
            }
            if (!Schema::hasColumn('orders', 'awb_number')) {
                $table->string('awb_number', 100)->nullable()->after('courier_code');
            }
            if (!Schema::hasColumn('orders', 'tracking_number')) {
                $table->string('tracking_number', 100)->nullable()->after('awb_number');
            }
            if (!Schema::hasColumn('orders', 'shipping_cost')) {
                $table->decimal('shipping_cost', 10, 2)->default(0)->after('tracking_number');
            }
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', [
                    'pending',
                    'authorized',
                    'paid',
                    'failed',
                    'cancelled',
                    'refunded',
                ])->default('pending')->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'payment_transaction_id')) {
                $table->string('payment_transaction_id', 64)->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'shipping_status')) {
                $table->enum('shipping_status', [
                    'pending',
                    'created',
                    'picked_up',
                    'in_transit',
                    'out_for_delivery',
                    'delivered',
                    'failed',
                    'returned',
                ])->default('pending')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $cols = [
                'shipping_method_id',
                'shipping_zone_id',
                'courier_code',
                'awb_number',
                'tracking_number',
                'shipping_cost',
                'payment_status',
                'payment_transaction_id',
                'shipping_status',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payment_gateways');
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('courier_connections');
        Schema::table('shipping_zones', function (Blueprint $table) {
            $cols = ['shipping_method_id', 'courier_code', 'cod_available', 'city_names'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('shipping_zones', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        Schema::dropIfExists('shipping_methods');
    }
};
