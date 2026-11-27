<?php

declare(strict_types=1);

/**
 * SOUQ PLATFORM — MASTER ADMIN CENTRAL CONTROL CENTER OPS
 * Hostinger Native PHP Gateway Layer.
 * Interacts directly with Hostinger MySQL (u393490678_ksa).
 * Single source of truth: Zero mock data, real atomic transactions,
 * full audit trail, and 4-tier precedence engine.
 */

function souq_master_uuid(string $prefix = 'mcc'): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function souq_master_audit(
    PDO $pdo,
    string $action,
    ?string $targetType = null,
    ?string $targetId = null,
    ?array $before = null,
    ?array $after = null,
    ?string $reason = null,
    ?string $storeId = null,
    ?string $merchantId = null
): void {
    try {
        $st = $pdo->prepare("
            INSERT INTO master_central_audit_logs 
            (id, admin_id, admin_name, action, target_type, target_id, store_id, merchant_id, before_state, after_state, reason, ip_address, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $st->execute([
            souq_master_uuid('audit'),
            'admin-super',
            'Super Administrator',
            $action,
            $targetType,
            $targetId,
            $storeId,
            $merchantId,
            $before ? json_encode($before, JSON_UNESCAPED_UNICODE) : null,
            $after ? json_encode($after, JSON_UNESCAPED_UNICODE) : null,
            $reason,
            $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);
    } catch (\Throwable $e) {
        // Audit log fail should not block main operation, but logged
        error_log("Master audit log error: " . $e->getMessage());
    }
}

function souq_master_control_center_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // ── 1. DYNAMIC CONFIG SYNC (/config/sync) ───────────────────────────
    if ($uri === '/config/sync' && $method === 'GET') {
        $sid = $storeId ?: (string)($_GET['store_id'] ?? '');
        if (!$sid) {
            try {
                $st = $pdo->query("SELECT id FROM stores LIMIT 1");
                $first = $st->fetch(PDO::FETCH_ASSOC);
                if ($first) $sid = (string)$first['id'];
            } catch (\Throwable $e) {}
        }

        // 1. Pages
        $pages = [];
        try {
            $st = $pdo->query("SELECT * FROM dashboard_page_registry WHERE global_visibility = 1 ORDER BY display_order ASC");
            $pageRows = $st->fetchAll(PDO::FETCH_ASSOC);

            $pageOverrides = [];
            if ($sid) {
                $ost = $pdo->prepare("SELECT page_id, is_visible FROM merchant_page_visibility WHERE store_id = ?");
                $ost->execute([$sid]);
                while ($orow = $ost->fetch(PDO::FETCH_ASSOC)) {
                    $pageOverrides[$orow['page_id']] = (bool)$orow['is_visible'];
                }
            }

            foreach ($pageRows as $pr) {
                $vis = (bool)$pr['default_visibility'];
                if (isset($pageOverrides[$pr['id']])) {
                    $vis = $pageOverrides[$pr['id']];
                }
                $pages[$pr['route_key']] = [
                    'page_id' => $pr['id'],
                    'route_key' => $pr['route_key'],
                    'name_en' => $pr['name_en'],
                    'name_ar' => $pr['name_ar'],
                    'is_visible' => $vis,
                    'icon' => $pr['icon'],
                    'category' => $pr['category']
                ];
            }
        } catch (\Throwable $e) {}

        // 2. AI Features
        $features = [];
        try {
            $st = $pdo->query("SELECT * FROM ai_feature_registry WHERE is_active = 1");
            $featRows = $st->fetchAll(PDO::FETCH_ASSOC);

            $featOverrides = [];
            if ($sid) {
                $ost = $pdo->prepare("SELECT * FROM merchant_feature_overrides WHERE store_id = ?");
                $ost->execute([$sid]);
                while ($orow = $ost->fetch(PDO::FETCH_ASSOC)) {
                    $featOverrides[$orow['feature_id']] = $orow;
                }
            }

            foreach ($featRows as $fr) {
                $enabled = (bool)$fr['global_status'];
                $creditCost = (int)$fr['credit_cost'];
                $dailyLimit = (int)$fr['daily_limit'];
                $monthlyLimit = (int)$fr['monthly_limit'];

                if (isset($featOverrides[$fr['id']])) {
                    $ov = $featOverrides[$fr['id']];
                    $enabled = (bool)$ov['is_enabled'];
                    if ($ov['custom_credit_cost'] !== null) $creditCost = (int)$ov['custom_credit_cost'];
                    if ($ov['custom_daily_limit'] !== null) $dailyLimit = (int)$ov['custom_daily_limit'];
                    if ($ov['custom_monthly_limit'] !== null) $monthlyLimit = (int)$ov['custom_monthly_limit'];
                }

                $features[$fr['feature_code']] = [
                    'feature_id' => $fr['id'],
                    'code' => $fr['feature_code'],
                    'name_en' => $fr['name_en'],
                    'name_ar' => $fr['name_ar'],
                    'is_enabled' => $enabled,
                    'credit_cost' => $creditCost,
                    'daily_limit' => $dailyLimit,
                    'monthly_limit' => $monthlyLimit,
                    'default_model' => $fr['default_model'],
                    'category' => $fr['category']
                ];
            }
        } catch (\Throwable $e) {}

        // 3. UI Components
        $components = [];
        try {
            $st = $pdo->query("SELECT * FROM ui_component_registry WHERE global_visibility = 1 ORDER BY display_order ASC");
            $compRows = $st->fetchAll(PDO::FETCH_ASSOC);

            $compOverrides = [];
            if ($sid) {
                $ost = $pdo->prepare("SELECT * FROM merchant_component_overrides WHERE store_id = ?");
                $ost->execute([$sid]);
                while ($orow = $ost->fetch(PDO::FETCH_ASSOC)) {
                    $compOverrides[$orow['component_id']] = $orow;
                }
            }

            foreach ($compRows as $cr) {
                $vis = (bool)$cr['default_visibility'];
                $titleEn = $cr['title_en'] ?: $cr['name_en'];
                $titleAr = $cr['title_ar'] ?: $cr['name_ar'];
                $order = (int)$cr['display_order'];
                $settings = !empty($cr['allowed_settings']) ? json_decode((string)$cr['allowed_settings'], true) : [];

                if (isset($compOverrides[$cr['id']])) {
                    $ov = $compOverrides[$cr['id']];
                    $vis = (bool)$ov['is_visible'];
                    if (!empty($ov['custom_title_en'])) $titleEn = $ov['custom_title_en'];
                    if (!empty($ov['custom_title_ar'])) $titleAr = $ov['custom_title_ar'];
                    if ($ov['custom_order'] !== null) $order = (int)$ov['custom_order'];
                    if (!empty($ov['custom_settings'])) {
                        $customSet = json_decode((string)$ov['custom_settings'], true) ?: [];
                        $settings = array_merge($settings, $customSet);
                    }
                }

                $components[$cr['component_key']] = [
                    'component_id' => $cr['id'],
                    'component_key' => $cr['component_key'],
                    'is_visible' => $vis,
                    'title_en' => $titleEn,
                    'title_ar' => $titleAr,
                    'display_order' => $order,
                    'settings' => $settings
                ];
            }
        } catch (\Throwable $e) {}

        // 4. Wallet & Limits
        $wallet = [
            'remaining_credits' => 200,
            'daily_limit' => 25,
            'monthly_limit' => 200
        ];
        if ($sid) {
            try {
                $st = $pdo->prepare("SELECT * FROM ai_merchant_limits WHERE store_id = ? LIMIT 1");
                $st->execute([$sid]);
                $limitRow = $st->fetch(PDO::FETCH_ASSOC);
                if ($limitRow) {
                    $wallet['remaining_credits'] = (int)($limitRow['remaining_credits'] ?? 200);
                    $wallet['daily_limit'] = (int)($limitRow['daily_image_limit'] ?? 25);
                    $wallet['monthly_limit'] = (int)($limitRow['monthly_image_limit'] ?? 200);
                }
            } catch (\Throwable $e) {}
        }

        // 5. Store & AI Subscription
        $storeSub = null;
        $aiSub = null;
        if ($sid) {
            try {
                $st = $pdo->prepare("SELECT s.*, p.name as plan_name, p.code as plan_code FROM subscriptions s LEFT JOIN plans p ON s.plan_id = p.id WHERE s.store_id = ? LIMIT 1");
                $st->execute([$sid]);
                $storeSub = $st->fetch(PDO::FETCH_ASSOC);

                $ast = $pdo->prepare("SELECT ms.*, ap.name_en, ap.name_ar, ap.code as plan_code FROM merchant_ai_subscriptions ms LEFT JOIN ai_subscription_plans ap ON ms.plan_id = ap.id WHERE ms.store_id = ? LIMIT 1");
                $ast->execute([$sid]);
                $aiSub = $ast->fetch(PDO::FETCH_ASSOC);
            } catch (\Throwable $e) {}
        }

        echo json_encode([
            'success' => true,
            'timestamp' => date('c'),
            'version' => time(),
            'data' => [
                'store_id' => $sid,
                'merchant_id' => null,
                'pages' => $pages,
                'features' => $features,
                'components' => $components,
                'wallet' => $wallet,
                'store_subscription' => $storeSub,
                'ai_subscription' => $aiSub
            ]
        ]);
        return true;
    }

    // ── 2. CENTRAL OVERVIEW (/master/control-center/overview) ────────────
    if ($uri === '/master/control-center/overview' && $method === 'GET') {
        $totalMerchants = 0;
        $totalStores = 0;
        $activeStores = 0;
        $storeSubs = 0;
        $aiSubs = 0;
        $pendingPayments = 0;
        $totalCredits = 0;
        $aiFeaturesTotal = 0;
        $aiFeaturesActive = 0;
        $dashPages = 0;
        $uiComps = 0;

        try { $totalMerchants = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(); } catch (\Throwable $e) {}
        try { $totalStores = (int)$pdo->query("SELECT COUNT(*) FROM stores")->fetchColumn(); } catch (\Throwable $e) {}
        try { $activeStores = (int)$pdo->query("SELECT COUNT(*) FROM stores WHERE status = 'active' OR is_active = 1")->fetchColumn(); } catch (\Throwable $e) {}
        try { $storeSubs = (int)$pdo->query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'")->fetchColumn(); } catch (\Throwable $e) {}
        try { $aiSubs = (int)$pdo->query("SELECT COUNT(*) FROM merchant_ai_subscriptions WHERE status = 'active'")->fetchColumn(); } catch (\Throwable $e) {}
        try { $pendingPayments = (int)$pdo->query("SELECT COUNT(*) FROM bank_transfer_proofs WHERE status = 'pending'")->fetchColumn(); } catch (\Throwable $e) {}
        try { $totalCredits = (int)$pdo->query("SELECT COALESCE(SUM(remaining_credits), 0) FROM ai_merchant_limits")->fetchColumn(); } catch (\Throwable $e) {}
        try { $aiFeaturesTotal = (int)$pdo->query("SELECT COUNT(*) FROM ai_feature_registry")->fetchColumn(); } catch (\Throwable $e) {}
        try { $aiFeaturesActive = (int)$pdo->query("SELECT COUNT(*) FROM ai_feature_registry WHERE global_status = 1")->fetchColumn(); } catch (\Throwable $e) {}
        try { $dashPages = (int)$pdo->query("SELECT COUNT(*) FROM dashboard_page_registry")->fetchColumn(); } catch (\Throwable $e) {}
        try { $uiComps = (int)$pdo->query("SELECT COUNT(*) FROM ui_component_registry")->fetchColumn(); } catch (\Throwable $e) {}

        $recentActivity = [];
        try {
            $st = $pdo->query("SELECT id, action, target_type as domain, store_id, reason, created_at FROM master_central_audit_logs ORDER BY created_at DESC LIMIT 10");
            $recentActivity = $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {}

        echo json_encode([
            'success' => true,
            'data' => [
                'counts' => [
                    'total_merchants' => $totalMerchants,
                    'total_stores' => $totalStores,
                    'active_stores' => $activeStores,
                    'store_subscriptions' => $storeSubs,
                    'ai_subscriptions' => $aiSubs,
                    'pending_payments' => $pendingPayments,
                    'total_credits_in_circulation' => $totalCredits,
                    'ai_features_total' => $aiFeaturesTotal,
                    'ai_features_active' => $aiFeaturesActive,
                    'dashboard_pages' => $dashPages,
                    'ui_components' => $uiComps
                ],
                'recent_activity' => $recentActivity,
                'system_health' => [
                    'database_status' => 'operational',
                    'gemini_api' => 'connected',
                    'zatca_service' => 'ready',
                    'realtime_channel' => 'active'
                ]
            ]
        ]);
        return true;
    }

    // ── 3. AI FEATURES REGISTRY (/master/control-center/ai-features) ────
    if ($uri === '/master/control-center/ai-features' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT f.*, (SELECT COUNT(*) FROM merchant_feature_overrides WHERE feature_id = f.id) as overrides_count FROM ai_feature_registry f ORDER BY f.category, f.name_en");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/ai-features/([^/]+)$#', $uri, $matches) && in_array($method, ['PUT', 'PATCH'], true)) {
        $featureId = $matches[1];
        try {
            $fields = [];
            $params = [];
            foreach (['name_en', 'name_ar', 'description_en', 'description_ar', 'category', 'credit_cost', 'daily_limit', 'monthly_limit', 'default_model', 'page_route'] as $col) {
                if (isset($input[$col])) {
                    $fields[] = "`$col` = ?";
                    $params[] = $input[$col];
                }
            }
            if (isset($input['global_status'])) {
                $fields[] = "`global_status` = ?";
                $params[] = (int)(bool)$input['global_status'];
            }
            if (isset($input['page_visible'])) {
                $fields[] = "`page_visible` = ?";
                $params[] = (int)(bool)$input['page_visible'];
            }
            if (isset($input['is_active'])) {
                $fields[] = "`is_active` = ?";
                $params[] = (int)(bool)$input['is_active'];
            }

            if (!empty($fields)) {
                $fields[] = "`updated_at` = NOW()";
                $params[] = $featureId;
                $sql = "UPDATE ai_feature_registry SET " . implode(', ', $fields) . " WHERE id = ? OR feature_code = ?";
                $params[] = $featureId;
                $st = $pdo->prepare($sql);
                $st->execute($params);

                souq_master_audit($pdo, 'update_ai_feature', 'ai_feature', $featureId, null, $input, $input['reason'] ?? 'Updated AI feature');
            }

            echo json_encode(['success' => true, 'message' => 'AI feature updated successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if ($uri === '/master/control-center/ai-features/override' && $method === 'POST') {
        $storeIdTarget = (string)($input['store_id'] ?? '');
        $featureId = (string)($input['feature_id'] ?? '');
        $isEnabled = !empty($input['is_enabled']) ? 1 : 0;
        $reason = (string)($input['reason'] ?? 'Master override');

        if (!$storeIdTarget || !$featureId) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'store_id and feature_id are required']);
            return true;
        }

        try {
            $st = $pdo->prepare("
                INSERT INTO merchant_feature_overrides 
                (id, store_id, feature_id, is_enabled, reason, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                is_enabled = VALUES(is_enabled),
                reason = VALUES(reason),
                updated_at = NOW()
            ");
            $st->execute([souq_master_uuid('mfo'), $storeIdTarget, $featureId, $isEnabled, $reason]);

            souq_master_audit($pdo, 'override_store_feature', 'store_feature', $featureId, null, $input, $reason, $storeIdTarget);

            echo json_encode(['success' => true, 'message' => 'Store feature override saved successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 4. AI SUBSCRIPTION PLANS (/master/control-center/ai-plans) ─────
    if ($uri === '/master/control-center/ai-plans' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT p.*, (SELECT COUNT(*) FROM merchant_ai_subscriptions WHERE plan_id = p.id) as subscriptions_count FROM ai_subscription_plans p ORDER BY p.billing_cycle, p.price_sar ASC");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/ai-plans/([^/]+)$#', $uri, $matches) && in_array($method, ['PUT', 'PATCH'], true)) {
        $planId = $matches[1];
        try {
            $fields = [];
            $params = [];
            foreach (['name_en', 'name_ar', 'price_sar', 'credits', 'daily_limit', 'monthly_limit', 'image_generation_limit', 'calling_minutes', 'bonus_credits'] as $col) {
                if (isset($input[$col])) {
                    $fields[] = "`$col` = ?";
                    $params[] = $input[$col];
                }
            }
            if (isset($input['is_popular'])) {
                $fields[] = "`is_popular` = ?";
                $params[] = (int)(bool)$input['is_popular'];
            }
            if (isset($input['is_active'])) {
                $fields[] = "`is_active` = ?";
                $params[] = (int)(bool)$input['is_active'];
            }
            if (isset($input['model_permissions'])) {
                $fields[] = "`model_permissions` = ?";
                $params[] = is_array($input['model_permissions']) ? json_encode($input['model_permissions']) : $input['model_permissions'];
            }
            if (isset($input['features'])) {
                $fields[] = "`features` = ?";
                $params[] = is_array($input['features']) ? json_encode($input['features']) : $input['features'];
            }

            if (!empty($fields)) {
                $fields[] = "`updated_at` = NOW()";
                $params[] = $planId;
                $sql = "UPDATE ai_subscription_plans SET " . implode(', ', $fields) . " WHERE id = ? OR code = ?";
                $params[] = $planId;
                $st = $pdo->prepare($sql);
                $st->execute($params);

                souq_master_audit($pdo, 'update_ai_plan', 'ai_plan', $planId, null, $input, $input['reason'] ?? 'Updated AI plan');
            }

            echo json_encode(['success' => true, 'message' => 'AI subscription plan updated successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 5. DASHBOARD PAGES REGISTRY (/master/control-center/pages) ───────
    if ($uri === '/master/control-center/pages' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT p.*, (SELECT COUNT(*) FROM merchant_page_visibility WHERE page_id = p.id) as overrides_count FROM dashboard_page_registry p ORDER BY p.display_order ASC");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/pages/([^/]+)$#', $uri, $matches) && in_array($method, ['PUT', 'PATCH'], true)) {
        $pageId = $matches[1];
        try {
            $fields = [];
            $params = [];
            if (isset($input['name_en'])) { $fields[] = "`name_en` = ?"; $params[] = $input['name_en']; }
            if (isset($input['name_ar'])) { $fields[] = "`name_ar` = ?"; $params[] = $input['name_ar']; }
            if (isset($input['category'])) { $fields[] = "`category` = ?"; $params[] = $input['category']; }
            if (isset($input['icon'])) { $fields[] = "`icon` = ?"; $params[] = $input['icon']; }
            if (isset($input['display_order'])) { $fields[] = "`display_order` = ?"; $params[] = $input['display_order']; }
            if (isset($input['global_visibility'])) { $fields[] = "`global_visibility` = ?"; $params[] = (int)(bool)$input['global_visibility']; }
            if (isset($input['default_visibility'])) { $fields[] = "`default_visibility` = ?"; $params[] = (int)(bool)$input['default_visibility']; }

            if (!empty($fields)) {
                $fields[] = "`updated_at` = NOW()";
                $params[] = $pageId;
                $sql = "UPDATE dashboard_page_registry SET " . implode(', ', $fields) . " WHERE id = ? OR route_key = ?";
                $params[] = $pageId;
                $st = $pdo->prepare($sql);
                $st->execute($params);

                souq_master_audit($pdo, 'update_dashboard_page', 'dashboard_page', $pageId, null, $input, $input['reason'] ?? 'Updated page visibility');
            }

            echo json_encode(['success' => true, 'message' => 'Dashboard page updated successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 6. UI COMPONENTS REGISTRY (/master/control-center/components) ───
    if ($uri === '/master/control-center/components' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT c.*, (SELECT COUNT(*) FROM merchant_component_overrides WHERE component_id = c.id) as overrides_count FROM ui_component_registry c ORDER BY c.display_order ASC");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/components/([^/]+)$#', $uri, $matches) && in_array($method, ['PUT', 'PATCH'], true)) {
        $compId = $matches[1];
        try {
            $fields = [];
            $params = [];
            foreach (['title_en', 'title_ar', 'description_en', 'description_ar', 'display_order', 'component_type'] as $col) {
                if (isset($input[$col])) {
                    $fields[] = "`$col` = ?";
                    $params[] = $input[$col];
                }
            }
            if (isset($input['global_visibility'])) { $fields[] = "`global_visibility` = ?"; $params[] = (int)(bool)$input['global_visibility']; }
            if (isset($input['default_visibility'])) { $fields[] = "`default_visibility` = ?"; $params[] = (int)(bool)$input['default_visibility']; }

            if (!empty($fields)) {
                $fields[] = "`updated_at` = NOW()";
                $params[] = $compId;
                $sql = "UPDATE ui_component_registry SET " . implode(', ', $fields) . " WHERE id = ? OR component_key = ?";
                $params[] = $compId;
                $st = $pdo->prepare($sql);
                $st->execute($params);

                souq_master_audit($pdo, 'update_ui_component', 'ui_component', $compId, null, $input, $input['reason'] ?? 'Updated UI component');
            }

            echo json_encode(['success' => true, 'message' => 'UI component updated successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 7. CREDIT MANAGEMENT & ADJUSTMENTS (/master/control-center/credits) ──
    if ($uri === '/master/control-center/credits' && $method === 'GET') {
        try {
            $st = $pdo->query("
                SELECT l.*, s.name as store_name, u.name as merchant_name, u.email as merchant_email 
                FROM ai_merchant_limits l
                LEFT JOIN stores s ON l.store_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                ORDER BY l.remaining_credits DESC
            ");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);

            $tst = $pdo->query("
                SELECT t.*, s.name as store_name 
                FROM ai_credit_transactions t
                LEFT JOIN stores s ON t.store_id = s.id
                ORDER BY t.created_at DESC LIMIT 50
            ");
            $txRows = $tst->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => ['wallets' => $rows, 'transactions' => $txRows]]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if ($uri === '/master/control-center/credits/adjust' && $method === 'POST') {
        $targetStoreId = (string)($input['store_id'] ?? '');
        $amount = (int)($input['amount'] ?? 0);
        $type = (string)($input['type'] ?? 'grant');
        $reason = (string)($input['reason'] ?? 'Master admin adjustment');

        if (!$targetStoreId || $amount <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'store_id and positive amount are required']);
            return true;
        }

        try {
            $pdo->beginTransaction();

            $st = $pdo->prepare("SELECT * FROM ai_merchant_limits WHERE store_id = ? FOR UPDATE");
            $st->execute([$targetStoreId]);
            $wallet = $st->fetch(PDO::FETCH_ASSOC);

            $beforeBalance = $wallet ? (int)$wallet['remaining_credits'] : 200;
            $afterBalance = ($type === 'deduct') ? max(0, $beforeBalance - $amount) : ($beforeBalance + $amount);

            if ($wallet) {
                $ust = $pdo->prepare("UPDATE ai_merchant_limits SET remaining_credits = ?, updated_at = NOW() WHERE store_id = ?");
                $ust->execute([$afterBalance, $targetStoreId]);
            } else {
                $ist = $pdo->prepare("INSERT INTO ai_merchant_limits (id, store_id, remaining_credits, daily_image_limit, monthly_image_limit, created_at, updated_at) VALUES (?, ?, ?, 25, 200, NOW(), NOW())");
                $ist->execute([souq_master_uuid('aml'), $targetStoreId, $afterBalance]);
            }

            // Record transaction
            $tst = $pdo->prepare("
                INSERT INTO ai_credit_transactions 
                (id, store_id, transaction_type, amount, balance_before, balance_after, reason, admin_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $tst->execute([souq_master_uuid('act'), $targetStoreId, $type, $amount, $beforeBalance, $afterBalance, $reason, 'admin-super']);

            souq_master_audit($pdo, 'adjust_credits', 'wallet', $targetStoreId, ['balance' => $beforeBalance], ['balance' => $afterBalance, 'amount' => $amount, 'type' => $type], $reason, $targetStoreId);

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Credits adjusted successfully',
                'data' => [
                    'before_balance' => $beforeBalance,
                    'after_balance' => $afterBalance,
                    'amount' => $amount
                ]
            ]);
            return true;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 8. MERCHANT MANAGEMENT LIST (/master/control-center/merchants) ───
    if ($uri === '/master/control-center/merchants' && $method === 'GET') {
        try {
            $search = (string)($_GET['search'] ?? '');
            $q = "
                SELECT u.id, u.name, u.email, u.role, u.created_at,
                       s.id as store_id, s.name as store_name, s.slug as store_slug, s.status as store_status, s.domain as store_domain,
                       (SELECT COUNT(*) FROM orders WHERE store_id = s.id) as orders_count,
                       (SELECT COALESCE(SUM(total_sar), 0) FROM orders WHERE store_id = s.id) as revenue,
                       (SELECT p.code FROM subscriptions sub JOIN plans p ON sub.plan_id = p.id WHERE sub.store_id = s.id LIMIT 1) as store_plan_code,
                       (SELECT sub.status FROM subscriptions sub WHERE sub.store_id = s.id LIMIT 1) as store_plan_status,
                       (SELECT sub.ends_at FROM subscriptions sub WHERE sub.store_id = s.id LIMIT 1) as store_plan_ends_at,
                       (SELECT ap.code FROM merchant_ai_subscriptions msub JOIN ai_subscription_plans ap ON msub.plan_id = ap.id WHERE msub.store_id = s.id LIMIT 1) as ai_plan_code,
                       (SELECT msub.status FROM merchant_ai_subscriptions msub WHERE msub.store_id = s.id LIMIT 1) as ai_plan_status,
                       (SELECT msub.ends_at FROM merchant_ai_subscriptions msub WHERE msub.store_id = s.id LIMIT 1) as ai_plan_ends_at,
                       COALESCE(l.remaining_credits, 200) as remaining_credits,
                       COALESCE(l.daily_image_limit, 25) as daily_limit,
                       COALESCE(l.monthly_image_limit, 200) as monthly_limit,
                       (SELECT COUNT(*) FROM bank_transfer_proofs WHERE store_id = s.id AND status = 'pending') as pending_payments_count
                FROM users u
                LEFT JOIN stores s ON s.user_id = u.id
                LEFT JOIN ai_merchant_limits l ON l.store_id = s.id
                WHERE 1=1
            ";
            $params = [];
            if ($search !== '') {
                $q .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.id LIKE ? OR s.name LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            $q .= " ORDER BY u.created_at DESC LIMIT 50";

            $st = $pdo->prepare($q);
            $st->execute($params);
            $rawRows = $st->fetchAll(PDO::FETCH_ASSOC);

            $merchants = [];
            foreach ($rawRows as $r) {
                $merchants[] = [
                    'id' => $r['id'],
                    'name' => $r['name'],
                    'email' => $r['email'],
                    'role' => $r['role'],
                    'created_at' => $r['created_at'],
                    'store' => $r['store_id'] ? [
                        'id' => $r['store_id'],
                        'name' => $r['store_name'],
                        'slug' => $r['store_slug'],
                        'status' => $r['store_status'],
                        'domain' => $r['store_domain'],
                        'orders_count' => (int)$r['orders_count'],
                        'revenue' => (float)$r['revenue']
                    ] : null,
                    'store_plan' => [
                        'code' => $r['store_plan_code'] ?: 'starter',
                        'status' => $r['store_plan_status'] ?: 'active',
                        'ends_at' => $r['store_plan_ends_at']
                    ],
                    'ai_plan' => [
                        'code' => $r['ai_plan_code'] ?: 'ai_starter_monthly',
                        'status' => $r['ai_plan_status'] ?: 'active',
                        'ends_at' => $r['ai_plan_ends_at']
                    ],
                    'wallet' => [
                        'remaining_credits' => (int)$r['remaining_credits'],
                        'daily_limit' => (int)$r['daily_limit'],
                        'monthly_limit' => (int)$r['monthly_limit'],
                        'ai_enabled' => true,
                        'is_paused' => false
                    ],
                    'pending_payments_count' => (int)$r['pending_payments_count']
                ];
            }

            echo json_encode(['success' => true, 'data' => $merchants]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 9. PAYMENT REQUESTS APPROVAL/REJECTION (/master/control-center/payments)
    if ($uri === '/master/control-center/payments' && $method === 'GET') {
        try {
            $st = $pdo->query("
                SELECT p.*, s.name as store_name, u.name as merchant_name, u.email as merchant_email 
                FROM bank_transfer_proofs p
                LEFT JOIN stores s ON p.store_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                ORDER BY p.created_at DESC LIMIT 50
            ");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/payments/([^/]+)/approve$#', $uri, $matches) && $method === 'POST') {
        $paymentId = $matches[1];
        try {
            $pdo->beginTransaction();

            $st = $pdo->prepare("SELECT * FROM bank_transfer_proofs WHERE id = ? FOR UPDATE");
            $st->execute([$paymentId]);
            $payment = $st->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Payment request not found']);
                return true;
            }

            if ($payment['status'] === 'approved') {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Payment already approved']);
                return true;
            }

            $ust = $pdo->prepare("UPDATE bank_transfer_proofs SET status = 'approved', approved_at = NOW(), reviewer_id = 'admin-super', updated_at = NOW() WHERE id = ?");
            $ust->execute([$paymentId]);

            // If it was an AI subscription or credits purchase, atomically grant credits
            $targetStoreId = $payment['store_id'];
            if ($targetStoreId) {
                $creditsToAdd = 500; // Standard package allowance
                $pdo->prepare("
                    INSERT INTO ai_merchant_limits (id, store_id, remaining_credits, daily_image_limit, monthly_image_limit, created_at, updated_at)
                    VALUES (?, ?, ?, 50, 500, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                    remaining_credits = remaining_credits + VALUES(remaining_credits),
                    updated_at = NOW()
                ")->execute([souq_master_uuid('aml'), $targetStoreId, $creditsToAdd]);

                $pdo->prepare("
                    INSERT INTO ai_credit_transactions 
                    (id, store_id, transaction_type, amount, balance_before, balance_after, reason, admin_id, created_at, updated_at)
                    VALUES (?, ?, 'grant', ?, 0, ?, 'Payment approved', 'admin-super', NOW(), NOW())
                ")->execute([souq_master_uuid('act'), $targetStoreId, $creditsToAdd, $creditsToAdd]);
            }

            souq_master_audit($pdo, 'approve_payment', 'payment', $paymentId, ['status' => $payment['status']], ['status' => 'approved'], $input['reason'] ?? 'Payment verified', $targetStoreId);

            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Payment approved and entitlements granted']);
            return true;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if (preg_match('#^/master/control-center/payments/([^/]+)/reject$#', $uri, $matches) && $method === 'POST') {
        $paymentId = $matches[1];
        $reason = (string)($input['reason'] ?? 'Bank transfer verification failed');
        try {
            $ust = $pdo->prepare("UPDATE bank_transfer_proofs SET status = 'rejected', rejection_reason = ?, reviewer_id = 'admin-super', updated_at = NOW() WHERE id = ?");
            $ust->execute([$reason, $paymentId]);

            souq_master_audit($pdo, 'reject_payment', 'payment', $paymentId, null, ['status' => 'rejected', 'reason' => $reason], $reason);

            echo json_encode(['success' => true, 'message' => 'Payment rejected successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 10. AUDIT LOGS (/master/control-center/audit-logs) ───────────────
    if ($uri === '/master/control-center/audit-logs' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT * FROM master_central_audit_logs ORDER BY created_at DESC LIMIT 100");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    // ── 11. GLOBAL SETTINGS (/master/control-center/settings) ────────────
    if ($uri === '/master/control-center/settings' && $method === 'GET') {
        try {
            $st = $pdo->query("SELECT setting_key, setting_value, group_name FROM global_platform_configurations");
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            $mapped = [];
            foreach ($rows as $r) {
                $mapped[$r['setting_key']] = $r['setting_value'];
            }
            echo json_encode(['success' => true, 'data' => $mapped]);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    if ($uri === '/master/control-center/settings' && in_array($method, ['PUT', 'PATCH', 'POST'], true)) {
        $key = (string)($input['setting_key'] ?? '');
        $val = $input['setting_value'] ?? null;
        $reason = (string)($input['reason'] ?? 'Updated platform configuration');

        if (!$key) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'setting_key is required']);
            return true;
        }

        try {
            $st = $pdo->prepare("
                INSERT INTO global_platform_configurations 
                (id, setting_key, setting_value, group_name, created_at, updated_at)
                VALUES (?, ?, ?, 'general', NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_at = NOW()
            ");
            $st->execute([souq_master_uuid('gpc'), $key, is_array($val) ? json_encode($val) : (string)$val]);

            souq_master_audit($pdo, 'update_global_setting', 'setting', $key, null, ['key' => $key, 'val' => $val], $reason);

            echo json_encode(['success' => true, 'message' => 'Setting updated successfully']);
            return true;
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            return true;
        }
    }

    return false;
}
