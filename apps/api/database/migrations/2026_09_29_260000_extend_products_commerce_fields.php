<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('gallery_urls')->nullable()->after('image_version');
            $table->text('video_url')->nullable()->after('gallery_urls');
            $table->json('tags')->nullable()->after('video_url');
            $table->string('seo_title', 255)->nullable()->after('badge');
            $table->text('seo_description')->nullable()->after('seo_title');
            $table->string('seo_keywords', 500)->nullable()->after('seo_description');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'gallery_urls',
                'video_url',
                'tags',
                'seo_title',
                'seo_description',
                'seo_keywords',
            ]);
        });
    }
};
