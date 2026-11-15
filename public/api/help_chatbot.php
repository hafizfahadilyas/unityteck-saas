<?php

/**
 * Store Help Chatbot — AI first, human Master handoff, per store_id.
 * Voice/image handled on client; server stores text + attachment URLs + Gemini replies.
 */

function souq_help_chat_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function souq_ensure_help_chat_tables(PDO $pdo): void
{
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (!function_exists('souq_table_exists')) {
            return;
        }

        if (!souq_table_exists($pdo, 'help_chatbot_settings')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_chatbot_settings` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `enabled` TINYINT(1) NOT NULL DEFAULT 1,
                    `bot_name_en` VARCHAR(120) NOT NULL DEFAULT 'Souq Master Admin',
                    `bot_name_ar` VARCHAR(120) NOT NULL DEFAULT 'إدارة سوق الرئيسية',
                    `welcome_en` TEXT NULL,
                    `welcome_ar` TEXT NULL,
                    `system_prompt_en` TEXT NULL,
                    `system_prompt_ar` TEXT NULL,
                    `voice_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                    `image_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                    `human_handoff_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                    `primary_color` VARCHAR(32) NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `help_chatbot_settings_store_idx` (`store_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'help_chat_sessions')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_chat_sessions` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `requester_name` VARCHAR(191) NULL,
                    `requester_email` VARCHAR(191) NULL,
                    `locale` VARCHAR(8) NOT NULL DEFAULT 'en',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'ai_active',
                    `satisfaction` VARCHAR(32) NULL,
                    `subject` VARCHAR(255) NULL,
                    `ticket_id` VARCHAR(64) NULL,
                    `last_message_at` TIMESTAMP NULL DEFAULT NULL,
                    `escalated_at` TIMESTAMP NULL DEFAULT NULL,
                    `resolved_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `help_chat_sessions_store_idx` (`store_id`, `status`, `updated_at`),
                    KEY `help_chat_sessions_status_idx` (`status`, `escalated_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'help_chat_messages')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_chat_messages` (
                    `id` VARCHAR(64) NOT NULL,
                    `session_id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `role` VARCHAR(24) NOT NULL,
                    `body` TEXT NOT NULL,
                    `attachment_url` TEXT NULL,
                    `attachment_type` VARCHAR(32) NULL,
                    `meta_json` JSON NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `help_chat_messages_session_idx` (`session_id`, `created_at`),
                    KEY `help_chat_messages_store_idx` (`store_id`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        // Monthly AI reply quota per store (Free = 0 · Paid 100 · Pro 300 · Premium/Custom 500)
        if (!souq_table_exists($pdo, 'help_chat_ai_usage')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_chat_ai_usage` (
                    `store_id` VARCHAR(64) NOT NULL,
                    `period_key` VARCHAR(16) NOT NULL,
                    `replies_used` INT NOT NULL DEFAULT 0,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`store_id`, `period_key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'help_kb_articles')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_kb_articles` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `category` VARCHAR(64) NOT NULL DEFAULT 'general',
                    `title_en` VARCHAR(255) NOT NULL,
                    `title_ar` VARCHAR(255) NOT NULL,
                    `body_en` TEXT NOT NULL,
                    `body_ar` TEXT NOT NULL,
                    `suggested` TINYINT(1) NOT NULL DEFAULT 0,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'published',
                    `sort_order` INT NOT NULL DEFAULT 0,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `help_kb_store_idx` (`store_id`, `status`, `sort_order`),
                    KEY `help_kb_suggested_idx` (`suggested`, `status`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        // Session intent: ask_ai | fix_problem | contact_human
        if (souq_table_exists($pdo, 'help_chat_sessions') && function_exists('souq_table_has_column')) {
            if (!souq_table_has_column($pdo, 'help_chat_sessions', 'intent')) {
                try {
                    $pdo->exec("ALTER TABLE `help_chat_sessions` ADD COLUMN `intent` VARCHAR(32) NULL DEFAULT 'ask_ai' AFTER `locale`");
                } catch (Throwable) {
                }
            }
            if (!souq_table_has_column($pdo, 'help_chat_sessions', 'assignee')) {
                try {
                    $pdo->exec("ALTER TABLE `help_chat_sessions` ADD COLUMN `assignee` VARCHAR(191) NULL AFTER `ticket_id`");
                } catch (Throwable) {
                }
            }
        }

        souq_help_kb_seed_defaults($pdo);
    } catch (Throwable) {
        // keep gateway alive if DDL blocked
    }
}

/** Platform FAQ / knowledge base defaults (Souq docs — not store commerce fake data). */
function souq_help_kb_seed_defaults(PDO $pdo): void
{
    try {
        if (!souq_table_exists($pdo, 'help_kb_articles')) {
            return;
        }
        $count = (int) $pdo->query("SELECT COUNT(*) FROM help_kb_articles WHERE store_id IS NULL")->fetchColumn();
        if ($count > 0) {
            return;
        }
        $now = date('Y-m-d H:i:s');
        $rows = [
            ['kb-products', 'products', 'How do I add a product?', 'كيف أضيف منتجاً؟',
                "1) Open Products from the store sidebar.\n2) Click Add Product.\n3) Fill English and Arabic names, price (SAR), images, and stock.\n4) Save. The catalog updates for this store_id only.",
                "١) افتح المنتجات من القائمة الجانبية.\n٢) اضغط إضافة منتج.\n٣) عبّئ الاسم بالإنجليزية والعربية والسعر (ر.س) والصور والمخزون.\n٤) احفظ. يظهر الكتالوج لهذا المتجر فقط.", 1, 10],
            ['kb-orders', 'orders', 'Where do I manage orders?', 'أين أدير الطلبات؟',
                "Open Orders. Use search, status filters, and date range. Update fulfillment status from the order drawer. Empty list means no real orders yet.",
                "افتح الطلبات. استخدم البحث وفلاتر الحالة والتاريخ. حدّث حالة التنفيذ من درج الطلب. القائمة الفارغة تعني عدم وجود طلبات حقيقية بعد.", 1, 20],
            ['kb-shipping', 'shipping', 'How do shipping zones work?', 'كيف تعمل مناطق الشحن؟',
                "Go to Shipping. Add zones for Saudi cities, set rates, and enable methods. Zones are isolated per store_id.",
                "اذهب إلى الشحن. أضف مناطق لمدن المملكة وحدّد الأسعار وفعّل الطرق. المناطق معزولة لكل متجر.", 1, 30],
            ['kb-whatsapp', 'messaging', 'WhatsApp not connected', 'واتساب غير متصل',
                "Open WhatsApp Manager. Connect credentials for this store only. If status is Not Connected, messages will not send — never invent a connected state.",
                "افتح إدارة واتساب. اربط بيانات الاعتماد لهذا المتجر فقط. إذا كانت الحالة غير متصل فلن تُرسل الرسائل — لا تختلق حالة اتصال.", 1, 40],
            ['kb-theme', 'themes', 'How do I customize the theme?', 'كيف أخصص السمة؟',
                "Use Themes → Customize / Page Builder. Edit text and images, then Publish. Draft is not public until publish.",
                "استخدم السمات ← تخصيص / منشئ الصفحات. عدّل النصوص والصور ثم انشر. المسودة ليست عامة حتى النشر.", 1, 50],
            ['kb-login', 'account', 'Store login email issues', 'مشاكل بريد تسجيل الدخول',
                "Only Master SuperAdmin can change the store login email or set Active/Inactive. Merchants cannot change login email from Settings.",
                "فقط الإدارة العليا تغيّر بريد تسجيل دخول المتجر أو تفعّله/تعطّله. التاجر لا يغيّر بريد الدخول من الإعدادات.", 1, 60],
            ['kb-ai-plan', 'billing', 'AI Help Chat plan limits', 'حدود محادثة المساعدة بالذكاء الاصطناعي',
                "Free: Souq Master Admin welcome, then wait for human reply (leave your problem). Paid: 100 AI replies/month. Pro: 300. Premium/Custom: 500. Quotas reset monthly (Asia/Riyadh).",
                "المجاني: ترحيب من إدارة سوق الرئيسية ثم انتظار رد بشري (اترك مشكلتك). المدفوع: ١٠٠ رد/شهر. الاحترافي: ٣٠٠. المميز/المخصص: ٥٠٠. تتجدد الحصة شهرياً (توقيت الرياض).", 1, 70],
            ['kb-escalation', 'support', 'When to contact human support', 'متى أتواصل مع الدعم البشري',
                "On Free, leave your problem after the welcome and wait for Souq Master Admin. On paid plans, if AI cannot solve it, switch to Master. Full chat history and attachments go to Master Support.",
                "على المجاني اترك مشكلتك بعد الترحيب وانتظر إدارة سوق الرئيسية. على الخطط المدفوعة إذا لم يحل الرد الآلي المشكلة انتقل إلى الإدارة. يُرسل سجل المحادثة والمرفقات إلى دعم الإدارة.", 0, 80],
        ];
        $ins = $pdo->prepare(
            'INSERT INTO help_kb_articles
                (id, store_id, category, title_en, title_ar, body_en, body_ar, suggested, status, sort_order, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        foreach ($rows as $r) {
            $ins->execute([
                $r[0], null, $r[1], $r[2], $r[3], $r[4], $r[5], $r[6], 'published', $r[7], $now, $now,
            ]);
        }
    } catch (Throwable) {
    }
}

/** @return list<array<string,mixed>> */
function souq_help_kb_list(PDO $pdo, ?string $storeId = null, bool $suggestedOnly = false, int $limit = 50): array
{
    $limit = max(1, min(200, $limit));
    $sql = "SELECT * FROM help_kb_articles WHERE status = 'published' AND (store_id IS NULL";
    $params = [];
    if ($storeId) {
        $sql .= ' OR store_id = ?';
        $params[] = $storeId;
    }
    $sql .= ')';
    if ($suggestedOnly) {
        $sql .= ' AND suggested = 1';
    }
    $sql .= ' ORDER BY sort_order ASC, created_at DESC LIMIT ' . (int) $limit;
    try {
        $st = $pdo->prepare($sql);
        $st->execute($params);
        return $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Throwable) {
        return [];
    }
}

function souq_help_kb_context_blob(PDO $pdo, ?string $storeId, string $locale): string
{
    $rows = souq_help_kb_list($pdo, $storeId, false, 12);
    if (!$rows) {
        return '';
    }
    $wantAr = str_starts_with(strtolower($locale), 'ar');
    $lines = [];
    foreach ($rows as $r) {
        $t = $wantAr ? (string) ($r['title_ar'] ?: $r['title_en']) : (string) ($r['title_en'] ?: $r['title_ar']);
        $b = $wantAr ? (string) ($r['body_ar'] ?: $r['body_en']) : (string) ($r['body_en'] ?: $r['body_ar']);
        $lines[] = "- {$t}: " . mb_substr(preg_replace('/\s+/', ' ', $b) ?? '', 0, 280);
    }
    return implode("\n", $lines);
}

/**
 * @return array{plan_code:string,ai_enabled:bool,human_enabled:bool,limit:int,used:int,remaining:int,period_key:string}
 */
function souq_help_support_entitlement(PDO $pdo, string $storeId): array
{
    $base = souq_help_chat_ai_entitlement($pdo, $storeId);
    // Human support available for all plans; AI only for paid tiers.
    $base['human_enabled'] = true;
    return $base;
}

/**
 * Free = no AI chat. Paid=100 / Pro=300 / Premium|Custom=500 AI replies per month (Asia/Riyadh).
 *
 * @return array{plan_code:string,ai_enabled:bool,limit:int,used:int,remaining:int,period_key:string}
 */
function souq_help_chat_ai_entitlement(PDO $pdo, string $storeId): array
{
    $plan = function_exists('souq_store_plan_code') ? souq_store_plan_code($pdo, $storeId) : 'free';
    $limit = match ($plan) {
        'paid' => 100,
        'pro' => 300,
        'premium', 'custom' => 500,
        default => 0, // free
    };
    $period = function_exists('souq_ai_period_key') ? souq_ai_period_key() : date('Y-m');
    $used = 0;
    try {
        $st = $pdo->prepare('SELECT replies_used FROM help_chat_ai_usage WHERE store_id = ? AND period_key = ?');
        $st->execute([$storeId, $period]);
        $used = (int) ($st->fetchColumn() ?: 0);
    } catch (Throwable) {
        $used = 0;
    }

    return [
        'plan_code' => $plan,
        'ai_enabled' => $limit > 0,
        'limit' => $limit,
        'used' => $used,
        'remaining' => max(0, $limit - $used),
        'period_key' => $period,
    ];
}

function souq_help_chat_ai_consume(PDO $pdo, string $storeId): void
{
    $period = function_exists('souq_ai_period_key') ? souq_ai_period_key() : date('Y-m');
    $now = date('Y-m-d H:i:s');
    try {
        $pdo->prepare(
            'INSERT INTO help_chat_ai_usage (store_id, period_key, replies_used, updated_at)
             VALUES (?,?,1,?)
             ON DUPLICATE KEY UPDATE replies_used = replies_used + 1, updated_at = VALUES(updated_at)'
        )->execute([$storeId, $period, $now]);
    } catch (Throwable) {
    }
}

/** @return array<string,mixed> */
function souq_help_chat_default_settings(?string $storeId = null): array
{
    return [
        'id' => $storeId ? ('store-' . $storeId) : 'global',
        'store_id' => $storeId,
        'enabled' => 1,
        'bot_name_en' => 'Souq Master Admin',
        'bot_name_ar' => 'إدارة سوق الرئيسية',
        'welcome_en' => 'Welcome, any help?',
        'welcome_ar' => 'مرحباً، هل تحتاج مساعدة؟',
        'system_prompt_en' => 'You are Souq Master Admin support for a bilingual Saudi e-commerce SaaS. Answer clearly about products, orders, shipping, payments, marketing, WhatsApp, themes, and settings. Never invent store metrics or claim integrations are connected. If unsure, say so and suggest waiting for a human Master Admin. Keep answers short and actionable.',
        'system_prompt_ar' => 'أنت دعم إدارة سوق الرئيسية لمنصة تجارة إلكترونية سعودية. أجب بوضوح عن المنتجات والطلبات والشحن والمدفوعات والتسويق وواتساب والسمات والإعدادات. لا تخترع أرقاماً ولا تدّعِ أن تكاملاً متصل. إذا لم تكن متأكداً قل ذلك واقترح انتظار رد بشري من الإدارة. أبقِ الإجابات قصيرة وعملية.',
        'voice_enabled' => 1,
        'image_enabled' => 1,
        'human_handoff_enabled' => 1,
        'primary_color' => null,
        'updated_at' => null,
    ];
}

/** Friendly Master-branded auto-ack after merchant leaves a problem (Free / human queue). */
function souq_help_chat_master_ack_text(string $locale): string
{
    return str_starts_with(strtolower($locale), 'ar')
        ? 'تم استلام رسالتك. اترك مشكلتك هنا وسنرد عليك قريباً — إدارة سوق الرئيسية.'
        : 'Got your message. Leave your problem here and we will reply soon — Souq Master Admin.';
}

function souq_help_chat_welcome_text(array $settings, string $locale, string $intent, bool $aiEnabled): string
{
    $welcome = $locale === 'ar'
        ? (string) ($settings['welcome_ar'] ?: $settings['welcome_en'] ?: 'مرحباً، هل تحتاج مساعدة؟')
        : (string) ($settings['welcome_en'] ?: $settings['welcome_ar'] ?: 'Welcome, any help?');

    if ($intent === 'fix_problem' && $aiEnabled) {
        return $locale === 'ar'
            ? 'مرحباً، هل تحتاج مساعدة؟ صف المشكلة أو أرفق صورة وسأرشدك خطوة بخطوة.'
            : 'Welcome, any help? Describe the issue or attach a screenshot and I will guide you step by step.';
    }
    if ($intent === 'contact_human' || !$aiEnabled) {
        return $locale === 'ar'
            ? (trim($welcome) !== '' ? $welcome : 'مرحباً، هل تحتاج مساعدة؟')
            : (trim($welcome) !== '' ? $welcome : 'Welcome, any help?');
    }

    return trim($welcome) !== '' ? $welcome : ($locale === 'ar' ? 'مرحباً، هل تحتاج مساعدة؟' : 'Welcome, any help?');
}

/** @return array<string,mixed> */
function souq_help_chat_normalize_settings_row(array $row, array $defaults): array
{
    $merged = array_merge($defaults, $row);
    // Soft-upgrade legacy AI Studio / Souq Help copy → Master Admin welcome flow.
    $legacyBotEn = ['Souq Help', 'souq help', 'Help Bot'];
    $legacyBotAr = ['مساعدة سوق', 'مساعد سوق'];
    $legacyWelcomeEn = [
        'Hi! I am your Souq assistant. Ask anything about your store dashboard. If I cannot help, tap Talk to human.',
        'Hi. Free plan has no AI replies. Use human support or upgrade (100 / 300 / 500 AI replies).',
    ];
    $legacyWelcomeAr = [
        'مرحباً! أنا مساعد سوق. اسأل عن أي شيء في لوحة تحكم متجرك. إذا لم أستطع المساعدة، اضغط تحدّث مع إنسان.',
        'مرحباً. خطة متجرك المجانية لا تشمل ردود الذكاء الاصطناعي. استخدم الدعم البشري أو رقِّ خطتك (١٠٠ / ٣٠٠ / ٥٠٠).',
    ];
    $botEn = trim((string) ($merged['bot_name_en'] ?? ''));
    $botAr = trim((string) ($merged['bot_name_ar'] ?? ''));
    $welEn = trim((string) ($merged['welcome_en'] ?? ''));
    $welAr = trim((string) ($merged['welcome_ar'] ?? ''));
    if ($botEn === '' || in_array($botEn, $legacyBotEn, true)) {
        $merged['bot_name_en'] = $defaults['bot_name_en'];
    }
    if ($botAr === '' || in_array($botAr, $legacyBotAr, true)) {
        $merged['bot_name_ar'] = $defaults['bot_name_ar'];
    }
    if ($welEn === '' || in_array($welEn, $legacyWelcomeEn, true)) {
        $merged['welcome_en'] = $defaults['welcome_en'];
    }
    if ($welAr === '' || in_array($welAr, $legacyWelcomeAr, true)) {
        $merged['welcome_ar'] = $defaults['welcome_ar'];
    }

    return $merged;
}

function souq_help_chat_get_settings(PDO $pdo, ?string $storeId = null): array
{
    $defaults = souq_help_chat_default_settings($storeId);
    try {
        if ($storeId) {
            $st = $pdo->prepare('SELECT * FROM help_chatbot_settings WHERE store_id = ? LIMIT 1');
            $st->execute([$storeId]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return souq_help_chat_normalize_settings_row($row, $defaults);
            }
        }
        $st = $pdo->prepare('SELECT * FROM help_chatbot_settings WHERE id = ? OR store_id IS NULL LIMIT 1');
        $st->execute(['global']);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return souq_help_chat_normalize_settings_row($row, array_merge($defaults, [
                'store_id' => $storeId,
                'id' => $storeId ? ('store-' . $storeId) : 'global',
            ]));
        }
    } catch (Throwable) {
    }

    return $defaults;
}

/**
 * @param array<string,mixed> $patch
 * @return array<string,mixed>
 */
function souq_help_chat_save_settings(PDO $pdo, array $patch, ?string $storeId = null): array
{
    $current = souq_help_chat_get_settings($pdo, $storeId);
    $id = $storeId ? ('store-' . $storeId) : 'global';
    $now = date('Y-m-d H:i:s');
    $row = [
        'id' => $id,
        'store_id' => $storeId,
        'enabled' => array_key_exists('enabled', $patch) ? ((int) !!$patch['enabled']) : (int) ($current['enabled'] ?? 1),
        'bot_name_en' => trim((string) ($patch['bot_name_en'] ?? $current['bot_name_en'] ?? 'Souq Master Admin')),
        'bot_name_ar' => trim((string) ($patch['bot_name_ar'] ?? $current['bot_name_ar'] ?? 'إدارة سوق الرئيسية')),
        'welcome_en' => (string) ($patch['welcome_en'] ?? $current['welcome_en'] ?? ''),
        'welcome_ar' => (string) ($patch['welcome_ar'] ?? $current['welcome_ar'] ?? ''),
        'system_prompt_en' => (string) ($patch['system_prompt_en'] ?? $current['system_prompt_en'] ?? ''),
        'system_prompt_ar' => (string) ($patch['system_prompt_ar'] ?? $current['system_prompt_ar'] ?? ''),
        'voice_enabled' => array_key_exists('voice_enabled', $patch) ? ((int) !!$patch['voice_enabled']) : (int) ($current['voice_enabled'] ?? 1),
        'image_enabled' => array_key_exists('image_enabled', $patch) ? ((int) !!$patch['image_enabled']) : (int) ($current['image_enabled'] ?? 1),
        'human_handoff_enabled' => array_key_exists('human_handoff_enabled', $patch)
            ? ((int) !!$patch['human_handoff_enabled'])
            : (int) ($current['human_handoff_enabled'] ?? 1),
        'primary_color' => isset($patch['primary_color']) ? (trim((string) $patch['primary_color']) ?: null) : ($current['primary_color'] ?? null),
        'updated_at' => $now,
    ];

    $pdo->prepare(
        'INSERT INTO help_chatbot_settings
            (id, store_id, enabled, bot_name_en, bot_name_ar, welcome_en, welcome_ar, system_prompt_en, system_prompt_ar,
             voice_enabled, image_enabled, human_handoff_enabled, primary_color, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
            enabled=VALUES(enabled), bot_name_en=VALUES(bot_name_en), bot_name_ar=VALUES(bot_name_ar),
            welcome_en=VALUES(welcome_en), welcome_ar=VALUES(welcome_ar),
            system_prompt_en=VALUES(system_prompt_en), system_prompt_ar=VALUES(system_prompt_ar),
            voice_enabled=VALUES(voice_enabled), image_enabled=VALUES(image_enabled),
            human_handoff_enabled=VALUES(human_handoff_enabled), primary_color=VALUES(primary_color),
            updated_at=VALUES(updated_at)'
    )->execute([
        $row['id'],
        $row['store_id'],
        $row['enabled'],
        $row['bot_name_en'],
        $row['bot_name_ar'],
        $row['welcome_en'],
        $row['welcome_ar'],
        $row['system_prompt_en'],
        $row['system_prompt_ar'],
        $row['voice_enabled'],
        $row['image_enabled'],
        $row['human_handoff_enabled'],
        $row['primary_color'],
        $row['updated_at'],
    ]);

    return souq_help_chat_get_settings($pdo, $storeId);
}

/**
 * @param array<string,mixed>|null $meta
 */
function souq_help_chat_insert_message(
    PDO $pdo,
    string $sessionId,
    string $storeId,
    string $role,
    string $body,
    ?string $attachmentUrl = null,
    ?string $attachmentType = null,
    ?array $meta = null
): array {
    $id = souq_help_chat_id('hcm');
    $now = date('Y-m-d H:i:s');
    $pdo->prepare(
        'INSERT INTO help_chat_messages (id, session_id, store_id, role, body, attachment_url, attachment_type, meta_json, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id,
        $sessionId,
        $storeId,
        $role,
        $body,
        $attachmentUrl,
        $attachmentType,
        $meta ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null,
        $now,
    ]);
    $pdo->prepare('UPDATE help_chat_sessions SET last_message_at = ?, updated_at = ? WHERE id = ?')
        ->execute([$now, $now, $sessionId]);

    return [
        'id' => $id,
        'session_id' => $sessionId,
        'store_id' => $storeId,
        'role' => $role,
        'body' => $body,
        'attachment_url' => $attachmentUrl,
        'attachment_type' => $attachmentType,
        'meta' => $meta,
        'created_at' => $now,
    ];
}

/** @return list<array<string,mixed>> */
function souq_help_chat_list_messages(PDO $pdo, string $sessionId, string $storeId = '', int $limit = 200): array
{
    $limit = max(1, min(500, $limit));
    if ($storeId !== '') {
        $st = $pdo->prepare(
            'SELECT * FROM help_chat_messages WHERE session_id = ? AND store_id = ? ORDER BY created_at ASC LIMIT ' . (int) $limit
        );
        $st->execute([$sessionId, $storeId]);
    } else {
        $st = $pdo->prepare(
            'SELECT * FROM help_chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ' . (int) $limit
        );
        $st->execute([$sessionId]);
    }
    $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $out = [];
    foreach ($rows as $r) {
        $meta = null;
        if (!empty($r['meta_json'])) {
            $decoded = json_decode((string) $r['meta_json'], true);
            $meta = is_array($decoded) ? $decoded : null;
        }
        $out[] = [
            'id' => $r['id'],
            'session_id' => $r['session_id'],
            'store_id' => $r['store_id'],
            'role' => $r['role'],
            'body' => $r['body'],
            'attachment_url' => $r['attachment_url'],
            'attachment_type' => $r['attachment_type'],
            'meta' => $meta,
            'created_at' => $r['created_at'],
        ];
    }

    return $out;
}

function souq_help_chat_notify_merchant(PDO $pdo, string $storeId, string $titleEn, string $titleAr, string $preview, string $sessionId): void
{
    if (!function_exists('souq_store_data') || !function_exists('souq_save_store_data')) {
        return;
    }
    try {
        $data = souq_store_data($pdo, $storeId);
        $items = is_array($data['notification_deliveries'] ?? null) ? $data['notification_deliveries'] : [];
        array_unshift($items, [
            'id' => souq_help_chat_id('ndl'),
            'store_id' => $storeId,
            'event' => 'help_chat_reply',
            'channel' => 'in_app',
            'audience' => 'merchant',
            'recipient' => 'store_owner',
            'status' => 'sent',
            'preview' => $preview,
            'merchant_read' => false,
            'meta' => [
                'session_id' => $sessionId,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'action_tab' => 'help-chat',
            ],
            'created_at' => date('c'),
        ]);
        $data['notification_deliveries'] = array_slice($items, 0, 100);
        souq_save_store_data($pdo, $storeId, $data);
    } catch (Throwable) {
    }
}

/**
 * @param list<array{role:string,body:string,attachment_url?:?string}> $history
 * @return array{ok:bool,text?:string,code?:string,message?:string,model?:string}
 */
function souq_help_chat_ai_reply(
    PDO $pdo,
    string $storeId,
    string $locale,
    array $history,
    string $userText,
    ?string $attachmentUrl = null
): array {
    if (!function_exists('souq_gemini_api_key')) {
        return ['ok' => false, 'code' => 'provider_missing', 'message' => 'AI provider helpers not loaded.'];
    }
    $apiKey = souq_gemini_api_key();
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return [
            'ok' => false,
            'code' => 'provider_not_connected',
            'message' => 'AI is not connected. Escalate to Master Admin.',
        ];
    }

    $settings = souq_help_chat_get_settings($pdo, $storeId);
    $wantAr = str_starts_with(strtolower($locale), 'ar');
    $system = $wantAr
        ? (string) ($settings['system_prompt_ar'] ?: $settings['system_prompt_en'])
        : (string) ($settings['system_prompt_en'] ?: $settings['system_prompt_ar']);

    $storeName = $storeId;
    try {
        if (function_exists('souq_store_row')) {
            $row = souq_store_row($pdo, $storeId);
            if (is_array($row)) {
                $storeName = (string) ($row['name'] ?? $row['name_en'] ?? $storeId);
            }
        }
    } catch (Throwable) {
    }

    $system .= "\n\nStore id: {$storeId}. Store name: {$storeName}.";
    $system .= $wantAr
        ? "\nReply in Arabic only (no English words in the reply)."
        : "\nReply in English only (no Arabic in the reply).";
    $system .= "\nUse Souq Platform knowledge below for step-by-step dashboard guidance. Never invent store metrics or fake connected integrations.";
    $kb = souq_help_kb_context_blob($pdo, $storeId, $locale);
    if ($kb !== '') {
        $system .= "\n\nKNOWLEDGE BASE:\n" . $kb;
    }

    $contents = [];
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => "SYSTEM INSTRUCTIONS:\n" . $system]],
    ];
    $contents[] = [
        'role' => 'model',
        'parts' => [['text' => $wantAr ? 'حسناً، سأساعد تاجر المتجر وفق التعليمات.' : 'Understood. I will help the merchant per the instructions.']],
    ];

    $trimmed = array_slice($history, -12);
    foreach ($trimmed as $msg) {
        $role = ($msg['role'] ?? '') === 'user' ? 'user' : 'model';
        $text = trim((string) ($msg['body'] ?? ''));
        if ($text === '') {
            continue;
        }
        $contents[] = ['role' => $role, 'parts' => [['text' => $text]]];
    }

    $parts = [['text' => $userText !== '' ? $userText : ($wantAr ? 'يرجى مراجعة المرفق.' : 'Please review the attachment.')]];
    if ($attachmentUrl && preg_match('#^https?://#i', $attachmentUrl)) {
        $parts[0]['text'] .= "\n\n[Attachment URL: {$attachmentUrl}]";
    }
    $contents[] = ['role' => 'user', 'parts' => $parts];

    $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => 'AI reply failed.'];
    foreach (souq_gemini_text_model_candidates() as $model) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
        $res = souq_gemini_curl_json_retry($url, [
            'contents' => $contents,
            'generationConfig' => souq_gemini_text_generation_config($model, [
                'temperature' => 0.4,
                'maxOutputTokens' => 1024,
            ]),
        ], 35, $apiKey);

        if ($res['raw'] === false || $res['status'] < 200 || $res['status'] >= 300) {
            $msg = $res['err'] !== '' ? $res['err'] : 'AI reply failed.';
            $decoded = json_decode((string) $res['raw'], true);
            if (is_array($decoded) && !empty($decoded['error']['message'])) {
                $msg = (string) $decoded['error']['message'];
            }
            $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => mb_substr($msg, 0, 280)];
            continue;
        }
        $json = json_decode((string) $res['raw'], true);
        $text = '';
        foreach (($json['candidates'][0]['content']['parts'] ?? []) as $part) {
            if (!empty($part['text'])) {
                $text .= (string) $part['text'];
            }
        }
        $text = trim($text);
        if ($text === '') {
            $lastFail = ['ok' => false, 'code' => 'empty_result', 'message' => 'AI returned empty text.'];
            continue;
        }

        return ['ok' => true, 'text' => mb_substr($text, 0, 4000), 'model' => $model];
    }

    return $lastFail;
}

function souq_help_chat_escalate(PDO $pdo, array $session, string $reason = '', bool $silentSystem = false): array
{
    $sessionId = (string) $session['id'];
    $storeId = (string) $session['store_id'];
    $now = date('Y-m-d H:i:s');
    $locale = (string) ($session['locale'] ?? 'en');
    $wantAr = str_starts_with(strtolower($locale), 'ar');

    $messages = souq_help_chat_list_messages($pdo, $sessionId, $storeId, 40);
    $snippet = '';
    foreach (array_reverse($messages) as $m) {
        if (($m['role'] ?? '') === 'user' && trim((string) $m['body']) !== '') {
            $snippet = trim((string) $m['body']);
            break;
        }
    }
    if ($snippet === '') {
        $snippet = $reason !== '' ? $reason : ($wantAr ? 'طلب مساعدة بشرية' : 'Requested human help');
    }

    $subject = mb_substr(
        ($wantAr ? 'محادثة مساعدة: ' : 'Help chat: ') . $snippet,
        0,
        180
    );

    $ticketId = (string) ($session['ticket_id'] ?? '');
    if ($ticketId === '' && function_exists('souq_ensure_phase1_ops_tables')) {
        souq_ensure_phase1_ops_tables($pdo);
        $ticketId = 'tkt-' . bin2hex(random_bytes(8));
        $descParts = [];
        foreach ($messages as $m) {
            $role = strtoupper((string) ($m['role'] ?? ''));
            $descParts[] = "[{$role}] " . (string) ($m['body'] ?? '');
            if (!empty($m['attachment_url'])) {
                $descParts[] = '  ↳ ' . (string) $m['attachment_url'];
            }
        }
        if ($reason !== '') {
            $descParts[] = ($wantAr ? '[سبب التصعيد] ' : '[Escalate reason] ') . $reason;
        }
        $pdo->prepare(
            'INSERT INTO support_tickets (id, subject, description, requester_name, requester_email, store_id, category, priority, status, assignee, created_by, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $ticketId,
            $subject,
            implode("\n", $descParts),
            $session['requester_name'] ?? null,
            $session['requester_email'] ?? null,
            $storeId,
            'help_chat',
            'high',
            'open',
            null,
            'store_owner',
            $now,
            $now,
        ]);
    }

    $pdo->prepare(
        'UPDATE help_chat_sessions SET status = ?, satisfaction = ?, ticket_id = ?, escalated_at = ?, subject = ?, updated_at = ? WHERE id = ?'
    )->execute(['waiting_human', 'unsatisfied', $ticketId !== '' ? $ticketId : null, $now, $subject, $now, $sessionId]);

    if (!$silentSystem) {
        $sysBody = $wantAr
            ? 'تم تحويل محادثتك إلى الإدارة. سيظهر السؤال في لوحة التحكم الرئيسية وسيصلك إشعار فور الرد.'
            : 'Your chat was escalated to Master Admin. They will see this store question and you will get a notification when they reply.';
        souq_help_chat_insert_message($pdo, $sessionId, $storeId, 'system', $sysBody);
    }

    if (function_exists('souq_notify_platform')) {
        $storeLabel = $storeId;
        try {
            if (function_exists('souq_store_row')) {
                $row = souq_store_row($pdo, $storeId);
                if (is_array($row)) {
                    $storeLabel = (string) ($row['name'] ?? $row['name_en'] ?? $storeId);
                }
            }
        } catch (Throwable) {
        }
        souq_notify_platform(
            $pdo,
            'Help chat escalation',
            "Store {$storeLabel} ({$storeId}): {$snippet}",
            'support',
            'High',
            'help_chat',
            $sessionId,
            [
                'title_ar' => 'تصعيد محادثة مساعدة',
                'description_ar' => "متجر {$storeLabel} ({$storeId}): {$snippet}",
                'store_id' => $storeId,
                'action_tab' => 'support',
            ]
        );
    }

    $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ?');
    $st->execute([$sessionId]);

    return $st->fetch(PDO::FETCH_ASSOC) ?: $session;
}

function souq_help_chatbot_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!str_starts_with($uri, '/help-chat') && !str_starts_with($uri, '/master/help-chat')) {
        return false;
    }

    souq_ensure_help_chat_tables($pdo);
    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));

    $needMaster = static function () use ($portal, $pdo): bool {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return false;
        }
        if (function_exists('souq_require_master_bearer_ops')) {
            return souq_require_master_bearer_ops($pdo);
        }
        if (function_exists('souq_require_master_bearer')) {
            return souq_require_master_bearer();
        }
        return true;
    };

    // ── Public/store: settings for active store ──
    if ($uri === '/help-chat/settings' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $settings = souq_help_chat_get_settings($pdo, $storeId);
        // Never expose system prompts to store UI — only Master edits them.
        unset($settings['system_prompt_en'], $settings['system_prompt_ar']);
        $entitlement = souq_help_support_entitlement($pdo, $storeId);
        echo json_encode([
            'data' => $settings,
            'entitlement' => $entitlement,
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Store: FAQ / knowledge base + suggested questions ──
    if ($uri === '/help-chat/faq' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $suggested = !empty($_GET['suggested']);
        $rows = souq_help_kb_list($pdo, $storeId, $suggested, (int) ($_GET['limit'] ?? 50));
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'source' => 'help_kb_articles'],
            'entitlement' => souq_help_support_entitlement($pdo, $storeId),
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/help-chat/settings' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $target = trim((string) ($_GET['store_id'] ?? ''));
        echo json_encode([
            'data' => souq_help_chat_get_settings($pdo, $target !== '' ? $target : null),
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/help-chat/settings' && in_array($method, ['PUT', 'PATCH', 'POST'], true)) {
        if (!$needMaster()) {
            return true;
        }
        $target = trim((string) ($input['store_id'] ?? $_GET['store_id'] ?? ''));
        $saved = souq_help_chat_save_settings($pdo, $input, $target !== '' ? $target : null);
        echo json_encode(['data' => $saved, 'message' => 'Settings saved'], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Store: open / resume session ──
    if ($uri === '/help-chat/session' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $settings = souq_help_chat_get_settings($pdo, $storeId);
        if (!(int) ($settings['enabled'] ?? 1)) {
            http_response_code(403);
            echo json_encode(['message' => 'Help chatbot is disabled for this store.']);
            return true;
        }
        $entitlement = souq_help_support_entitlement($pdo, $storeId);
        $publicSettings = array_diff_key($settings, ['system_prompt_en' => 1, 'system_prompt_ar' => 1]);

        $locale = strtolower(trim((string) ($input['locale'] ?? 'en')));
        if (!in_array($locale, ['ar', 'en'], true)) {
            $locale = 'en';
        }
        $intent = strtolower(trim((string) ($input['intent'] ?? 'ask_ai')));
        if (!in_array($intent, ['ask_ai', 'fix_problem', 'contact_human'], true)) {
            $intent = 'ask_ai';
        }
        // Free / human intent → wait for Master after welcome (no AI). Paid Ask/Fix → AI session.
        if (!$entitlement['ai_enabled'] && in_array($intent, ['ask_ai', 'fix_problem'], true)) {
            $intent = 'contact_human';
        }
        // Free legacy threads stuck on ai_active → flip to waiting_human (Master wait flow).
        $migrateFreeHuman = static function (PDO $pdo, array $row, array $entitlement): array {
            if (!empty($entitlement['ai_enabled'])) {
                return $row;
            }
            if ((string) ($row['status'] ?? '') !== 'ai_active') {
                return $row;
            }
            $now = date('Y-m-d H:i:s');
            try {
                $pdo->prepare(
                    "UPDATE help_chat_sessions SET status = 'waiting_human', intent = 'contact_human', updated_at = ? WHERE id = ? AND store_id = ?"
                )->execute([$now, $row['id'], $row['store_id']]);
                $row['status'] = 'waiting_human';
                $row['intent'] = 'contact_human';
                $row['updated_at'] = $now;
            } catch (Throwable) {
            }
            return $row;
        };

        $resumeId = trim((string) ($input['session_id'] ?? ''));
        if ($resumeId !== '') {
            $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? AND store_id = ? LIMIT 1');
            $st->execute([$resumeId, $storeId]);
            $existing = $st->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                $existing = $migrateFreeHuman($pdo, $existing, $entitlement);
                echo json_encode([
                    'data' => [
                        'session' => $existing,
                        'messages' => souq_help_chat_list_messages($pdo, $resumeId, $storeId),
                        'settings' => $publicSettings,
                        'entitlement' => $entitlement,
                        'faq' => souq_help_kb_list($pdo, $storeId, true, 8),
                    ],
                ], JSON_UNESCAPED_UNICODE);
                return true;
            }
        }

        // Prefer open session for this store (one active thread)
        $st = $pdo->prepare(
            "SELECT * FROM help_chat_sessions
             WHERE store_id = ? AND status IN ('ai_active','waiting_human','human_active')
             ORDER BY updated_at DESC LIMIT 1"
        );
        $st->execute([$storeId]);
        $open = $st->fetch(PDO::FETCH_ASSOC);
        if ($open) {
            $open = $migrateFreeHuman($pdo, $open, $entitlement);
            echo json_encode([
                'data' => [
                    'session' => $open,
                    'messages' => souq_help_chat_list_messages($pdo, (string) $open['id'], $storeId),
                    'settings' => $publicSettings,
                    'entitlement' => $entitlement,
                    'faq' => souq_help_kb_list($pdo, $storeId, true, 8),
                ],
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $id = souq_help_chat_id('hcs');
        $now = date('Y-m-d H:i:s');
        // Free + Human: welcome then wait. Paid AI intents stay ai_active.
        $startStatus = (!$entitlement['ai_enabled'] || $intent === 'contact_human')
            ? 'waiting_human'
            : 'ai_active';
        try {
            $pdo->prepare(
                'INSERT INTO help_chat_sessions
                    (id, store_id, requester_name, requester_email, locale, intent, status, created_at, updated_at, last_message_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?)'
            )->execute([
                $id,
                $storeId,
                trim((string) ($input['requester_name'] ?? '')) ?: null,
                trim((string) ($input['requester_email'] ?? '')) ?: null,
                $locale,
                $intent,
                $startStatus,
                $now,
                $now,
                $now,
            ]);
        } catch (Throwable) {
            $pdo->prepare(
                'INSERT INTO help_chat_sessions
                    (id, store_id, requester_name, requester_email, locale, status, created_at, updated_at, last_message_at)
                 VALUES (?,?,?,?,?,?,?,?,?)'
            )->execute([
                $id,
                $storeId,
                trim((string) ($input['requester_name'] ?? '')) ?: null,
                trim((string) ($input['requester_email'] ?? '')) ?: null,
                $locale,
                $startStatus,
                $now,
                $now,
                $now,
            ]);
        }

        $welcome = souq_help_chat_welcome_text(
            $settings,
            $locale,
            $intent,
            !empty($entitlement['ai_enabled'])
        );
        $messages = [];
        if (trim($welcome) !== '') {
            $messages[] = souq_help_chat_insert_message(
                $pdo,
                $id,
                $storeId,
                'assistant',
                $welcome,
                null,
                null,
                [
                    'kind' => 'welcome',
                    'from' => 'souq_master_admin',
                    'label_en' => 'Souq Master Admin',
                    'label_ar' => 'إدارة سوق الرئيسية',
                ]
            );
        }

        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ?');
        $st->execute([$id]);
        $sessionRow = $st->fetch(PDO::FETCH_ASSOC);
        // Do NOT escalate on open — wait until merchant leaves a problem/message.

        echo json_encode([
            'data' => [
                'session' => $sessionRow,
                'messages' => $messages ?: souq_help_chat_list_messages($pdo, $id, $storeId),
                'settings' => $publicSettings,
                'entitlement' => $entitlement,
                'faq' => souq_help_kb_list($pdo, $storeId, true, 8),
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/help-chat/session/([^/]+)$#', $uri, $m) && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$m[1], $storeId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }
        echo json_encode([
            'data' => [
                'session' => $session,
                'messages' => souq_help_chat_list_messages($pdo, $m[1], $storeId),
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Store: send message (AI or waiting for human) ──
    if (preg_match('#^/help-chat/session/([^/]+)/messages$#', $uri, $m) && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $sessionId = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$sessionId, $storeId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }

        $body = trim((string) ($input['body'] ?? ''));
        $attachmentUrl = trim((string) ($input['attachment_url'] ?? '')) ?: null;
        $attachmentType = trim((string) ($input['attachment_type'] ?? '')) ?: null;
        if ($body === '' && !$attachmentUrl) {
            http_response_code(422);
            echo json_encode(['message' => 'Message body or attachment required.']);
            return true;
        }

        $locale = (string) ($session['locale'] ?? 'en');
        $sessionIntent = strtolower((string) ($session['intent'] ?? 'ask_ai'));
        if ($sessionIntent === 'fix_problem' && $body !== '') {
            $prefix = $locale === 'ar' ? '[إصلاح مشكلة] ' : '[Fix My Problem] ';
            if (!str_starts_with($body, $prefix) && !str_starts_with($body, '[Fix My Problem]') && !str_starts_with($body, '[إصلاح مشكلة]')) {
                $body = $prefix . $body;
            }
        }

        $userMsg = souq_help_chat_insert_message(
            $pdo,
            $sessionId,
            $storeId,
            'user',
            $body !== '' ? $body : (($session['locale'] ?? 'en') === 'ar' ? 'مرفق' : 'Attachment'),
            $attachmentUrl,
            $attachmentType
        );

        $status = (string) ($session['status'] ?? 'ai_active');
        $assistantMsg = null;
        $aiMeta = null;
        $entitlement = souq_help_support_entitlement($pdo, $storeId);
        $wantHumanQueue = in_array($status, ['waiting_human', 'human_active'], true)
            || !$entitlement['ai_enabled']
            || (int) ($entitlement['remaining'] ?? 0) <= 0;

        if ($wantHumanQueue) {
            // Free / human / quota: one Master ack after first problem message, then wait for human.
            $needsTicket = empty($session['ticket_id']) || $status === 'ai_active';
            if ($needsTicket) {
                $session = souq_help_chat_escalate(
                    $pdo,
                    $session,
                    $locale === 'ar' ? 'رسالة تاجر للدعم' : 'Merchant support message',
                    true // silent — Master-branded ack follows instead of system spam
                );
                $status = (string) ($session['status'] ?? 'waiting_human');
            }

            $prior = souq_help_chat_list_messages($pdo, $sessionId, $storeId, 80);
            $alreadyAcked = false;
            foreach ($prior as $pm) {
                $meta = is_array($pm['meta'] ?? null) ? $pm['meta'] : [];
                if (($meta['kind'] ?? '') === 'master_ack' || ($meta['code'] ?? '') === 'help_ack') {
                    $alreadyAcked = true;
                    break;
                }
            }

            if (!$alreadyAcked) {
                $assistantMsg = souq_help_chat_insert_message(
                    $pdo,
                    $sessionId,
                    $storeId,
                    'assistant',
                    souq_help_chat_master_ack_text($locale),
                    null,
                    null,
                    [
                        'kind' => 'master_ack',
                        'code' => 'help_ack',
                        'from' => 'souq_master_admin',
                        'label_en' => 'Souq Master Admin',
                        'label_ar' => 'إدارة سوق الرئيسية',
                    ]
                );
            }

            $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ?');
            $st->execute([$sessionId]);
            $session = $st->fetch(PDO::FETCH_ASSOC) ?: $session;

            echo json_encode([
                'data' => [
                    'user_message' => $userMsg,
                    'assistant_message' => $assistantMsg,
                    'session' => $session,
                    'mode' => 'human',
                    'entitlement' => $entitlement,
                ],
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $history = souq_help_chat_list_messages($pdo, $sessionId, $storeId, 30);
        $ai = souq_help_chat_ai_reply(
            $pdo,
            $storeId,
            $locale,
            $history,
            $body,
            $attachmentUrl
        );

        if (!empty($ai['ok']) && !empty($ai['text'])) {
            souq_help_chat_ai_consume($pdo, $storeId);
            $entitlement = souq_help_support_entitlement($pdo, $storeId);
            $assistantMsg = souq_help_chat_insert_message(
                $pdo,
                $sessionId,
                $storeId,
                'assistant',
                (string) $ai['text'],
                null,
                null,
                ['model' => $ai['model'] ?? null]
            );
            $aiMeta = ['ok' => true, 'model' => $ai['model'] ?? null];
        } else {
            $failText = $locale === 'ar'
                ? 'تعذر الرد الآلي حالياً. يمكنك الضغط على «تحدّث مع إنسان» لإرسال سؤالك للإدارة.'
                : 'AI could not reply right now. Tap Talk to human to send your question to Master Admin.';
            $assistantMsg = souq_help_chat_insert_message(
                $pdo,
                $sessionId,
                $storeId,
                'system',
                $failText,
                null,
                null,
                ['ai_error' => $ai['message'] ?? 'failed']
            );
            $aiMeta = ['ok' => false, 'code' => $ai['code'] ?? 'error', 'message' => $ai['message'] ?? ''];
        }

        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ?');
        $st->execute([$sessionId]);
        echo json_encode([
            'data' => [
                'user_message' => $userMsg,
                'assistant_message' => $assistantMsg,
                'session' => $st->fetch(PDO::FETCH_ASSOC),
                'mode' => 'ai',
                'ai' => $aiMeta,
                'entitlement' => $entitlement,
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Store: satisfied / escalate ──
    if (preg_match('#^/help-chat/session/([^/]+)/feedback$#', $uri, $m) && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $sessionId = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? AND store_id = ? LIMIT 1');
        $st->execute([$sessionId, $storeId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }

        $verdict = strtolower(trim((string) ($input['satisfaction'] ?? $input['verdict'] ?? '')));
        $reason = trim((string) ($input['reason'] ?? ''));
        $now = date('Y-m-d H:i:s');

        if (in_array($verdict, ['satisfied', 'ok', 'yes', 'resolved'], true)) {
            $pdo->prepare(
                'UPDATE help_chat_sessions SET satisfaction = ?, status = ?, resolved_at = ?, updated_at = ? WHERE id = ?'
            )->execute(['satisfied', 'resolved', $now, $now, $sessionId]);
            $locale = (string) ($session['locale'] ?? 'en');
            souq_help_chat_insert_message(
                $pdo,
                $sessionId,
                $storeId,
                'system',
                $locale === 'ar' ? 'شكراً لتأكيدك. يسعدنا أن المساعدة كانت كافية.' : 'Thanks — glad the AI help was enough.'
            );
            $st->execute([$sessionId, $storeId]);
            echo json_encode(['data' => ['session' => $st->fetch(PDO::FETCH_ASSOC)]], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $settings = souq_help_chat_get_settings($pdo, $storeId);
        if (!(int) ($settings['human_handoff_enabled'] ?? 1)) {
            http_response_code(403);
            echo json_encode(['message' => 'Human handoff is disabled.']);
            return true;
        }

        $updated = souq_help_chat_escalate($pdo, $session, $reason);
        echo json_encode(['data' => ['session' => $updated]], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: list sessions (paginated — scales toward 10k+) ──
    if ($uri === '/master/help-chat/sessions' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $status = trim((string) ($_GET['status'] ?? ''));
        $filterStore = trim((string) ($_GET['store_id'] ?? ''));
        $search = trim((string) ($_GET['q'] ?? $_GET['search'] ?? ''));
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 25)));
        $where = ' WHERE 1=1';
        $params = [];
        if ($status !== '' && $status !== 'all') {
            $where .= ' AND status = ?';
            $params[] = $status;
        }
        if ($filterStore !== '') {
            $where .= ' AND store_id = ?';
            $params[] = $filterStore;
        }
        if ($search !== '') {
            $where .= ' AND (store_id LIKE ? OR subject LIKE ? OR requester_email LIKE ? OR requester_name LIKE ? OR id LIKE ?)';
            $like = '%' . $search . '%';
            array_push($params, $like, $like, $like, $like, $like);
        }

        $total = 0;
        $waiting = 0;
        try {
            $cst = $pdo->prepare('SELECT COUNT(*) FROM help_chat_sessions' . $where);
            $cst->execute($params);
            $total = (int) ($cst->fetchColumn() ?: 0);
            $wst = $pdo->query(
                "SELECT COUNT(*) FROM help_chat_sessions WHERE status IN ('waiting_human','human_active')"
            );
            $waiting = (int) ($wst ? $wst->fetchColumn() : 0);
        } catch (Throwable) {
            $total = 0;
        }

        $offset = ($page - 1) * $perPage;
        $sql = 'SELECT * FROM help_chat_sessions' . $where
            . ' ORDER BY COALESCE(escalated_at, updated_at) DESC LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset;
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];

        echo json_encode([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'waiting' => $waiting,
                'page' => $page,
                'per_page' => $perPage,
                'page_count' => max(1, (int) ceil(($total ?: 1) / $perPage)),
                'source' => 'help_chat_sessions',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/help-chat/sessions/([^/]+)$#', $uri, $m) && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? LIMIT 1');
        $st->execute([$m[1]]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }
        echo json_encode([
            'data' => [
                'session' => $session,
                'messages' => souq_help_chat_list_messages($pdo, $m[1]),
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: AI draft (suggest) or AI send as Master reply ──
    if (preg_match('#^/master/help-chat/sessions/([^/]+)/ai-reply$#', $uri, $m) && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $sessionId = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? LIMIT 1');
        $st->execute([$sessionId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }
        $storeIdSession = (string) $session['store_id'];
        $locale = (string) ($session['locale'] ?? 'en');
        $send = !empty($input['send']);
        $hint = trim((string) ($input['hint'] ?? $input['body'] ?? ''));
        $history = souq_help_chat_list_messages($pdo, $sessionId, $storeIdSession, 40);
        $prompt = $hint !== ''
            ? $hint
            : ($locale === 'ar'
                ? 'اكتب رداً مهنياً قصيراً من إدارة المنصة لصاحب المتجر بناءً على المحادثة.'
                : 'Write a short professional Master Admin reply to the store owner based on this chat.');
        $ai = souq_help_chat_ai_reply($pdo, $storeIdSession, $locale, $history, $prompt, null);
        if (empty($ai['ok']) || empty($ai['text'])) {
            http_response_code(502);
            echo json_encode([
                'message' => $ai['message'] ?? 'AI draft failed',
                'code' => $ai['code'] ?? 'ai_failed',
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $draft = (string) $ai['text'];
        if (!$send) {
            echo json_encode([
                'data' => [
                    'draft' => $draft,
                    'model' => $ai['model'] ?? null,
                    'session_id' => $sessionId,
                ],
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $msg = souq_help_chat_insert_message(
            $pdo,
            $sessionId,
            $storeIdSession,
            'human',
            $draft,
            null,
            null,
            ['author' => 'master_ai', 'model' => $ai['model'] ?? null]
        );
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'UPDATE help_chat_sessions SET status = ?, updated_at = ?, last_message_at = ? WHERE id = ?'
        )->execute(['human_active', $now, $now, $sessionId]);
        souq_help_chat_notify_merchant(
            $pdo,
            $storeIdSession,
            'Master Admin replied to your help chat',
            'ردّت الإدارة على محادثة المساعدة',
            mb_substr($draft, 0, 200),
            $sessionId
        );
        $st->execute([$sessionId]);
        echo json_encode([
            'data' => [
                'message' => $msg,
                'session' => $st->fetch(PDO::FETCH_ASSOC),
                'draft' => $draft,
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: human reply → notify store owner ──
    if (preg_match('#^/master/help-chat/sessions/([^/]+)/reply$#', $uri, $m) && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $sessionId = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? LIMIT 1');
        $st->execute([$sessionId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }

        $body = trim((string) ($input['body'] ?? ''));
        $attachmentUrl = trim((string) ($input['attachment_url'] ?? '')) ?: null;
        $attachmentType = trim((string) ($input['attachment_type'] ?? '')) ?: null;
        if ($body === '' && !$attachmentUrl) {
            http_response_code(422);
            echo json_encode(['message' => 'Reply body required.']);
            return true;
        }

        $storeIdSession = (string) $session['store_id'];
        $msg = souq_help_chat_insert_message(
            $pdo,
            $sessionId,
            $storeIdSession,
            'human',
            $body !== '' ? $body : 'Attachment',
            $attachmentUrl,
            $attachmentType,
            ['author' => 'master']
        );

        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'UPDATE help_chat_sessions SET status = ?, updated_at = ?, last_message_at = ? WHERE id = ?'
        )->execute(['human_active', $now, $now, $sessionId]);

        if (!empty($session['ticket_id']) && function_exists('souq_ensure_phase1_ops_tables')) {
            try {
                souq_ensure_phase1_ops_tables($pdo);
                $rid = 'rpl-' . bin2hex(random_bytes(6));
                $pdo->prepare(
                    'INSERT INTO support_ticket_replies (id, ticket_id, body, author, created_at) VALUES (?,?,?,?,?)'
                )->execute([$rid, $session['ticket_id'], $body, 'master', $now]);
                $pdo->prepare(
                    "UPDATE support_tickets SET updated_at = ?, status = CASE WHEN status = 'closed' THEN status ELSE 'in_progress' END WHERE id = ?"
                )->execute([$now, $session['ticket_id']]);
            } catch (Throwable) {
            }
        }

        $preview = mb_substr($body !== '' ? $body : 'New help reply', 0, 200);
        souq_help_chat_notify_merchant(
            $pdo,
            $storeIdSession,
            'Master Admin replied to your help chat',
            'ردّت الإدارة على محادثة المساعدة',
            $preview,
            $sessionId
        );

        $st->execute([$sessionId]);
        echo json_encode([
            'data' => [
                'message' => $msg,
                'session' => $st->fetch(PDO::FETCH_ASSOC),
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/help-chat/sessions/([^/]+)$#', $uri, $m) && in_array($method, ['PATCH', 'PUT'], true)) {
        if (!$needMaster()) {
            return true;
        }
        $sessionId = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_chat_sessions WHERE id = ? LIMIT 1');
        $st->execute([$sessionId]);
        $session = $st->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(['message' => 'Session not found.']);
            return true;
        }
        $assignee = array_key_exists('assignee', $input) ? trim((string) $input['assignee']) : null;
        $status = trim((string) ($input['status'] ?? ''));
        $allowed = ['ai_active', 'waiting_human', 'human_active', 'resolved', 'closed'];
        $now = date('Y-m-d H:i:s');
        if ($status !== '' && in_array($status, $allowed, true)) {
            $resolved = in_array($status, ['resolved', 'closed'], true) ? $now : null;
            try {
                $pdo->prepare(
                    'UPDATE help_chat_sessions SET status = ?, assignee = COALESCE(?, assignee), resolved_at = COALESCE(?, resolved_at), updated_at = ? WHERE id = ?'
                )->execute([$status, $assignee !== '' ? $assignee : null, $resolved, $now, $sessionId]);
            } catch (Throwable) {
                $pdo->prepare('UPDATE help_chat_sessions SET status = ?, resolved_at = COALESCE(?, resolved_at), updated_at = ? WHERE id = ?')
                    ->execute([$status, $resolved, $now, $sessionId]);
            }
            if (!empty($session['ticket_id']) && ($assignee !== null || $status !== '')) {
                try {
                    if (function_exists('souq_ensure_phase1_ops_tables')) {
                        souq_ensure_phase1_ops_tables($pdo);
                    }
                    $pdo->prepare(
                        'UPDATE support_tickets SET status = COALESCE(?, status), assignee = COALESCE(?, assignee), updated_at = ? WHERE id = ?'
                    )->execute([
                        $status !== '' ? $status : null,
                        $assignee !== '' ? $assignee : null,
                        $now,
                        $session['ticket_id'],
                    ]);
                } catch (Throwable) {
                }
            }
        } elseif ($assignee !== null) {
            try {
                $pdo->prepare('UPDATE help_chat_sessions SET assignee = ?, updated_at = ? WHERE id = ?')
                    ->execute([$assignee !== '' ? $assignee : null, $now, $sessionId]);
            } catch (Throwable) {
            }
        }
        $st->execute([$sessionId]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: knowledge base CRUD ──
    if ($uri === '/master/help-chat/kb' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $filterStore = trim((string) ($_GET['store_id'] ?? ''));
        try {
            if ($filterStore !== '') {
                $st = $pdo->prepare(
                    "SELECT * FROM help_kb_articles WHERE store_id IS NULL OR store_id = ? ORDER BY sort_order ASC, created_at DESC LIMIT 300"
                );
                $st->execute([$filterStore]);
            } else {
                $st = $pdo->query('SELECT * FROM help_kb_articles ORDER BY sort_order ASC, created_at DESC LIMIT 300');
            }
            $rows = $st ? ($st->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
        } catch (Throwable) {
            $rows = [];
        }
        echo json_encode(['data' => $rows, 'meta' => ['total' => count($rows), 'source' => 'help_kb_articles']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/help-chat/kb' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $titleEn = trim((string) ($input['title_en'] ?? ''));
        $titleAr = trim((string) ($input['title_ar'] ?? ''));
        if ($titleEn === '' && $titleAr === '') {
            http_response_code(422);
            echo json_encode(['message' => 'title_en or title_ar required']);
            return true;
        }
        $id = souq_help_chat_id('kb');
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO help_kb_articles
                (id, store_id, category, title_en, title_ar, body_en, body_ar, suggested, status, sort_order, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            trim((string) ($input['store_id'] ?? '')) ?: null,
            trim((string) ($input['category'] ?? 'general')) ?: 'general',
            $titleEn !== '' ? $titleEn : $titleAr,
            $titleAr !== '' ? $titleAr : $titleEn,
            (string) ($input['body_en'] ?? ''),
            (string) ($input['body_ar'] ?? ''),
            !empty($input['suggested']) ? 1 : 0,
            trim((string) ($input['status'] ?? 'published')) ?: 'published',
            (int) ($input['sort_order'] ?? 100),
            $now,
            $now,
        ]);
        $st = $pdo->prepare('SELECT * FROM help_kb_articles WHERE id = ?');
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/help-chat/kb/([^/]+)$#', $uri, $m) && in_array($method, ['PATCH', 'PUT'], true)) {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $st = $pdo->prepare('SELECT * FROM help_kb_articles WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Article not found']);
            return true;
        }
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'UPDATE help_kb_articles SET category=?, title_en=?, title_ar=?, body_en=?, body_ar=?, suggested=?, status=?, sort_order=?, updated_at=? WHERE id=?'
        )->execute([
            trim((string) ($input['category'] ?? $row['category'])),
            trim((string) ($input['title_en'] ?? $row['title_en'])),
            trim((string) ($input['title_ar'] ?? $row['title_ar'])),
            (string) ($input['body_en'] ?? $row['body_en']),
            (string) ($input['body_ar'] ?? $row['body_ar']),
            array_key_exists('suggested', $input) ? ((int) !!$input['suggested']) : (int) $row['suggested'],
            trim((string) ($input['status'] ?? $row['status'])),
            (int) ($input['sort_order'] ?? $row['sort_order']),
            $now,
            $id,
        ]);
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: support analytics ──
    if ($uri === '/master/help-chat/analytics' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $scalar = static function (PDO $pdo, string $sql): int {
            try {
                return (int) ($pdo->query($sql)->fetchColumn() ?: 0);
            } catch (Throwable) {
                return 0;
            }
        };
        $period = function_exists('souq_ai_period_key') ? souq_ai_period_key() : date('Y-m');
        $aiUsed = 0;
        try {
            $st = $pdo->prepare('SELECT COALESCE(SUM(replies_used),0) FROM help_chat_ai_usage WHERE period_key = ?');
            $st->execute([$period]);
            $aiUsed = (int) ($st->fetchColumn() ?: 0);
        } catch (Throwable) {
        }
        $data = [
            'period_key' => $period,
            'sessions_total' => $scalar($pdo, 'SELECT COUNT(*) FROM help_chat_sessions'),
            'ai_active' => $scalar($pdo, "SELECT COUNT(*) FROM help_chat_sessions WHERE status = 'ai_active'"),
            'waiting_human' => $scalar($pdo, "SELECT COUNT(*) FROM help_chat_sessions WHERE status = 'waiting_human'"),
            'human_active' => $scalar($pdo, "SELECT COUNT(*) FROM help_chat_sessions WHERE status = 'human_active'"),
            'resolved' => $scalar($pdo, "SELECT COUNT(*) FROM help_chat_sessions WHERE status IN ('resolved','closed')"),
            'escalated' => $scalar($pdo, 'SELECT COUNT(*) FROM help_chat_sessions WHERE escalated_at IS NOT NULL'),
            'tickets_open' => $scalar($pdo, "SELECT COUNT(*) FROM support_tickets WHERE status IN ('open','in_progress','pending')"),
            'kb_articles' => $scalar($pdo, "SELECT COUNT(*) FROM help_kb_articles WHERE status = 'published'"),
            'ai_replies_used_period' => $aiUsed,
        ];
        echo json_encode(['data' => $data, 'meta' => ['source' => 'help_chat_sessions']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Master: agents (reuse platform roles — no duplicate auth) ──
    if ($uri === '/master/help-chat/agents' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $agents = [];
        try {
            if (souq_table_exists($pdo, 'users')) {
                $st = $pdo->query(
                    "SELECT id, name, email, role FROM users
                     WHERE LOWER(COALESCE(role,'')) IN ('super_admin','admin','support','support_agent','master')
                     ORDER BY name ASC LIMIT 100"
                );
                $agents = $st ? ($st->fetchAll(PDO::FETCH_ASSOC) ?: []) : [];
            }
        } catch (Throwable) {
            $agents = [];
        }
        if (!$agents) {
            $agents = [
                ['id' => 'master', 'name' => 'Master Admin', 'email' => 'master@unityteck.com', 'role' => 'super_admin'],
            ];
        }
        echo json_encode(['data' => $agents, 'meta' => ['total' => count($agents), 'source' => 'users']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}
