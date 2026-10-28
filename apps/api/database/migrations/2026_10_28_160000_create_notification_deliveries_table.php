<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_deliveries', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->string('store_id', 64)->index();
            $table->string('order_id', 64)->nullable()->index();
            $table->string('order_number', 64)->nullable();
            $table->string('event', 64)->index();
            $table->string('channel', 32)->index(); // whatsapp | sms | email
            $table->string('audience', 24)->default('customer'); // customer | merchant
            $table->string('recipient', 191)->nullable();
            $table->string('status', 32)->default('skipped'); // sent | failed | skipped
            $table->string('provider', 64)->nullable();
            $table->string('provider_message_id', 128)->nullable();
            $table->text('preview')->nullable();
            $table->text('error')->nullable();
            $table->boolean('merchant_read')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'created_at']);
            $table->index(['store_id', 'merchant_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
    }
};
