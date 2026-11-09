<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Services\Loyalty\LoyaltyPointsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Hostinger cron: php artisan schedule:run → loyalty:award-birthdays daily.
 * Awards birthday points per store_id only; never cross-tenant.
 */
class AwardLoyaltyBirthdays extends Command
{
    protected $signature = 'loyalty:award-birthdays';

    protected $description = 'Award birthday loyalty points for customers with DOB matching today (Asia/Riyadh)';

    public function handle(LoyaltyPointsService $loyalty): int
    {
        if (! Schema::hasTable('loyalty_point_transactions') || ! Schema::hasColumn('customers', 'dob')) {
            $this->warn('Loyalty birthday tables/columns missing — run migrations.');

            return self::SUCCESS;
        }

        $total = 0;
        foreach (Store::query()->orderBy('id')->pluck('id') as $storeId) {
            $total += $loyalty->awardBirthdaysForStore((string) $storeId);
        }

        $this->info("Birthday loyalty credits issued: {$total}");

        return self::SUCCESS;
    }
}
