<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Coffee login email becomes mieraf.sa8@gmail.com.
 * Car joins the central Hostinger (shared store_id). Flowers stays on its own account.
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $next = 'mieraf.sa8@gmail.com';
        $previous = 'rayan@specialtycoffee.sa';

        if (Schema::hasTable('users')) {
            $taken = DB::table('users')->where('email', $next)->exists();
            if (! $taken) {
                DB::table('users')->where('email', $previous)->update([
                    'email' => $next,
                    'updated_at' => $now,
                ]);
            }
        }

        if (Schema::hasTable('stores')) {
            $store = ['updated_at' => $now];
            if (Schema::hasColumn('stores', 'email')) {
                $store['email'] = $next;
            }
            DB::table('stores')->where('id', 'store-coffee')->update($store);

            $central = ['updated_at' => $now];
            if (Schema::hasColumn('stores', 'hosting_mode')) {
                $central['hosting_mode'] = 'shared';
            }
            if (Schema::hasColumn('stores', 'db_isolation')) {
                $central['db_isolation'] = 'shared_store_id';
            }
            DB::table('stores')->where('id', 'store-bleco')->update($central);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            $taken = DB::table('users')->where('email', 'rayan@specialtycoffee.sa')->exists();
            if (! $taken) {
                DB::table('users')->where('email', 'mieraf.sa8@gmail.com')->update([
                    'email' => 'rayan@specialtycoffee.sa',
                ]);
            }
        }

        if (Schema::hasTable('stores') && Schema::hasColumn('stores', 'email')) {
            DB::table('stores')->where('id', 'store-coffee')->update([
                'email' => 'rayan@specialtycoffee.sa',
            ]);
        }
    }
};
