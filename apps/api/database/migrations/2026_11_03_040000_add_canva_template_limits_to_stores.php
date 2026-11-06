<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Step 1 — Canva KSA templates: Master may raise Free unlocks per category per store.
 * null = use plan default (Free/Paid = 5; Pro/Custom = unlimited catalog).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (! Schema::hasColumn('stores', 'canva_templates_per_category')) {
                $table->unsignedSmallInteger('canva_templates_per_category')->nullable()->after('master_granted_pro');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            if (Schema::hasColumn('stores', 'canva_templates_per_category')) {
                $table->dropColumn('canva_templates_per_category');
            }
        });
    }
};
