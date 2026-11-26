<?php
/**
 * Souq marketplace (plans / themes / add-ons) — Hostinger gateway parity with Laravel SouqMarketplaceController.
 * CT-5/6/7 · docs/36 · price-first, zero mock.
 */
declare(strict_types=1);

function souq_mp_billing_periods(): array
{
    return [
        ['months' => 1, 'discount_pct' => 0, 'label_en' => '1 month', 'label_ar' => 'شهر واحد'],
        ['months' => 6, 'discount_pct' => 15, 'label_en' => '6 months (−15%)', 'label_ar' => '٦ أشهر (خصم ١٥٪)'],
        ['months' => 12, 'discount_pct' => 25, 'label_en' => '12 months (−25%)', 'label_ar' => '١٢ شهراً (خصم ٢٥٪)'],
    ];
}

function souq_mp_price_for_period(int $monthlySar, int $months): array
{
    $months = in_array($months, [1, 6, 12], true) ? $months : 1;
    $pct = 0;
    foreach (souq_mp_billing_periods() as $p) {
        if ((int) $p['months'] === $months) {
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
        'currency' => 'SAR',
    ];
}

function souq_mp_hosting_catalog(): array
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
            'limited_slots' => 20,
        ],
    ];
}

function souq_mp_addons_catalog(): array
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
            'description_en' => 'Sales agent + outreach assist. Master sets limits after payment.',
            'description_ar' => 'وكيل مبيعات ومساعدة تواصل. الماستر يضبط الحدود بعد الدفع.',
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
            'description_en' => 'Product photoshoot and creatives (credits).',
            'description_ar' => 'تصوير المنتجات والإبداعات (رصيد).',
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
            'description_en' => 'Dedicated voice minutes pack — Master unlock after payment.',
            'description_ar' => 'حزمة دقائق صوتية — يفتحها الماستر بعد الدفع.',
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

function souq_mp_common_themes(): array
{
    return [
        [
            'id' => 'theme-souq-common-retail',
            'name' => 'Souq Common Retail',
            'name_ar' => 'سوق المشترك — تجزئة',
            'category' => 'General',
            'tier' => 'basic',
            'price_sar' => 0,
            'included_in_tiers' => ['starter', 'pro', 'premium', 'custom', 'free', 'paid'],
            'preview_color' => '#0f766e',
            'is_default' => true,
        ],
        [
            'id' => 'theme-souq-common-catalog',
            'name' => 'Souq Common Catalog',
            'name_ar' => 'سوق المشترك — كتالوج',
            'category' => 'General',
            'tier' => 'full',
            'price_sar' => 79,
            'included_in_tiers' => ['pro', 'premium', 'custom'],
            'preview_color' => '#1e3a5f',
            'is_default' => false,
        ],
        [
            'id' => 'theme-souq-common-services',
            'name' => 'Souq Common Services',
            'name_ar' => 'سوق المشترك — خدمات',
            'category' => 'Services',
            'tier' => 'full',
            'price_sar' => 79,
            'included_in_tiers' => ['pro', 'premium', 'custom'],
            'preview_color' => '#7c2d12',
            'is_default' => false,
        ],
        [
            'id' => 'theme-souq-common-boutique',
            'name' => 'Souq Common Boutique',
            'name_ar' => 'سوق المشترك — بوتيك',
            'category' => 'Luxury',
            'tier' => 'full',
            'price_sar' => 149,
            'included_in_tiers' => ['premium', 'custom'],
            'preview_color' => '#581c87',
            'is_default' => false,
        ],
    ];
}

/** @return list<array<string, mixed>> */
function souq_mp_plans_with_periods(): array
{
    $catalog = function_exists('souq_plans_catalog') ? souq_plans_catalog() : [];
    $out = [];
    foreach ($catalog as $plan) {
        $code = (string) ($plan['code'] ?? '');
        if (!in_array($code, ['starter', 'pro', 'premium', 'free'], true)) {
            continue;
        }
        $monthly = $plan['price_sar'] ?? null;
        $periods = [];
        if ($monthly !== null && is_numeric($monthly) && (float) $monthly > 0) {
            foreach ([1, 6, 12] as $m) {
                $periods[] = souq_mp_price_for_period((int) $monthly, $m);
            }
        }
        $out[] = [
            'code' => $code,
            'name' => $plan['name'] ?? $code,
            'name_ar' => $plan['name_ar'] ?? null,
            'price_sar' => $monthly === null ? null : (is_numeric($monthly) ? (float) $monthly : null),
            'currency' => 'SAR',
            'features' => $plan['features'] ?? [],
            'billing_periods' => $periods,
            'includes_free_hosting_domain' => $code === 'premium',
            'free_hosting_note_en' => $code === 'premium'
                ? 'Hostinger hosting + domain free for the first 20 Premium stores (Master-approved).'
                : null,
            'free_hosting_note_ar' => $code === 'premium'
                ? 'استضافة هوستنجر والنطاق مجاناً لأول ٢٠ متجراً على الباقة المميزة (بعد موافقة الماستر).'
                : null,
        ];
    }

    return $out;
}

