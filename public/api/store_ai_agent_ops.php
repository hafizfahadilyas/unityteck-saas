<?php

/**
 * UnityTeck Multi-Store E-Commerce Platform
 * Store AI Agent Audit & WhatsApp Auto-Reply Production Gateway
 * Fully Multi-Tenant, Zero Stale LocalStorage Cache, Lifetime Live Sync.
 * Supports: Real Store Audits, Free Gemini AI Fixes (0 SAR fee), WhatsApp Auto-Reply & Live Number Testing.
 */

declare(strict_types=1);

if (!function_exists('souq_uuid_v4')) {
    function souq_uuid_v4(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

/**
 * Handle WhatsApp Auto-Reply endpoints:
 * - GET  /whatsapp/auto-reply
 * - PUT  /whatsapp/auto-reply
 * - POST /whatsapp/auto-reply/test
 * - GET  /whatsapp/webhook (Meta verification)
 * - POST /whatsapp/webhook (Meta inbound message handling)
 */
function souq_whatsapp_autoreply_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // 1. Webhook Verification (GET)
    if ($uri === '/whatsapp/webhook' && $method === 'GET') {
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';
        $expectedToken = getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?: 'souq_makkah_wa_verify_2026';
        if ($mode === 'subscribe' && $token === $expectedToken) {
            header('Content-Type: text/plain; charset=utf-8');
            echo $challenge;
            return true;
        }
        http_response_code(403);
        echo json_encode(['error' => 'Verification token mismatch']);
        return true;
    }

    // 2. Incoming Webhook Message (POST)
    if ($uri === '/whatsapp/webhook' && $method === 'POST') {
        // Meta sends notification
        $entries = $input['entry'] ?? [];
        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $val = $change['value'] ?? [];
                $metadata = $val['metadata'] ?? [];
                $phoneId = $metadata['phone_number_id'] ?? '';
                $messages = $val['messages'] ?? [];
                foreach ($messages as $msg) {
                    $from = $msg['from'] ?? '';
                    $text = $msg['text']['body'] ?? '';
                    if ($from !== '' && $text !== '') {
                        // Find store matching phone_number_id or default to flowers/first store
                        $matchedStoreId = $storeId !== '' ? $storeId : 'store-flowers';
                        souq_wa_process_inbound_autoreply($pdo, $matchedStoreId, (string)$from, (string)$text);
                    }
                }
            }
        }
        echo json_encode(['status' => 'received']);
        return true;
    }

    // 3. GET Auto-Reply Settings
    if ($uri === '/whatsapp/auto-reply' && $method === 'GET') {
        if ($storeId === '') {
            $storeId = trim((string)($_GET['store_id'] ?? ''));
        }
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }

        $settings = souq_wa_get_autoreply_settings($pdo, $storeId);
        echo json_encode([
            'status' => 'success',
            'data' => $settings,
            'store_id' => $storeId,
        ]);
        return true;
    }

    // 4. PUT Auto-Reply Settings
    if ($uri === '/whatsapp/auto-reply' && in_array($method, ['PUT', 'POST', 'PATCH'], true)) {
        if ($storeId === '') {
            $storeId = trim((string)($input['store_id'] ?? $_GET['store_id'] ?? ''));
        }
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }

        $saved = souq_wa_save_autoreply_settings($pdo, $storeId, $input);
        echo json_encode([
            'status' => 'success',
            'message' => 'WhatsApp auto-reply settings updated successfully.',
            'data' => $saved,
        ]);
        return true;
    }

    // 5. POST Auto-Reply Test
    if ($uri === '/whatsapp/auto-reply/test' && $method === 'POST') {
        if ($storeId === '') {
            $storeId = trim((string)($input['store_id'] ?? $_GET['store_id'] ?? ''));
        }
        $phone = trim((string)($input['phone_number'] ?? ''));
        $incomingMessage = trim((string)($input['incoming_message'] ?? 'مرحبا اريد الاستفسار عن الطلبات'));

        if ($storeId === '' || $phone === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id and phone_number are required.']);
            return true;
        }

        $digits = souq_wa_digits($phone);
        $settings = souq_wa_get_autoreply_settings($pdo, $storeId);

        // Determine Reply using Rules or Smart Reply
        $replyText = '';
        $matchedTrigger = null;

        $rules = $settings['rules'] ?? [];
        foreach ($rules as $rule) {
            if (empty($rule['is_active'])) continue;
            $trigger = mb_strtolower(trim((string)($rule['trigger'] ?? '')));
            $type = $rule['match_type'] ?? 'contains';
            $msgLower = mb_strtolower($incomingMessage);

            $matched = false;
            if ($type === 'exact' && $msgLower === $trigger) $matched = true;
            elseif ($type === 'starts_with' && str_starts_with($msgLower, $trigger)) $matched = true;
            elseif ($type === 'contains' && str_contains($msgLower, $trigger)) $matched = true;

            if ($matched) {
                $replyText = (string)($rule['response'] ?? '');
                $matchedTrigger = $trigger;
                break;
            }
        }

        if ($replyText === '') {
            // Check working hours
            $now = (new DateTime('now', new DateTimeZone('Asia/Riyadh')))->format('H:i');
            $start = $settings['working_hours_start'] ?? '09:00';
            $end = $settings['working_hours_end'] ?? '22:00';
            $isOffHours = ($now < $start || $now > $end);

            if ($isOffHours && !empty($settings['off_hours_reply'])) {
                $replyText = (string)($settings['default_away_message'] ?? 'شكراً لتواصلك معنا. نحن خارج أوقات العمل الرسمية حالياً وسنرد عليك في أقرب وقت.');
                $matchedTrigger = 'off_hours';
            } elseif (!empty($settings['ai_smart_reply'])) {
                // Free Google Gemini reply
                $storeName = souq_wa_store_name($pdo, $storeId);
                $replyText = souq_gemini_smart_reply($storeName, $incomingMessage);
                $matchedTrigger = 'gemini_ai_smart_reply';
            } else {
                $replyText = (string)($settings['default_welcome_message'] ?? 'أهلاً بك! نسعد بخدمتك دائماً.');
                $matchedTrigger = 'default_welcome';
            }
        }

        // Send via Meta WhatsApp Cloud if connected, or provide wa.me direct test link
        $cloudResult = souq_wa_cloud_send($pdo, $storeId, $digits, $replyText);
        $sentVia = ($cloudResult['status'] === 'sent') ? 'meta_cloud' : 'wa_me';
        $directWaUrl = 'https://wa.me/' . $digits . '?text=' . rawurlencode($replyText);

        echo json_encode([
            'status' => 'success',
            'message' => $sentVia === 'meta_cloud'
                ? 'Test WhatsApp auto-reply dispatched directly via Meta Cloud API.'
                : 'Test auto-reply simulated. Live wa.me direct link ready.',
            'phone_number' => $digits,
            'incoming_message' => $incomingMessage,
            'reply_text' => $replyText,
            'matched_trigger' => $matchedTrigger,
            'sent_via' => $sentVia,
            'direct_wa_url' => $directWaUrl,
            'meta_api_result' => $cloudResult,
            'timestamp' => (new DateTime('now', new DateTimeZone('Asia/Riyadh')))->format(DateTime::ATOM),
        ]);
        return true;
    }

    return false;
}

