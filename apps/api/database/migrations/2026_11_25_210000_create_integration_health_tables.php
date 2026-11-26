<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_health_checks', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('category', 32); // payment | shipping
            $table->string('provider', 64);
            $table->string('connection_status', 64)->default('not_configured');
            $table->string('auth_status', 64)->default('not_configured');
            $table->string('api_health_status', 64)->default('not_configured');
            $table->string('sandbox_status', 64)->default('not_configured');
            $table->string('production_verification_status', 64)->default('not_tested');
            $table->string('webhook_status', 64)->default('not_configured');
            $table->timestamp('last_successful_test_at')->nullable();
            $table->timestamp('last_failed_test_at')->nullable();
            $table->unsignedInteger('api_response_time_ms')->nullable();
            $table->text('last_error_message')->nullable();
            $table->string('integration_version', 64)->nullable();
            $table->json('supported_features')->nullable();
            $table->string('environment', 32)->nullable(); // sandbox | production
            $table->string('overall_status', 64)->default('not_configured');
            $table->timestamps();

            $table->unique(['store_id', 'category', 'provider'], 'ihc_store_cat_provider_uq');
        });

        Schema::create('integration_health_logs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('category', 32)->index();
            $table->string('provider', 64)->index();
            $table->string('test_type', 64)->nullable();
            $table->string('environment', 32)->nullable();
            $table->timestamp('request_at')->nullable();
            $table->timestamp('response_at')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->string('api_endpoint', 512)->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->string('error_code', 64)->nullable();
            $table->text('error_message_sanitized')->nullable();
            $table->string('transaction_id', 128)->nullable()->index();
            $table->string('shipment_id', 128)->nullable()->index();
            $table->boolean('success')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'provider', 'created_at'], 'ihl_store_provider_created_idx');
        });

        Schema::create('integration_webhook_events', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('category', 32); // payment | shipping
            $table->string('provider', 64);
            $table->string('event_id', 191);
            $table->string('event_type', 128)->nullable();
            $table->boolean('signature_ok')->nullable();
            $table->string('status', 64)->default('received'); // received | processed | duplicate | rejected
            $table->string('transaction_id', 128)->nullable();
            $table->string('shipment_id', 128)->nullable();
            $table->json('payload_sanitized')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'provider', 'event_id'], 'iwe_store_provider_event_uq');
        });

        Schema::create('bank_transfer_proofs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64)->index();
            $table->string('order_id', 64)->nullable()->index();
            $table->string('transaction_id', 64)->nullable()->index();
            $table->string('media_path', 512);
            $table->string('media_url', 1024)->nullable();
            $table->string('status', 32)->default('pending'); // pending | approved | rejected
            $table->string('reviewed_by', 191)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->json('audit_trail')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status'], 'btp_store_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transfer_proofs');
        Schema::dropIfExists('integration_webhook_events');
        Schema::dropIfExists('integration_health_logs');
        Schema::dropIfExists('integration_health_checks');
    }
};
