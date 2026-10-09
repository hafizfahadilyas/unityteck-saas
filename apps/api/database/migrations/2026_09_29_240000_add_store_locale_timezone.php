<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Phase 2.5 — store locale / text direction / timezone (currency already exists). */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stores')) {
            return;
        }

        Schema::table('stores', function (Blueprint $table) {
            if (! Schema::hasColumn('stores', 'locale')) {
                $table->string('locale', 8)->default('en')->after('currency');
            }
            if (! Schema::hasColumn('stores', 'text_direction')) {
                $table->string('text_direction', 8)->default('ltr')->after('locale');
            }
            if (! Schema::hasColumn('stores', 'timezone')) {
                $table->string('timezone', 64)->default('Asia/Riyadh')->after('text_direction');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('stores')) {
            return;
        }

        Schema::table('stores', function (Blueprint $table) {
            foreach (['timezone', 'text_direction', 'locale'] as $col) {
                if (Schema::hasColumn('stores', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
