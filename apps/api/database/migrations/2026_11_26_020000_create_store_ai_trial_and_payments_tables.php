<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('store_ai_trial_usages')) {
            Schema::create('store_ai_trial_usages', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->unique();
                $table->unsignedInteger('trial_items_limit')->default(5);
                $table->unsignedInteger('trial_items_used')->default(0);
                $table->string('status', 32)->default('active'); // active | exhausted | paid
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('store_ai_payments')) {
            Schema::create('store_ai_payments', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64)->index();
                $table->string('package_id', 64);
                $table->string('package_name', 128);
                $table->decimal('amount_sar', 10, 2)->default(0);
                $table->string('payment_method', 64)->default('bank_transfer');
                $table->string('transaction_ref', 128);
                $table->string('sender_name', 128)->nullable();
                $table->string('proof_path', 512)->nullable();
                $table->text('proof_url')->nullable();
                $table->string('proof_type', 32)->default('image'); // image | pdf
                $table->string('status', 32)->default('approved'); // pending | approved | rejected
                $table->json('limits_granted')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->string('reviewed_by', 128)->nullable();
                $table->timestamps();

                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->index(['store_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('store_ai_payments');
        Schema::dropIfExists('store_ai_trial_usages');
    }
};
