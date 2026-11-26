<?php

namespace App\Services\OpenAi;

use App\Models\Media;
use App\Models\Store;
use App\Models\StoreOpenAiImageConfig;
use App\Models\StoreOpenAiImageEvent;
use App\Models\StoreOpenAiImageUsage;
use App\Support\Plans;
use App\Support\StoreAiSuiteAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Master-owned OpenAI image generation — isolated per store_id.
 * Default: 50 successful images / month, no daily cap. Separate from Gemini.
 */
final class OpenAiImageService
{
    public function __construct(
        private readonly OpenAiConfigService $configs,
        private readonly OpenAiCostService $costs,
    ) {}

    public function periodKey(?\DateTimeInterface $now = null): string
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $dt = $now
            ? \DateTimeImmutable::createFromInterface($now)->setTimezone($tz)
            : new \DateTimeImmutable('now', $tz);

        return $dt->format('Y-m');
    }

    public function forStore(Store $store): StoreOpenAiImageConfig
    {
        $row = StoreOpenAiImageConfig::query()->where('store_id', $store->id)->first();
        if ($row) {
            return $row;
        }

        return StoreOpenAiImageConfig::query()->create([
            'id' => 'oaic-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'enabled' => false,
            'default_model' => (string) config('services.openai.image_model', 'gpt-image-2.6-flare'),
            'default_quality' => (string) config('services.openai.default_image_quality', 'medium'),
            'monthly_image_quota' => 50,
            'payment_required_for_usage' => true,
            'usage_unlocked' => false,
            'payment_status' => 'unpaid',
            'config_status' => 'draft',
        ]);
    }

    public function usageRow(Store $store): StoreOpenAiImageUsage
    {
        $key = $this->periodKey();
        $row = StoreOpenAiImageUsage::query()
            ->where('store_id', $store->id)
            ->where('period_key', $key)
            ->first();
        if ($row) {
            return $row;
        }

        return StoreOpenAiImageUsage::query()->create([
            'id' => 'oaiu-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'period_key' => $key,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(Store $store, StoreOpenAiImageConfig $cfg): array
    {
        $usage = $this->usageRow($store);

        return [
            'store_id' => $store->id,
            'store_name' => $store->name,
            'store_plan' => Plans::effectiveCode($store),
            'pro_eligible' => $this->configs->storeIsProEligible($store),
            'enabled' => (bool) $cfg->enabled,
            'default_model' => $cfg->default_model,
            'default_quality' => $cfg->default_quality,
            'monthly_image_quota' => (int) $cfg->monthly_image_quota,
            'daily_quota' => null, // intentionally none
            'monthly_budget_usd' => (float) $cfg->monthly_budget_usd,
            'max_cost_per_image_usd' => (float) $cfg->max_cost_per_image_usd,
            'warning_threshold_pct' => (int) $cfg->warning_threshold_pct,
            'auto_stop_at_quota' => (bool) $cfg->auto_stop_at_quota,
            'payment_required_for_usage' => (bool) $cfg->payment_required_for_usage,
            'usage_unlocked' => (bool) $cfg->usage_unlocked,
            'payment_status' => $cfg->payment_status,
            'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
            'config_status' => $cfg->config_status,
            'usage' => [
                'period_key' => $usage->period_key,
                'images_success' => (int) $usage->images_success,
                'images_failed' => (int) $usage->images_failed,
                'images_remaining' => max(0, (int) $cfg->monthly_image_quota - (int) $usage->images_success),
                'cost_usd' => (float) $usage->cost_usd,
                'hard_stopped' => (bool) $usage->hard_stopped,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Store $store, array $payload, ?string $actorId): StoreOpenAiImageConfig
    {
        $cfg = $this->forStore($store);
        $before = $cfg->toArray();
        if (StoreAiSuiteAccess::shouldRelockForLimitRaise($before, $payload, [
            'monthly_image_quota',
            'monthly_budget_usd',
            'max_cost_per_image_usd',
        ])) {
            $payload = StoreAiSuiteAccess::applyRelockPayload($payload);
        }
        $cfg->fill([
            'enabled' => array_key_exists('enabled', $payload) ? (bool) $payload['enabled'] : $cfg->enabled,
            'default_model' => (string) ($payload['default_model'] ?? $cfg->default_model),
            'default_quality' => in_array($payload['default_quality'] ?? $cfg->default_quality, ['low', 'medium', 'high'], true)
                ? (string) ($payload['default_quality'] ?? $cfg->default_quality)
                : 'medium',
            'monthly_image_quota' => (int) ($payload['monthly_image_quota'] ?? $cfg->monthly_image_quota),
            'monthly_budget_usd' => (float) ($payload['monthly_budget_usd'] ?? $cfg->monthly_budget_usd),
            'max_cost_per_image_usd' => (float) ($payload['max_cost_per_image_usd'] ?? $cfg->max_cost_per_image_usd),
            'warning_threshold_pct' => in_array((int) ($payload['warning_threshold_pct'] ?? $cfg->warning_threshold_pct), [50, 80, 90], true)
                ? (int) ($payload['warning_threshold_pct'] ?? $cfg->warning_threshold_pct)
                : 80,
            'auto_stop_at_quota' => array_key_exists('auto_stop_at_quota', $payload)
                ? (bool) $payload['auto_stop_at_quota']
                : $cfg->auto_stop_at_quota,
            'payment_required_for_usage' => array_key_exists('payment_required_for_usage', $payload)
                ? (bool) $payload['payment_required_for_usage']
                : $cfg->payment_required_for_usage,
            'config_status' => (string) ($payload['config_status'] ?? $cfg->config_status),
        ]);
        foreach (['usage_unlocked', 'payment_status', 'usage_unlocked_until'] as $k) {
            if (array_key_exists($k, $payload)) {
                $cfg->{$k} = $payload[$k];
            }
        }
        $cfg->save();
        $this->configs->audit($store->id, $actorId, 'image_config_updated', 'info', 'OpenAI image config saved', [
            'enabled' => $cfg->enabled,
            'quota' => $cfg->monthly_image_quota,
        ]);

        return $cfg->fresh();
    }

    /**
     * @return array{ok: true}|array{ok: false, code: string, message: string, payment_required?: bool}
     */
    public function assertCanGenerate(Store $store, StoreOpenAiImageConfig $cfg): array
    {
        $global = $this->configs->global();
        if ($global->emergency_disabled || ! $global->enabled) {
            return ['ok' => false, 'code' => 'provider_disabled', 'message' => 'OpenAI provider is disabled.'];
        }
        if (! $cfg->enabled) {
            return ['ok' => false, 'code' => 'store_disabled', 'message' => 'OpenAI Image is disabled for this store.'];
        }
        if (! $this->configs->storeIsProEligible($store)) {
            return ['ok' => false, 'code' => 'pro_required', 'message' => 'Pro plan required.', 'payment_required' => true];
        }
        if ($cfg->payment_required_for_usage) {
            $unlocked = (bool) $cfg->usage_unlocked;
            if ($cfg->usage_unlocked_until && $cfg->usage_unlocked_until->isPast()) {
                $unlocked = false;
            }
            if (! $unlocked && ! in_array($cfg->payment_status, ['paid', 'comped'], true)) {
                return ['ok' => false, 'code' => 'payment_required', 'message' => 'Payment required for image usage.', 'payment_required' => true];
            }
        }

        return DB::transaction(function () use ($store, $cfg) {
            $usage = StoreOpenAiImageUsage::query()
                ->where('store_id', $store->id)
                ->where('period_key', $this->periodKey())
                ->lockForUpdate()
                ->first();
            if (! $usage) {
                $usage = $this->usageRow($store);
                $usage = StoreOpenAiImageUsage::query()->whereKey($usage->id)->lockForUpdate()->first();
            }
            if ($usage->hard_stopped) {
                return ['ok' => false, 'code' => 'hard_stopped', 'message' => 'Monthly image quota hard-stopped.'];
            }
            if ((int) $usage->images_success >= (int) $cfg->monthly_image_quota) {
                return ['ok' => false, 'code' => 'monthly_quota', 'message' => 'Monthly successful image quota reached.'];
            }
            if ((float) $usage->cost_usd >= (float) $cfg->monthly_budget_usd && $cfg->auto_stop_at_quota) {
                return ['ok' => false, 'code' => 'monthly_budget', 'message' => 'Monthly image budget reached.'];
            }

            return ['ok' => true];
        });
    }

    /**
     * @return array{ok: bool, code?: string, message?: string, payment_required?: bool, data?: array<string, mixed>}
     */
    public function generate(Store $store, string $prompt, ?string $actorId): array
    {
        $cfg = $this->forStore($store);
        $gate = $this->assertCanGenerate($store, $cfg);
        if (! ($gate['ok'] ?? false)) {
            StoreOpenAiImageEvent::query()->create([
                'id' => 'oaie-'.Str::lower(Str::random(12)),
                'store_id' => $store->id,
                'user_id' => $actorId,
                'status' => ($gate['payment_required'] ?? false) ? 'payment_required' : 'blocked',
                'error_code' => $gate['code'] ?? 'blocked',
                'error_message' => $gate['message'] ?? 'Blocked',
                'created_at' => now(),
            ]);

            return $gate;
        }

        $apiKey = trim((string) config('services.openai.api_key', ''));
        if ($apiKey === '') {
            return ['ok' => false, 'code' => 'key_missing', 'message' => 'OpenAI API key is not configured.'];
        }

        $model = $cfg->default_model ?: 'gpt-image-2.6-flare';
        $quality = $cfg->default_quality ?: 'medium';
        $requestId = 'oa-img-'.Str::lower(Str::random(10));
        $result = $this->postImage($apiKey, $model, $quality, trim($prompt));

        if (! ($result['ok'] ?? false)) {
            DB::transaction(function () use ($store) {
                $usage = StoreOpenAiImageUsage::query()
                    ->where('store_id', $store->id)
                    ->where('period_key', $this->periodKey())
                    ->lockForUpdate()
                    ->first() ?: $this->usageRow($store);
                $usage->images_failed = (int) $usage->images_failed + 1;
                $usage->save();
            });
            StoreOpenAiImageEvent::query()->create([
                'id' => 'oaie-'.Str::lower(Str::random(12)),
                'store_id' => $store->id,
                'user_id' => $actorId,
                'request_id' => $requestId,
                'model' => $model,
                'quality' => $quality,
                'status' => 'failed',
                'error_code' => $result['code'] ?? 'provider_error',
                'error_message' => $result['message'] ?? 'Failed',
                'created_at' => now(),
            ]);

            return $result;
        }

        $this->costs->ensureDefaultPricing();
        $pricing = \App\Models\OpenAiModelPricing::query()
            ->where('model', $model)
            ->where('modality', 'image')
            ->where('active', true)
            ->first();
        $cost = $pricing && $pricing->image_per_unit_usd !== null
            ? (float) $pricing->image_per_unit_usd
            : 0.042;

        $bytes = base64_decode((string) ($result['b64'] ?? ''), true);
        if ($bytes === false || $bytes === '') {
            return ['ok' => false, 'code' => 'decode_failed', 'message' => 'Could not decode image bytes.'];
        }

        $filename = 'openai-'.Str::lower(Str::random(8)).'-'.time().'.png';
        $path = 'stores/'.$store->id.'/media/'.$filename;
        Storage::disk('public')->put($path, $bytes);
        $url = '/storage/'.$path.'?v='.time();

        $media = Media::query()->create([
            'id' => 'med-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'file_name' => $filename,
            'file_type' => 'image',
            'mime' => 'image/png',
            'size_bytes' => strlen($bytes),
            'url' => $url,
            'path' => $path,
            'folder' => 'openai-generated',
            'processing_status' => 'ready',
            'metadata' => [
                'source' => 'openai_generator',
                'model' => $model,
                'quality' => $quality,
                'request_id' => $requestId,
            ],
        ]);

        DB::transaction(function () use ($store, $cfg, $cost) {
            $usage = StoreOpenAiImageUsage::query()
                ->where('store_id', $store->id)
                ->where('period_key', $this->periodKey())
                ->lockForUpdate()
                ->first() ?: $this->usageRow($store);
            $usage = StoreOpenAiImageUsage::query()->whereKey($usage->id)->lockForUpdate()->first();
            $usage->images_success = (int) $usage->images_success + 1;
            $usage->cost_usd = round((float) $usage->cost_usd + $cost, 6);
            $quota = (int) $cfg->monthly_image_quota;
            if ($quota > 0 && ! $usage->warning_sent) {
                $ratio = $usage->images_success / $quota;
                if ($ratio >= ((int) $cfg->warning_threshold_pct) / 100) {
                    $usage->warning_sent = true;
                }
            }
            if ($cfg->auto_stop_at_quota && $usage->images_success >= $quota) {
                $usage->hard_stopped = true;
            }
            $usage->save();
        });

        StoreOpenAiImageEvent::query()->create([
            'id' => 'oaie-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'user_id' => $actorId,
            'request_id' => $requestId,
            'model' => $model,
            'quality' => $quality,
            'status' => 'success',
            'actual_cost_usd' => $cost,
            'media_id' => $media->id,
            'created_at' => now(),
        ]);

        return [
            'ok' => true,
            'data' => [
                'request_id' => $requestId,
                'media_id' => $media->id,
                'url' => $url,
                'model' => $model,
                'quality' => $quality,
                'actual_cost_usd' => $cost,
                'usage' => $this->serialize($store, $cfg)['usage'],
            ],
        ];
    }

    /**
     * @return array{ok: bool, b64?: string, code?: string, message?: string}
     */
    private function postImage(string $apiKey, string $model, string $quality, string $prompt): array
    {
        if ($prompt === '') {
            return ['ok' => false, 'code' => 'invalid_prompt', 'message' => 'Prompt is required.'];
        }
        $body = [
            'model' => $model,
            'prompt' => mb_substr($prompt, 0, 32000),
            'quality' => $quality,
            'size' => '1024x1024',
            'n' => 1,
        ];
        $ch = curl_init('https://api.openai.com/v1/images/generations');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
        ]);
        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno) {
            return ['ok' => false, 'code' => 'timeout_or_network', 'message' => 'Image request failed (network/timeout).'];
        }
        $json = is_string($raw) ? json_decode($raw, true) : null;
        if ($http === 429) {
            return ['ok' => false, 'code' => 'rate_limited', 'message' => 'OpenAI rate limit.'];
        }
        if ($http >= 400 || ! is_array($json)) {
            $msg = is_array($json) ? (string) ($json['error']['message'] ?? 'Provider error') : 'Invalid response';

            return ['ok' => false, 'code' => 'provider_error', 'message' => $msg];
        }
        $b64 = (string) ($json['data'][0]['b64_json'] ?? '');
        if ($b64 === '' && ! empty($json['data'][0]['url'])) {
            // URL response — fetch bytes
            $img = @file_get_contents((string) $json['data'][0]['url']);
            if ($img === false) {
                return ['ok' => false, 'code' => 'fetch_failed', 'message' => 'Could not download generated image.'];
            }
            $b64 = base64_encode($img);
        }
        if ($b64 === '') {
            return ['ok' => false, 'code' => 'empty_image', 'message' => 'Provider returned no image.'];
        }

        return ['ok' => true, 'b64' => $b64];
    }
}
