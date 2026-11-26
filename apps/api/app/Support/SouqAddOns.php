<?php

namespace App\Support;

use App\Models\Store;

/**
 * Price-first add-on catalog — show everywhere; unlock after pay + Master approve.
 * docs/36 · AI agent / image / video / calling / social schedule / WhatsApp
 */
final class SouqAddOns
{
    /**
     * @return list<array{
     *   id: string,
     *   category: string,
     *   name_en: string,
     *   name_ar: string,
     *   price_sar: int,
     *   billing: string,
     *   feature_flag: string|null,
     *   description_en: string,
     *   description_ar: string,
     *   min_plan: string
     * }>
     */
    public static function catalog(): array
    {
        return [
            [
                'id' => 'addon-ai-agent',
                'category' => 'ai',
                'name_en' => 'AI Calling / Sales Agent',
                'name_ar' => 'وكيل المبيعات والمكالمات بالذكاء الاصطناعي',
                'price_sar' => 99,
                'billing' => 'monthly',
                'feature_flag' => 'ai',
                'description_en' => 'Sales agent + outreach assist. Master sets low/medium/high limits after payment.',
                'description_ar' => 'وكيل مبيعات ومساعدة تواصل. الماستر يضبط حدود منخفض/متوسط/مرتفع بعد الدفع.',
                'min_plan' => 'starter',
            ],
            [
                'id' => 'addon-ai-images',
                'category' => 'ai',
                'name_en' => 'AI Image Studio',
                'name_ar' => 'استوديو الصور بالذكاء الاصطناعي',
                'price_sar' => 149,
                'billing' => 'monthly',
                'feature_flag' => 'media_studio',
                'description_en' => 'Product photoshoot and creatives (credits). Unlock after Master approve.',
                'description_ar' => 'تصوير المنتجات والإبداعات (رصيد). يُفتح بعد موافقة الماستر.',
                'min_plan' => 'starter',
            ],
            [
                'id' => 'addon-ai-video',
                'category' => 'ai',
                'name_en' => 'AI Video Studio',
                'name_ar' => 'استوديو الفيديو بالذكاء الاصطناعي',
                'price_sar' => 199,
                'billing' => 'monthly',
                'feature_flag' => 'media_studio',
                'description_en' => 'Short promo videos for products and campaigns.',
                'description_ar' => 'فيديوهات ترويجية قصيرة للمنتجات والحملات.',
                'min_plan' => 'pro',
            ],
            [
                'id' => 'addon-ai-fix',
                'category' => 'ai',
                'name_en' => 'AI Store Doctor / Fix',
                'name_ar' => 'طبيب المتجر والإصلاح بالذكاء الاصطناعي',
                'price_sar' => 89,
                'billing' => 'monthly',
                'feature_flag' => 'ai',
                'description_en' => 'Health scan for broken links, images, and stock gaps.',
                'description_ar' => 'فحص صحة الروابط والصور وفجوات المخزون.',
                'min_plan' => 'pro',
            ],
            [
                'id' => 'addon-ai-calling',
                'category' => 'ai',
                'name_en' => 'AI Voice / Calling Extra',
                'name_ar' => 'المكالمات الصوتية الإضافية',
                'price_sar' => 199,
                'billing' => 'monthly',
                'feature_flag' => null,
                'description_en' => 'Dedicated voice minutes pack — Master unlock only after real payment.',
                'description_ar' => 'حزمة دقائق صوتية — يفتحها الماستر بعد الدفع الحقيقي فقط.',
                'min_plan' => 'pro',
            ],
            [
                'id' => 'addon-whatsapp-automation',
                'category' => 'messaging',
                'name_en' => 'WhatsApp Automation',
                'name_ar' => 'أتمتة واتساب',
                'price_sar' => 99,
                'billing' => 'monthly',
                'feature_flag' => 'whatsapp',
                'description_en' => 'Order alerts, abandoned cart, and support flows.',
                'description_ar' => 'تنبيهات الطلبات واسترداد السلة ومسارات الدعم.',
                'min_plan' => 'starter',
            ],
            [
                'id' => 'addon-social-automation',
                'category' => 'social',
                'name_en' => 'Social Media Auto-Scheduling',
                'name_ar' => 'جدولة وسائل التواصل تلقائياً',
                'price_sar' => 149,
                'billing' => 'monthly',
                'feature_flag' => 'social',
                'description_en' => 'Design + auto-schedule posts after real Meta connect.',
                'description_ar' => 'تصميم وجدولة تلقائية بعد ربط ميتا الحقيقي.',
                'min_plan' => 'pro',
            ],
            [
                'id' => 'addon-ai-credits-pack',
                'category' => 'credits',
                'name_en' => 'AI Credits Pack (100)',
                'name_ar' => 'حزمة رصيد الذكاء الاصطناعي (١٠٠)',
                'price_sar' => 50,
                'billing' => 'one_time',
                'feature_flag' => null,
                'description_en' => 'Extra AI credits when monthly quota is exhausted.',
                'description_ar' => 'رصيد إضافي عند نفاد الحصة الشهرية.',
                'min_plan' => 'starter',
            ],
        ];
    }

