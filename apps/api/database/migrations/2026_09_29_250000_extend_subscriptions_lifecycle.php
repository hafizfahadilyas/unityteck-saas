<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Phase 2.7 — subscription billing interval + grace/renewal timestamps. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('subscriptions')) {
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'billing_interval')) {
                $table->string('billing_interval', 16)->default('monthly')->after('status');
            }
            if (! Schema::hasColumn('subscriptions', 'grace_ends_at')) {
                $table->timestamp('grace_ends_at')->nullable()->after('ends_at');
            }
            if (! Schema::hasColumn('subscriptions', 'renewed_at')) {
                $table->timestamp('renewed_at')->nullable()->after('grace_ends_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('subscriptions')) {
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            foreach (['renewed_at', 'grace_ends_at', 'billing_interval'] as $col) {
                if (Schema::hasColumn('subscriptions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
