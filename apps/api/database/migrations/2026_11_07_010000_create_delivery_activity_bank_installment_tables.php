<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Step 2 — Real delivery drivers, customer activities, bank accounts, order installments.
 * All tables are store_id scoped. No seed / mock data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_drivers', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name', 191);
            $table->string('name_ar', 191)->nullable();
            $table->string('phone', 32);
            $table->string('email', 191)->nullable();
            $table->string('vehicle_type', 64)->nullable();
            $table->string('city', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('customer_activities', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('customer_id', 64)->nullable();
            $table->string('customer_name', 191)->nullable();
            $table->string('activity_type', 64);
            $table->string('product_id', 64)->nullable();
            $table->string('product_name', 191)->nullable();
            $table->string('order_id', 64)->nullable();
            $table->json('meta')->nullable();
            $table->dateTime('occurred_at');
            $table->timestamps();

            $table->index(['store_id', 'occurred_at']);
            $table->index(['store_id', 'customer_id']);
            $table->index(['store_id', 'activity_type']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
        });

        Schema::create('store_bank_accounts', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('bank_name', 191);
            $table->string('bank_name_ar', 191)->nullable();
            $table->string('account_title', 191);
            $table->string('account_title_ar', 191)->nullable();
            $table->string('iban', 64);
            $table->string('account_number', 64)->nullable();
            $table->string('payment_reference_prefix', 32)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('store_id');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('order_installments', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('order_id', 64);
            $table->unsignedInteger('installment_number');
            $table->decimal('amount', 12, 2);
            $table->date('due_date');
            $table->dateTime('paid_at')->nullable();
            $table->string('payment_transaction_id', 64)->nullable();
            $table->string('status', 32)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'order_id', 'installment_number'], 'order_installments_store_order_num_unique');
            $table->index(['store_id', 'order_id']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('payment_transaction_id')->references('id')->on('payment_transactions')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'delivery_mode')) {
                $table->string('delivery_mode', 32)->nullable()->after('shipping_status');
            }
            if (! Schema::hasColumn('orders', 'driver_id')) {
                $table->string('driver_id', 64)->nullable()->after('delivery_mode');
            }
            if (! Schema::hasColumn('orders', 'bank_account_id')) {
                $table->string('bank_account_id', 64)->nullable()->after('payment_transaction_id');
            }
            if (! Schema::hasColumn('orders', 'payment_plan')) {
                $table->string('payment_plan', 32)->nullable()->after('bank_account_id');
            }
            if (! Schema::hasColumn('orders', 'amount_paid')) {
                $table->decimal('amount_paid', 12, 2)->default(0)->after('payment_plan');
            }
            if (! Schema::hasColumn('orders', 'remaining_balance')) {
                $table->decimal('remaining_balance', 12, 2)->nullable()->after('amount_paid');
            }
            if (! Schema::hasColumn('orders', 'estimated_delivery_at')) {
                $table->dateTime('estimated_delivery_at')->nullable()->after('remaining_balance');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'driver_id')) {
                $table->foreign('driver_id')->references('id')->on('delivery_drivers')->nullOnDelete();
            }
            if (Schema::hasColumn('orders', 'bank_account_id')) {
                $table->foreign('bank_account_id')->references('id')->on('store_bank_accounts')->nullOnDelete();
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'shipping_mode')) {
                $table->string('shipping_mode', 32)->nullable()->after('weight_kg');
            }
            if (! Schema::hasColumn('products', 'shipping_method_id')) {
                $table->string('shipping_method_id', 64)->nullable()->after('shipping_mode');
            }
            if (! Schema::hasColumn('products', 'delivery_fee')) {
                $table->decimal('delivery_fee', 10, 2)->nullable()->after('shipping_method_id');
            }
            if (! Schema::hasColumn('products', 'estimated_delivery_text')) {
                $table->string('estimated_delivery_text', 191)->nullable()->after('delivery_fee');
            }
            if (! Schema::hasColumn('products', 'requires_own_driver')) {
                $table->boolean('requires_own_driver')->default(false)->after('estimated_delivery_text');
            }
        });

        if (Schema::hasTable('shipping_methods') && ! Schema::hasColumn('shipping_methods', 'fulfillment_mode')) {
            Schema::table('shipping_methods', function (Blueprint $table) {
                $table->string('fulfillment_mode', 32)->default('courier')->after('type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                foreach (['orders_driver_id_foreign', 'orders_bank_account_id_foreign'] as $fk) {
                    try {
                        $table->dropForeign($fk);
                    } catch (\Throwable) {
                        // ignore missing FK
                    }
                }
            });

            Schema::table('orders', function (Blueprint $table) {
                foreach ([
                    'delivery_mode',
                    'driver_id',
                    'bank_account_id',
                    'payment_plan',
                    'amount_paid',
                    'remaining_balance',
                    'estimated_delivery_at',
                ] as $col) {
                    if (Schema::hasColumn('orders', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                foreach ([
                    'shipping_mode',
                    'shipping_method_id',
                    'delivery_fee',
                    'estimated_delivery_text',
                    'requires_own_driver',
                ] as $col) {
                    if (Schema::hasColumn('products', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('shipping_methods') && Schema::hasColumn('shipping_methods', 'fulfillment_mode')) {
            Schema::table('shipping_methods', function (Blueprint $table) {
                $table->dropColumn('fulfillment_mode');
            });
        }

        Schema::dropIfExists('order_installments');
        Schema::dropIfExists('store_bank_accounts');
        Schema::dropIfExists('customer_activities');
        Schema::dropIfExists('delivery_drivers');
    }
};
