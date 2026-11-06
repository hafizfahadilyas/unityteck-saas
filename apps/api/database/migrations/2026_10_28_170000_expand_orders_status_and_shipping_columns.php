<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Order lifecycle (shipped, delivered, preparing, …) and free-form shipping_status
 * must not be blocked by Phase-1 SQLite CHECK / MySQL ENUM on orders.
 */
return new class extends Migration
{
    /** @var list<string> */
    private const STRING_LIFECYCLE_COLUMNS = [
        'status',
        'shipping_status',
        'payment_status',
        'source',
        'payment_method',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            $this->expandMysqlOrderColumns();

            return;
        }

        if ($driver === 'sqlite') {
            $this->rebuildSqliteOrdersWithoutEnumChecks();
        }
    }

    private function expandMysqlOrderColumns(): void
    {
        DB::statement("ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(64) NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE `orders` MODIFY COLUMN `shipping_status` VARCHAR(64) NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE `orders` MODIFY COLUMN `payment_status` VARCHAR(64) NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE `orders` MODIFY COLUMN `source` VARCHAR(64) NOT NULL DEFAULT 'Direct'");
        DB::statement("ALTER TABLE `orders` MODIFY COLUMN `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Mada'");
    }

    private function rebuildSqliteOrdersWithoutEnumChecks(): void
    {
        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('orders_lifecycle_expand_tmp')) {
            Schema::drop('orders_lifecycle_expand_tmp');
        }

        Schema::create('orders_lifecycle_expand_tmp', function (Blueprint $table) {
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
            $table->string('source', 64)->default('Direct');
            $table->string('source_details')->nullable();
            $table->string('delivery_location');
            $table->string('status', 64)->default('pending');
            $table->string('payment_method', 64)->default('Mada');
            $table->dateTime('order_date');
            $table->timestamps();
            $table->string('shipping_method_id', 64)->nullable();
            $table->string('shipping_zone_id', 64)->nullable();
            $table->string('courier_code', 64)->nullable();
            $table->string('awb_number', 100)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->string('payment_status', 64)->default('pending');
            $table->string('payment_transaction_id', 64)->nullable();
            $table->string('shipping_status', 64)->default('pending');
            $table->string('medium', 64)->nullable();
            $table->string('campaign', 128)->nullable();
            $table->string('utm_term', 128)->nullable();
            $table->string('utm_content', 128)->nullable();
            $table->string('cod_status', 64)->default('not_cod');
            $table->timestamp('cod_collected_at')->nullable();
            $table->timestamp('cod_remitted_at')->nullable();
            $table->string('cod_notes', 255)->nullable();
            $table->string('refund_status', 64)->default('none');
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->string('return_reason', 255)->nullable();
            $table->text('return_notes')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('restocked_at')->nullable();

            $table->unique(['store_id', 'order_number']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
        });

        $columns = collect(DB::select('PRAGMA table_info(orders)'))
            ->pluck('name')
            ->all();

        $tmpColumns = collect(DB::select('PRAGMA table_info(orders_lifecycle_expand_tmp)'))
            ->pluck('name')
            ->all();

        $shared = array_values(array_intersect($columns, $tmpColumns));
        if ($shared === []) {
            Schema::drop('orders_lifecycle_expand_tmp');
            Schema::enableForeignKeyConstraints();
            throw new \RuntimeException('orders lifecycle expand: no shared columns between orders and tmp table.');
        }

        $quoted = implode(', ', array_map(static fn (string $c) => '"' . $c . '"', $shared));
        DB::statement("INSERT INTO orders_lifecycle_expand_tmp ({$quoted}) SELECT {$quoted} FROM orders");

        Schema::drop('orders');
        Schema::rename('orders_lifecycle_expand_tmp', 'orders');

        Schema::table('orders', function (Blueprint $table) {
            if (! $this->indexExists('orders', 'orders_store_id_status_created_at_index')) {
                $table->index(['store_id', 'status', 'created_at'], 'orders_store_id_status_created_at_index');
            }
            if (! $this->indexExists('orders', 'orders_store_id_created_at_index')) {
                $table->index(['store_id', 'created_at'], 'orders_store_id_created_at_index');
            }
        });

        Schema::enableForeignKeyConstraints();
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $rows = DB::select("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ?", [$table, $indexName]);

        return $rows !== [];
    }

    public function down(): void
    {
        // Irreversible safely: restoring CHECK/ENUM would reject existing lifecycle rows.
    }
};
