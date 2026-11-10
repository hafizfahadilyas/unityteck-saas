<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master SuperAdmin login-email Active/Inactive — Hostinger MySQL (per store_id).
 * Default true = login allowed until Master deactivates.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stores')) {
            return;
        }
        if (Schema::hasColumn('stores', 'login_email_active')) {
            return;
        }
        Schema::table('stores', function (Blueprint $table) {
            $table->boolean('login_email_active')->default(true)->after('email');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('stores') || ! Schema::hasColumn('stores', 'login_email_active')) {
            return;
        }
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('login_email_active');
        });
    }
};
