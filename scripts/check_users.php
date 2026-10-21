<?php
require 'apps/api/vendor/autoload.php';
$app = require_once 'apps/api/bootstrap/app.php';
$k = $app->make(Illuminate\Contracts\Console\Kernel::class);
$k->bootstrap();

echo "=== STORES ===\n";
foreach(App\Models\Store::all() as $s) {
    echo "ID: {$s->id} | Name: {$s->name} | Slug: {$s->slug} | Email: {$s->email} | Phone: {$s->phone}\n";
}

echo "\n=== USERS ===\n";
foreach(App\Models\User::all() as $u) {
    echo "User ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role}\n";
}
