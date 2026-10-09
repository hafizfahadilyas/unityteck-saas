<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name');
            $table->string('email');
            $table->string('phone', 32);
            $table->string('city', 100)->default('Makkah');
            $table->string('country', 100)->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable();
            $table->string('group', 64)->nullable();
            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('total_spend', 12, 2)->default(0);
            $table->decimal('avg_order_value', 12, 2)->default(0);
            $table->string('acquisition_source', 64)->default('Direct');
            $table->enum('status', ['Active', 'VIP', 'New', 'Inactive', 'Cancelled'])->default('New');
            $table->dateTime('last_order_date')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'email']);
            $table->index(['store_id', 'status']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