function souq_mp_public_addons(): array
{
    $out = [];
    foreach (souq_mp_addons_catalog() as $row) {
        $periods = [];
        if (($row['billing'] ?? '') === 'monthly' && (int) ($row['price_sar'] ?? 0) > 0) {
            foreach ([1, 6, 12] as $m) {
                $periods[] = souq_mp_price_for_period((int) $row['price_sar'], $m);
            }
        }
        $out[] = array_merge($row, [
            'currency' => 'SAR',
            'unlocked' => false,
            'lock_reason' => 'login_required',
            'billing_periods' => $periods,
            'master_must_approve' => true,
        ]);
    }

    return $out;
}

function souq_mp_free_hosting_slots(PDO $pdo): int
{
    $total = 20;
    if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'stores')) {
        return $total;
    }
    try {
        $used = 0;
        $cols = $pdo->query('SHOW COLUMNS FROM stores')->fetchAll(PDO::FETCH_COLUMN) ?: [];
        if (in_array('hosting_comped', $cols, true)) {
            $st = $pdo->query("SELECT COUNT(*) FROM stores WHERE (plan = 'premium' OR master_granted_pro = 1) AND hosting_comped = 1");
            $used = (int) ($st ? $st->fetchColumn() : 0);
        } elseif (in_array('hosting_id', $cols, true)) {
            $st = $pdo->query("SELECT COUNT(*) FROM stores WHERE (plan = 'premium' OR COALESCE(master_granted_pro,0) = 1) AND hosting_id IS NOT NULL AND hosting_id != ''");
            $used = (int) ($st ? $st->fetchColumn() : 0);
        }

        return max(0, $total - $used);
    } catch (Throwable) {
        return $total;
    }
}

function souq_mp_inactivity_policy(): array
{
    return [
        'warning_1_days' => 30,
        'warning_2_days' => 60,
        'terminate_days' => 90,
        'note_en' => 'Month 1 unused → warning. Month 2 → second warning. Then Master may terminate.',
        'note_ar' => 'شهر دون استخدام ← تحذير. الشهر الثاني ← تحذير ثانٍ. ثم قد يُنهي الماستر المتجر.',
    ];
}

