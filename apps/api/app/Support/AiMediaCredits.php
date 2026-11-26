<?php

namespace App\Support;

use App\Models\Store;
use App\Models\StoreAiGenerationUsage;
use App\Models\StoreOpenAiImageConfig;
use Illuminate\Support\Str;

/**
 * Monthly + daily AI image/video generation quotas — isolated per store_id.
 * Daily caps protect the shared Gemini key so one store cannot burn the whole month in a day.
 */
final class AiMediaCredits
{
    /**
     * @return array{images: int, videos: int, images_daily: int, videos_daily: int}
     */
    public static function limitsForStore(Store $store): array
    {
        $code = Plans::effectiveCode($store);

        $base = match ($code) {
            'free' => ['images' => 8, 'videos' => 0, 'images_daily' => 1, 'videos_daily' => 0],
            'paid' => ['images' => 25, 'videos' => 0, 'images_daily' => 2, 'videos_daily' => 0],
            'pro' => ['images' => 60, 'videos' => 8, 'images_daily' => 5, 'videos_daily' => 1],
            'premium' => ['images' => 200, 'videos' => 30, 'images_daily' => 10, 'videos_daily' => 2],
            'custom' => ['images' => 500, 'videos' => 50, 'images_daily' => 20, 'videos_daily' => 3],
            default => ['images' => 8, 'videos' => 0, 'images_daily' => 1, 'videos_daily' => 0],
        };

        // Master can raise Gemini image caps via store_openai_image_configs (increment panel).
        try {
            $cfg = StoreOpenAiImageConfig::query()->where('store_id', $store->id)->first();
            if ($cfg) {
                $month = (int) ($cfg->monthly_image_quota ?? 0);
                if ($month > $base['images']) {
                    $base['images'] = $month;
                }
                $attrs = $cfg->getAttributes();
                if (array_key_exists('daily_image_quota', $attrs)) {
                    $day = (int) ($attrs['daily_image_quota'] ?? 0);
                    if ($day > $base['images_daily']) {
                        $base['images_daily'] = $day;
                    }
                } elseif ($month > 0) {
                    $base['images_daily'] = max($base['images_daily'], (int) ceil($month / 12));
                }
            }
        } catch (\Throwable) {
            /* table / column missing — keep plan defaults */
        }

        return $base;
    }

    public static function periodKey(?\DateTimeInterface $now = null): string
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $dt = $now
            ? \DateTimeImmutable::createFromInterface($now)->setTimezone($tz)
            : new \DateTimeImmutable('now', $tz);

        return $dt->format('Y-m');
    }

    public static function dayKey(?\DateTimeInterface $now = null): string
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $dt = $now
            ? \DateTimeImmutable::createFromInterface($now)->setTimezone($tz)
            : new \DateTimeImmutable('now', $tz);

        return $dt->format('Y-m-d');
    }

    public static function usageRow(Store $store, ?string $periodKey = null): StoreAiGenerationUsage
    {
        $period = $periodKey ?? self::periodKey();
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
     *   day_key: string,
     *   plan_code: string,
     *   images_limit: int,
     *   images_used: int,
     *   images_remaining: int,
     *   images_daily_limit: int,
     *   images_used_today: int,
     *   images_remaining_today: int,
     *   videos_limit: int,
     *   videos_used: int,
     *   videos_remaining: int,
     *   videos_daily_limit: int,
     *   videos_used_today: int,
     *   videos_remaining_today: int,
     *   image_provider_ready: bool,
     *   video_provider_ready: bool
     * }
     */
    public static function snapshot(Store $store): array
    {
        $limits = self::limitsForStore($store);
        $usage = self::usageRow($store);
        $dayUsage = self::usageRow($store, self::dayKey());
        $plan = Plans::forStore($store);
        $apiKey = trim((string) config('services.gemini.api_key', ''));
        $imageReady = $apiKey !== '' && $apiKey !== 'MY_GEMINI_API_KEY';
        $videoReady = $imageReady && (bool) config('services.gemini.video_enabled', false);

        $imagesRemainingMonth = max(0, $limits['images'] - (int) $usage->images_used);
        $imagesRemainingDay = max(0, $limits['images_daily'] - (int) $dayUsage->images_used);
        $videosRemainingMonth = max(0, $limits['videos'] - (int) $usage->videos_used);
        $videosRemainingDay = max(0, $limits['videos_daily'] - (int) $dayUsage->videos_used);

        return [
            'store_id' => $store->id,
            'period_key' => $usage->period_key,
            'day_key' => $dayUsage->period_key,
            'plan_code' => $plan['code'],
            'images_limit' => $limits['images'],
            'images_used' => (int) $usage->images_used,
            'images_remaining' => min($imagesRemainingMonth, $imagesRemainingDay),
            'images_daily_limit' => $limits['images_daily'],
            'images_used_today' => (int) $dayUsage->images_used,
            'images_remaining_today' => $imagesRemainingDay,
            'videos_limit' => $limits['videos'],
            'videos_used' => (int) $usage->videos_used,
            'videos_remaining' => min($videosRemainingMonth, $videosRemainingDay),
            'videos_daily_limit' => $limits['videos_daily'],
            'videos_used_today' => (int) $dayUsage->videos_used,
            'videos_remaining_today' => $videosRemainingDay,
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

        if ($kind === 'image') {
            if (($snap['images_remaining_today'] ?? 0) <= 0) {
                return [
                    'ok' => false,
                    'code' => 'image_daily_quota_exhausted',
                    'message' => 'Daily AI image generation limit reached for this store. Try again tomorrow.',
                    'snapshot' => $snap,
                ];
            }
            if ($snap['images_remaining'] <= 0 || (($snap['images_limit'] - $snap['images_used']) <= 0)) {
                return [
                    'ok' => false,
                    'code' => 'image_quota_exhausted',
                    'message' => 'Monthly AI image generation limit reached for this store.',
                    'snapshot' => $snap,
                ];
            }
        }

        if ($kind === 'video') {
            if (($snap['videos_remaining_today'] ?? 0) <= 0) {
                return [
                    'ok' => false,
                    'code' => 'video_daily_quota_exhausted',
                    'message' => 'Daily AI video generation limit reached for this store.',
                    'snapshot' => $snap,
                ];
            }
            if ($snap['videos_remaining'] <= 0 || (($snap['videos_limit'] - $snap['videos_used']) <= 0)) {
                return [
                    'ok' => false,
                    'code' => 'video_quota_exhausted',
                    'message' => 'Monthly AI video generation limit reached for this store.',
                    'snapshot' => $snap,
                ];
            }
        }

        $usage = self::usageRow($store);
        $dayUsage = self::usageRow($store, self::dayKey());
        if ($kind === 'video') {
            $usage->videos_used = (int) $usage->videos_used + 1;
            $dayUsage->videos_used = (int) $dayUsage->videos_used + 1;
        } else {
            $usage->images_used = (int) $usage->images_used + 1;
            $dayUsage->images_used = (int) $dayUsage->images_used + 1;
        }
        $usage->save();
        $dayUsage->save();

        return ['ok' => true, 'usage' => $usage];
    }
}
