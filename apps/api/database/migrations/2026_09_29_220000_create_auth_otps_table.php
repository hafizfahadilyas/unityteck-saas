<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Phase 2.2 — email/OTP stubs (delivery later; codes stored hashed). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('portal', 16); // master | store
            $table->string('purpose', 32); // login | reset
            $table->string('code_hash');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'portal', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_otps');
    }
};
