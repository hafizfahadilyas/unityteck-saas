<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('themes_catalog', function (Blueprint $table) {
            if (! Schema::hasColumn('themes_catalog', 'tier')) {
                $table->string('tier', 16)->default('basic')->after('category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('themes_catalog', function (Blueprint $table) {
            if (Schema::hasColumn('themes_catalog', 'tier')) {
                $table->dropColumn('tier');
            }
        });
    }
};
