<?php

namespace App\Console\Commands;

use App\Models\StoreGoogleIntegration;
use App\Services\GoogleAdsService;
use Illuminate\Console\Command;

/**
 * Hostinger cron via schedule:run → google:sync-ads every 30 minutes.
 * Syncs only stores with google_ads_customer_id (isolated per store_id).
 */
class SyncGoogleAdsSnapshots extends Command
{
    protected $signature = 'google:sync-ads {--limit=50}';

    protected $description = 'Sync Google Ads snapshots (campaigns, cost, ROAS) per connected store';

    public function handle(GoogleAdsService $ads): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $rows = StoreGoogleIntegration::query()
            ->where('is_connected', true)
            ->whereNotNull('google_ads_customer_id')
            ->where('google_ads_customer_id', '!=', '')
            ->orderBy('last_synced_at')
            ->limit($limit)
            ->get();

        $ok = 0;
        $fail = 0;
        foreach ($rows as $integration) {
            $result = $ads->syncIntegrationSnapshot($integration);
            if ($result['ok'] ?? false) {
                $ok++;
                $this->line('OK '.$integration->store_id);
            } else {
                $fail++;
                $this->warn('FAIL '.$integration->store_id.': '.($result['error'] ?? 'unknown'));
            }
        }

        $this->info("Synced ok={$ok} fail={$fail}");

        return self::SUCCESS;
    }
}
