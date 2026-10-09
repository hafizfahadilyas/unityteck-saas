<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('hosting_id', 64)->nullable()->after('accent_color');
            $table->string('database_id', 64)->nullable()->after('hosting_id');
            $table->string('ssl_status', 32)->default('pending')->after('database_id');
            $table->string('deployment_status', 32)->default('pending')->after('ssl_status');
            $table->string('subscription_status', 32)->default('active')->after('deployment_status');
            $table->string('demo_domain')->nullable()->after('domain');
            $table->string('custom_domain')->nullable()->after('demo_domain');
            $table->string('hostinger_status', 32)->default('not_connected')->after('custom_domain');
            $table->string('dns_status', 32)->default('unverified')->after('hostinger_status');
        });

        Schema::table('domains', function (Blueprint $table) {
            $table->string('hosting_id', 64)->nullable()->after('registered_date');
            $table->string('database_id', 64)->nullable()->after('hosting_id');
            $table->string('deployment_status', 32)->default('pending')->after('database_id');
            $table->string('hostinger_plan', 64)->nullable()->after('deployment_status');
            $table->string('server_ip', 64)->nullable()->after('hostinger_plan');
            $table->json('dns_records')->nullable()->after('server_ip');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'hosting_id',
                'database_id',
                'ssl_status',
                'deployment_status',
                'subscription_status',
                'demo_domain',
                'custom_domain',
                'hostinger_status',
                'dns_status',
            ]);
        });

        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'hosting_id',
                'database_id',
                'deployment_status',
                'hostinger_plan',
                'server_ip',
                'dns_records',
            ]);
        });
    }
};
