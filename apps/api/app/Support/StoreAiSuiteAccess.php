<?php

namespace App\Support;

use App\Models\Store;
use App\Models\StoreAiPayment;
use App\Models\StoreAiTrialUsage;
use App\Services\OpenAi\OpenAiAutomationService;
use App\Services\OpenAi\OpenAiConfigService;
use App\Services\OpenAi\OpenAiImageService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Store-facing AI Tools suite gate — per store_id, Master-owned payment + limits.
 * Gates: images (Gemini playground + OpenAI images), text, automation.
 * Includes 5-item Free Trial per store, payment proof verification, and limit increment.
 */
final class StoreAiSuiteAccess
{
    /** Payment / quota gates (not the same as SouqAiModules engine ids). */
    public const MODULES = ['images', 'text', 'automation'];

    public const FREE_TRIAL_LIMIT = 5;

    /**
     * Official Souq Bank details for manual transfers
     */
    public static function bankTransferDetails(): array
    {
        return [
            'bank_name_ar' => 'مصرف الراجحي',
            'bank_name_en' => 'Al Rajhi Bank',
            'beneficiary_name_ar' => 'منصة سوق للحلول التقنية (يونيتيك)',
            'beneficiary_name_en' => 'Souq Platform E-Commerce (Unityteck KSA)',
            'iban' => 'SA0380000456608010123456',
            'account_number' => '456608010123456',
            'stc_pay_phone' => '+966 50 123 4567',
            'vat_number' => '310123456700003',
        ];
    }

    /**
     * Payment packages shown in store popup with full limits info.
     *
     * @return list<array{id: string, level: string, label_en: string, label_ar: string, price_sar: int, includes_en: string, includes_ar: string, image_quota: int, text_tokens: int, auto_questions: int, calling_minutes: int}>
     */
    public static function paymentPackages(): array
    {
        return [
            [
                'id' => 'ai_starter',
                'level' => 'low',
                'label_en' => 'AI Starter',
                'label_ar' => 'ذكاء المبتدئ',
                'price_sar' => 99,
                'includes_en' => '50 Images/mo · 150,000 Text Tokens · 50 Automation Q&A · 30 Min Voice Calling',
                'includes_ar' => '50 صورة شهرياً · 150,000 رمز نصي · 50 سؤال أتمتة · 30 دقيقة مكالمات',
                'image_quota' => 50,
                'text_tokens' => 150000,
                'auto_questions' => 50,
                'calling_minutes' => 30,
            ],
            [
                'id' => 'ai_pro',
                'level' => 'medium',
                'label_en' => 'AI Growth Pro',
                'label_ar' => 'ذكاء النمو المتقدم',
                'price_sar' => 249,
                'includes_en' => '200 Images/mo · 500,000 Text Tokens · 200 Automation Q&A · 120 Min Voice Calling · Bug Fix Diagnostics',
                'includes_ar' => '200 صورة شهرياً · 500,000 رمز نصي · 200 سؤال أتمتة · 120 دقيقة مكالمات · تشخيص وإصلاح الأخطاء',
                'image_quota' => 200,
                'text_tokens' => 500000,
                'auto_questions' => 200,
                'calling_minutes' => 120,
            ],
            [
                'id' => 'ai_enterprise',
                'level' => 'high',
                'label_en' => 'AI Unlimited Scale',
                'label_ar' => 'الذكاء اللامحدود للمؤسسات',
                'price_sar' => 499,
                'includes_en' => '1,000 Images/mo · 2,000,000 Text Tokens · 1,000 Automation Q&A · 500 Min Voice Calling · Priority Support',
                'includes_ar' => '1,000 صورة شهرياً · 2,000,000 رمز نصي · 1,000 سؤال أتمتة · 500 دقيقة مكالمات · دعم فوري مخصص',
                'image_quota' => 1000,
                'text_tokens' => 2000000,
                'auto_questions' => 1000,
                'calling_minutes' => 500,
            ],
        ];
    }

