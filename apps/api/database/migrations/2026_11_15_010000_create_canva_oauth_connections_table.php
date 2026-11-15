<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Official Canva Connect OAuth — platform Master testing connection only.
 * Does not touch store design studio / KSA Canva templates.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('canva_oauth_connections')) {
            return;
        }

        Schema::create('canva_oauth_connections', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            /** master | store:{store_id} — Master testing uses "master" */
            $table->string('owner_key', 128)->unique();
            $table->boolean('is_connected')->default(false);
            $table->string('display_name', 191)->nullable();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->text('granted_scopes')->nullable();
            $table->string('last_error', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canva_oauth_connections');
    }
};
