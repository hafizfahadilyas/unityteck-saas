<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2.3 — expand users.role beyond Phase-1 CHECK/ENUM → free VARCHAR + normalize slugs.
 * SQLite: rebuild table (CHECK cannot ALTER). MySQL: MODIFY VARCHAR.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(64) NOT NULL DEFAULT 'support'");
        }

        if ($driver === 'sqlite') {
            $this->rebuildSqliteUsersWithoutRoleCheck();
        }

        $map = [
            'master_admin' => 'super_admin',
            'store_manager' => 'manager',
            'store_staff' => 'support',
            'store_viewer' => 'viewer',
        ];

        foreach ($map as $from => $to) {
            DB::table('users')->where('role', $from)->update(['role' => $to]);
            if (Schema::hasTable('store_users')) {
                DB::table('store_users')->where('role', $from)->update(['role' => $to]);
            }
        }
    }

    private function rebuildSqliteUsersWithoutRoleCheck(): void
    {
        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('users_role_expand_tmp')) {
            Schema::drop('users_role_expand_tmp');
        }

        Schema::create('users_role_expand_tmp', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role', 64)->default('support');
            $table->rememberToken();
            $table->timestamps();
        });

        DB::statement(
            'INSERT INTO users_role_expand_tmp (id, name, email, email_verified_at, password, role, remember_token, created_at, updated_at)
             SELECT id, name, email, email_verified_at, password, role, remember_token, created_at, updated_at FROM users'
        );

        Schema::drop('users');
        Schema::rename('users_role_expand_tmp', 'users');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'master_admin']);
        DB::table('users')->where('role', 'manager')->update(['role' => 'store_manager']);
        DB::table('users')->where('role', 'support')->update(['role' => 'store_staff']);
        DB::table('users')->where('role', 'viewer')->update(['role' => 'store_viewer']);

        if (Schema::hasTable('store_users')) {
            DB::table('store_users')->where('role', 'manager')->update(['role' => 'store_manager']);
            DB::table('store_users')->where('role', 'support')->update(['role' => 'store_staff']);
            DB::table('store_users')->where('role', 'viewer')->update(['role' => 'store_viewer']);
        }
    }
};