function souq_mp_inactivity_for_store(PDO $pdo, string $storeId): array
{
    $days = 0;
    try {
        if (souq_table_exists($pdo, 'stores') && $storeId !== '') {
            $st = $pdo->prepare('SELECT * FROM stores WHERE id = ? LIMIT 1');
            $st->execute([$storeId]);
            $row = $st->fetch(PDO::FETCH_ASSOC) ?: null;
            if ($row) {
                $ts = null;
                foreach (['last_activity_at', 'updated_at', 'created_at'] as $col) {
                    if (!empty($row[$col])) {
                        $ts = strtotime((string) $row[$col]);
                        if ($ts !== false) {
                            break;
                        }
                    }
                }
                if ($ts) {
                    $days = (int) floor((time() - $ts) / 86400);
                }
            }
        }
    } catch (Throwable) {
        $days = 0;
    }

    if ($days >= 90) {
        return [
            'status' => 'terminate',
            'days_inactive' => $days,
            'next_action_en' => 'Store eligible for termination after 90 days of inactivity. Master must confirm.',
            'next_action_ar' => 'المتجر مؤهل للإنهاء بعد ٩٠ يوماً من عدم النشاط. يلزم تأكيد الماستر.',
        ];
    }
    if ($days >= 60) {
        return [
            'status' => 'warning_2',
            'days_inactive' => $days,
            'next_action_en' => 'Second warning: inactive 60+ days. Terminate after 90 days if unused.',
            'next_action_ar' => 'تحذير ثانٍ: عدم نشاط ٦٠+ يوماً. الإنهاء بعد ٩٠ يوماً إن استمر.',
        ];
    }
    if ($days >= 30) {
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

function souq_mp_plan_code(PDO $pdo, string $storeId): string
{
    if (function_exists('souq_store_plan_code')) {
        return strtolower((string) souq_store_plan_code($pdo, $storeId));
    }
    try {
        $st = $pdo->prepare('SELECT plan FROM stores WHERE id = ? LIMIT 1');
        $st->execute([$storeId]);
        $code = strtolower(trim((string) ($st->fetchColumn() ?: 'free')));

        return in_array($code, ['free', 'paid', 'starter', 'pro', 'premium', 'custom'], true) ? $code : 'free';
    } catch (Throwable) {
        return 'free';
    }
}

function souq_mp_addons_for_store(PDO $pdo, string $storeId): array
{
    $plan = souq_mp_plan_code($pdo, $storeId);
    $rank = match ($plan) {
        'free' => 0,
        'paid' => 1,
        'starter' => 2,
        'pro' => 3,
        'premium' => 4,
        'custom' => 5,
        default => 0,
    };
    $out = [];
    foreach (souq_mp_addons_catalog() as $row) {
        $minRank = match ((string) ($row['min_plan'] ?? 'starter')) {
            'free' => 0,
            'paid' => 1,
            'starter' => 2,
            'pro' => 3,
            'premium' => 4,
            'custom' => 5,
            default => 2,
        };
        $planOk = $rank >= $minRank || $plan === 'custom';
        $unlocked = false;
        if ($row['feature_flag'] && $planOk && in_array($plan, ['pro', 'premium', 'custom'], true)) {
            $unlocked = true;
        }
        if (in_array($row['id'], ['addon-ai-calling', 'addon-ai-video', 'addon-ai-credits-pack'], true)) {
            $unlocked = false;
        }
        $periods = [];
        if (($row['billing'] ?? '') === 'monthly' && (int) ($row['price_sar'] ?? 0) > 0) {
            foreach ([1, 6, 12] as $m) {
                $periods[] = souq_mp_price_for_period((int) $row['price_sar'], $m);
            }
        }
        $out[] = array_merge($row, [
            'currency' => 'SAR',
            'unlocked' => $unlocked,
            'lock_reason' => $unlocked ? null : (!$planOk ? 'upgrade_plan' : 'purchase_required'),
            'plan_code' => $plan,
            'billing_periods' => $periods,
            'master_must_approve' => true,
        ]);
    }

    return $out;
}

function souq_mp_public_themes(PDO $pdo): array
{
    $static = souq_mp_common_themes();
    if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'themes_catalog')) {
        return array_map(static function (array $t) {
            return array_merge($t, [
                'currency' => 'SAR',
                'unlocked' => false,
                'lock_reason' => 'login_required',
            ]);
        }, $static);
    }

    try {
        $rows = $pdo->query('SELECT * FROM themes_catalog ORDER BY is_default DESC, name ASC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if (!$rows) {
            $rows = $static;
        }
        $out = [];
        foreach ($rows as $t) {
            $tiers = $t['included_in_tiers'] ?? [];
            if (is_string($tiers)) {
                $decoded = json_decode($tiers, true);
                $tiers = is_array($decoded) ? $decoded : [];
            }
            $out[] = [
                'id' => $t['id'] ?? '',
                'name' => $t['name'] ?? '',
                'name_ar' => $t['name_ar'] ?? null,
                'category' => $t['category'] ?? null,
                'tier' => $t['tier'] ?? null,
                'price_sar' => isset($t['price_sar']) && $t['price_sar'] !== null ? (int) $t['price_sar'] : null,
                'currency' => 'SAR',
                'included_in_tiers' => $tiers,
                'preview_color' => $t['preview_color'] ?? null,
                'is_default' => (bool) ($t['is_default'] ?? false),
                'unlocked' => false,
                'lock_reason' => 'login_required',
            ];
        }

        return $out;
    } catch (Throwable) {
        return array_map(static function (array $t) {
            return array_merge($t, [
                'currency' => 'SAR',
                'unlocked' => false,
                'lock_reason' => 'login_required',
            ]);
        }, $static);
    }
}

