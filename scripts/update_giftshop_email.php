<?php
require 'apps/api/vendor/autoload.php';
$app = require_once 'apps/api/bootstrap/app.php';
$k = $app->make(Illuminate\Contracts\Console\Kernel::class);
$k->bootstrap();

use App\Models\Store;
use App\Models\User;

// 1. Update store-1
$store = Store::find('store-1');
if ($store) {
    $store->email = 'giftshop2030m@gmail.com';
    $store->name = 'متجر هدايا';
    $store->owner_name = 'متجر هدايا';
    $store->phone = '+966 50 442 8819';
    $store->save();
    echo "Updated store-1 successfully!\n";
} else {
    echo "store-1 not found\n";
}

// 2. Update user-store-1
$user = User::find('user-store-1');
if ($user) {
    $user->email = 'giftshop2030m@gmail.com';
    $user->name = 'متجر هدايا';
    $user->save();
    echo "Updated user-store-1 to giftshop2030m@gmail.com successfully!\n";
} else {
    // If user by email exists or need to create
    $user = User::where('email', 'giftshop2030m@gmail.com')->first();
    if ($user) {
        $user->name = 'متجر هدايا';
        $user->save();
        echo "Found and updated existing user giftshop2030m@gmail.com\n";
    }
}

// 3. Ensure tariq@wardalmakkah.sa can also exist or alias
$tariq = User::where('email', 'tariq@wardalmakkah.sa')->first();
if ($tariq && $tariq->id !== 'user-store-1') {
    // keep as alias
}

echo "Done.\n";