    /**
     * Annotate with 1/6/12 period totals + unlock state.
     *
     * @return list<array<string, mixed>>
     */
    public static function forStore(Store $store): array
    {
        $plan = Plans::effectiveCode($store);
        $rank = self::planRank($plan);
        $out = [];

        foreach (self::catalog() as $row) {
            $minRank = self::planRank($row['min_plan']);
            $planOk = $rank >= $minRank || $plan === 'custom';
            $featureOk = $row['feature_flag']
                ? Plans::hasFeature($store, (string) $row['feature_flag'])
                : false;

            // Price-first: feature flag alone is NOT enough without payment unlock path
            $unlocked = false;
            if ($row['feature_flag'] && $featureOk && $planOk) {
                // Soft preview unlock only when plan already includes feature; Master still owns AI payment unlock
                $unlocked = in_array($plan, ['pro', 'premium', 'custom'], true)
                    && $row['feature_flag'] !== null
                    && Plans::hasFeature($store, (string) $row['feature_flag']);
            }
            if (in_array($row['id'], ['addon-ai-calling', 'addon-ai-video', 'addon-ai-credits-pack'], true)) {
                $unlocked = false; // always Master-paid
            }

            $periods = [];
            if ($row['billing'] === 'monthly' && $row['price_sar'] > 0) {
                foreach ([1, 6, 12] as $m) {
                    $periods[] = SouqBilling::priceForPeriod((int) $row['price_sar'], $m);
                }
            }

            $out[] = array_merge($row, [
                'currency' => 'SAR',
                'unlocked' => $unlocked,
                'lock_reason' => $unlocked
                    ? null
                    : (! $planOk ? 'upgrade_plan' : 'purchase_required'),
                'plan_code' => $plan,
                'billing_periods' => $periods,
                'master_must_approve' => true,
            ]);
        }

        return $out;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function publicMatrix(): array
    {
        return array_map(static function (array $row) {
            $periods = [];
            if ($row['billing'] === 'monthly' && $row['price_sar'] > 0) {
                foreach ([1, 6, 12] as $m) {
                    $periods[] = SouqBilling::priceForPeriod((int) $row['price_sar'], $m);
                }
            }

            return array_merge($row, [
                'currency' => 'SAR',
                'unlocked' => false,
                'lock_reason' => 'login_required',
                'billing_periods' => $periods,
                'master_must_approve' => true,
            ]);
        }, self::catalog());
    }

    private static function planRank(string $code): int
    {
        return match (Plans::normalizeCode($code)) {
            'free' => 0,
            'paid' => 1,
            'starter' => 2,
            'pro' => 3,
            'premium' => 4,
            'custom' => 5,
            default => 0,
        };
    }
}
