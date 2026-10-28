<?php

namespace App\Services\Notification;

use App\Models\Store;
use App\Models\StoreSetting;

/**
 * Per-store outbound WhatsApp/SMS API quotas (anti-ban).
 *
 * Basic/Free/Paid = 20/day (manual paced sends).
 * Pro/Custom = 50/day default; Master Admin can raise further per store.
 * Email = always manual (no auto blast). Dashboard notifications = automatic (unlimited).
 * Direct wa.me click-to-chat is free and does NOT consume quota.
 */
class MessageQuota
{
    public static function planDailyDefault(?string $plan): int
    {
        return match (strtolower((string) $plan)) {
            'pro', 'custom' => 50,
            default => 20, // basic / free / paid
        };
    }

    public static function planMonthlyDefault(?string $plan): int
    {
        return match (strtolower((string) $plan)) {
            'pro', 'custom' => 1000,
            default => 400, // basic ≈ 20 × ~20 days buffer
        };
    }

    /**
     * @return array{daily_limit:int,monthly_limit:int,source:string,plan:string,frozen:bool}
     */
    public static function forStore(string $storeId): array
    {
        $store = Store::query()->where('id', $storeId)->first();
        $plan = (string) ($store?->plan ?? 'free');
        if (!empty($store?->master_granted_pro)) {
            $plan = 'pro';
        }

        $row = StoreSetting::query()->where('store_id', $storeId)->first();
        $wa = is_array($row?->settings) ? ($row->settings['whatsapp'] ?? []) : [];

        $hasOverride = array_key_exists('daily_limit', $wa) && $wa['daily_limit'] !== null && $wa['daily_limit'] !== '';
        $daily = $hasOverride
            ? (int) $wa['daily_limit']
            : self::planDailyDefault($plan);

        $hasMonthly = array_key_exists('monthly_limit', $wa) && $wa['monthly_limit'] !== null && $wa['monthly_limit'] !== '';
        $monthly = $hasMonthly
            ? (int) $wa['monthly_limit']
            : self::planMonthlyDefault($plan);

        $frozen = !empty($wa['quota_frozen']);

        return [
            'daily_limit' => max(0, $daily),
            'monthly_limit' => max(0, $monthly),
            'source' => $hasOverride ? 'master_or_store_override' : 'plan_default',
            'plan' => $plan,
            'frozen' => $frozen,
        ];
    }
}
