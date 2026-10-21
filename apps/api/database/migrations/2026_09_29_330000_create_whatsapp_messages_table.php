<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('whatsapp_messages')) {
            Schema::create('whatsapp_messages', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('customer_id', 64)->nullable()->index();
                $table->string('customer_name', 255)->default('');
                $table->string('phone_number', 64)->index();
                $table->string('order_id', 64)->nullable()->index();
                $table->string('order_number', 64)->nullable()->index();
                $table->text('message_content');
                $table->string('message_type', 64)->default('Custom'); // Order Update, Order Confirmation, Marketing, Delivery Update, Payment Update, Return Update, Custom
                $table->string('category', 32)->default('custom')->index(); // order, marketing, custom
                $table->string('template_name', 100)->nullable()->index();
                $table->string('status', 32)->default('sent')->index(); // sent, delivered, read, failed
                $table->string('agent_name', 100)->nullable();
                $table->string('agent_initials', 10)->nullable();
                $table->string('direction', 20)->default('outgoing'); // outgoing, incoming
                $table->string('error_code', 50)->nullable();
                $table->text('error_message')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['store_id', 'created_at']);
                $table->index(['store_id', 'status']);
                $table->index(['store_id', 'category']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