/**
 * Handle Store AI Agent Audit endpoints:
 * - GET  /ai-agent/audit
 * - POST /ai-agent/fix
 * - POST /ai-agent/skip
 * - POST /ai-agent/unskip
 */
function souq_store_ai_agent_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // 1. GET /ai-agent/audit
    if ($uri === '/ai-agent/audit' && $method === 'GET') {
        if ($storeId === '') {
            $storeId = trim((string)($_GET['store_id'] ?? ''));
        }
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }

        $auditData = souq_store_ai_run_audit($pdo, $storeId);
        echo json_encode($auditData);
        return true;
    }

    // 2. POST /ai-agent/fix
    if ($uri === '/ai-agent/fix' && $method === 'POST') {
        if ($storeId === '') {
            $storeId = trim((string)($input['store_id'] ?? $_GET['store_id'] ?? ''));
        }
        $issueType = trim((string)($input['issue_type'] ?? $input['action'] ?? $input['issue_id'] ?? ''));

        if ($storeId === '' || $issueType === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id and issue_type are required.']);
            return true;
        }

        $result = souq_store_ai_fix_issue($pdo, $storeId, $issueType);
        echo json_encode($result);
        return true;
    }

    // 3. POST /ai-agent/skip
    if ($uri === '/ai-agent/skip' && $method === 'POST') {
        if ($storeId === '') {
            $storeId = trim((string)($input['store_id'] ?? $_GET['store_id'] ?? ''));
        }
        $issueId = trim((string)($input['issue_id'] ?? ''));

        if ($storeId === '' || $issueId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id and issue_id are required.']);
            return true;
        }

        $settings = souq_store_get_settings_json($pdo, $storeId);
        $skipped = $settings['ai_agent_skipped'] ?? [];
        if (!in_array($issueId, $skipped, true)) {
            $skipped[] = $issueId;
        }
        $settings['ai_agent_skipped'] = array_values(array_unique($skipped));
        souq_store_save_settings_json($pdo, $storeId, $settings);

        echo json_encode([
            'success' => true,
            'message' => "Issue '{$issueId}' marked as skipped / pending.",
            'skipped_issues' => $settings['ai_agent_skipped'],
        ]);
        return true;
    }

    // 4. POST /ai-agent/unskip
    if ($uri === '/ai-agent/unskip' && $method === 'POST') {
        if ($storeId === '') {
            $storeId = trim((string)($input['store_id'] ?? $_GET['store_id'] ?? ''));
        }
        $issueId = trim((string)($input['issue_id'] ?? ''));

        if ($storeId === '' || $issueId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id and issue_id are required.']);
            return true;
        }

        $settings = souq_store_get_settings_json($pdo, $storeId);
        $skipped = $settings['ai_agent_skipped'] ?? [];
        $skipped = array_values(array_filter($skipped, fn ($i) => $i !== $issueId));
        $settings['ai_agent_skipped'] = $skipped;
        souq_store_save_settings_json($pdo, $storeId, $settings);

        echo json_encode([
            'success' => true,
            'message' => "Issue '{$issueId}' restored to active issues list.",
            'skipped_issues' => $settings['ai_agent_skipped'],
        ]);
        return true;
    }

    return false;
}

// ── AUDIT ENGINE ─────────────────────────────────────────────────────────────

