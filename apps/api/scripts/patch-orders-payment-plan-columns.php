<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::table('orders', function (Blueprint $table) {
    if (! Schema::hasColumn('orders', 'payment_plan')) {
        $table->string('payment_plan', 32)->nullable()->after('bank_account_id');
    }
    if (! Schema::hasColumn('orders', 'amount_paid')) {
        $table->decimal('amount_paid', 12, 2)->default(0)->after('payment_plan');
    }
    if (! Schema::hasColumn('orders', 'remaining_balance')) {
        $table->decimal('remaining_balance', 12, 2)->nullable()->after('amount_paid');
    }
    if (! Schema::hasColumn('orders', 'estimated_delivery_at')) {
        $table->dateTime('estimated_delivery_at')->nullable()->after('remaining_balance');
    }
});

echo "orders columns patched\n";
