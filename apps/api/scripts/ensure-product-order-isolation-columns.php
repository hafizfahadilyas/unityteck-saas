<?php

/**
 * One-shot Hostinger: product + order_items isolation/snapshot columns.
 * Usage (from apps/api): php scripts/ensure-product-order-isolation-columns.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

$done = [];

if (Schema::hasTable('products')) {
    Schema::table('products', function (Blueprint $table) use (&$done) {
        if (! Schema::hasColumn('products', 'category_list')) {
            $table->json('category_list')->nullable();
            $done[] = 'products.category_list';
        }
        if (! Schema::hasColumn('products', 'published_at')) {
            $table->timestamp('published_at')->nullable();
            $done[] = 'products.published_at';
        }
    });
}

if (Schema::hasTable('order_items')) {
    Schema::table('order_items', function (Blueprint $table) use (&$done) {
        if (! Schema::hasColumn('order_items', 'sku')) {
            $table->string('sku', 100)->nullable();
            $done[] = 'order_items.sku';
        }
        if (! Schema::hasColumn('order_items', 'brand')) {
            $table->string('brand', 191)->nullable();
            $done[] = 'order_items.brand';
        }
        if (! Schema::hasColumn('order_items', 'category')) {
            $table->string('category', 191)->nullable();
            $done[] = 'order_items.category';
        }
        if (! Schema::hasColumn('order_items', 'image_url')) {
            $table->text('image_url')->nullable();
            $done[] = 'order_items.image_url';
        }
    });
}

if ($done === []) {
    echo "OK: all product/order isolation columns already present\n";
    exit(0);
}

echo 'OK: added '.implode(', ', $done)."\n";
