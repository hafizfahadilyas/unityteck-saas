<?php

namespace App\Support;

use App\Models\Store;
use App\Models\StoreAiGenerationUsage;
use Illuminate\Support\Str;

/**
 * Monthly AI image/video generation quotas — isolated per store_id.
 */
final class AiMediaCredits
{
    /**
     * @return array{images: int, videos: int}
     */
    public static function limitsForStore(Store $store): array
    {
        $code = Plans::effectiveCode($store);

        return match ($code) {
            'free' => ['images' => 8, 'videos' => 0],
            'paid' => ['images' => 25, 'videos' => 0],
            'pro' => ['images' => 60, 'videos' => 8],
            'premium' => ['images' => 200, 'videos' => 30],
            'custom' => ['images' => 500, 'videos' => 50],
            default => ['images' => 8, 'videos' => 0],
        };
    }

    public static function periodKey(?\DateTimeInterface $now = null): string
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $dt = $now
            ? \DateTimeImmutable::createFromInterface($now)->setTimezone($tz)
            : new \DateTimeImmutable('now', $tz);

        return $dt->format('Y-m');
    }

    public static function usageRow(Store $store): StoreAiGenerationUsage
    {
        $period = self::periodKey();
        $row = StoreAiGenerationUsage::query()
            ->where('store_id', $store->id)
            ->where('period_key', $period)
            ->first();

        if ($row) {
            return $row;
        }

        return StoreAiGenerationUsage::query()->create([
            'id' => 'aigu-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'period_key' => $period,
            'images_used' => 0,
            'videos_used' => 0,
        ]);
    }

    /**
     * @return array{
     *   store_id: string,
     *   period_key: string,
     *   plan_code: string,
     *   images_limit: int,
     *   images_used: int,
     *   images_remaining: int,
     *   videos_limit: int,
     *   videos_used: int,
     *   videos_remaining: int,
     *   image_provider_ready: bool,
     *   video_provider_ready: bool
     * }
     */
    public static function snapshot(Store $store): array
    {
        $limits = self::limitsForStore($store);
        $usage = self::usageRow($store);
        $plan = Plans::forStore($store);
        $apiKey = trim((string) config('services.gemini.api_key', ''));
        $imageReady = $apiKey !== '' && $apiKey !== 'MY_GEMINI_API_KEY';
        $videoReady = $imageReady && (bool) config('services.gemini.video_enabled', false);

        return [
            'store_id' => $store->id,
            'period_key' => $usage->period_key,
            'plan_code' => $plan['code'],
            'images_limit' => $limits['images'],
            'images_used' => (int) $usage->images_used,
            'images_remaining' => max(0, $limits['images'] - (int) $usage->images_used),
            'videos_limit' => $limits['videos'],
            'videos_used' => (int) $usage->videos_used,
            'videos_remaining' => max(0, $limits['videos'] - (int) $usage->videos_used),
            'image_provider_ready' => $imageReady,
            'video_provider_ready' => $videoReady,
        ];
    }

    /**
     * @return array{ok: true, usage: StoreAiGenerationUsage}|array{ok: false, code: string, message: string, snapshot: array}
     */
    public static function consume(Store $store, string $kind): array
    {
        $kind = $kind === 'video' ? 'video' : 'image';
        $snap = self::snapshot($store);

        if ($kind === 'image' && $snap['images_remaining'] <= 0) {
            return [
                'ok' => false,
                'code' => 'image_quota_exhausted',
                'message' => 'Monthly AI image generation limit reached for this store.',
                'snapshot' => $snap,
            ];
        }

        if ($kind === 'video' && $snap['videos_remaining'] <= 0) {
            return [
                'ok' => false,
                'code' => 'video_quota_exhausted',
                'message' => 'Monthly AI video generation limit reached for this store.',
                'snapshot' => $snap,
            ];
        }

        $usage = self::usageRow($store);
        if ($kind === 'video') {
            $usage->videos_used = (int) $usage->videos_used + 1;
        } else {
            $usage->images_used = (int) $usage->images_used + 1;
        }
        $usage->save();

        return ['ok' => true, 'usage' => $usage];
    }
}