function souq_mp_marketing_bundle(PDO $pdo): array
{
    return [
        'plans' => souq_mp_plans_with_periods(),
        'billing_periods' => souq_mp_billing_periods(),
        'hosting' => souq_mp_hosting_catalog(),
        'free_hosting_slots_remaining' => souq_mp_free_hosting_slots($pdo),
        'free_hosting_slots_total' => 20,
        'inactivity' => souq_mp_inactivity_policy(),
        'addons' => souq_mp_public_addons(),
        'currency' => 'SAR',
        'master_approves_unlock' => true,
    ];
}

function souq_mp_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (function_exists('souq_table_exists') && !souq_table_exists($pdo, 'store_theme_entitlements')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `store_theme_entitlements` (
                    `id` varchar(64) NOT NULL,
                    `store_id` varchar(64) NOT NULL,
                    `theme_id` varchar(64) NOT NULL,
                    `source` varchar(32) NOT NULL DEFAULT 'purchase',
                    `price_sar` int unsigned NULL DEFAULT NULL,
                    `granted_by` varchar(64) NULL DEFAULT NULL,
                    `created_at` timestamp NULL DEFAULT NULL,
                    `updated_at` timestamp NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `ste_store_theme_unique` (`store_id`,`theme_id`),
                    KEY `ste_store_id_index` (`store_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (function_exists('souq_table_exists') && souq_table_exists($pdo, 'themes_catalog')) {
            foreach (souq_mp_common_themes() as $t) {
                $st = $pdo->prepare('SELECT id FROM themes_catalog WHERE id = ? LIMIT 1');
                $st->execute([$t['id']]);
                $exists = (bool) $st->fetchColumn();
                $tiers = json_encode($t['included_in_tiers'], JSON_UNESCAPED_UNICODE);
                if ($exists) {
                    $upd = $pdo->prepare(
                        'UPDATE themes_catalog SET name = ?, category = ?, tier = ?, preview_color = ?, is_default = ? WHERE id = ?'
                    );
                    $upd->execute([
                        $t['name'],
                        $t['category'],
                        $t['tier'],
                        $t['preview_color'],
                        $t['is_default'] ? 1 : 0,
                        $t['id'],
                    ]);
                } else {
                    $ins = $pdo->prepare(
                        'INSERT INTO themes_catalog (id, name, category, tier, preview_color, is_default) VALUES (?, ?, ?, ?, ?, ?)'
                    );
                    $ins->execute([
                        $t['id'],
                        $t['name'],
                        $t['category'],
                        $t['tier'],
                        $t['preview_color'],
                        $t['is_default'] ? 1 : 0,
                    ]);
                }
                // Best-effort optional columns
                try {
                    $pdo->prepare('UPDATE themes_catalog SET name_ar = ?, price_sar = ?, included_in_tiers = ? WHERE id = ?')
                        ->execute([$t['name_ar'], $t['price_sar'], $tiers, $t['id']]);
                } catch (Throwable) {
                    /* columns may be missing until SQL 14 applied */
                }
            }
            // Platform default for NEW stores = common retail only (flagships keep own store_themes rows)
            try {
                $pdo->exec("UPDATE themes_catalog SET is_default = 0 WHERE id <> 'theme-souq-common-retail'");
                $pdo->exec("UPDATE themes_catalog SET is_default = 1 WHERE id = 'theme-souq-common-retail'");
            } catch (Throwable) {
                /* ignore */
            }
        }
        if (function_exists('souq_table_exists') && souq_table_exists($pdo, 'plans')) {
            $now = date('Y-m-d H:i:s');
            $features = json_encode([
                'catalog', 'orders', 'basic_seo', 'seo', 'coupons', 'shipping',
                'themes_basic', 'media_studio', 'whatsapp',
            ]);
            try {
                $pdo->prepare(
                    "INSERT INTO plans (id, code, name, price_sar, product_limit, storage_mb, team_seats, features, is_active, created_at, updated_at)
                     VALUES ('plan-starter','starter','Starter',100,250,2048,2,?,1,?,?)
                     ON DUPLICATE KEY UPDATE name=VALUES(name), price_sar=VALUES(price_sar), product_limit=VALUES(product_limit),
                       storage_mb=VALUES(storage_mb), team_seats=VALUES(team_seats), features=VALUES(features), is_active=1, updated_at=VALUES(updated_at)"
                )->execute([$features, $now, $now]);
            } catch (Throwable) {
                /* ignore */
            }
        }
    } catch (Throwable) {
        /* degrade — handlers still return static catalogs */
    }
}

/**
 * @return bool true if request handled
 */
function souq_marketplace_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!str_starts_with($uri, '/storefront/marketplace') && $uri !== '/marketplace/addons' && !str_starts_with($uri, '/marketplace/themes/')) {
        return false;
    }

    souq_mp_ensure_schema($pdo);

    if ($uri === '/storefront/marketplace/plans' && $method === 'GET') {
        echo json_encode([
            'success' => true,
            'data' => souq_mp_plans_with_periods(),
            'billing_periods' => souq_mp_billing_periods(),
            'hosting' => souq_mp_hosting_catalog(),
            'free_hosting_slots_remaining' => souq_mp_free_hosting_slots($pdo),
            'inactivity' => souq_mp_inactivity_policy(),
            'platform' => [
                'name_en' => 'Souq Platform',
                'name_ar' => 'منصة سوق',
            ],
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    if ($uri === '/storefront/marketplace/themes' && $method === 'GET') {
        echo json_encode([
            'success' => true,
            'data' => souq_mp_public_themes($pdo),
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    if ($uri === '/storefront/marketplace/addons' && $method === 'GET') {
        echo json_encode([
            'success' => true,
            'data' => souq_mp_public_addons(),
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    if ($uri === '/storefront/marketplace/bundle' && $method === 'GET') {
        echo json_encode([
            'success' => true,
            'data' => souq_mp_marketing_bundle($pdo),
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    if ($uri === '/marketplace/addons' && $method === 'GET') {
        $sid = trim($storeId !== '' ? $storeId : (string) ($_GET['store_id'] ?? ($input['store_id'] ?? '')));
        if ($sid === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'store_id is required.']);

            return true;
        }
        echo json_encode([
            'success' => true,
            'data' => souq_mp_addons_for_store($pdo, $sid),
            'plans' => souq_mp_plans_with_periods(),
            'billing_periods' => souq_mp_billing_periods(),
            'hosting' => souq_mp_hosting_catalog(),
            'inactivity' => souq_mp_inactivity_for_store($pdo, $sid),
            'free_hosting_slots_remaining' => souq_mp_free_hosting_slots($pdo),
            'store_id' => $sid,
            'plan_code' => souq_mp_plan_code($pdo, $sid),
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    if (preg_match('#^/marketplace/themes/([^/]+)/purchase$#', $uri, $m) && $method === 'POST') {
        $themeId = rawurldecode($m[1]);
        $sid = trim($storeId !== '' ? $storeId : (string) ($input['store_id'] ?? ($_GET['store_id'] ?? '')));
        if ($sid === '') {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'store_id is required.']);

            return true;
        }
        $confirm = !empty($input['confirm_payment']);
        $source = (string) ($input['source'] ?? 'purchase');
        if ($source === 'purchase' && !$confirm) {
            echo json_encode([
                'success' => true,
                'pending_payment' => true,
                'theme_id' => $themeId,
                'currency' => 'SAR',
                'message' => 'Payment required. Master unlocks after payment confirmation.',
                'message_ar' => 'الدفع مطلوب. الماستر يفتح القالب بعد تأكيد الدفع.',
                'store_id' => $sid,
            ], JSON_UNESCAPED_UNICODE);

            return true;
        }
        if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'store_theme_entitlements')) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Theme entitlements table missing.']);

            return true;
        }
        try {
            $id = 'ste-' . bin2hex(random_bytes(8));
            $now = date('Y-m-d H:i:s');
            $st = $pdo->prepare(
                'INSERT INTO store_theme_entitlements (id, store_id, theme_id, source, price_sar, granted_by, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE source = VALUES(source), updated_at = VALUES(updated_at)'
            );
            $st->execute([$id, $sid, $themeId, $source, null, null, $now, $now]);
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'theme_id' => $themeId,
                'store_id' => $sid,
                'unlocked' => true,
                'data' => ['id' => $id, 'store_id' => $sid, 'theme_id' => $themeId, 'source' => $source],
            ], JSON_UNESCAPED_UNICODE);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Could not grant theme.']);
        }

        return true;
    }

    return false;
}
