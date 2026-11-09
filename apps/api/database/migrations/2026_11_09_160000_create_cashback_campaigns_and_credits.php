<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cashback campaigns + pending/available credit ledger (per store_id).
 * Store-wallet-only is enforced: credits never cross tenants.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cashback_campaigns')) {
            Schema::create('cashback_campaigns', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('name', 255);
                $table->enum('type', ['percentage', 'fixed'])->default('percentage');
                $table->decimal('value', 12, 2)->default(0);
                $table->decimal('min_cart_value', 12, 2)->default(0);
                $table->decimal('max_cashback_per_order', 12, 2)->nullable();
                $table->timestamp('start_date')->nullable();
                $table->timestamp('end_date')->nullable();
                $table->enum('status', ['active', 'draft', 'completed', 'paused'])->default('draft');
                // all | include | exclude
                $table->string('product_scope', 16)->default('all');
                $table->json('product_ids')->nullable();
                // Always true for multi-tenant safety — cashback stays in this store's wallet
                $table->boolean('store_wallet_only')->default(true);
                // Days after available credit until unused balance expires (null = no expiry)
                $table->unsignedInteger('credit_expiry_days')->nullable();
                // Hold / maturation days after delivered before credit becomes spendable
                $table->unsignedInteger('hold_days')->default(7);
                $table->timestamps();

                $table->index(['store_id', 'status']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('cashback_credits')) {
            Schema::create('cashback_credits', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('customer_id', 64);
                $table->string('campaign_id', 64)->nullable();
                $table->string('order_id', 64)->nullable();
                $table->decimal('amount', 12, 2);
                $table->enum('status', ['pending', 'available', 'expired', 'reversed'])->default('pending');
                $table->timestamp('available_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->string('source_event_id', 128);
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->unique(['store_id', 'source_event_id'], 'cb_credit_store_source_unique');
                $table->index(['store_id', 'customer_id', 'status']);
                $table->index(['store_id', 'status', 'available_at']);
                $table->index(['store_id', 'status', 'expires_at']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cashback_credits');
        Schema::dropIfExists('cashback_campaigns');
    }
};
