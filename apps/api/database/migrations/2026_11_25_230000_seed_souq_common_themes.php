<?php

use App\Support\SouqCommonThemes;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        SouqCommonThemes::ensureCatalogRows();
    }

    public function down(): void
    {
        // Keep catalog rows — do not delete themes that may be assigned to stores
    }
};
