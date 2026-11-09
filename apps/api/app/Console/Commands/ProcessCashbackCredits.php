<?php

namespace App\Console\Commands;

use App\Services\Cashback\CashbackService;
use Illuminate\Console\Command;

/**
 * Hostinger cron via schedule:run — mature hold-period credits + expire unused cashback.
 */
class ProcessCashbackCredits extends Command
{
    protected $signature = 'cashback:process-credits';

    protected $description = 'Mature pending cashback after hold period and expire unused store-wallet credits';

    public function handle(CashbackService $cashback): int
    {
        if (! $cashback->tablesReady()) {
            $this->warn('Cashback tables missing — run migration / 07_cashback_campaigns.sql');

            return self::SUCCESS;
        }

        $matured = $cashback->matureDueCredits();
        $expired = $cashback->expireDueCredits();
        $this->info("Cashback matured: {$matured}; expired: {$expired}");

        return self::SUCCESS;
    }
}
