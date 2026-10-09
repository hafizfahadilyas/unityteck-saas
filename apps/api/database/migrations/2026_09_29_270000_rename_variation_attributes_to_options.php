<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rename product_variations.attributes → options (Eloquent reserves $attributes).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_variations')) {
            return;
        }

        $hasAttrs = Schema::hasColumn('product_variations', 'attributes');
        $hasOptions = Schema::hasColumn('product_variations', 'options');

        if ($hasAttrs && ! $hasOptions) {
            Schema::table('product_variations', function (Blueprint $table) {
                $table->json('options')->nullable()->after('sku');
            });

            $rows = DB::table('product_variations')->get();
            foreach ($rows as $row) {
                $raw = $row->attributes ?? null;
                DB::table('product_variations')
                    ->where('id', $row->id)
                    ->update(['options' => $raw]);
            }

            Schema::table('product_variations', function (Blueprint $table) {
                $table->dropColumn('attributes');
            });
        } elseif (! $hasOptions) {
            Schema::table('product_variations', function (Blueprint $table) {
                $table->json('options')->nullable()->after('sku');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('product_variations')) {
            return;
        }

        if (Schema::hasColumn('product_variations', 'options')
            && ! Schema::hasColumn('product_variations', 'attributes')) {
            Schema::table('product_variations', function (Blueprint $table) {
                $table->json('attributes')->nullable()->after('sku');
            });

            $rows = DB::table('product_variations')->get();
            foreach ($rows as $row) {
                DB::table('product_variations')
                    ->where('id', $row->id)
                    ->update(['attributes' => $row->options ?? null]);
            }

            Schema::table('product_variations', function (Blueprint $table) {
                $table->dropColumn('options');
            });
        }
    }
};
