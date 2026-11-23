<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HiBrew coffee-only: parent grouped product → 3–4 independent child products.
 * Children remain full products rows; this table only stores membership + order.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('product_group_members')) {
            return;
        }

        Schema::create('product_group_members', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('store_id', 64);
            $table->string('parent_product_id', 64);
            $table->string('child_product_id', 64);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->text('selector_image_url')->nullable();
            $table->timestamps();

            $table->unique(
                ['store_id', 'parent_product_id', 'child_product_id'],
                'pgm_store_parent_child_uq'
            );
            $table->unique(['store_id', 'child_product_id'], 'pgm_store_child_uq');
            $table->index(['store_id', 'parent_product_id', 'sort_order'], 'pgm_store_parent_sort_idx');

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('parent_product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->foreign('child_product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_group_members');
    }
};
