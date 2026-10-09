<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable();
            $table->enum('status', ['active', 'inactive', 'pending', 'suspended'])->default('pending');
            $table->enum('plan', ['free', 'paid', 'pro', 'custom'])->default('free');
            $table->boolean('master_granted_pro')->default(false);
            $table->string('currency', 10)->default('SAR');
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('owner_name')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('category')->nullable();
            $table->string('logo')->nullable();
            $table->string('accent_color', 32)->nullable();
            $table->enum('hosting_mode', ['shared', 'dedicated', 'client'])->default('shared');
            $table->enum('db_isolation', ['shared_store_id', 'dedicated_mysql'])->default('shared_store_id');
            $table->string('zatca_vat_number', 32)->nullable();
            $table->unsignedInteger('products_count')->default(0);
            $table->unsignedInteger('orders_count')->default(0);
            $table->decimal('revenue', 14, 2)->default(0);
            $table->unsignedInteger('visitors_count')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('plan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
