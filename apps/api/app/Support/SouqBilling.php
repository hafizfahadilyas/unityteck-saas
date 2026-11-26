<?php

namespace App\Support;

use App\Models\Store;
use Illuminate\Support\Carbon;

/**
 * Souq commercial model — billing periods, hosting/domain, inactivity terminate.
 * docs/36 (updated) · Master + Store + Souq marketing site must show same SAR.
 */
final class SouqBilling
{
    /** First N Premium stores get Hostinger + domain free (platform-wide). */
    public const FREE_HOSTING_PREMIUM_SLOTS = 20;

    /** Inactivity thresholds (days without merchant activity). */
    public const INACTIVITY_WARNING_1_DAYS = 30;

    public const INACTIVITY_WARNING_2_DAYS = 60;

    public const INACTIVITY_TERMINATE_DAYS = 90;

    /**
     * Period discounts on monthly plan price.
     *
     * @return list<array{months: int, discount_pct: int, label_en: string, label_ar: string}>
     */
    public static function billingPeriods(): array
    {
        return [
            [
                'months' => 1,
                'discount_pct' => 0,
                'label_en' => '1 month',
                'label_ar' => 'شهر واحد',
            ],
            [
                'months' => 6,
                'discount_pct' => 15,
                'label_en' => '6 months (−15%)',
                'label_ar' => '٦ أشهر (خصم ١٥٪)',
            ],
            [
                'months' => 12,
                'discount_pct' => 25,
                'label_en' => '12 months (−25%)',
                'label_ar' => '١٢ شهراً (خصم ٢٥٪)',
            ],
        ];
    }

    /**
     * @return array{total_sar: int, monthly_effective_sar: float, discount_pct: int, months: int}
     */
    public static function priceForPeriod(int $monthlySar, int $months): array
    {
        $months = in_array($months, [1, 6, 12], true) ? $months : 1;
        $pct = 0;
        foreach (self::billingPeriods() as $p) {
            if ($p['months'] === $months) {
                $pct = (int) $p['discount_pct'];
                break;
            }
        }
        $gross = $monthlySar * $months;
        $total = (int) round($gross * (100 - $pct) / 100);

        return [
            'months' => $months,
            'discount_pct' => $pct,
            'total_sar' => $total,
            'monthly_effective_sar' => $months > 0 ? round($total / $months, 2) : (float) $monthlySar,
        ];
    }

    /**
     * Public + dashboard plan cards with 1/6/12 totals.
     *
     * @return list<array<string, mixed>>
     */
    public static function plansWithPeriods(): array
    {
        $out = [];
        foreach (Plans::catalog() as $code => $meta) {
            if (! in_array($code, ['starter', 'pro', 'premium', 'free'], true)) {
                continue;
            }
            $monthly = $meta['price_sar'];
            $periods = [];
            if ($monthly !== null && $monthly > 0) {
                foreach ([1, 6, 12] as $m) {
                    $periods[] = array_merge(
                        self::priceForPeriod((int) $monthly, $m),
                        ['currency' => 'SAR']
                    );
                }
            }
            $out[] = [
                'code' => $code,
                'name' => $meta['name'],
                'name_ar' => $meta['name_ar'] ?? null,
                'price_sar' => $monthly,
                'currency' => 'SAR',
                'features' => $meta['features'],
                'billing_periods' => $periods,
                'includes_free_hosting_domain' => $code === 'premium',
                'free_hosting_note_en' => $code === 'premium'
                    ? 'Hostinger hosting + domain free for the first '.self::FREE_HOSTING_PREMIUM_SLOTS.' Premium stores (Master-approved).'
                    : null,
                'free_hosting_note_ar' => $code === 'premium'
                    ? 'استضافة هوستنجر والنطاق مجاناً لأول '.self::FREE_HOSTING_PREMIUM_SLOTS.' متجراً على الباقة المميزة (بعد موافقة الماستر).'
                    : null,
            ];
        }

        return $out;
    }

    /**
     * Hosting / domain SKUs sold by Souq (Master fulfills on Hostinger).
     *
     * @return list<array<string, mixed>>
     */
    public static function hostingCatalog(): array
    {
        return [
            [
                'id' => 'hosting-shared-starter',
                'name_en' => 'Hostinger Shared Starter + Domain',
                'name_ar' => 'استضافة هوستنجر الأساسية + نطاق',
                'price_sar' => 49,
                'billing' => 'monthly',
                'currency' => 'SAR',
            ],
            [
                'id' => 'hosting-shared-business',
                'name_en' => 'Hostinger Shared Business + Domain',
                'name_ar' => 'استضافة هوستنجر للأعمال + نطاق',
                'price_sar' => 79,
                'billing' => 'monthly',
                'currency' => 'SAR',
            ],
            [
                'id' => 'hosting-premium-comp',
                'name_en' => 'Premium free hosting slot',
                'name_ar' => 'استضافة مجانية للباقة المميزة',
                'price_sar' => 0,
                'billing' => 'included',
                'currency' => 'SAR',
                'requires_plan' => 'premium',
                'limited_slots' => self::FREE_HOSTING_PREMIUM_SLOTS,
            ],
        ];
    }

