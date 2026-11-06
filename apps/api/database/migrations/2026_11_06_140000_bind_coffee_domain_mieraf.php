<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Bind store-coffee to the included Hostinger domain.
 * DNS and SSL stay unverified until hPanel actually points the name here.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stores')) {
            return;
        }

        $domain = 'mieraf-ksa.com';
        $storeId = 'store-coffee';
        $now = now();

        $store = [];
        foreach ([
            'domain' => $domain,
            'demo_domain' => $domain,
            'custom_domain' => $domain,
            'ssl_status' => 'pending',
            'deployment_status' => 'pending',
            'hostinger_status' => 'provisioning',
            'dns_status' => 'pending',
        ] as $column => $value) {
            if (Schema::hasColumn('stores', $column)) {
                $store[$column] = $value;
            }
        }
        if (Schema::hasColumn('stores', 'updated_at')) {
            $store['updated_at'] = $now;
        }
        if ($store !== []) {
            DB::table('stores')->where('id', $storeId)->update($store);
        }

        if (! Schema::hasTable('domains')) {
            return;
        }

        $taken = DB::table('domains')->where('domain_name', $domain)->first();
        $existing = DB::table('domains')->where('store_id', $storeId)->orderBy('is_primary', 'desc')->first();
        if ($taken && (! $existing || $taken->id !== $existing->id)) {
            return;
        }

        $row = [
            'domain_name' => $domain,
            'is_primary' => true,
            'ssl_status' => 'provisioning',
            'dns_configured' => false,
            'dns_verified' => false,
            'hosting_tier' => 'Hostinger Cloud',
            'monthly_fee' => 0,
            'payment_received' => false,
            'status' => 'dns_propagation',
            'nameservers' => json_encode([]),
            'hostinger_plan' => 'Hostinger Cloud',
            'deployment_status' => 'pending',
            'server_ip' => null,
            'dns_records' => json_encode([]),
            'updated_at' => $now,
        ];
        $row = array_filter(
            $row,
            fn ($value, $column) => Schema::hasColumn('domains', $column),
            ARRAY_FILTER_USE_BOTH
        );

        if ($existing) {
            DB::table('domains')->where('id', $existing->id)->update($row);
            return;
        }

        DB::table('domains')->insert(array_merge($row, [
            'id' => 'dom-coffee',
            'store_id' => $storeId,
            'registered_date' => $now->toDateString(),
            'created_at' => $now,
        ]));
    }

    public function down(): void
    {
        if (Schema::hasTable('stores')) {
            DB::table('stores')->where('id', 'store-coffee')->update([
                'domain' => 'specialtycoffee.sa',
                'custom_domain' => 'specialtycoffee.sa',
            ]);
        }

        if (Schema::hasTable('domains')) {
            DB::table('domains')->where('id', 'dom-coffee')->update([
                'domain_name' => 'specialtycoffee.sa',
            ]);
        }
    }
};
