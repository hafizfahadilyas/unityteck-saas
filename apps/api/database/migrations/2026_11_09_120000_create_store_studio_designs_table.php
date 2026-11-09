<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_studio_designs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('editor_type', 32)->index(); // banner | logo | product_card
            $table->string('category', 32)->default('banner');
            $table->string('title', 255);
            $table->unsignedSmallInteger('width')->default(1080);
            $table->unsignedSmallInteger('height')->default(1080);
            $table->longText('design_json');
            $table->string('preview_media_id', 64)->nullable();
            $table->string('source', 16)->default('studio');
            $table->timestamps();

            $table->index(['store_id', 'editor_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_studio_designs');
    }
};
