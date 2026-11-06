<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_field_definitions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('category_id', 64)->nullable();
            $table->string('name_en', 191);
            $table->string('name_ar', 191)->nullable();
            $table->string('field_type', 32)->default('text');
            $table->json('options')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['store_id', 'category_id']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_field_definitions');
    }
};
