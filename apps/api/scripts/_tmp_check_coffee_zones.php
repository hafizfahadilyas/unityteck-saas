<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ShippingZone;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';
echo 'table='.(Schema::hasTable('shipping_zones') ? 'yes' : 'no').PHP_EOL;
$cols = Schema::hasTable('shipping_zones') ? Schema::getColumnListing('shipping_zones') : [];
echo 'cols='.implode(',', $cols).PHP_EOL;
$rows = DB::table('shipping_zones')->where('store_id', $storeId)->get();
echo 'count='.$rows->count().PHP_EOL;
echo $rows->toJson(JSON_UNESCAPED_UNICODE).PHP_EOL;
