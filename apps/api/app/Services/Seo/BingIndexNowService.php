<?php

namespace App\Services\Seo;

use App\Models\SeoIntegration;
use App\Models\Store;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BingIndexNowService
{
    public const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

    /**
     * Get or create the unique IndexNow key for this merchant.
     */
    public function getOrCreateIndexNowKey(Store $store): string
    {
        $integration = SeoIntegration::firstOrNew([
            'store_id' => $store->id,
            'provider' => 'indexnow',
        ]);

        if (!$integration->exists || empty($integration->indexnow_key)) {
            $integration->id = 'integ-'.Str::lower(Str::random(10));
            $integration->store_id = $store->id;
            $integration->provider = 'indexnow';
            $integration->indexnow_key = Str::lower(Str::random(32));
            $integration->is_connected = true;
            $integration->save();
        }

        return $integration->indexnow_key;
    }

    /**
     * Submit single or multiple updated URLs to IndexNow (Bing, Yandex, Seznam).
     */
    public function submitUrls(Store $store, array $urlList): array
    {
        if (empty($urlList)) {
            return ['success' => false, 'message' => 'No URLs provided for submission.'];
        }

        $key = $this->getOrCreateIndexNowKey($store);
        $host = (string) ($store->custom_domain ?: $store->domain ?: "{$store->slug}.mieraf-ksa.com");
        $host = preg_replace('#^https?://#i', '', rtrim($host, '/'));

        $payload = [
            'host' => $host,
            'key' => $key,
            'keyLocation' => "https://{$host}/{$key}.txt",
            'urlList' => array_values($urlList),
        ];

        try {
            $res = Http::timeout(10)->post(self::INDEXNOW_ENDPOINT, $payload);
            $statusCode = $res->status();

            $integration = SeoIntegration::where('store_id', $store->id)->where('provider', 'indexnow')->first();
            if ($integration) {
                $integration->last_sync_at = now();
                $integration->last_status = ($statusCode === 200 || $statusCode === 202) ? 'submitted' : 'failed';
                $integration->error_details = ($statusCode === 200 || $statusCode === 202) ? null : $res->body();
                $integration->save();
            }

            if ($statusCode === 200 || $statusCode === 202) {
                return [
                    'success' => true,
                    'status_code' => $statusCode,
                    'message' => 'URLs successfully submitted to IndexNow network.',
                    'submitted_count' => count($urlList),
                ];
            }

            return [
                'success' => false,
                'status_code' => $statusCode,
                'message' => 'IndexNow API returned non-success response: ' . $res->body(),
            ];
        } catch (\Throwable $e) {
            Log::warning("IndexNow submission exception: {$e->getMessage()}");
            return [
                'success' => false,
                'message' => 'Could not connect to IndexNow endpoint: ' . $e->getMessage(),
            ];
        }
    }
}