    public static function freeHostingSlotsRemaining(): int
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('stores')) {
            return self::FREE_HOSTING_PREMIUM_SLOTS;
        }

        try {
            $used = Store::query()
                ->where(function ($q) {
                    $q->where('plan', 'premium')
                        ->orWhere('master_granted_pro', true);
                })
                ->where(function ($q) {
                    if (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'hosting_comped')) {
                        $q->where('hosting_comped', true);
                    } elseif (\Illuminate\Support\Facades\Schema::hasColumn('stores', 'hosting_id')) {
                        $q->whereNotNull('hosting_id')->where('hosting_id', '!=', '');
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->count();
        } catch (\Throwable) {
            return self::FREE_HOSTING_PREMIUM_SLOTS;
        }

        return max(0, self::FREE_HOSTING_PREMIUM_SLOTS - $used);
    }

    /**
     * Inactivity policy snapshot for a store.
     *
     * @return array{status: string, days_inactive: int, next_action_en: string, next_action_ar: string}
     */
    public static function inactivityForStore(Store $store): array
    {
        $last = null;
        foreach (['last_activity_at', 'updated_at', 'created_at'] as $col) {
            if (! empty($store->{$col})) {
                try {
                    $last = Carbon::parse($store->{$col});
                    break;
                } catch (\Throwable) {
                }
            }
        }
        if (! $last) {
            $last = now();
        }

        $days = (int) $last->diffInDays(now());
        if ($days >= self::INACTIVITY_TERMINATE_DAYS) {
            return [
                'status' => 'terminate',
                'days_inactive' => $days,
                'next_action_en' => 'Store eligible for termination after 90 days of inactivity. Master must confirm.',
                'next_action_ar' => 'المتجر مؤهل للإنهاء بعد ٩٠ يوماً من عدم النشاط. يلزم تأكيد الماستر.',
            ];
        }
        if ($days >= self::INACTIVITY_WARNING_2_DAYS) {
            return [
                'status' => 'warning_2',
                'days_inactive' => $days,
                'next_action_en' => 'Second warning: inactive 60+ days. Terminate after 90 days if unused.',
                'next_action_ar' => 'تحذير ثانٍ: عدم نشاط ٦٠+ يوماً. الإنهاء بعد ٩٠ يوماً إن استمر.',
            ];
        }
        if ($days >= self::INACTIVITY_WARNING_1_DAYS) {
            return [
                'status' => 'warning_1',
                'days_inactive' => $days,
                'next_action_en' => 'First warning: inactive 30+ days. Use the store or risk later termination.',
                'next_action_ar' => 'تحذير أول: عدم نشاط ٣٠+ يوماً. استخدم المتجر أو قد يُنهى لاحقاً.',
            ];
        }

        return [
            'status' => 'ok',
            'days_inactive' => $days,
            'next_action_en' => 'Active within policy.',
            'next_action_ar' => 'نشط ضمن السياسة.',
        ];
    }

    /**
     * Full public marketing payload (Souq site + dashboards).
     *
     * @return array<string, mixed>
     */
    public static function marketingBundle(): array
    {
        return [
            'plans' => self::plansWithPeriods(),
            'billing_periods' => self::billingPeriods(),
            'hosting' => self::hostingCatalog(),
            'free_hosting_slots_remaining' => self::freeHostingSlotsRemaining(),
            'free_hosting_slots_total' => self::FREE_HOSTING_PREMIUM_SLOTS,
            'inactivity' => [
                'warning_1_days' => self::INACTIVITY_WARNING_1_DAYS,
                'warning_2_days' => self::INACTIVITY_WARNING_2_DAYS,
                'terminate_days' => self::INACTIVITY_TERMINATE_DAYS,
                'note_en' => 'Month 1 unused → warning. Month 2 → second warning. Then Master may terminate.',
                'note_ar' => 'شهر دون استخدام ← تحذير. الشهر الثاني ← تحذير ثانٍ. ثم قد يُنهي الماستر المتجر.',
            ],
            'addons' => SouqAddOns::publicMatrix(),
            'currency' => 'SAR',
            'master_approves_unlock' => true,
        ];
    }
}