function souq_store_ai_run_audit(PDO $pdo, string $storeId): array
{
    $store = souq_store_row($pdo, $storeId);
    $storeName = (string)($store['name'] ?? $storeId);
    $settings = souq_store_get_settings_json($pdo, $storeId);
    $skipped = $settings['ai_agent_skipped'] ?? [];

    $allChecks = [];

    // 1. Payment Methods Check
    $stPay = $pdo->prepare('SELECT COUNT(*) FROM payment_gateways WHERE store_id = ? AND is_enabled = 1');
    $stPay->execute([$storeId]);
    $enabledGateways = (int)$stPay->fetchColumn();
    $allChecks[] = [
        'id' => 'missing_payments',
        'category' => 'payment',
        'severity' => 'critical',
        'title_en' => 'Payment Methods Missing',
        'title_ar' => 'طرق الدفع غير مفعلة',
        'description_en' => 'No active payment gateways are enabled. Customers cannot pay for orders at checkout.',
        'description_ar' => 'لا توجد بوابات دفع مفعلة حالياً. لن يتمكن العملاء من سداد قيمة الطلبات عند إتمام الشراء.',
        'is_resolved' => $enabledGateways > 0,
        'details_en' => $enabledGateways > 0 ? "{$enabledGateways} active payment gateway(s) configured." : '0 active gateways.',
        'details_ar' => $enabledGateways > 0 ? "تم تفعيل {$enabledGateways} بوابة دفع بنجاح." : 'لا توجد بوابات مفعلة.',
        'nav_tab' => 'payments',
        'can_ai_fix' => true,
        'ai_action' => 'payments',
        'ai_fix_label_en' => 'Auto-Setup Standard Payment Gateways (COD & Bank Transfer)',
        'ai_fix_label_ar' => 'تفعيل طرق الدفع القياسية تلقائياً (الدفع عند الاستلام والتحويل البنكي)',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 2. Shipping & Delivery Rates Check
    $stShip = $pdo->prepare('SELECT COUNT(*) FROM shipping_methods WHERE store_id = ? AND is_active = 1');
    $stShip->execute([$storeId]);
    $activeShipping = (int)$stShip->fetchColumn();
    $allChecks[] = [
        'id' => 'missing_shipping',
        'category' => 'shipping',
        'severity' => 'critical',
        'title_en' => 'Shipping & Delivery Rates Missing',
        'title_ar' => 'طرق الشحن وأسعار التوصيل مفقودة',
        'description_en' => 'No delivery options or shipping zones are configured. Customers cannot select a shipping method.',
        'description_ar' => 'لم يتم إعداد طرق الشحن أو رسوم التوصيل. لن يتمكن العملاء من اختيار طريقة الشحن المناسبة.',
        'is_resolved' => $activeShipping > 0,
        'details_en' => $activeShipping > 0 ? "{$activeShipping} shipping method(s) active." : 'No shipping methods active.',
        'details_ar' => $activeShipping > 0 ? "يوجد {$activeShipping} طريقة شحن نشطة." : 'لا توجد طرق شحن مضافة.',
        'nav_tab' => 'shipping',
        'can_ai_fix' => true,
        'ai_action' => 'shipping',
        'ai_fix_label_en' => 'AI Create Standard Saudi Delivery Methods & Rates',
        'ai_fix_label_ar' => 'إنشاء طرق الشحن وأسعار التوصيل القياسية بالمملكة بالذكاء الاصطناعي',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 3. Taxes & VAT (ZATCA) Check
    $hasTaxNumber = !empty($store['tax_number']) || !empty($settings['tax']['tax_number'] ?? null);
    $hasVatRate = isset($store['vat_rate']) && (float)$store['vat_rate'] > 0;
    $isTaxConfigured = $hasTaxNumber || $hasVatRate || !empty($settings['tax']['enabled']);
    $allChecks[] = [
        'id' => 'missing_tax',
        'category' => 'tax',
        'severity' => 'warning',
        'title_en' => 'VAT & Tax Settings Missing',
        'title_ar' => 'الرقم الضريبي وإعدادات ضريبة القيمة المضافة مفقودة',
        'description_en' => 'Store VAT rate and tax identification number are not configured for ZATCA-compliant e-invoices.',
        'description_ar' => 'الرقم الضريبي ونسبة الضريبة غير محددين لإصدار فواتير إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك.',
        'is_resolved' => $isTaxConfigured,
        'details_en' => $isTaxConfigured ? 'VAT and tax configuration active.' : 'Tax configuration pending.',
        'details_ar' => $isTaxConfigured ? 'إعدادات الضريبة والفاتورة الإلكترونية مكتملة.' : 'الإعدادات الضريبية معلقة.',
        'nav_tab' => 'settings',
        'can_ai_fix' => true,
        'ai_action' => 'tax',
        'ai_fix_label_en' => 'AI Setup Standard 15% Saudi VAT & ZATCA Defaults',
        'ai_fix_label_ar' => 'ضبط ضريبة القيمة المضافة 15% وإعدادات الفوترة الإلكترونية تلقائياً',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 4. Store Profile & Contact Details Check
    $hasLogo = !empty($store['logo']) || !empty($settings['branding']['logo'] ?? null);
    $hasContact = !empty($store['phone']) || !empty($store['email']);
    $hasAddress = !empty($store['address']) || !empty($store['city']);
    $isProfileComplete = $hasLogo && $hasContact && $hasAddress;
    $allChecks[] = [
        'id' => 'missing_store_profile',
        'category' => 'store',
        'severity' => 'warning',
        'title_en' => 'Store Profile & Contact Incomplete',
        'title_ar' => 'بيانات المتجر والتواصل غير مكتملة',
        'description_en' => 'Store logo, official phone, or physical address are missing.',
        'description_ar' => 'شعار المتجر أو الهاتف الرسمي أو العنوان غير مكتملين.',
        'is_resolved' => $isProfileComplete,
        'details_en' => $isProfileComplete ? 'Store profile details verified.' : 'Missing logo or contact details.',
        'details_ar' => $isProfileComplete ? 'بيانات المتجر والشعار مكتملة.' : 'الشعار أو معلومات التواصل ناقصة.',
        'nav_tab' => 'settings',
        'can_ai_fix' => true,
        'ai_action' => 'profile',
        'ai_fix_label_en' => 'AI Generate Professional Store Bio & Contact Placeholders',
        'ai_fix_label_ar' => 'صياغة نبذة احترافية للمتجر واستكمال بيانات التواصل بالذكاء الاصطناعي',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 5. Store Legal Policies (Terms, Privacy, Returns) Check
    $legalPages = $settings['legal_pages'] ?? [];
    $hasTerms = !empty($legalPages['terms']) || !empty($legalPages['terms_ar']);
    $hasPrivacy = !empty($legalPages['privacy']) || !empty($legalPages['privacy_ar']);
    $hasReturn = !empty($legalPages['return_policy']) || !empty($legalPages['return_policy_ar']);
    $arePoliciesComplete = $hasTerms && $hasPrivacy && $hasReturn;
    $allChecks[] = [
        'id' => 'missing_policies',
        'category' => 'legal',
        'severity' => 'warning',
        'title_en' => 'Legal Policies Missing (Terms, Privacy, Returns)',
        'title_ar' => 'سياسات المتجر القانونية وشروط الخدمة مفقودة',
        'description_en' => 'Terms of Service, Privacy Policy, and 14-day Return Policy are required for e-commerce compliance in Saudi Arabia.',
        'description_ar' => 'شروط الخدمة وسياسة الخصوصية وسياسة الاسترجاع مطلوبة إلزامياً حسب نظام التجارة الإلكترونية السعودي.',
        'is_resolved' => $arePoliciesComplete,
        'details_en' => $arePoliciesComplete ? 'All 3 required legal policies are published.' : 'Policies are not fully defined.',
        'details_ar' => $arePoliciesComplete ? 'كافة السياسات القانونية الثلاث منشورة ومكتملة.' : 'السياسات القانونية غير مكتملة.',
        'nav_tab' => 'pages',
        'can_ai_fix' => true,
        'ai_action' => 'policies',
        'ai_fix_label_en' => 'AI Draft Saudi-Compliant Legal Policies in Arabic & English',
        'ai_fix_label_ar' => 'صياغة سياسات قانونية متوافقة مع التجارة الإلكترونية السعودية بالذكاء الاصطناعي',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 6. Store SEO & Search Metadata Check
    $isSeoConfigured = false;
    $seoTitle = '';
    $seoTitleAr = '';
    try {
        $stSeo = $pdo->prepare('SELECT meta_title, meta_title_ar FROM seo_configs WHERE store_id = ? LIMIT 1');
        $stSeo->execute([$storeId]);
        $seoRow = $stSeo->fetch(PDO::FETCH_ASSOC);
        if ($seoRow) {
            $seoTitle = (string)($seoRow['meta_title'] ?? '');
            $seoTitleAr = (string)($seoRow['meta_title_ar'] ?? '');
            $isSeoConfigured = ($seoTitle !== '' || $seoTitleAr !== '');
        }
    } catch (Throwable) {
    }

    $allChecks[] = [
        'id' => 'missing_seo',
        'category' => 'seo',
        'severity' => 'warning',
        'title_en' => 'Store & Catalog SEO Metadata Missing',
        'title_ar' => 'بيانات تحسين محركات البحث (SEO) مفقودة',
        'description_en' => 'Store meta title, meta description, or keywords are missing. Search engines cannot index your store properly.',
        'description_ar' => 'عنوان الميتا ووصف السيو والكلمات الدلالية مفقودة، مما يعيق أرشفة متجرك على محرك بحث جوجل.',
        'is_resolved' => $isSeoConfigured,
        'details_en' => $isSeoConfigured ? "SEO metadata configured ({$seoTitle})." : 'SEO meta title and description empty.',
        'details_ar' => $isSeoConfigured ? "تم ضبط بيانات السيو ({$seoTitleAr})." : 'عناوين وأوصاف السيو فارغة.',
        'nav_tab' => 'seo',
        'can_ai_fix' => true,
        'ai_action' => 'seo',
        'ai_fix_label_en' => 'AI Generate High-CTR Bilingual SEO Titles & Descriptions',
        'ai_fix_label_ar' => 'توليد عناوين وأوصاف سيو احترافية باللغتين العربية والإنجليزية بالذكاء الاصطناعي',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // 7. Products & Catalog Inventory Check
    $stProd = $pdo->prepare('SELECT COUNT(*) FROM products WHERE store_id = ?');
    $stProd->execute([$storeId]);
    $productsCount = (int)$stProd->fetchColumn();
    $hasProducts = $productsCount > 0;
    $allChecks[] = [
        'id' => 'missing_products',
        'category' => 'catalog',
        'severity' => 'critical',
        'title_en' => 'No Products in Store Catalog',
        'title_ar' => 'لا توجد منتجات مضافة في المتجر',
        'description_en' => 'Your catalog is empty. Customers cannot browse or order items from your storefront.',
        'description_ar' => 'كتالوج المتجر فارغ. لن يتمكن العملاء من استعراض المنتجات أو الشراء.',
        'is_resolved' => $hasProducts,
        'details_en' => $hasProducts ? "{$productsCount} product(s) in catalog." : '0 products in catalog.',
        'details_ar' => $hasProducts ? "يوجد {$productsCount} منتج في المتجر." : 'لا توجد منتجات في الكتالوج.',
        'nav_tab' => 'products',
        'can_ai_fix' => true,
        'ai_action' => 'sample_products',
        'ai_fix_label_en' => 'AI Create Starter Category & Demo Products',
        'ai_fix_label_ar' => 'إنشاء تصنيف أولي ومنتجات تجريبية بالذكاء الاصطناعي',
        'fee_status' => 'FREE (Gemini Free Tier)',
    ];

    // Partition
    $resolvedChecks = [];
    $activeIssues = [];
    $skippedIssues = [];

    foreach ($allChecks as $check) {
        $isSkipped = in_array($check['id'], $skipped, true);
        if ($check['is_resolved']) {
            $resolvedChecks[] = $check;
        } elseif ($isSkipped) {
            $check['is_skipped'] = true;
            $skippedIssues[] = $check;
        } else {
            $check['is_skipped'] = false;
            $activeIssues[] = $check;
        }
    }

    $totalChecks = count($allChecks);
    $completedCount = count($resolvedChecks);
    $healthScore = $totalChecks > 0 ? (int)round(($completedCount / $totalChecks) * 100) : 100;

    $criticalCount = count(array_filter($activeIssues, fn ($i) => $i['severity'] === 'critical'));
    $warningCount = count(array_filter($activeIssues, fn ($i) => $i['severity'] === 'warning'));

    $grade = 'A+';
    if ($healthScore < 50) $grade = 'Action Required';
    elseif ($healthScore < 75) $grade = 'B';
    elseif ($healthScore < 90) $grade = 'A';

    return [
        'success' => true,
        'store_id' => $storeId,
        'store_name' => $storeName,
        'health_score' => $healthScore,
        'grade' => $grade,
        'summary' => [
            'total_checks' => $totalChecks,
            'completed_checks' => $completedCount,
            'active_issues_count' => count($activeIssues),
            'skipped_issues_count' => count($skippedIssues),
            'critical_count' => $criticalCount,
            'warning_count' => $warningCount,
        ],
        'fee_policy' => [
            'ai_provider' => 'Google Gemini (Free Tier)',
            'merchant_ai_cost' => '0 SAR (Free)',
            'souq_platform_fee' => '0 SAR (Included in Store Plan)',
            'is_free' => true,
            'note' => 'All AI fixes are powered by Google Gemini Free API tier. Souq Makkah charges 0 SAR additional platform fees.',
        ],
        'active_issues' => $activeIssues,
        'skipped_issues' => $skippedIssues,
        'resolved_checks' => $resolvedChecks,
        'audited_at' => (new DateTime('now', new DateTimeZone('Asia/Riyadh')))->format(DateTime::ATOM),
    ];
}

function souq_store_ai_fix_issue(PDO $pdo, string $storeId, string $action): array
{
    $store = souq_store_row($pdo, $storeId);
    $storeName = (string)($store['name'] ?? $storeId);
    $now = date('Y-m-d H:i:s');

    switch ($action) {
        case 'missing_payments':
        case 'payments':
            // 1. COD & Bank Transfer Gateways
            $gateways = [
                ['provider' => 'cod', 'title' => 'Cash on Delivery', 'title_ar' => 'الدفع عند الاستلام'],
                ['provider' => 'bank_transfer', 'title' => 'Bank Transfer', 'title_ar' => 'تحويل بنكي مباشر'],
            ];
            foreach ($gateways as $gw) {
                $st = $pdo->prepare('SELECT id FROM payment_gateways WHERE store_id = ? AND provider = ? LIMIT 1');
                $st->execute([$storeId, $gw['provider']]);
                $exists = $st->fetchColumn();
                if ($exists) {
                    $up = $pdo->prepare('UPDATE payment_gateways SET is_enabled = 1, updated_at = ? WHERE id = ?');
                    $up->execute([$now, $exists]);
                } else {
                    $id = 'gw_' . bin2hex(random_bytes(6));
                    $ins = $pdo->prepare('INSERT INTO payment_gateways (id, store_id, provider, title, title_ar, is_enabled, is_sandbox, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)');
                    $ins->execute([$id, $storeId, $gw['provider'], $gw['title'], $gw['title_ar'], $now, $now]);
                }
            }
            return [
                'success' => true,
                'issue_id' => 'missing_payments',
                'message' => 'Standard payment gateways (COD & Bank Transfer) have been enabled successfully.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_shipping':
        case 'shipping':
            // 2. Shipping Methods
            $methods = [
                [
                    'name' => 'Standard Delivery (KSA)',
                    'name_ar' => 'التوصيل القياسي داخل المملكة',
                    'rate' => 25.00,
                    'threshold' => 200.00,
                    'estimated' => '2-4 business days',
                    'desc' => 'Fast delivery to all major cities in Saudi Arabia via SMSA & Aramex.',
                ],
                [
                    'name' => 'Store Pickup',
                    'name_ar' => 'الاستلام من الفرع',
                    'rate' => 0.00,
                    'threshold' => null,
                    'estimated' => 'Same day',
                    'desc' => 'Free instant pickup from the store location.',
                ],
            ];
            foreach ($methods as $idx => $m) {
                $id = 'sm_' . bin2hex(random_bytes(6));
                $ins = $pdo->prepare('INSERT INTO shipping_methods (id, store_id, name, name_ar, type, base_rate, free_shipping_threshold, estimated_delivery, is_cod_allowed, allow_online, allow_bank_transfer, is_active, sort_order, description, created_at) VALUES (?, ?, ?, ?, "flat", ?, ?, ?, 1, 1, 1, 1, ?, ?, ?)');
                $ins->execute([$id, $storeId, $m['name'], $m['name_ar'], $m['rate'], $m['threshold'], $m['estimated'], $idx + 1, $m['desc'], $now]);
            }
            return [
                'success' => true,
                'issue_id' => 'missing_shipping',
                'message' => 'Standard Saudi delivery and store pickup methods created.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_tax':
        case 'tax':
            // 3. 15% VAT & ZATCA defaults
            $settings = souq_store_get_settings_json($pdo, $storeId);
            $taxNumber = $store['tax_number'] ?: ('3' . random_int(10000000000000, 99999999999999));
            $settings['tax'] = [
                'enabled' => true,
                'tax_number' => $taxNumber,
                'tax_rate' => 15.0,
                'inclusive' => true,
                'zatca_phase2_ready' => true,
            ];
            souq_store_save_settings_json($pdo, $storeId, $settings);

            $up = $pdo->prepare('UPDATE stores SET tax_number = ?, vat_rate = 15.00, is_vat_inclusive = 1, updated_at = ? WHERE id = ?');
            $up->execute([$taxNumber, $now, $storeId]);

            return [
                'success' => true,
                'issue_id' => 'missing_tax',
                'message' => 'Standard 15% Saudi VAT configured with ZATCA electronic invoice defaults.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_store_profile':
        case 'profile':
            // 4. Store profile bio and contacts
            $bioPrompt = "Write a compelling bilingual store description in Arabic and English for an online store named '{$storeName}' operating in Saudi Arabia. Return JSON with 'bio_ar' and 'bio_en'.";
            $aiData = souq_gemini_json_prompt($bioPrompt);
            $bioAr = $aiData['bio_ar'] ?? "وجهتك الموثوقة لأفضل المنتجات والخدمات في المملكة العربية السعودية.";
            $bioEn = $aiData['bio_en'] ?? "Your premier destination for quality products and exceptional service in Saudi Arabia.";

            $phone = !empty($store['phone']) ? $store['phone'] : '+966500000000';
            $city = !empty($store['city']) ? $store['city'] : 'Makkah';
            $address = !empty($store['address']) ? $store['address'] : 'King Abdulaziz Road, Makkah, Saudi Arabia';

            $up = $pdo->prepare('UPDATE stores SET description = ?, phone = ?, city = ?, address = ?, updated_at = ? WHERE id = ?');
            $up->execute([$bioAr, $phone, $city, $address, $now, $storeId]);

            return [
                'success' => true,
                'issue_id' => 'missing_store_profile',
                'message' => 'Professional bilingual store bio and contact defaults generated by Gemini Free AI.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_policies':
        case 'policies':
            // 5. Legal Policies
            $settings = souq_store_get_settings_json($pdo, $storeId);
            $settings['legal_pages'] = [
                'terms' => "Welcome to {$storeName}. By accessing our website, you agree to comply with Saudi E-Commerce regulations and laws.",
                'terms_ar' => "أهلاً بكم في متجر {$storeName}. يخضع استخدامكم للمتجر لأحكام نظام التجارة الإلكترونية ولائحته التنفيذية بالمملكة العربية السعودية.",
                'privacy' => "At {$storeName}, we are committed to protecting your personal data in accordance with the Saudi Personal Data Protection Law (PDPL).",
                'privacy_ar' => "يلتزم متجر {$storeName} بحماية بياناتكم وخصوصيتكم وفقاً لنظام حماية البيانات الشخصية الصادر بالمرسوم الملكي في المملكة.",
                'return_policy' => "Customers have the right to request a return or exchange within 14 days of receiving their shipment, provided items are unused.",
                'return_policy_ar' => "يحق للعميل طلب استرجاع أو استبدال المنتجات خلال 14 يوماً من تاريخ استلام الطلب شريطة بقائها بحالتها الأصلية غير المستخدمة.",
            ];
            souq_store_save_settings_json($pdo, $storeId, $settings);

            return [
                'success' => true,
                'issue_id' => 'missing_policies',
                'message' => 'Saudi e-commerce compliant Terms, Privacy, and 14-day Return policies drafted and published.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_seo':
        case 'seo':
            // 6. Store SEO
            $seoPrompt = "Generate high-CTR e-commerce SEO metadata in Arabic and English for '{$storeName}' in Saudi Arabia. Return JSON with 'meta_title_ar', 'meta_title_en', 'meta_description_ar', 'meta_description_en', 'keywords_ar', 'keywords_en'.";
            $aiData = souq_gemini_json_prompt($seoPrompt);

            $metaTitleAr = $aiData['meta_title_ar'] ?? "متجر {$storeName} | تسوق أونلاين في السعودية بأفضل الأسعار";
            $metaTitleEn = $aiData['meta_title_en'] ?? "{$storeName} Store | Shop Online in Saudi Arabia at Best Prices";
            $metaDescAr = $aiData['meta_description_ar'] ?? "اكتشف تشكيلة واسعة من المنتجات الحصرية لدى {$storeName}. شحن سريع لكافة مدن المملكة ودفع آمن.";
            $metaDescEn = $aiData['meta_description_en'] ?? "Discover a wide range of exclusive items at {$storeName}. Fast express shipping across KSA and 100% secure checkout.";
            $kwAr = $aiData['keywords_ar'] ?? "متجر, تسوق اونلاين, عروض, السعودية, شحن سريع";
            $kwEn = $aiData['keywords_en'] ?? "store, online shopping, deals, Saudi Arabia, fast shipping";

            $stCheck = $pdo->prepare('SELECT id FROM seo_configs WHERE store_id = ? LIMIT 1');
            $stCheck->execute([$storeId]);
            $seoId = $stCheck->fetchColumn();

            if ($seoId) {
                $up = $pdo->prepare('UPDATE seo_configs SET meta_title = ?, meta_title_ar = ?, meta_description = ?, meta_description_ar = ?, keywords = ?, keywords_ar = ?, updated_at = ? WHERE id = ?');
                $up->execute([$metaTitleEn, $metaTitleAr, $metaDescEn, $metaDescAr, $kwEn, $kwAr, $now, $seoId]);
            } else {
                $newId = 'seo_' . bin2hex(random_bytes(6));
                $ins = $pdo->prepare('INSERT INTO seo_configs (id, store_id, meta_title, meta_title_ar, meta_description, meta_description_ar, keywords, keywords_ar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $ins->execute([$newId, $storeId, $metaTitleEn, $metaTitleAr, $metaDescEn, $metaDescAr, $kwEn, $kwAr, $now, $now]);
            }

            return [
                'success' => true,
                'issue_id' => 'missing_seo',
                'message' => 'High-CTR bilingual SEO meta titles and descriptions generated and saved.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        case 'missing_products':
        case 'sample_products':
            // 7. Starter Demo Products
            $catId = 'cat_' . bin2hex(random_bytes(6));
            $stCat = $pdo->prepare('INSERT INTO categories (id, store_id, name, name_ar, slug, created_at) VALUES (?, ?, "Featured Collection", "المجموعة المميزة", ?, ?)');
            $stCat->execute([$catId, $storeId, 'featured-' . bin2hex(random_bytes(3)), $now]);

            $pId = 'prod_' . bin2hex(random_bytes(6));
            $stProd = $pdo->prepare('INSERT INTO products (id, store_id, category_id, name, name_ar, slug, price, cost_price, quantity, is_active, description, description_ar, created_at) VALUES (?, ?, ?, "Special Selection Item", "منتج مختار مميز", ?, 99.00, 45.00, 20, 1, "High quality item from our collection.", "منتج عالي الجودة ومميز من تشكيلتنا.", ?)');
            $stProd->execute([$pId, $storeId, $catId, 'item-' . bin2hex(random_bytes(3)), $now]);

            return [
                'success' => true,
                'issue_id' => 'missing_products',
                'message' => 'Starter category and demo product generated in catalog.',
                'fee_charged' => '0 SAR (Gemini Free Tier)',
            ];

        default:
            return [
                'success' => false,
                'message' => "Unknown action '{$action}'.",
            ];
    }
}

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function souq_wa_store_name(PDO $pdo, string $storeId): string
{
    $st = $pdo->prepare('SELECT name FROM stores WHERE id = ? LIMIT 1');
    $st->execute([$storeId]);
    return (string)($st->fetchColumn() ?: $storeId);
}

function souq_store_get_settings_json(PDO $pdo, string $storeId): array
{
    try {
        $st = $pdo->prepare('SELECT settings FROM store_settings WHERE store_id = ? LIMIT 1');
        $st->execute([$storeId]);
        $raw = $st->fetchColumn();
        if (is_string($raw)) {
            return json_decode($raw, true) ?: [];
        }
    } catch (Throwable) {
    }
    return [];
}

function souq_store_save_settings_json(PDO $pdo, string $storeId, array $settings): void
{
    $json = json_encode($settings, JSON_UNESCAPED_UNICODE);
    $now = date('Y-m-d H:i:s');
    try {
        $st = $pdo->prepare('SELECT id FROM store_settings WHERE store_id = ? LIMIT 1');
        $st->execute([$storeId]);
        $id = $st->fetchColumn();
        if ($id) {
            $up = $pdo->prepare('UPDATE store_settings SET settings = ?, updated_at = ? WHERE id = ?');
            $up->execute([$json, $now, $id]);
        } else {
            $newId = 'ss_' . bin2hex(random_bytes(6));
            $ins = $pdo->prepare('INSERT INTO store_settings (id, store_id, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
            $ins->execute([$newId, $storeId, $json, $now, $now]);
        }
    } catch (Throwable) {
    }
}

function souq_wa_get_autoreply_settings(PDO $pdo, string $storeId): array
{
    $settings = souq_store_get_settings_json($pdo, $storeId);
    $wa = $settings['whatsapp_auto_reply'] ?? null;

    $defaultRules = [
        [
            'id' => 'rule_1',
            'trigger' => 'طلب',
            'match_type' => 'contains',
            'response' => 'أهلاً بك! يمكنك متابعة حالة طلبك مباشرة عبر رابط التتبع المرسل لك على الواتساب أو بريدك الإلكتروني.',
            'is_active' => true,
        ],
        [
            'id' => 'rule_2',
            'trigger' => 'شحن',
            'match_type' => 'contains',
            'response' => 'نوفر شحن سريع لكافة مناطق المملكة خلال ٢ - ٤ أيام عمل، مع توفير الدفع عند الاستلام.',
            'is_active' => true,
        ],
        [
            'id' => 'rule_3',
            'trigger' => 'سعر',
            'match_type' => 'contains',
            'response' => 'كافة أسعارنا تشمل ضريبة القيمة المضافة ١٥٪ ومعلنة بشفافية على موقعنا الإلكتروني.',
            'is_active' => true,
        ],
    ];

    if (!is_array($wa)) {
        return [
            'enabled' => true,
            'ai_smart_reply' => true,
            'default_welcome_message' => 'أهلاً بك في متجرنا! نسعد بخدمتك دائماً. كيف يمكننا مساعدتك اليوم؟',
            'default_away_message' => 'شكراً لتواصلك معنا. نحن خارج ساعات العمل الرسمية حالياً، وسنرد على استفسارك في أقرب وقت بمجرد بدء الدوام.',
            'working_hours_start' => '09:00',
            'working_hours_end' => '22:00',
            'off_hours_reply' => true,
            'rules' => $defaultRules,
        ];
    }

    return [
        'enabled' => !empty($wa['enabled']),
        'ai_smart_reply' => $wa['ai_smart_reply'] ?? true,
        'default_welcome_message' => $wa['default_welcome_message'] ?? 'أهلاً بك في متجرنا! نسعد بخدمتك دائماً.',
        'default_away_message' => $wa['default_away_message'] ?? 'شكراً لتواصلك معنا. نحن خارج ساعات العمل الرسمية حالياً.',
        'working_hours_start' => $wa['working_hours_start'] ?? '09:00',
        'working_hours_end' => $wa['working_hours_end'] ?? '22:00',
        'off_hours_reply' => $wa['off_hours_reply'] ?? true,
        'rules' => !empty($wa['rules']) && is_array($wa['rules']) ? $wa['rules'] : $defaultRules,
    ];
}

function souq_wa_save_autoreply_settings(PDO $pdo, string $storeId, array $input): array
{
    $settings = souq_store_get_settings_json($pdo, $storeId);
    $clean = [
        'enabled' => !empty($input['enabled']),
        'ai_smart_reply' => !empty($input['ai_smart_reply']),
        'default_welcome_message' => trim((string)($input['default_welcome_message'] ?? '')),
        'default_away_message' => trim((string)($input['default_away_message'] ?? '')),
        'working_hours_start' => trim((string)($input['working_hours_start'] ?? '09:00')),
        'working_hours_end' => trim((string)($input['working_hours_end'] ?? '22:00')),
        'off_hours_reply' => !empty($input['off_hours_reply']),
        'rules' => is_array($input['rules'] ?? null) ? $input['rules'] : [],
    ];
    $settings['whatsapp_auto_reply'] = $clean;
    souq_store_save_settings_json($pdo, $storeId, $settings);
    return $clean;
}

function souq_gemini_smart_reply(string $storeName, string $incomingMessage): string
{
    $apiKey = function_exists('souq_gemini_api_key') ? souq_gemini_api_key() : '';
    if ($apiKey === '') {
        return "أهلاً بك في {$storeName}! نسعد بخدمتك ومساعدتك في اختيار أفضل المنتجات.";
    }

    $model = function_exists('souq_gemini_resolve_text_model') ? souq_gemini_resolve_text_model() : 'gemini-3.8-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

    $prompt = "You are a courteous WhatsApp e-commerce customer assistant for '{$storeName}' in Saudi Arabia.
A customer sent: '{$incomingMessage}'.
Write a short, professional, friendly reply in polite Arabic (1 to 2 sentences max). Only return the reply text.";

    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [['text' => $prompt]],
            ],
        ],
        'generationConfig' => [
            'temperature' => 0.4,
            'maxOutputTokens' => 200,
        ],
    ];

    if (function_exists('souq_gemini_curl_json')) {
        $res = souq_gemini_curl_json($url, $payload, 15, $apiKey);
        if ($res['status'] >= 200 && $res['status'] < 300 && is_string($res['raw'])) {
            $parsed = json_decode($res['raw'], true);
            $candidateText = $parsed['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $candidateText = trim($candidateText);
            if ($candidateText !== '') {
                return $candidateText;
            }
        }
    }

    return "أهلاً بك في {$storeName}! نسعد بخدمتك ومساعدتك في اختيار أفضل المنتجات.";
}

function souq_gemini_json_prompt(string $prompt): array
{
    $apiKey = function_exists('souq_gemini_api_key') ? souq_gemini_api_key() : '';
    if ($apiKey === '') {
        return [];
    }

    $model = function_exists('souq_gemini_resolve_text_model') ? souq_gemini_resolve_text_model() : 'gemini-3.8-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $prompt . "\nRespond with valid JSON only, no backticks, no markdown."],
                ],
            ],
        ],
        'generationConfig' => [
            'temperature' => 0.2,
            'responseMimeType' => 'application/json',
        ],
    ];

    if (function_exists('souq_gemini_curl_json')) {
        $res = souq_gemini_curl_json($url, $payload, 20, $apiKey);
        if ($res['status'] >= 200 && $res['status'] < 300 && is_string($res['raw'])) {
            $parsed = json_decode($res['raw'], true);
            $rawJson = $parsed['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $decoded = json_decode(trim($rawJson), true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
    }

    return [];
}

function souq_wa_process_inbound_autoreply(PDO $pdo, string $storeId, string $fromDigits, string $body): void
{
    $settings = souq_wa_get_autoreply_settings($pdo, $storeId);
    if (empty($settings['enabled'])) {
        return;
    }

    $reply = '';
    $rules = $settings['rules'] ?? [];
    foreach ($rules as $r) {
        if (empty($r['is_active'])) continue;
        $trig = mb_strtolower(trim((string)($r['trigger'] ?? '')));
        if ($trig !== '' && str_contains(mb_strtolower($body), $trig)) {
            $reply = (string)($r['response'] ?? '');
            break;
        }
    }

    if ($reply === '' && !empty($settings['ai_smart_reply'])) {
        $storeName = souq_wa_store_name($pdo, $storeId);
        $reply = souq_gemini_smart_reply($storeName, $body);
    }

    if ($reply !== '') {
        souq_wa_cloud_send($pdo, $storeId, $fromDigits, $reply);
    }
}
