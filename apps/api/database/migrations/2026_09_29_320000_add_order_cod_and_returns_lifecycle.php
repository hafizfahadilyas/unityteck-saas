<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure orders table supports full lifecycle statuses & COD / Returns fields
        if (Schema::hasTable('orders')) {
            // Modify status column to varchar(64) so it accommodates all lifecycle statuses
            try {
                DB::statement("ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(64) NOT NULL DEFAULT 'pending'");
            } catch (\Throwable $e) {
                // If DB driver does not support raw statement or already altered
            }

            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'cod_status')) {
                    $table->string('cod_status', 64)->default('not_cod')->after('payment_status');
                }
                if (!Schema::hasColumn('orders', 'cod_collected_at')) {
                    $table->timestamp('cod_collected_at')->nullable()->after('cod_status');
                }
                if (!Schema::hasColumn('orders', 'cod_remitted_at')) {
                    $table->timestamp('cod_remitted_at')->nullable()->after('cod_collected_at');
                }
                if (!Schema::hasColumn('orders', 'cod_notes')) {
                    $table->string('cod_notes', 255)->nullable()->after('cod_remitted_at');
                }
                if (!Schema::hasColumn('orders', 'refund_status')) {
                    $table->string('refund_status', 64)->default('none')->after('cod_notes');
                }
                if (!Schema::hasColumn('orders', 'refund_amount')) {
                    $table->decimal('refund_amount', 12, 2)->default(0)->after('refund_status');
                }
                if (!Schema::hasColumn('orders', 'return_reason')) {
                    $table->string('return_reason', 255)->nullable()->after('refund_amount');
                }
                if (!Schema::hasColumn('orders', 'return_notes')) {
                    $table->text('return_notes')->nullable()->after('return_reason');
                }
                if (!Schema::hasColumn('orders', 'returned_at')) {
                    $table->timestamp('returned_at')->nullable()->after('return_notes');
                }
                if (!Schema::hasColumn('orders', 'restocked_at')) {
                    $table->timestamp('restocked_at')->nullable()->after('returned_at');
                }
            });
        }

        // 2. Create order_returns table for dedicated returns ledger
        if (!Schema::hasTable('order_returns')) {
            Schema::create('order_returns', function (Blueprint $table) {
                $table->string('id', 64)->primary();
                $table->string('store_id', 64);
                $table->string('order_id', 64);
                $table->string('return_number', 64);
                $table->string('customer_name', 255);
                $table->string('reason', 100);
                $table->text('reason_details')->nullable();
                $table->string('status', 64)->default('requested'); // requested, approved, rejected, completed
                $table->decimal('refund_amount', 12, 2)->default(0);
                $table->boolean('restock_inventory')->default(true);
                $table->json('items')->nullable();
                $table->text('admin_notes')->nullable();
                $table->timestamp('requested_at')->useCurrent();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();

                $table->index(['store_id', 'status']);
                $table->index(['store_id', 'order_id']);
                $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
                $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('order_returns');

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $cols = [
                    'cod_status',
                    'cod_collected_at',
                    'cod_remitted_at',
                    'cod_notes',
                    'refund_status',
                    'refund_amount',
                    'return_reason',
                    'return_notes',
                    'returned_at',
                    'restocked_at',
                ];
                foreach ($cols as $c) {
                    if (Schema::hasColumn('orders', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
    }
};
