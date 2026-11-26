<?php

namespace App\Services\Gemini;

use App\Models\AiCreditTransaction;
use App\Models\AiGenerationHistory;
use App\Models\AiMerchantLimit;
use App\Models\AiModel;
use App\Models\AiProvider;
use App\Models\AiProviderConfiguration;
use App\Models\AiUsageLog;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GeminiSettingsService
{
    public const PROVIDER_ID = 'provider-gemini';
    public const PROVIDER_SLUG = 'gemini';

    /**
     * Get or create the main Gemini provider row.
     */
    public function getOrCreateProvider(): AiProvider
    {
        $provider = AiProvider::find(self::PROVIDER_ID);
        if (! $provider) {
            $provider = AiProvider::create([
                'id' => self::PROVIDER_ID,
                'slug' => self::PROVIDER_SLUG,
                'name' => 'Google Gemini AI',
                'display_name_ar' => 'جوجل جيميني للذكاء الاصطناعي',
                'display_name_en' => 'Google Gemini AI',
                'status' => 'active',
                'is_default' => true,
                'api_endpoint' => 'https://generativelanguage.googleapis.com/v1beta',
                'connection_status' => 'untested',
            ]);
        }

        return $provider;
    }

    /**
     * Get or create configuration.
     */
    public function getOrCreateConfig(): AiProviderConfiguration
    {
        $provider = $this->getOrCreateProvider();
        $config = AiProviderConfiguration::where('provider_id', $provider->id)->first();

        if (! $config) {
            $config = AiProviderConfiguration::create([
                'id' => 'cfg-gemini-'.Str::lower(Str::random(8)),
                'provider_id' => $provider->id,
                'enabled' => true,
                'default_model' => 'gemini-2.5-flash-image',
                'default_text_model' => 'gemini-3.8-flash',
                'default_image_model' => 'gemini-2.5-flash-image',
                'default_language' => 'ar',
                'default_image_quality' => 'balanced',
                'default_aspect_ratio' => '1:1',
                'max_image_resolution' => '2K',
                'default_generation_mode' => 'text_to_image',
                'feature_text_to_image' => true,
                'feature_image_to_image' => true,
                'feature_product_photography' => true,
                'feature_background_replacement' => true,
                'feature_lifestyle_scenes' => true,
                'feature_promotional_banners' => true,
                'feature_social_creatives' => true,
                'feature_product_variations' => true,
                'allowed_aspect_ratios' => ['1:1', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2', '9:16', '16:9', '21:9'],
                'output_format' => 'webp',
                'storage_location' => 'public_disk',
                'compression_quality' => 90,
                'max_upload_size_mb' => 10,
                'all_merchants_enabled' => true,
                'default_daily_image_limit' => 25,
                'default_monthly_image_limit' => 200,
                'default_daily_credit_allowance' => 25,
                'default_monthly_credit_allowance' => 200,
                'max_images_per_request' => 2,
                'monthly_spending_limit_usd' => 100.0,
                'api_timeout_seconds' => 60,
                'retry_enabled' => true,
                'max_retries' => 3,
                'request_concurrency_limit' => 5,
                'rate_limit_per_minute' => 60,
                'provider_fallback_enabled' => true,
                'fallback_model' => 'gemini-3.1-flash-lite-image',
                'failure_alerts_enabled' => true,
                'global_maintenance_mode' => false,
            ]);
        }

        return $config;
    }

    /**
     * Return masked API key for UI security.
     */
    public function getMaskedApiKey(): array
    {
        $raw = trim((string) config('services.gemini.api_key', ''));
        $hasKey = $raw !== '' && $raw !== 'MY_GEMINI_API_KEY';

        if (! $hasKey) {
            return [
                'has_key' => false,
                'masked' => '',
                'preview' => 'Not Configured',
                'length' => 0,
            ];
        }

        $len = strlen($raw);
        $masked = substr($raw, 0, 7) . str_repeat('•', max(8, $len - 11)) . substr($raw, -4);

        return [
            'has_key' => true,
            'masked' => $masked,
            'preview' => substr($raw, 0, 7) . '...' . substr($raw, -4),
            'length' => $len,
        ];
    }

    /**
     * Sync verified official Gemini models into ai_models.
     */
    public function syncOfficialModels(): void
    {
        $provider = $this->getOrCreateProvider();

        $models = [
            [
                'id' => 'gemini-2.5-flash-image',
                'model_id' => 'gemini-2.5-flash-image',
                'name_en' => 'Gemini 2.5 Flash Image',
                'name_ar' => 'جيميني ٢٫٥ فلاش صورة (مستقر)',
                'description_en' => 'Stable official commercial image generation model, fast latency and strong Saudi contextual understanding.',
                'description_ar' => 'نموذج توليد الصور التجاري الرسمي والمستقر، سرعة فائقة ودقة عالية في فهم تفاصيل الأسواق الخليجية.',
                'tier' => 'standard',
                'capabilities' => ['text-to-image', 'product-photography', 'background-replacement', 'lifestyle', 'promotional-banners', 'product-variations'],
                'supports_image_generation' => true,
                'supports_image_editing' => true,
                'input_modalities' => ['text', 'image'],
                'output_modalities' => ['image'],
                'availability_status' => 'available',
                'is_enabled' => true,
                'is_default' => true,
                'priority' => 1,
                'input_token_price_per_1m_usd' => 0.00,
                'output_token_price_per_1m_usd' => 0.00,
                'image_generation_price_usd' => 0.030,
            ],
            [
                'id' => 'gemini-3.1-flash-lite-image',
                'model_id' => 'gemini-3.1-flash-lite-image',
                'name_en' => 'Gemini 3.1 Flash Lite Image',
                'name_ar' => 'جيميني ٣٫١ فلاش لايت (الأسرع)',
                'description_en' => 'Lightweight high-throughput image model designed for social media assets and instant catalog variations.',
                'description_ar' => 'نموذج خفيف وعالي السرعة مخصص لإنتاج منشورات التواصل وتنويعات المنتجات اللحظية.',
                'tier' => 'standard',
                'capabilities' => ['text-to-image', 'social-creatives', 'product-variations'],
                'supports_image_generation' => true,
                'supports_image_editing' => false,
                'input_modalities' => ['text'],
                'output_modalities' => ['image'],
                'availability_status' => 'available',
                'is_enabled' => true,
                'is_default' => false,
                'priority' => 2,
                'input_token_price_per_1m_usd' => 0.00,
                'output_token_price_per_1m_usd' => 0.00,
                'image_generation_price_usd' => 0.025,
            ],
            [
                'id' => 'gemini-3.1-flash-image',
                'model_id' => 'gemini-3.1-flash-image',
                'name_en' => 'Gemini 3.1 Flash Image',
                'name_ar' => 'جيميني ٣٫١ فلاش صورة (متوازن متقدم)',
                'description_en' => 'Next-gen balanced model with fine-grained product texture preservation and Arabic typography positioning.',
                'description_ar' => 'نموذج الجيل القادم المتوازن مع الحفاظ الدقيق على ملمس المنتجات ومواضع الشعارات العربية.',
                'tier' => 'balanced',
                'capabilities' => ['text-to-image', 'image-to-image', 'product-photography', 'lifestyle', 'promotional-banners'],
                'supports_image_generation' => true,
                'supports_image_editing' => true,
                'input_modalities' => ['text', 'image'],
                'output_modalities' => ['image'],
                'availability_status' => 'available',
                'is_enabled' => true,
                'is_default' => false,
                'priority' => 3,
                'input_token_price_per_1m_usd' => 0.00,
                'output_token_price_per_1m_usd' => 0.00,
                'image_generation_price_usd' => 0.035,
            ],
            [
                'id' => 'gemini-3-pro-image',
                'model_id' => 'gemini-3-pro-image',
                'name_en' => 'Gemini 3 Pro Image (Ultra HD)',
                'name_ar' => 'جيميني ٣ برو صورة (أعلى جودة 4K)',
                'description_en' => 'Flagship studio-grade rendering up to 4K resolution, complex multiobject lighting, and hyper-realistic product surfaces.',
                'description_ar' => 'أعلى مستوى استوديو فوتوغرافي بدقة تصل 4K، إضاءة معقدة للمنتجات والمشاهد الفاخرة.',
                'tier' => 'pro',
                'capabilities' => ['text-to-image', 'image-to-image', 'product-photography', 'background-replacement', 'lifestyle', 'promotional-banners', '4K-resolution'],
                'supports_image_generation' => true,
                'supports_image_editing' => true,
                'input_modalities' => ['text', 'image'],
                'output_modalities' => ['image'],
                'availability_status' => 'available',
                'is_enabled' => true,
                'is_default' => false,
                'priority' => 4,
                'input_token_price_per_1m_usd' => 0.00,
                'output_token_price_per_1m_usd' => 0.00,
                'image_generation_price_usd' => 0.060,
            ],
            [
                'id' => 'gemini-3.8-flash',
                'model_id' => 'gemini-3.8-flash',
                'name_en' => 'Gemini 3.8 Flash (Multimodal Text/Vision)',
                'name_ar' => 'جيميني ٣٫٨ فلاش (نصوص ورؤية بصرية)',
                'description_en' => 'Powers prompt optimization, smart Arabic product descriptions, and image analysis.',
                'description_ar' => 'يغذي تحسين الموجهات الذكية، كتابة المحتوى التسويقي للمنتجات وتحليل الصور.',
                'tier' => 'standard',
                'capabilities' => ['prompt-enhancement', 'image-understanding', 'copywriting'],
                'supports_image_generation' => false,
                'supports_image_editing' => false,
                'input_modalities' => ['text', 'image'],
                'output_modalities' => ['text'],
                'availability_status' => 'available',
                'is_enabled' => true,
                'is_default' => false,
                'priority' => 5,
                'input_token_price_per_1m_usd' => 0.075,
                'output_token_price_per_1m_usd' => 0.300,
                'image_generation_price_usd' => 0.00,
            ],
        ];

        foreach ($models as $m) {
            AiModel::updateOrCreate(
                ['provider_id' => $provider->id, 'model_id' => $m['model_id']],
                array_merge($m, ['provider_id' => $provider->id])
            );
        }
    }

    /**
     * Test live Gemini connection using the real API key.
     */
    public function testConnection(): array
    {
        $provider = $this->getOrCreateProvider();
        $apiKey = trim((string) config('services.gemini.api_key', ''));

        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            $provider->connection_status = 'failed';
            $provider->last_connection_error = 'Google Gemini API Key is missing. Set GEMINI_API_KEY in backend configuration.';
            $provider->last_connection_test_at = now();
            $provider->save();

            return [
                'ok' => false,
                'status' => 'disconnected',
                'message' => 'API Key is missing or invalid.',
                'tested_at' => now()->toIso8601String(),
                'latency_ms' => 0,
                'models_count' => 0,
            ];
        }

        $endpoint = rtrim($provider->api_endpoint ?: 'https://generativelanguage.googleapis.com/v1beta', '/');
        $url = "{$endpoint}/models?key=" . rawurlencode($apiKey);

        $start = microtime(true);
        try {
            $curlOpts = [
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_IPRESOLVE => defined('CURL_IPRESOLVE_V4') ? CURL_IPRESOLVE_V4 : 1,
            ];

            $http = Http::timeout(15)
                ->withoutVerifying()
                ->withOptions(['curl' => $curlOpts])
                ->acceptJson();

            $response = $http->get($url);

            $latencyMs = (int) round((microtime(true) - $start) * 1000);

            if ($response->successful()) {
                $modelsData = $response->json('models') ?? [];
                $count = is_array($modelsData) ? count($modelsData) : 0;

                $provider->connection_status = 'connected';
                $provider->last_connection_test_at = now();
                $provider->last_connection_error = null;
                $provider->save();

                // Log successful connection ping
                AiUsageLog::create([
                    'id' => 'log-ping-'.Str::lower(Str::random(10)),
                    'request_id' => 'ping-'.Str::random(8),
                    'provider_id' => $provider->id,
                    'model_id' => 'api-probe',
                    'endpoint' => '/models',
                    'response_time_ms' => $latencyMs,
                    'http_status' => $response->status(),
                    'status' => 'success',
                    'created_at' => now(),
                ]);

                return [
                    'ok' => true,
                    'status' => 'connected',
                    'message' => 'Connection verified successfully with Google Generative Language API.',
                    'latency_ms' => $latencyMs,
                    'tested_at' => $provider->last_connection_test_at->toIso8601String(),
                    'models_count' => $count,
                    'api_version' => 'v1beta',
                ];
            }

            $errMsg = $response->json('error.message') ?: 'HTTP '.$response->status().' '.$response->body();
            $provider->connection_status = 'failed';
            $provider->last_connection_test_at = now();
            $provider->last_connection_error = mb_substr($errMsg, 0, 400);
            $provider->save();

            return [
                'ok' => false,
                'status' => 'failed',
                'message' => $errMsg,
                'latency_ms' => $latencyMs,
                'tested_at' => $provider->last_connection_test_at->toIso8601String(),
                'http_status' => $response->status(),
            ];
        } catch (\Throwable $e) {
            $latencyMs = (int) round((microtime(true) - $start) * 1000);
            $provider->connection_status = 'failed';
            $provider->last_connection_test_at = now();
            $provider->last_connection_error = mb_substr($e->getMessage(), 0, 400);
            $provider->save();

            return [
                'ok' => false,
                'status' => 'failed',
                'message' => 'Connection timeout or network failure: '.$e->getMessage(),
                'latency_ms' => $latencyMs,
                'tested_at' => $provider->last_connection_test_at->toIso8601String(),
            ];
        }
    }

    /**
     * Get or create merchant limit for a specific store.
     */
    public function getOrCreateMerchantLimit(Store $store): AiMerchantLimit
    {
        $limit = AiMerchantLimit::where('store_id', $store->id)
            ->where('provider_id', self::PROVIDER_ID)
            ->first();

        if (! $limit) {
            $cfg = $this->getOrCreateConfig();
            $limit = AiMerchantLimit::create([
                'id' => 'lim-'.Str::lower(Str::random(10)),
                'store_id' => $store->id,
                'merchant_id' => $store->user_id ?? $store->owner_id ?? null,
                'provider_id' => self::PROVIDER_ID,
                'ai_enabled' => (bool) $cfg->all_merchants_enabled,
                'is_paused' => false,
                'plan_code' => $store->subscription_plan_code ?? 'standard',
                'daily_image_limit' => $cfg->default_daily_image_limit,
                'monthly_image_limit' => $cfg->default_monthly_image_limit,
                'daily_credits_allowance' => $cfg->default_daily_credit_allowance,
                'monthly_credits_allowance' => $cfg->default_monthly_credit_allowance,
                'remaining_credits' => $cfg->default_monthly_credit_allowance,
                'max_images_per_request' => $cfg->max_images_per_request,
            ]);
        }

        return $limit;
    }

    /**
     * Adjust credits manually with transaction log.
     */
    public function adjustMerchantCredits(Store $store, int $amount, string $reason, ?string $adminUserId = null): AiMerchantLimit
    {
        $limit = $this->getOrCreateMerchantLimit($store);
        $oldBalance = $limit->remaining_credits;
        $newBalance = max(0, $oldBalance + $amount);

        $limit->remaining_credits = $newBalance;
        $limit->save();

        AiCreditTransaction::create([
            'id' => 'tx-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'merchant_id' => $limit->merchant_id,
            'provider_id' => self::PROVIDER_ID,
            'transaction_type' => $amount >= 0 ? 'grant' : 'adjustment',
            'amount' => $amount,
            'balance_after' => $newBalance,
            'reason' => $reason,
            'created_by_user_id' => $adminUserId,
            'created_at' => now(),
        ]);

        return $limit;
    }

    /**
     * Compute real analytics from actual database tables.
     */
    public function getAnalytics(array $filters = []): array
    {
        $queryLogs = AiUsageLog::query()->where('provider_id', self::PROVIDER_ID);
        $queryHistory = AiGenerationHistory::query()->where('provider_id', self::PROVIDER_ID);

        // Date filter
        $period = $filters['period'] ?? '30d';
        $now = Carbon::now();
        $startDate = match ($period) {
            'today' => $now->copy()->startOfDay(),
            '7d' => $now->copy()->subDays(7)->startOfDay(),
            '30d' => $now->copy()->subDays(30)->startOfDay(),
            'custom' => ! empty($filters['start_date']) ? Carbon::parse($filters['start_date']) : $now->copy()->subDays(30),
            default => $now->copy()->subDays(30)->startOfDay(),
        };

        if ($startDate) {
            $queryLogs->where('created_at', '>=', $startDate);
            $queryHistory->where('created_at', '>=', $startDate);
        }

        if (! empty($filters['end_date'])) {
            $endDate = Carbon::parse($filters['end_date'])->endOfDay();
            $queryLogs->where('created_at', '<=', $endDate);
            $queryHistory->where('created_at', '<=', $endDate);
        }

        if (! empty($filters['store_id'])) {
            $queryLogs->where('store_id', $filters['store_id']);
            $queryHistory->where('store_id', $filters['store_id']);
        }

        if (! empty($filters['model_id'])) {
            $queryLogs->where('model_id', $filters['model_id']);
            $queryHistory->where('model_id', $filters['model_id']);
        }

        // Real counts
        $totalImages = (clone $queryHistory)->where('status', 'success')->count();
        $totalRequests = (clone $queryLogs)->count();
        $successfulRequests = (clone $queryLogs)->where('status', 'success')->count();
        $failedRequests = (clone $queryLogs)->where('status', '!=', 'success')->count();
        $totalInputTokens = (int) (clone $queryLogs)->sum('input_tokens');
        $totalOutputTokens = (int) (clone $queryLogs)->sum('output_tokens');
        $estimatedCost = (float) (clone $queryLogs)->sum('cost_usd');

        // Monthly count (current month)
        $monthStart = $now->copy()->startOfMonth();
        $monthlyImages = AiGenerationHistory::where('provider_id', self::PROVIDER_ID)
            ->where('created_at', '>=', $monthStart)
            ->where('status', 'success')
            ->count();

        // Daily series for chart (last 14 days or days in range)
        $dailySeries = [];
        $daysCount = min(30, max(7, (int) $now->diffInDays($startDate ?: $now->copy()->subDays(14))));
        for ($i = $daysCount - 1; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $dateStr = $day->format('Y-m-d');
            $dayStart = $day->copy()->startOfDay();
            $dayEnd = $day->copy()->endOfDay();

            $imagesOnDay = AiGenerationHistory::where('provider_id', self::PROVIDER_ID)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->where('status', 'success')
                ->count();

            $reqsOnDay = AiUsageLog::where('provider_id', self::PROVIDER_ID)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dailySeries[] = [
                'date' => $dateStr,
                'label' => $day->format('M d'),
                'images' => $imagesOnDay,
                'requests' => $reqsOnDay,
            ];
        }

        // Model usage breakdown
        $modelBreakdown = AiGenerationHistory::query()
            ->where('provider_id', self::PROVIDER_ID)
            ->select('model_id', DB::raw('count(*) as total'))
            ->groupBy('model_id')
            ->get()
            ->map(fn ($r) => ['model' => $r->model_id, 'count' => (int) $r->total])
            ->toArray();

        return [
            'cards' => [
                'total_generated_images' => $totalImages,
                'total_api_requests' => $totalRequests,
                'successful_requests' => $successfulRequests,
                'failed_requests' => $failedRequests,
                'total_input_tokens' => $totalInputTokens,
                'total_output_tokens' => $totalOutputTokens,
                'estimated_api_cost_usd' => round($estimatedCost, 4),
                'monthly_usage' => $monthlyImages,
            ],
            'chart_daily' => $dailySeries,
            'model_breakdown' => $modelBreakdown,
            'filter_applied' => [
                'period' => $period,
                'store_id' => $filters['store_id'] ?? null,
                'model_id' => $filters['model_id'] ?? null,
            ],
        ];
    }
}
