<?php

/**
 * Upsert default Al Rajhi bank account for store-coffee (merchant IBAN letter).
 *
 * Usage: php scripts/seed-coffee-bank-alrajhi.php
 *        php scripts/seed-coffee-bank-alrajhi.php --store-id=store-1
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StoreBankAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$storeId = 'store-coffee';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--store-id=')) {
        $storeId = substr($arg, strlen('--store-id='));
    }
}

$bankName = 'Al Rajhi Bank';
$bankNameAr = 'مصرف الراجحي';
$iban = 'SA1480000158608016194276';
$accountNumber = '158000010006086194276';

$store = DB::table('stores')->where('id', $storeId)->first();
$titleEn = $store->name ?? ($storeId === 'store-coffee' ? 'HiBrew KSA Coffee Store' : 'Store Merchant');
$titleAr = $storeId === 'store-coffee' ? 'متجر هايبرو السعودية للقهوة' : $titleEn;

$existing = StoreBankAccount::query()
    ->withoutGlobalScope('store')
    ->where('store_id', $storeId)
    ->where('iban', $iban)
    ->first();

if ($existing) {
    $existing->update([
        'bank_name' => $bankName,
        'bank_name_ar' => $bankNameAr,
        'account_title' => $titleEn,
        'account_title_ar' => $titleAr,
        'account_number' => $accountNumber,
        'payment_reference_prefix' => $storeId === 'store-coffee' ? 'HIBREW' : strtoupper(substr($storeId, -4)),
        'is_default' => true,
        'is_active' => true,
    ]);
    echo "Updated bank {$existing->id} for {$storeId}\n";
} else {
    StoreBankAccount::query()
        ->withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->update(['is_default' => false]);

    $id = 'bank-'.Str::lower(Str::random(10));
    StoreBankAccount::query()->create([
        'id' => $id,
        'store_id' => $storeId,
        'bank_name' => $bankName,
        'bank_name_ar' => $bankNameAr,
        'account_title' => $titleEn,
        'account_title_ar' => $titleAr,
        'iban' => $iban,
        'account_number' => $accountNumber,
        'payment_reference_prefix' => $storeId === 'store-coffee' ? 'HIBREW' : strtoupper(substr($storeId, -4)),
        'is_default' => true,
        'is_active' => true,
    ]);
    echo "Created bank {$id} for {$storeId}\n";
}

echo "Done.\n";