    /**
     * Get or initialize 5-item Free Trial for store
     */
    public static function getOrCreateTrial(Store $store): StoreAiTrialUsage
    {
        try {
            $row = StoreAiTrialUsage::query()->withoutStoreScope()->where('store_id', $store->id)->first();
            if ($row) {
                return $row;
            }

            return StoreAiTrialUsage::query()->create([
                'id' => 'aitrial-'.Str::lower(Str::random(12)),
                'store_id' => $store->id,
                'trial_items_limit' => self::FREE_TRIAL_LIMIT,
                'trial_items_used' => 0,
                'status' => 'active',
            ]);
        } catch (\Throwable) {
            // Fallback object if table not yet migrated
            $obj = new StoreAiTrialUsage();
            $obj->id = 'aitrial-temp';
            $obj->store_id = $store->id;
            $obj->trial_items_limit = self::FREE_TRIAL_LIMIT;
            $obj->trial_items_used = 0;
            $obj->status = 'active';
            return $obj;
        }
    }

    /**
     * Record a trial item consumption
     */
    public static function recordTrialUse(Store $store): void
    {
        try {
            $trial = self::getOrCreateTrial($store);
            if ($trial->exists) {
                $newCount = $trial->trial_items_used + 1;
                $trial->trial_items_used = $newCount;
                if ($newCount >= $trial->trial_items_limit) {
                    $trial->status = 'exhausted';
                }
                $trial->save();
            }
        } catch (\Throwable) {
            // Silently ignore DB errors during trial update
        }
    }

    public static function isUnlocked(?bool $unlocked, mixed $until, string $paymentStatus): bool
    {
        if (! $unlocked) {
            return false;
        }
        if ($until) {
            try {
                if (Carbon::parse($until)->isPast()) {
                    return false;
                }
            } catch (\Throwable) {
                return false;
            }
        }

        return in_array($paymentStatus, ['paid', 'comped'], true) || (bool) $unlocked;
    }

    /**
     * @return array{ok: true, is_trial?: bool, trial_remaining?: int}|array{ok: false, code: string, message: string, payment_required: bool, module: string, is_trial?: bool, trial_remaining?: int}
     */
    public static function assertModule(Store $store, string $module): array
    {
        $module = in_array($module, self::MODULES, true) ? $module : 'text';
        $status = self::moduleStatus($store, $module);

        $unlocked = (bool) ($status['unlocked'] ?? false);
        $trial = self::getOrCreateTrial($store);
        $trialRemaining = max(0, (int) $trial->trial_items_limit - (int) $trial->trial_items_used);

        // If module is unlocked via paid subscription, proceed!
        if ($unlocked) {
            return ['ok' => true, 'is_trial' => false];
        }

        // If not paid, check 5-item Free Trial!
        if ($trialRemaining > 0) {
            return [
                'ok' => true,
                'is_trial' => true,
                'trial_remaining' => $trialRemaining,
                'trial_used' => (int) $trial->trial_items_used,
                'trial_limit' => (int) $trial->trial_items_limit,
            ];
        }

        return [
            'ok' => false,
            'code' => 'payment_required',
            'message' => 'Free trial limit reached (5/5 used). Please upgrade to a paid plan or submit payment proof to unlock full limits.',
            'message_ar' => 'لقد استنفدت التجربة المجانية (5 من 5). يرجى الترقية إلى باقة مدفوعة أو إرفاق إيصال الدفع لفتح كافة الميزات.',
            'payment_required' => true,
            'module' => $module,
            'is_trial' => true,
            'trial_remaining' => 0,
        ];
    }

