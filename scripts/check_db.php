<?php
require 'apps/api/vendor/autoload.php';
$app = require_once 'apps/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Default DB: " . config('database.default') . "\n";
echo "DB Host: " . config('database.connections.mysql.host') . "\n";
echo "DB Name: " . config('database.connections.mysql.database') . "\n";

$stores = App\Models\Store::all(['id', 'name', 'slug']);
echo "Total stores: " . $stores->count() . "\n";
foreach ($stores as $s) {
    $msgCount = App\Models\WhatsAppMessage::where('store_id', $s->id)->count();
    $custCount = App\Models\Customer::where('store_id', $s->id)->count();
    echo "- Store ID: {$s->id} | Name: {$s->name} | Messages: {$msgCount} | Customers: {$custCount}\n";
}
