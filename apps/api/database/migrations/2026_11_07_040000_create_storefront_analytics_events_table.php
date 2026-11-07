<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('storefront_analytics_events')) {
            return;
        }

        Schema::create('storefront_analytics_events', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('event_name', 64);
            $table->string('path', 512)->nullable();
            $table->string('source', 64)->nullable();
            $table->string('medium', 128)->nullable();
            $table->string('campaign', 191)->nullable();
            $table->string('customer_id', 64)->nullable();
            $table->string('session_key', 64)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'event_name', 'created_at']);
            $table->index(['store_id', 'customer_id', 'created_at']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storefront_analytics_events');
    }
};
