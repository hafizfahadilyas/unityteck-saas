<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('store_appointments')) {
            return;
        }

        Schema::create('store_appointments', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('customer_name', 160);
            $table->string('customer_phone', 32);
            $table->string('customer_email', 191)->nullable();
            $table->string('service_key', 64);
            $table->string('service_name_en', 191)->nullable();
            $table->string('service_name_ar', 191)->nullable();
            $table->json('additional_services')->nullable();
            $table->string('vehicle_make', 120)->nullable();
            $table->string('vehicle_model', 120)->nullable();
            $table->string('vehicle_year', 16)->nullable();
            $table->date('appointment_date');
            $table->string('appointment_time', 16);
            $table->json('photo_urls')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('pending');
            $table->string('staff_name', 120)->nullable();
            $table->string('staff_id', 64)->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'appointment_date', 'appointment_time'], 'sa_store_slot_idx');
            $table->index(['store_id', 'status', 'created_at'], 'sa_store_status_idx');
            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_appointments');
    }
};
