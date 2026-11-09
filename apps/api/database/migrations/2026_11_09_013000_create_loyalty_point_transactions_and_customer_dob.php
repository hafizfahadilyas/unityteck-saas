<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('customers', 'dob')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->date('dob')->nullable()->after('gender');
            });
        }

        if (! Schema::hasTable('loyalty_point_transactions')) {
            Schema::create('loyalty_point_transactions', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('customer_id', 64);
                $table->string('transaction_type', 32); // credit|debit|expire|reversal
                $table->integer('points_delta');
                $table->unsignedInteger('balance_after')->default(0);
                $table->string('method', 64)->nullable(); // earn-rule key
                $table->string('reason', 255)->nullable();
                $table->string('source_event_id', 128);
                $table->string('order_id', 64)->nullable();
                $table->string('review_id', 64)->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->unique(['store_id', 'source_event_id'], 'lpt_store_source_unique');
                $table->index(['store_id', 'customer_id', 'created_at'], 'lpt_store_customer_created');
                $table->index(['store_id', 'method', 'created_at'], 'lpt_store_method_created');
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_point_transactions');

        if (Schema::hasColumn('customers', 'dob')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('dob');
            });
        }
    }
};
