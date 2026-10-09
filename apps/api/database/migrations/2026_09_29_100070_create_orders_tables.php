<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('order_number', 64);
            $table->string('customer_id', 64)->nullable();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 32);
            $table->unsignedInteger('items_count')->default(0);
            $table->string('items_summary')->nullable();
            $table->decimal('total_amount', 12, 2);
            $table->string('currency', 10)->default('SAR');
            $table->enum('source', [
                'WhatsApp',
                'Instagram',
                'Google Ads',
                'Facebook',
                'Snapchat',
                'Direct',
            ])->default('Direct');
            $table->string('source_details')->nullable();
            $table->string('delivery_location');
            $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['Mada', 'Visa/MC', 'Apple Pay', 'COD'])->default('Mada');
            $table->dateTime('order_date');
            $table->timestamps();

            $table->unique(['store_id', 'order_number']);
            $table->index(['store_id', 'status']);
            $table->index(['store_id', 'source']);
            $table->index(['store_id', 'order_date']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 64);
            $table->string('store_id', 64);
            $table->string('product_id', 64)->nullable();
            $table->string('product_name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();

            $table->index('order_id');
            $table->index('store_id');
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
