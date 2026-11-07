<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Expand own-delivery riders + shipping methods for KSA dynamic rates:
 * fixed / per-kg / per-km, service areas, payment options (COD / online / bank).
 * All columns are store-scoped via parent tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('delivery_drivers')) {
            Schema::table('delivery_drivers', function (Blueprint $table) {
                if (! Schema::hasColumn('delivery_drivers', 'base_location')) {
                    $table->string('base_location', 191)->nullable()->after('city');
                }
                if (! Schema::hasColumn('delivery_drivers', 'service_areas')) {
                    $table->json('service_areas')->nullable()->after('base_location');
                }
                if (! Schema::hasColumn('delivery_drivers', 'rate_mode')) {
                    $table->string('rate_mode', 32)->default('fixed')->after('service_areas');
                }
                if (! Schema::hasColumn('delivery_drivers', 'fixed_rate')) {
                    $table->decimal('fixed_rate', 10, 2)->default(0)->after('rate_mode');
                }
                if (! Schema::hasColumn('delivery_drivers', 'per_kg_rate')) {
                    $table->decimal('per_kg_rate', 10, 2)->default(0)->after('fixed_rate');
                }
                if (! Schema::hasColumn('delivery_drivers', 'per_km_rate')) {
                    $table->decimal('per_km_rate', 10, 2)->default(0)->after('per_kg_rate');
                }
                if (! Schema::hasColumn('delivery_drivers', 'same_day')) {
                    $table->boolean('same_day')->default(false)->after('per_km_rate');
                }
                if (! Schema::hasColumn('delivery_drivers', 'eta_text')) {
                    $table->string('eta_text', 100)->nullable()->after('same_day');
                }
                if (! Schema::hasColumn('delivery_drivers', 'payment_options')) {
                    $table->json('payment_options')->nullable()->after('eta_text');
                }
            });
        }

        if (Schema::hasTable('shipping_methods')) {
            Schema::table('shipping_methods', function (Blueprint $table) {
                if (! Schema::hasColumn('shipping_methods', 'per_km_rate')) {
                    $table->decimal('per_km_rate', 10, 2)->default(0)->after('per_kg_rate');
                }
                if (! Schema::hasColumn('shipping_methods', 'allow_online')) {
                    $table->boolean('allow_online')->default(true)->after('is_cod_allowed');
                }
                if (! Schema::hasColumn('shipping_methods', 'allow_bank_transfer')) {
                    $table->boolean('allow_bank_transfer')->default(false)->after('allow_online');
                }
                if (! Schema::hasColumn('shipping_methods', 'payment_options')) {
                    $table->json('payment_options')->nullable()->after('allow_bank_transfer');
                }
                if (! Schema::hasColumn('shipping_methods', 'eta_type')) {
                    $table->string('eta_type', 32)->default('days')->after('estimated_delivery');
                }
                if (! Schema::hasColumn('shipping_methods', 'eta_value')) {
                    $table->unsignedInteger('eta_value')->nullable()->after('eta_type');
                }
                if (! Schema::hasColumn('shipping_methods', 'tracking_enabled')) {
                    $table->boolean('tracking_enabled')->default(true)->after('eta_value');
                }
            });
        }

        if (Schema::hasTable('shipping_zones')) {
            Schema::table('shipping_zones', function (Blueprint $table) {
                if (! Schema::hasColumn('shipping_zones', 'rate_mode')) {
                    $table->string('rate_mode', 32)->default('fixed')->after('rate');
                }
                if (! Schema::hasColumn('shipping_zones', 'per_km_rate')) {
                    $table->decimal('per_km_rate', 10, 2)->default(0)->after('rate_per_kg');
                }
                if (! Schema::hasColumn('shipping_zones', 'same_day')) {
                    $table->boolean('same_day')->default(false)->after('estimated_delivery');
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (! Schema::hasColumn('products', 'allow_own_delivery')) {
                    $table->boolean('allow_own_delivery')->default(true)->after('requires_own_driver');
                }
                if (! Schema::hasColumn('products', 'allow_shipping_company')) {
                    $table->boolean('allow_shipping_company')->default(true)->after('allow_own_delivery');
                }
                if (! Schema::hasColumn('products', 'shipping_rate_mode')) {
                    $table->string('shipping_rate_mode', 32)->nullable()->after('allow_shipping_company');
                }
                if (! Schema::hasColumn('products', 'shipping_per_kg_rate')) {
                    $table->decimal('shipping_per_kg_rate', 10, 2)->nullable()->after('shipping_rate_mode');
                }
                if (! Schema::hasColumn('products', 'shipping_per_km_rate')) {
                    $table->decimal('shipping_per_km_rate', 10, 2)->nullable()->after('shipping_per_kg_rate');
                }
                if (! Schema::hasColumn('products', 'shipping_payment_options')) {
                    $table->json('shipping_payment_options')->nullable()->after('shipping_per_km_rate');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                foreach ([
                    'allow_own_delivery',
                    'allow_shipping_company',
                    'shipping_rate_mode',
                    'shipping_per_kg_rate',
                    'shipping_per_km_rate',
                    'shipping_payment_options',
                ] as $col) {
                    if (Schema::hasColumn('products', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('shipping_zones')) {
            Schema::table('shipping_zones', function (Blueprint $table) {
                foreach (['rate_mode', 'per_km_rate', 'same_day'] as $col) {
                    if (Schema::hasColumn('shipping_zones', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('shipping_methods')) {
            Schema::table('shipping_methods', function (Blueprint $table) {
                foreach ([
                    'per_km_rate',
                    'allow_online',
                    'allow_bank_transfer',
                    'payment_options',
                    'eta_type',
                    'eta_value',
                    'tracking_enabled',
                ] as $col) {
                    if (Schema::hasColumn('shipping_methods', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('delivery_drivers')) {
            Schema::table('delivery_drivers', function (Blueprint $table) {
                foreach ([
                    'base_location',
                    'service_areas',
                    'rate_mode',
                    'fixed_rate',
                    'per_kg_rate',
                    'per_km_rate',
                    'same_day',
                    'eta_text',
                    'payment_options',
                ] as $col) {
                    if (Schema::hasColumn('delivery_drivers', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
