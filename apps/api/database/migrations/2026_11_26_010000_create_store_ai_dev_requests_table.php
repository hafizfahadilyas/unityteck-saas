<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — merchant support requests for AI developer diagnostics.
 * Merchants never edit platform source; Master runs read-only diagnose only.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('store_ai_dev_requests')) {
            return;
        }

        Schema::create('store_ai_dev_requests', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('status', 32)->default('open')->index(); // open|diagnosing|awaiting_review|closed|rejected
            $table->string('severity', 32)->default('medium'); // low|medium|high
            $table->string('category', 64)->default('general'); // frontend|api|database|integration|other
            $table->string('title', 191);
            $table->text('description');
            $table->string('requested_by_user_id', 64)->nullable();
            $table->string('assigned_master_user_id', 64)->nullable();
            $table->json('symptoms')->nullable();
            $table->json('diagnosis')->nullable(); // read-only report — never auto-deploy
            $table->text('master_notes')->nullable();
            $table->boolean('auto_deploy_allowed')->default(false); // always false in app layer
            $table->timestamp('diagnosed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_ai_dev_requests');
    }
};
