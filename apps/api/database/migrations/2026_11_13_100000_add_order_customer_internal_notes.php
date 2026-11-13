<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'customer_notes')) {
                $table->text('customer_notes')->nullable()->after('return_notes');
            }
            if (! Schema::hasColumn('orders', 'internal_notes')) {
                $table->text('internal_notes')->nullable()->after('customer_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'internal_notes')) {
                $table->dropColumn('internal_notes');
            }
            if (Schema::hasColumn('orders', 'customer_notes')) {
                $table->dropColumn('customer_notes');
            }
        });
    }
};
