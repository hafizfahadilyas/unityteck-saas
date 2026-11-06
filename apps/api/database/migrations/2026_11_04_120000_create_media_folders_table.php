<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_folders', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('name', 191);
            $table->string('slug', 64);
            $table->string('parent_id', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['store_id', 'slug']);
            $table->index(['store_id', 'parent_id']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('media_folders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_folders');
    }
};
