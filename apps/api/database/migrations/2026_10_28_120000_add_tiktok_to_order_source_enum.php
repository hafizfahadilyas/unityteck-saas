<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Persist TikTok (and related) as first-class order sources — no longer collapsed to Direct.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN source ENUM(
                'WhatsApp',
                'Instagram',
                'Google Ads',
                'Facebook',
                'Snapchat',
                'TikTok',
                'Direct',
                'Organic Search',
                'Referral'
            ) NOT NULL DEFAULT 'Direct'");
            return;
        }

        // SQLite / others: enum is often stored as string — no ALTER needed for value acceptance
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::table('orders')->whereIn('source', ['TikTok', 'Organic Search', 'Referral'])->update(['source' => 'Direct']);
            DB::statement("ALTER TABLE orders MODIFY COLUMN source ENUM(
                'WhatsApp',
                'Instagram',
                'Google Ads',
                'Facebook',
                'Snapchat',
                'Direct'
            ) NOT NULL DEFAULT 'Direct'");
        }
    }
};
