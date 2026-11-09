<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Social composer: image | video | text (Facebook text-only + Meta video).
 * image_url holds the media URL for image/video; empty string for text-only posts.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('social_posts')) {
            return;
        }

        Schema::table('social_posts', function (Blueprint $table) {
            if (! Schema::hasColumn('social_posts', 'media_type')) {
                $table->string('media_type', 16)->default('image')->after('media_id');
            }
        });

        // Make image_url nullable for text-only Facebook posts (MySQL-safe, no doctrine/dbal).
        try {
            DB::statement('ALTER TABLE social_posts MODIFY image_url VARCHAR(1024) NULL');
        } catch (\Throwable $e) {
            // Column may already be nullable or engine may differ — non-fatal.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('social_posts')) {
            return;
        }

        Schema::table('social_posts', function (Blueprint $table) {
            if (Schema::hasColumn('social_posts', 'media_type')) {
                $table->dropColumn('media_type');
            }
        });
    }
};