    /**
     * Apply limits and unlock store after payment proof approval
     */
    public static function applyPaymentUnlock(Store $store, array $pkg): void
    {
        $now = Carbon::now();
        $until = $now->copy()->addDays(30);

        try {
            // 1. Text config unlock & limits
            $textConfigs = app(OpenAiConfigService::class);
            $textCfg = $textConfigs->forStore($store);
            $textCfg->enabled = true;
            $textCfg->usage_unlocked = true;
            $textCfg->payment_status = 'paid';
            $textCfg->payment_required_for_usage = false;
            $textCfg->usage_unlocked_until = $until;
            $textCfg->monthly_token_limit = (int) ($pkg['text_tokens'] ?? 500000);
            $textCfg->daily_token_limit = max(50000, (int) (($pkg['text_tokens'] ?? 500000) / 10));
            $textCfg->save();

            // 2. Images config unlock & limits
            $imgService = app(OpenAiImageService::class);
            $imgCfg = $imgService->forStore($store);
            $imgCfg->enabled = true;
            $imgCfg->usage_unlocked = true;
            $imgCfg->payment_status = 'paid';
            $imgCfg->payment_required_for_usage = false;
            $imgCfg->usage_unlocked_until = $until;
            $imgCfg->monthly_image_quota = (int) ($pkg['image_quota'] ?? 100);
            $imgCfg->save();

            // 3. Automation config unlock & limits
            $autoService = app(OpenAiAutomationService::class);
            $autoCfg = $autoService->forStore($store);
            $autoCfg->enabled = true;
            $autoCfg->usage_unlocked = true;
            $autoCfg->payment_status = 'paid';
            $autoCfg->payment_required_for_usage = false;
            $autoCfg->usage_unlocked_until = $until;
            $autoCfg->monthly_question_quota = (int) ($pkg['auto_questions'] ?? 100);
            $autoCfg->daily_question_quota = max(20, (int) (($pkg['auto_questions'] ?? 100) / 10));
            $autoCfg->save();

            // 4. Mark trial as paid/upgraded
            $trial = self::getOrCreateTrial($store);
            if ($trial->exists) {
                $trial->status = 'paid';
                $trial->save();
            }
        } catch (\Throwable $e) {
            \Log::error('Error applying AI payment unlock: '.$e->getMessage());
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function moduleStatus(Store $store, string $module): array
    {
        $configs = app(OpenAiConfigService::class);
        $pro = $configs->storeIsProEligible($store);

        if ($module === 'images') {
            $images = app(OpenAiImageService::class);
            $cfg = $images->forStore($store);
            $payRequired = (bool) $cfg->payment_required_for_usage;
            $unlocked = ! $payRequired || self::isUnlocked(
                (bool) $cfg->usage_unlocked,
                $cfg->usage_unlocked_until,
                (string) $cfg->payment_status,
            );
            $gemini = AiMediaCredits::snapshot($store);

            return [
                'module' => 'images',
                'pro_eligible' => $pro,
                'enabled' => (bool) $cfg->enabled || $unlocked,
                'unlocked' => $unlocked,
                'payment_status' => (string) $cfg->payment_status,
                'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
                'payment_required_for_usage' => $payRequired,
                'intelligence_level' => 'medium',
                'quality' => (string) $cfg->default_quality,
                'monthly_image_quota' => (int) $cfg->monthly_image_quota,
                'gemini_quota' => $gemini,
            ];
        }

        if ($module === 'automation') {
            $auto = app(OpenAiAutomationService::class);
            $cfg = $auto->forStore($store);
            $payRequired = (bool) $cfg->payment_required_for_usage;
            $unlocked = ! $payRequired || self::isUnlocked(
                (bool) $cfg->usage_unlocked,
                $cfg->usage_unlocked_until,
                (string) $cfg->payment_status,
            );

            return [
                'module' => 'automation',
                'pro_eligible' => $pro,
                'enabled' => (bool) $cfg->enabled,
                'unlocked' => $unlocked,
                'payment_status' => (string) $cfg->payment_status,
                'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
                'payment_required_for_usage' => $payRequired,
                'intelligence_level' => OpenAiLevels::normalize((string) $cfg->intelligence_level),
                'daily_question_quota' => (int) $cfg->daily_question_quota,
                'monthly_question_quota' => (int) $cfg->monthly_question_quota,
            ];
        }

        $cfg = $configs->forStore($store);
        $payRequired = (bool) $cfg->payment_required_for_usage;
        $unlocked = ! $payRequired || self::isUnlocked(
            (bool) $cfg->usage_unlocked,
            $cfg->usage_unlocked_until,
            (string) $cfg->payment_status,
        );

        return [
            'module' => 'text',
            'pro_eligible' => $pro,
            'enabled' => (bool) $cfg->enabled,
            'unlocked' => $unlocked,
            'payment_status' => (string) $cfg->payment_status,
            'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
            'payment_required_for_usage' => $payRequired,
            'intelligence_level' => OpenAiLevels::normalize((string) $cfg->intelligence_level),
            'daily_token_limit' => (int) $cfg->daily_token_limit,
            'monthly_token_limit' => (int) $cfg->monthly_token_limit,
            'level_catalog' => OpenAiLevels::catalog(),
        ];
    }

    /**
     * Full suite snapshot for the store AI Tools hub.
     *
     * @return array<string, mixed>
     */
    public static function suiteSnapshot(Store $store): array
    {
        $configs = app(OpenAiConfigService::class);
        $images = self::moduleStatus($store, 'images');
        $text = self::moduleStatus($store, 'text');
        $automation = self::moduleStatus($store, 'automation');

        $trial = self::getOrCreateTrial($store);
        $trialUsed = (int) $trial->trial_items_used;
        $trialLimit = (int) $trial->trial_items_limit;
        $trialRemaining = max(0, $trialLimit - $trialUsed);
        $hasActivePaid = (bool) ($text['unlocked'] || $images['unlocked'] || $automation['unlocked']);

        $engine = [];
        foreach (SouqAiModules::catalog() as $mod) {
            $gateKey = (string) ($mod['gate'] ?? SouqAiModules::GATE_NONE);
            $gateStatus = null;
            if ($gateKey === SouqAiModules::GATE_IMAGES) {
                $gateStatus = $images;
            } elseif ($gateKey === SouqAiModules::GATE_AUTOMATION) {
                $gateStatus = $automation;
            } elseif ($gateKey === SouqAiModules::GATE_TEXT) {
                $gateStatus = $text;
            }

            $unlocked = $gateStatus ? (bool) ($gateStatus['unlocked'] ?? false) : false;
            // Free trial unlocks all modules while credits remain!
            if (! $unlocked && $trialRemaining > 0) {
                $unlocked = true;
            }

            $engine[] = [
                'id' => $mod['id'],
                'name_en' => $mod['name_en'],
                'name_ar' => $mod['name_ar'],
                'description_en' => $mod['description_en'],
                'description_ar' => $mod['description_ar'],
                'status' => $mod['status'],
                'gate' => $gateKey,
                'provider' => $mod['provider'],
                'unlocked' => $unlocked,
                'pro_eligible' => true,
                'payment_status' => $gateStatus['payment_status'] ?? 'trial',
            ];
        }

        // Fetch recent payments for this store
        $payments = [];
        try {
            $payments = StoreAiPayment::query()
                ->withoutStoreScope()
                ->where('store_id', $store->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->toArray();
        } catch (\Throwable) {
            $payments = [];
        }

        return [
            'store_id' => $store->id,
            'pro_eligible' => true,
            'plan_code' => Plans::effectiveCode($store),
            'openai_key_configured' => $configs->apiKeyStatus()['configured'],
            'gemini_ready' => (bool) ($images['gemini_quota']['image_provider_ready'] ?? false),
            'trial' => [
                'limit' => $trialLimit,
                'used' => $trialUsed,
                'remaining' => $trialRemaining,
                'status' => $trial->status,
                'is_active' => $trialRemaining > 0,
                'is_paid' => $hasActivePaid,
            ],
            'bank_transfer_details' => self::bankTransferDetails(),
            'payments' => $payments,
            'modules' => [
                'images' => $images,
                'text' => $text,
                'automation' => $automation,
            ],
            'engine_modules' => $engine,
            'payment_packages' => self::paymentPackages(),
            'addons' => array_values(array_filter(
                SouqAddOns::forStore($store),
                static fn (array $row) => in_array((string) ($row['category'] ?? ''), ['ai', 'credits'], true)
                    || str_starts_with((string) ($row['id'] ?? ''), 'addon-ai')
            )),
            'levels' => OpenAiLevels::catalog(),
            'master_owned' => true,
            'note_en' => 'All stores start with 5 Free Trial items. Upgrade to a paid plan with proof of payment to unlock full capacities.',
            'note_ar' => 'تبدأ جميع المتاجر بـ 5 عناصر تجريبية مجانية. قم بالترقية وإرفاق إيصال التحويل لفتح السعات العالية.',
        ];
    }

    /**
     * When Master raises paid capacity, force re-payment (lock usage again).
     *
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @param  list<string>  $limitKeys
     */
    public static function shouldRelockForLimitRaise(array $before, array $after, array $limitKeys): bool
    {
        foreach ($limitKeys as $key) {
            if (! array_key_exists($key, $after)) {
                continue;
            }
            $old = (float) ($before[$key] ?? 0);
            $new = (float) $after[$key];
            if ($new > $old + 0.00001) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function applyRelockPayload(array $payload): array
    {
        $payload['usage_unlocked'] = false;
        $payload['payment_status'] = 'unpaid';
        $payload['usage_unlocked_until'] = null;
        if (! array_key_exists('payment_required_for_usage', $payload)) {
            $payload['payment_required_for_usage'] = true;
        }

        return $payload;
    }
}

