<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_wallets', function (Blueprint $table) {
            $table->id();
            $table->string('store_id', 64);
            $table->string('customer_id', 64);
            $table->decimal('balance', 12, 2)->default(0);
            $table->unsignedInteger('loyalty_points')->default(0);
            $table->timestamps();

            $table->unique(['store_id', 'customer_id']);
            $table->index(['store_id', 'customer_id']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('store_id', 64);
            $table->string('customer_id', 64);
            $table->enum('type', ['add', 'deduct']);
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->text('reason')->nullable();
            $table->string('employee_id', 64)->nullable();
            $table->string('employee_name', 191)->nullable();
            $table->string('notify_channel', 32)->nullable();
            $table->boolean('reset_loyalty')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['store_id', 'customer_id', 'created_at']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('customer_wallets');
    }
};
