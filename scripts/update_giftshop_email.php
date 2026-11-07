<?php
/**
 * Set gift store (store-1) login email to the active Gmail.
 * Run: php scripts/update_giftshop_email.php
 */
require __DIR__ . '/../apps/api/vendor/autoload.php';
$app = require_once __DIR__ . '/../apps/api/bootstrap/app.php';
$k = $app->make(Illuminate\Contracts\Console\Kernel::class);
$k->bootstrap();

use App\Models\Store;
use App\Models\User;

$NEW_EMAIL = 'p4pakistan098@gmail.com';
$OLD_EMAILS = [
    'giftshop2030m@gmail.com',
    'tariq@wardalmakkah.sa',
    'admin@giftshop-sa.com',
];

$store = Store::find('store-1');
if ($store) {
    $store->email = $NEW_EMAIL;
    $store->save();
    echo "Updated store-1 email → {$NEW_EMAIL}\n";
} else {
    echo "store-1 not found\n";
}

$user = User::find('user-store-1');
if (!$user) {
    foreach ($OLD_EMAILS as $old) {
        $user = User::where('email', $old)->first();
        if ($user) {
            break;
        }
    }
}

if ($user) {
    $conflict = User::where('email', $NEW_EMAIL)->where('id', '!=', $user->id)->first();
    if ($conflict) {
        echo "Conflict: {$NEW_EMAIL} already used by user {$conflict->id}\n";
        exit(1);
    }
    $user->email = $NEW_EMAIL;
    $user->name = $user->name ?: 'متجر هدايا';
    $user->save();
    echo "Updated user {$user->id} email → {$NEW_EMAIL}\n";
} else {
    echo "Gift store user not found (user-store-1 / old emails)\n";
    exit(1);
}

echo "Done.\n";
