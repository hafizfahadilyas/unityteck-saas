<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('file_name')->nullable();
            $table->string('file_type', 32)->default('image'); // image, video, gif, svg
            $table->string('mime', 128)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('path')->nullable();
            $table->text('url');
            $table->text('optimized_url')->nullable();
            $table->text('webp_url')->nullable();
            $table->text('avif_url')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('poster_url')->nullable();
            $table->string('alt')->nullable();
            $table->text('caption')->nullable();
            $table->string('folder', 64)->default('general');
            $table->string('processing_status', 32)->default('ready');
            $table->string('optimization_status', 32)->default('optimized');
            $table->unsignedInteger('version')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('store_id');
            $table->index(['store_id', 'file_type']);
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });

        Schema::create('media_usage', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('media_id', 64);
            $table->string('store_id', 64);
            $table->string('entity_type', 64);
            $table->string('entity_id', 64);
            $table->timestamps();

            $table->index(['store_id', 'entity_type', 'entity_id']);
            $table->foreign('media_id')->references('id')->on('media')->cascadeOnDelete();
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_usage');
        Schema::dropIfExists('media');
    }
};
