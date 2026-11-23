<?php

/**
 * One-shot Hostinger: product_group_members for HiBrew grouped products.
 * Usage (from apps/api): php scripts/ensure-product-group-members-table.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

if (Schema::hasTable('product_group_members')) {
    echo "OK: product_group_members already present\n";
    exit(0);
}

Schema::create('product_group_members', function (Blueprint $table) {
    $table->string('id', 64)->primary();
    $table->string('store_id', 64);
    $table->string('parent_product_id', 64);
    $table->string('child_product_id', 64);
    $table->unsignedSmallInteger('sort_order')->default(0);
    $table->text('selector_image_url')->nullable();
    $table->timestamps();

    $table->unique(['store_id', 'parent_product_id', 'child_product_id'], 'pgm_store_parent_child_uq');
    $table->unique(['store_id', 'child_product_id'], 'pgm_store_child_uq');
    $table->index(['store_id', 'parent_product_id', 'sort_order'], 'pgm_store_parent_sort_idx');

    $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
    $table->foreign('parent_product_id')->references('id')->on('products')->cascadeOnDelete();
    $table->foreign('child_product_id')->references('id')->on('products')->cascadeOnDelete();
});

echo "OK: created product_group_members\n";
