<?php

/**
 * OpenAI AI Management — Hostinger PHP twin (isolated from Gemini).
 * Master portal only. Real MySQL + real OpenAI API (no mock).
 */

function souq_openai_env(string $key, string $default = ''): string
{
    $env = function_exists('souq_load_root_env') ? souq_load_root_env() : [];
    $v = trim((string) ($env[$key] ?? getenv($key) ?: ''));

    return $v !== '' ? $v : $default;
}

function souq_openai_rid(string $prefix): string
{
    return $prefix.'-'.strtolower(bin2hex(random_bytes(6)));
}

function souq_openai_period(string $type): string
{
    $tz = new DateTimeZone('Asia/Riyadh');
    $dt = new DateTimeImmutable('now', $tz);

    return $type === 'day' ? $dt->format('Y-m-d') : $dt->format('Y-m');
}

function souq_openai_ensure_tables(PDO $pdo): void
{
    if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
        return;
    }
    $stmts = [
        "CREATE TABLE IF NOT EXISTS `openai_global_configs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `emergency_disabled` TINYINT(1) NOT NULL DEFAULT 0,
          `default_text_model` VARCHAR(80) NOT NULL DEFAULT 'gpt-5.4-mini',
          `prompt_caching_enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `platform_daily_request_cap` INT UNSIGNED NULL,
          `notes` TEXT NULL,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `openai_model_pricings` (
          `id` VARCHAR(64) PRIMARY KEY,
          `model` VARCHAR(80) NOT NULL,
          `modality` VARCHAR(20) NOT NULL DEFAULT 'text',
          `input_per_1m_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `output_per_1m_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `cached_input_per_1m_usd` DECIMAL(12,6) NULL,
          `image_per_unit_usd` DECIMAL(12,6) NULL,
          `active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `openai_model_modality_unique` (`model`,`modality`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_configs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `intelligence_level` VARCHAR(16) NOT NULL DEFAULT 'medium',
          `text_model` VARCHAR(80) NULL,
          `reasoning_effort` VARCHAR(16) NULL,
          `prompt_caching_enabled` TINYINT(1) NULL,
          `daily_token_limit` INT UNSIGNED NOT NULL DEFAULT 50000,
          `monthly_token_limit` INT UNSIGNED NOT NULL DEFAULT 500000,
          `max_input_tokens` INT UNSIGNED NOT NULL DEFAULT 4000,
          `max_output_tokens` INT UNSIGNED NOT NULL DEFAULT 2048,
          `daily_request_limit` INT UNSIGNED NOT NULL DEFAULT 100,
          `monthly_request_limit` INT UNSIGNED NOT NULL DEFAULT 2000,
          `daily_budget_usd` DECIMAL(12,4) NOT NULL DEFAULT 5,
          `monthly_budget_usd` DECIMAL(12,4) NOT NULL DEFAULT 50,
          `max_cost_per_request_usd` DECIMAL(12,4) NOT NULL DEFAULT 1,
          `warning_threshold_pct` TINYINT UNSIGNED NOT NULL DEFAULT 80,
          `auto_stop_at_budget` TINYINT(1) NOT NULL DEFAULT 1,
          `allow_admin_override` TINYINT(1) NOT NULL DEFAULT 1,
          `payment_required_for_usage` TINYINT(1) NOT NULL DEFAULT 1,
          `usage_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
          `payment_status` VARCHAR(32) NOT NULL DEFAULT 'unpaid',
          `usage_unlocked_until` TIMESTAMP NULL,
          `store_isolation_enforced` TINYINT(1) NOT NULL DEFAULT 1,
          `audit_logging_enabled` TINYINT(1) NOT NULL DEFAULT 1,
          `rate_limit_per_minute` INT UNSIGNED NOT NULL DEFAULT 20,
          `config_status` VARCHAR(32) NOT NULL DEFAULT 'draft',
          `level_overrides` JSON NULL,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `store_openai_configs_store_id_unique` (`store_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_usage_logs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `user_id` VARCHAR(64) NULL,
          `request_id` VARCHAR(64) NULL,
          `model` VARCHAR(80) NULL,
          `intelligence_level` VARCHAR(16) NULL,
          `input_tokens` INT UNSIGNED NOT NULL DEFAULT 0,
          `output_tokens` INT UNSIGNED NOT NULL DEFAULT 0,
          `cached_tokens` INT UNSIGNED NOT NULL DEFAULT 0,
          `total_tokens` INT UNSIGNED NOT NULL DEFAULT 0,
          `estimated_cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `actual_cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `status` VARCHAR(24) NOT NULL DEFAULT 'pending',
          `error_code` VARCHAR(64) NULL,
          `error_message` TEXT NULL,
          `meta` JSON NULL,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY `store_openai_usage_store_created` (`store_id`,`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_budget_periods` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `period_type` VARCHAR(8) NOT NULL,
          `period_key` VARCHAR(16) NOT NULL,
          `tokens_used` INT UNSIGNED NOT NULL DEFAULT 0,
          `requests_used` INT UNSIGNED NOT NULL DEFAULT 0,
          `cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `warning_sent` TINYINT(1) NOT NULL DEFAULT 0,
          `hard_stopped` TINYINT(1) NOT NULL DEFAULT 0,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `openai_budget_period_unique` (`store_id`,`period_type`,`period_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_config_histories` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `actor_user_id` VARCHAR(64) NULL,
          `before_json` JSON NULL,
          `after_json` JSON NULL,
          `action` VARCHAR(40) NOT NULL DEFAULT 'update',
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_audit_logs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NULL,
          `actor_user_id` VARCHAR(64) NULL,
          `action` VARCHAR(64) NOT NULL,
          `severity` VARCHAR(24) NOT NULL DEFAULT 'info',
          `message` TEXT NULL,
          `meta` JSON NULL,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_image_configs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `default_model` VARCHAR(80) NOT NULL DEFAULT 'gpt-image-2.6-flare',
          `default_quality` VARCHAR(16) NOT NULL DEFAULT 'medium',
          `monthly_image_quota` INT UNSIGNED NOT NULL DEFAULT 50,
          `monthly_budget_usd` DECIMAL(12,4) NOT NULL DEFAULT 25,
          `max_cost_per_image_usd` DECIMAL(12,4) NOT NULL DEFAULT 1,
          `warning_threshold_pct` TINYINT UNSIGNED NOT NULL DEFAULT 80,
          `auto_stop_at_quota` TINYINT(1) NOT NULL DEFAULT 1,
          `payment_required_for_usage` TINYINT(1) NOT NULL DEFAULT 1,
          `usage_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
          `payment_status` VARCHAR(32) NOT NULL DEFAULT 'unpaid',
          `usage_unlocked_until` TIMESTAMP NULL,
          `config_status` VARCHAR(32) NOT NULL DEFAULT 'draft',
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `store_openai_image_configs_store_unique` (`store_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_image_usage` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `period_key` VARCHAR(16) NOT NULL,
          `images_success` INT UNSIGNED NOT NULL DEFAULT 0,
          `images_failed` INT UNSIGNED NOT NULL DEFAULT 0,
          `cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `warning_sent` TINYINT(1) NOT NULL DEFAULT 0,
          `hard_stopped` TINYINT(1) NOT NULL DEFAULT 0,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `store_openai_image_usage_unique` (`store_id`,`period_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_image_events` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `user_id` VARCHAR(64) NULL,
          `request_id` VARCHAR(64) NULL,
          `model` VARCHAR(80) NULL,
          `quality` VARCHAR(16) NULL,
          `status` VARCHAR(24) NOT NULL DEFAULT 'pending',
          `actual_cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `media_id` VARCHAR(64) NULL,
          `error_code` VARCHAR(64) NULL,
          `error_message` TEXT NULL,
          `meta` JSON NULL,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_automation_configs` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `enabled` TINYINT(1) NOT NULL DEFAULT 0,
          `intelligence_level` VARCHAR(16) NOT NULL DEFAULT 'medium',
          `text_model` VARCHAR(80) NULL,
          `monthly_question_quota` INT UNSIGNED NOT NULL DEFAULT 100,
          `daily_question_quota` INT UNSIGNED NOT NULL DEFAULT 20,
          `max_output_tokens` INT UNSIGNED NOT NULL DEFAULT 1024,
          `own_store_data_only` TINYINT(1) NOT NULL DEFAULT 1,
          `block_cross_store` TINYINT(1) NOT NULL DEFAULT 1,
          `block_sql_and_secrets` TINYINT(1) NOT NULL DEFAULT 1,
          `payment_required_for_usage` TINYINT(1) NOT NULL DEFAULT 1,
          `usage_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
          `payment_status` VARCHAR(32) NOT NULL DEFAULT 'unpaid',
          `usage_unlocked_until` TIMESTAMP NULL,
          `config_status` VARCHAR(32) NOT NULL DEFAULT 'draft',
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `store_openai_auto_configs_store_unique` (`store_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `store_openai_automation_usage` (
          `id` VARCHAR(64) PRIMARY KEY,
          `store_id` VARCHAR(64) NOT NULL,
          `period_type` VARCHAR(8) NOT NULL,
          `period_key` VARCHAR(16) NOT NULL,
          `questions_used` INT UNSIGNED NOT NULL DEFAULT 0,
          `tokens_used` INT UNSIGNED NOT NULL DEFAULT 0,
          `cost_usd` DECIMAL(12,6) NOT NULL DEFAULT 0,
          `hard_stopped` TINYINT(1) NOT NULL DEFAULT 0,
          `created_at` TIMESTAMP NULL, `updated_at` TIMESTAMP NULL,
          UNIQUE KEY `openai_auto_usage_unique` (`store_id`,`period_type`,`period_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];
    foreach ($stmts as $sql) {
        try {
            $pdo->exec($sql);
        } catch (Throwable $e) {
            // keep going — partial schemas still usable
        }
    }
    // Master Gemini daily override (additive — safe if already present)
    try {
        $pdo->exec('ALTER TABLE `store_openai_image_configs` ADD COLUMN `daily_image_quota` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `monthly_image_quota`');
    } catch (Throwable $e) {
        /* column exists */
    }
}

function souq_openai_key_status(): array
{
    $key = souq_openai_env('OPENAI_API_KEY');
    if ($key === '' || $key === 'sk-your-key') {
        return ['configured' => false, 'masked' => null];
    }
    $len = strlen($key);
    $masked = $len <= 8 ? str_repeat('*', $len) : substr($key, 0, 3).str_repeat('*', max(4, $len - 7)).substr($key, -4);

    return ['configured' => true, 'masked' => $masked];
}

function souq_openai_global(PDO $pdo): array
{
    $st = $pdo->query('SELECT * FROM openai_global_configs ORDER BY created_at ASC LIMIT 1');
    $row = $st ? $st->fetch(PDO::FETCH_ASSOC) : false;
    if (!$row) {
        $id = souq_openai_rid('oagc');
        $pdo->prepare('INSERT INTO openai_global_configs (id, enabled, emergency_disabled, default_text_model, created_at, updated_at) VALUES (?,?,?,?,NOW(),NOW())')
            ->execute([$id, 0, 0, souq_openai_env('OPENAI_TEXT_MODEL', 'gpt-5.4-mini')]);
        $st = $pdo->query('SELECT * FROM openai_global_configs ORDER BY created_at ASC LIMIT 1');
        $row = $st ? $st->fetch(PDO::FETCH_ASSOC) : [];
    }

    return is_array($row) ? $row : [];
}

function souq_openai_store_plan(PDO $pdo, string $storeId): array
{
    $plan = function_exists('souq_store_plan_code') ? souq_store_plan_code($pdo, $storeId) : 'free';
    $row = function_exists('souq_store_row') ? souq_store_row($pdo, $storeId) : null;
    $data = $row ? (json_decode((string) ($row['data'] ?? '{}'), true) ?: []) : [];
    $granted = !empty($data['masterGrantedPro']) || !empty($data['master_granted_pro']);
    $effective = $granted && in_array($plan, ['free', 'paid'], true) ? 'pro' : $plan;
    $pro = in_array($effective, ['pro', 'premium', 'custom'], true);

    return ['plan' => $effective, 'pro_eligible' => $pro, 'name' => (string) ($row['name'] ?? $storeId)];
}

function souq_openai_text_cfg(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM store_openai_configs WHERE store_id = ? LIMIT 1');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return $row;
    }
    $id = souq_openai_rid('oasc');
    $pdo->prepare('INSERT INTO store_openai_configs (id, store_id, enabled, intelligence_level, payment_required_for_usage, usage_unlocked, payment_status, config_status, created_at, updated_at) VALUES (?,?,0,?,?,0,?,?,NOW(),NOW())')
        ->execute([$id, $storeId, 'medium', 1, 'unpaid', 'draft']);
    $st->execute([$storeId]);

    return $st->fetch(PDO::FETCH_ASSOC) ?: [];
}

function souq_openai_image_cfg(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM store_openai_image_configs WHERE store_id = ? LIMIT 1');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return $row;
    }
    $id = souq_openai_rid('oaic');
    $pdo->prepare('INSERT INTO store_openai_image_configs (id, store_id, enabled, default_model, default_quality, monthly_image_quota, payment_required_for_usage, usage_unlocked, payment_status, config_status, created_at, updated_at) VALUES (?,?,0,?,?,50,1,0,?,?,NOW(),NOW())')
        ->execute([$id, $storeId, souq_openai_env('OPENAI_IMAGE_MODEL', 'gpt-image-2.6-flare'), 'medium', 'unpaid', 'draft']);
    $st->execute([$storeId]);

    return $st->fetch(PDO::FETCH_ASSOC) ?: [];
}

function souq_openai_auto_cfg(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM store_openai_automation_configs WHERE store_id = ? LIMIT 1');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        return $row;
    }
    $id = souq_openai_rid('oaac');
    $pdo->prepare('INSERT INTO store_openai_automation_configs (id, store_id, enabled, intelligence_level, monthly_question_quota, daily_question_quota, payment_required_for_usage, usage_unlocked, payment_status, config_status, created_at, updated_at) VALUES (?,?,0,?,100,20,1,0,?,?,NOW(),NOW())')
        ->execute([$id, $storeId, 'medium', 'unpaid', 'draft']);
    $st->execute([$storeId]);

    return $st->fetch(PDO::FETCH_ASSOC) ?: [];
}

function souq_openai_usage_unlocked(array $cfg): bool
{
    if (empty($cfg['payment_required_for_usage'])) {
        return true;
    }
    if (!empty($cfg['usage_unlocked']) && in_array((string) ($cfg['payment_status'] ?? ''), ['paid', 'comped'], true)) {
        $until = $cfg['usage_unlocked_until'] ?? null;
        if ($until && strtotime((string) $until) < time()) {
            return false;
        }

        return true;
    }

    return false;
}

function souq_openai_curl(string $url, string $apiKey, array $body, int $timeout = 90): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer '.$apiKey, 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
    ]);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($errno) {
        return ['ok' => false, 'code' => 'timeout_or_network', 'message' => 'Network/timeout', 'http' => $http];
    }
    $json = is_string($raw) ? json_decode($raw, true) : null;
    if ($http >= 400 || !is_array($json)) {
        $msg = is_array($json) ? (string) ($json['error']['message'] ?? 'Provider error') : 'Invalid response';

        return ['ok' => false, 'code' => 'provider_error', 'message' => $msg, 'http' => $http];
    }

    return ['ok' => true, 'json' => $json, 'http' => $http];
}

/**
 * @return bool true if handled
 */
function souq_openai_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!str_starts_with($uri, '/master/openai')) {
        return false;
    }

    souq_openai_ensure_tables($pdo);

    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));
    if ($portal !== 'master') {
        http_response_code(403);
        echo json_encode(['message' => 'Master portal required.']);

        return true;
    }
    if (!function_exists('souq_require_master_bearer_ops')) {
        require_once __DIR__.'/master_phase1_ops.php';
    }
    if (!souq_require_master_bearer_ops($pdo)) {
        return true;
    }

    // GET overview
    if ($uri === '/master/openai/overview' && $method === 'GET') {
        $g = souq_openai_global($pdo);
        $req = 0;
        $tok = 0;
        $cost = 0.0;
        try {
            $req = (int) $pdo->query('SELECT COUNT(*) FROM store_openai_usage_logs')->fetchColumn();
            $tok = (int) $pdo->query('SELECT COALESCE(SUM(total_tokens),0) FROM store_openai_usage_logs')->fetchColumn();
            $cost = (float) $pdo->query('SELECT COALESCE(SUM(actual_cost_usd),0) FROM store_openai_usage_logs')->fetchColumn();
        } catch (Throwable $e) {
        }
        $active = 0;
        $disabled = 0;
        try {
            $active = (int) $pdo->query('SELECT COUNT(*) FROM store_openai_configs WHERE enabled=1')->fetchColumn();
            $disabled = (int) $pdo->query('SELECT COUNT(*) FROM store_openai_configs WHERE enabled=0')->fetchColumn();
        } catch (Throwable $e) {
        }
        echo json_encode([
            'global' => [
                'enabled' => !empty($g['enabled']),
                'emergency_disabled' => !empty($g['emergency_disabled']),
                'default_text_model' => (string) ($g['default_text_model'] ?? 'gpt-5.4-mini'),
                'prompt_caching_enabled' => !empty($g['prompt_caching_enabled']),
            ],
            'api_key' => souq_openai_key_status(),
            'overview' => [
                'total_requests' => $req,
                'total_tokens' => $tok,
                'total_cost_usd' => round($cost, 4),
                'active_stores' => $active,
                'stores_near_limit' => 0,
                'stores_disabled' => $disabled,
            ],
            'levels' => [
                'low' => ['reasoning_effort' => 'low', 'default_max_output_tokens' => 512],
                'medium' => ['reasoning_effort' => 'medium', 'default_max_output_tokens' => 2048],
                'high' => ['reasoning_effort' => 'high', 'default_max_output_tokens' => 8192],
            ],
            'pricing' => [],
        ]);

        return true;
    }

    if ($uri === '/master/openai/global' && $method === 'PUT') {
        $g = souq_openai_global($pdo);
        $enabled = array_key_exists('enabled', $input) ? (int) !empty($input['enabled']) : (int) !empty($g['enabled']);
        $emerg = array_key_exists('emergency_disabled', $input) ? (int) !empty($input['emergency_disabled']) : (int) !empty($g['emergency_disabled']);
        $model = (string) ($input['default_text_model'] ?? $g['default_text_model'] ?? 'gpt-5.4-mini');
        $pdo->prepare('UPDATE openai_global_configs SET enabled=?, emergency_disabled=?, default_text_model=?, updated_at=NOW() WHERE id=?')
            ->execute([$enabled, $emerg, $model, $g['id']]);
        echo json_encode(['ok' => true, 'global' => [
            'enabled' => (bool) $enabled,
            'emergency_disabled' => (bool) $emerg,
            'default_text_model' => $model,
            'prompt_caching_enabled' => !empty($g['prompt_caching_enabled']),
        ]]);

        return true;
    }

    if ($uri === '/master/openai/stores' && $method === 'GET') {
        $stores = $pdo->query('SELECT id, name FROM stores ORDER BY name ASC')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $rows = [];
        foreach ($stores as $s) {
            $sid = (string) $s['id'];
            $meta = souq_openai_store_plan($pdo, $sid);
            $cfg = souq_openai_text_cfg($pdo, $sid);
            $monthKey = souq_openai_period('month');
            $ust = $pdo->prepare('SELECT tokens_used, cost_usd FROM store_openai_budget_periods WHERE store_id=? AND period_type=? AND period_key=? LIMIT 1');
            $ust->execute([$sid, 'month', $monthKey]);
            $u = $ust->fetch(PDO::FETCH_ASSOC) ?: ['tokens_used' => 0, 'cost_usd' => 0];
            $rows[] = [
                'store_id' => $sid,
                'store_name' => $meta['name'] ?: (string) $s['name'],
                'plan' => $meta['plan'],
                'pro_eligible' => $meta['pro_eligible'],
                'enabled' => !empty($cfg['enabled']),
                'intelligence_level' => (string) ($cfg['intelligence_level'] ?? 'medium'),
                'model' => (string) ($cfg['text_model'] ?: souq_openai_global($pdo)['default_text_model'] ?? 'gpt-5.4-mini'),
                'daily_usage' => [],
                'monthly_usage' => [
                    'tokens_used' => (int) ($u['tokens_used'] ?? 0),
                    'tokens_limit' => (int) ($cfg['monthly_token_limit'] ?? 500000),
                    'cost_usd' => (float) ($u['cost_usd'] ?? 0),
                ],
                'monthly_budget_usd' => (float) ($cfg['monthly_budget_usd'] ?? 50),
                'actual_cost_usd' => (float) ($u['cost_usd'] ?? 0),
                'payment_status' => (string) ($cfg['payment_status'] ?? 'unpaid'),
                'usage_unlocked' => !empty($cfg['usage_unlocked']),
                'config_status' => (string) ($cfg['config_status'] ?? 'draft'),
            ];
        }
        echo json_encode(['data' => $rows, 'count' => count($rows)]);

        return true;
    }

    if (preg_match('#^/master/openai/stores/([^/]+)$#', $uri, $m)) {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        if ($method === 'GET') {
            $cfg = souq_openai_text_cfg($pdo, $sid);
            echo json_encode([
                'config' => array_merge($cfg, [
                    'store_id' => $sid,
                    'store_name' => $meta['name'],
                    'store_plan' => $meta['plan'],
                    'pro_eligible' => $meta['pro_eligible'],
                    'enabled' => !empty($cfg['enabled']),
                    'daily_token_limit' => (int) ($cfg['daily_token_limit'] ?? 50000),
                    'monthly_token_limit' => (int) ($cfg['monthly_token_limit'] ?? 500000),
                    'max_input_tokens' => (int) ($cfg['max_input_tokens'] ?? 4000),
                    'max_output_tokens' => (int) ($cfg['max_output_tokens'] ?? 2048),
                    'daily_request_limit' => (int) ($cfg['daily_request_limit'] ?? 100),
                    'monthly_request_limit' => (int) ($cfg['monthly_request_limit'] ?? 2000),
                    'daily_budget_usd' => (float) ($cfg['daily_budget_usd'] ?? 5),
                    'monthly_budget_usd' => (float) ($cfg['monthly_budget_usd'] ?? 50),
                    'max_cost_per_request_usd' => (float) ($cfg['max_cost_per_request_usd'] ?? 1),
                    'warning_threshold_pct' => (int) ($cfg['warning_threshold_pct'] ?? 80),
                    'auto_stop_at_budget' => !empty($cfg['auto_stop_at_budget']),
                    'allow_admin_override' => !empty($cfg['allow_admin_override']),
                    'payment_required_for_usage' => !empty($cfg['payment_required_for_usage']),
                    'usage_unlocked' => !empty($cfg['usage_unlocked']),
                    'store_isolation_enforced' => true,
                    'audit_logging_enabled' => !empty($cfg['audit_logging_enabled'] ?? 1),
                    'rate_limit_per_minute' => (int) ($cfg['rate_limit_per_minute'] ?? 20),
                    'level_catalog' => [],
                ]),
                'usage' => ['day' => [], 'month' => []],
                'config_history' => [],
                'usage_logs' => [],
                'security_events' => [],
                'api_key' => souq_openai_key_status(),
            ]);

            return true;
        }
        if ($method === 'PUT') {
            if (!empty($input['enabled']) && !$meta['pro_eligible']) {
                http_response_code(422);
                echo json_encode(['message' => 'Only Pro stores can enable OpenAI.', 'code' => 'pro_required', 'payment_required' => true]);

                return true;
            }
            $cfg = souq_openai_text_cfg($pdo, $sid);
            $fields = [
                'enabled' => array_key_exists('enabled', $input) ? (int) !empty($input['enabled']) : (int) !empty($cfg['enabled']),
                'intelligence_level' => (string) ($input['intelligence_level'] ?? $cfg['intelligence_level'] ?? 'medium'),
                'text_model' => $input['text_model'] ?? $cfg['text_model'],
                'reasoning_effort' => $input['reasoning_effort'] ?? $cfg['reasoning_effort'],
                'daily_token_limit' => (int) ($input['daily_token_limit'] ?? $cfg['daily_token_limit'] ?? 50000),
                'monthly_token_limit' => (int) ($input['monthly_token_limit'] ?? $cfg['monthly_token_limit'] ?? 500000),
                'max_input_tokens' => (int) ($input['max_input_tokens'] ?? $cfg['max_input_tokens'] ?? 4000),
                'max_output_tokens' => (int) ($input['max_output_tokens'] ?? $cfg['max_output_tokens'] ?? 2048),
                'daily_request_limit' => (int) ($input['daily_request_limit'] ?? $cfg['daily_request_limit'] ?? 100),
                'monthly_request_limit' => (int) ($input['monthly_request_limit'] ?? $cfg['monthly_request_limit'] ?? 2000),
                'daily_budget_usd' => (float) ($input['daily_budget_usd'] ?? $cfg['daily_budget_usd'] ?? 5),
                'monthly_budget_usd' => (float) ($input['monthly_budget_usd'] ?? $cfg['monthly_budget_usd'] ?? 50),
                'max_cost_per_request_usd' => (float) ($input['max_cost_per_request_usd'] ?? $cfg['max_cost_per_request_usd'] ?? 1),
                'warning_threshold_pct' => (int) ($input['warning_threshold_pct'] ?? $cfg['warning_threshold_pct'] ?? 80),
                'auto_stop_at_budget' => array_key_exists('auto_stop_at_budget', $input) ? (int) !empty($input['auto_stop_at_budget']) : (int) !empty($cfg['auto_stop_at_budget']),
                'allow_admin_override' => array_key_exists('allow_admin_override', $input) ? (int) !empty($input['allow_admin_override']) : (int) !empty($cfg['allow_admin_override']),
                'payment_required_for_usage' => array_key_exists('payment_required_for_usage', $input) ? (int) !empty($input['payment_required_for_usage']) : (int) !empty($cfg['payment_required_for_usage']),
                'rate_limit_per_minute' => (int) ($input['rate_limit_per_minute'] ?? $cfg['rate_limit_per_minute'] ?? 20),
                'config_status' => (string) ($input['config_status'] ?? $cfg['config_status'] ?? 'draft'),
            ];
            $pdo->prepare('UPDATE store_openai_configs SET enabled=?, intelligence_level=?, text_model=?, reasoning_effort=?, daily_token_limit=?, monthly_token_limit=?, max_input_tokens=?, max_output_tokens=?, daily_request_limit=?, monthly_request_limit=?, daily_budget_usd=?, monthly_budget_usd=?, max_cost_per_request_usd=?, warning_threshold_pct=?, auto_stop_at_budget=?, allow_admin_override=?, payment_required_for_usage=?, rate_limit_per_minute=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([
                    $fields['enabled'], $fields['intelligence_level'], $fields['text_model'], $fields['reasoning_effort'],
                    $fields['daily_token_limit'], $fields['monthly_token_limit'], $fields['max_input_tokens'], $fields['max_output_tokens'],
                    $fields['daily_request_limit'], $fields['monthly_request_limit'], $fields['daily_budget_usd'], $fields['monthly_budget_usd'],
                    $fields['max_cost_per_request_usd'], $fields['warning_threshold_pct'], $fields['auto_stop_at_budget'], $fields['allow_admin_override'],
                    $fields['payment_required_for_usage'], $fields['rate_limit_per_minute'], $fields['config_status'], $sid,
                ]);
            $cfg = souq_openai_text_cfg($pdo, $sid);
            echo json_encode(['ok' => true, 'config' => array_merge($cfg, [
                'store_id' => $sid,
                'store_name' => $meta['name'],
                'store_plan' => $meta['plan'],
                'pro_eligible' => $meta['pro_eligible'],
                'enabled' => !empty($cfg['enabled']),
                'level_catalog' => [],
            ])]);

            return true;
        }
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/unlock-payment$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        if (!$meta['pro_eligible']) {
            http_response_code(422);
            echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true]);

            return true;
        }
        $status = (($input['method'] ?? '') === 'comp') ? 'comped' : 'paid';
        $days = max(1, min(366, (int) ($input['days'] ?? 30)));
        $until = (new DateTimeImmutable('now'))->modify('+'.$days.' days')->format('Y-m-d H:i:s');
        souq_openai_text_cfg($pdo, $sid);
        $pdo->prepare('UPDATE store_openai_configs SET usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute([$status, $until, 'active', $sid]);
        $cfg = souq_openai_text_cfg($pdo, $sid);
        echo json_encode(['ok' => true, 'config' => array_merge($cfg, [
            'store_id' => $sid, 'store_name' => $meta['name'], 'store_plan' => $meta['plan'], 'pro_eligible' => true,
            'enabled' => !empty($cfg['enabled']), 'level_catalog' => [],
        ])]);

        return true;
    }

    // Master increments AI limits (Gemini images daily/monthly + text + automation) and re-unlocks.
    if (preg_match('#^/master/openai/stores/([^/]+)/increment-limits$#', $uri, $mInc) && $method === 'POST') {
        $sid = rawurldecode($mInc[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        if (!$meta['pro_eligible']) {
            http_response_code(422);
            echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required']);

            return true;
        }
        $imgDeltaMonth = max(0, min(5000, (int) ($input['images_monthly_delta'] ?? 0)));
        $imgDeltaDay = max(0, min(500, (int) ($input['images_daily_delta'] ?? 0)));
        $textDailyDelta = max(0, min(500000, (int) ($input['text_daily_delta'] ?? 0)));
        $textMonthlyDelta = max(0, min(5000000, (int) ($input['text_monthly_delta'] ?? 0)));
        $autoDailyDelta = max(0, min(5000, (int) ($input['auto_daily_delta'] ?? 0)));
        $autoMonthlyDelta = max(0, min(50000, (int) ($input['auto_monthly_delta'] ?? 0)));
        $days = max(1, min(366, (int) ($input['days'] ?? 30)));
        $methodPay = (string) ($input['method'] ?? 'comp');
        if (!in_array($methodPay, ['comp', 'mark_paid', 'services_points'], true)) {
            $methodPay = 'comp';
        }
        $status = $methodPay === 'comp' ? 'comped' : 'paid';
        $until = (new DateTimeImmutable('now'))->modify('+'.$days.' days')->format('Y-m-d H:i:s');

        souq_openai_ensure_tables($pdo);
        $txt = souq_openai_text_cfg($pdo, $sid);
        $img = souq_openai_image_cfg($pdo, $sid);
        $auto = souq_openai_auto_cfg($pdo, $sid);

        $newMonth = max(1, (int) ($img['monthly_image_quota'] ?? 50) + $imgDeltaMonth);
        $newDay = max(0, (int) ($img['daily_image_quota'] ?? 0) + $imgDeltaDay);
        if ($newDay <= 0 && $imgDeltaDay > 0) {
            $newDay = $imgDeltaDay;
        }
        if ($newDay <= 0) {
            $newDay = max(1, (int) ceil($newMonth / 12));
        }
        $newTextDaily = max(1000, (int) ($txt['daily_token_limit'] ?? 50000) + $textDailyDelta);
        $newTextMonthly = max(10000, (int) ($txt['monthly_token_limit'] ?? 500000) + $textMonthlyDelta);
        $newAutoDaily = max(1, (int) ($auto['daily_question_quota'] ?? 20) + $autoDailyDelta);
        $newAutoMonthly = max(1, (int) ($auto['monthly_question_quota'] ?? 100) + $autoMonthlyDelta);

        // Direct SQL — avoid update helpers that re-lock on limit raise.
        try {
            $pdo->prepare('UPDATE store_openai_image_configs SET monthly_image_quota=?, daily_image_quota=?, enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([$newMonth, $newDay, $status, $until, 'active', $sid]);
        } catch (Throwable $e) {
            $pdo->prepare('UPDATE store_openai_image_configs SET monthly_image_quota=?, enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([$newMonth, $status, $until, 'active', $sid]);
            $newDay = max(1, (int) ceil($newMonth / 12));
        }
        $pdo->prepare('UPDATE store_openai_configs SET daily_token_limit=?, monthly_token_limit=?, enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute([$newTextDaily, $newTextMonthly, $status, $until, 'active', $sid]);
        $pdo->prepare('UPDATE store_openai_automation_configs SET daily_question_quota=?, monthly_question_quota=?, enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute([$newAutoDaily, $newAutoMonthly, $status, $until, 'active', $sid]);

        echo json_encode([
            'ok' => true,
            'store_id' => $sid,
            'store_name' => $meta['name'],
            'payment_status' => $status,
            'until' => $until,
            'limits' => [
                'images_monthly' => $newMonth,
                'images_daily' => $newDay,
                'text_daily_tokens' => $newTextDaily,
                'text_monthly_tokens' => $newTextMonthly,
                'auto_daily_questions' => $newAutoDaily,
                'auto_monthly_questions' => $newAutoMonthly,
            ],
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    // Instant unlock text + image + automation for one store or all Pro stores.
    if ($uri === '/master/openai/unlock-suite' && $method === 'POST') {
        $scope = (string) ($input['scope'] ?? '');
        if (!in_array($scope, ['store', 'all'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'scope must be store or all.']);

            return true;
        }
        $methodPay = (string) ($input['method'] ?? '');
        if (!in_array($methodPay, ['mark_paid', 'comp', 'services_points'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid unlock method.']);

            return true;
        }
        $status = ($methodPay === 'comp') ? 'comped' : 'paid';
        $days = max(1, min(366, (int) ($input['days'] ?? 30)));
        $until = (new DateTimeImmutable('now'))->modify('+'.$days.' days')->format('Y-m-d H:i:s');

        $targetIds = [];
        if ($scope === 'store') {
            $sid = trim((string) ($input['store_id'] ?? ''));
            if ($sid === '') {
                http_response_code(422);
                echo json_encode(['message' => 'store_id required for scope=store.']);

                return true;
            }
            $targetIds = [$sid];
        } else {
            try {
                $rows = $pdo->query('SELECT id FROM stores ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC);
                foreach ($rows as $r) {
                    $targetIds[] = (string) ($r['id'] ?? '');
                }
            } catch (Throwable $e) {
                $targetIds = [];
            }
            $targetIds = array_values(array_filter($targetIds));
        }

        $unlocked = [];
        $skipped = [];
        foreach ($targetIds as $sid) {
            $meta = souq_openai_store_plan($pdo, $sid);
            if (!$meta['pro_eligible']) {
                $skipped[] = [
                    'store_id' => $sid,
                    'store_name' => $meta['name'],
                    'reason' => 'pro_required',
                ];
                continue;
            }
            souq_openai_text_cfg($pdo, $sid);
            souq_openai_image_cfg($pdo, $sid);
            souq_openai_auto_cfg($pdo, $sid);
            $pdo->prepare('UPDATE store_openai_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([$status, $until, 'active', $sid]);
            $pdo->prepare('UPDATE store_openai_image_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([$status, $until, 'active', $sid]);
            $pdo->prepare('UPDATE store_openai_automation_configs SET enabled=1, usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([$status, $until, 'active', $sid]);
            $unlocked[] = ['store_id' => $sid, 'store_name' => $meta['name']];
        }

        echo json_encode([
            'ok' => true,
            'scope' => $scope,
            'method' => $methodPay,
            'days' => $days,
            'unlocked_count' => count($unlocked),
            'skipped_count' => count($skipped),
            'unlocked' => $unlocked,
            'skipped' => $skipped,
        ]);

        return true;
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/reset$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        souq_openai_text_cfg($pdo, $sid);
        $pdo->prepare('UPDATE store_openai_configs SET enabled=0, intelligence_level=?, text_model=NULL, usage_unlocked=0, payment_status=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute(['medium', 'unpaid', 'draft', $sid]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_text_cfg($pdo, $sid);
        echo json_encode(['ok' => true, 'config' => array_merge($cfg, [
            'store_id' => $sid, 'store_name' => $meta['name'], 'store_plan' => $meta['plan'], 'pro_eligible' => $meta['pro_eligible'],
            'enabled' => false, 'level_catalog' => [],
        ])]);

        return true;
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/complete$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_text_cfg($pdo, $sid);
        $g = souq_openai_global($pdo);
        if (!empty($g['emergency_disabled']) || empty($g['enabled'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'provider_disabled', 'message' => 'OpenAI provider disabled.']);

            return true;
        }
        if (empty($cfg['enabled'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'store_disabled', 'message' => 'Disabled for store.']);

            return true;
        }
        if (!$meta['pro_eligible'] || !souq_openai_usage_unlocked($cfg)) {
            http_response_code(402);
            echo json_encode(['ok' => false, 'code' => 'payment_required', 'message' => 'Pro + payment required.', 'payment_required' => true]);

            return true;
        }
        $apiKey = souq_openai_env('OPENAI_API_KEY');
        if ($apiKey === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'key_missing', 'message' => 'OPENAI_API_KEY not set on server.']);

            return true;
        }
        $prompt = trim((string) ($input['prompt'] ?? ''));
        if ($prompt === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'invalid_prompt', 'message' => 'Prompt required.']);

            return true;
        }
        $model = (string) ($cfg['text_model'] ?: ($g['default_text_model'] ?? 'gpt-5.4-mini'));
        $maxOut = max(64, (int) ($cfg['max_output_tokens'] ?? 2048));
        $msgs = [];
        if (!empty($input['system'])) {
            $msgs[] = ['role' => 'system', 'content' => (string) $input['system']];
        }
        $msgs[] = ['role' => 'user', 'content' => $prompt];
        $body = ['model' => $model, 'messages' => $msgs, 'max_completion_tokens' => $maxOut];
        $effort = (string) ($cfg['reasoning_effort'] ?? '');
        if ($effort !== '' && str_contains(strtolower($model), 'gpt-5')) {
            $body['reasoning_effort'] = $effort;
        }
        $res = souq_openai_curl('https://api.openai.com/v1/chat/completions', $apiKey, $body, 90);
        $rid = souq_openai_rid('oa');
        if (!$res['ok']) {
            $pdo->prepare('INSERT INTO store_openai_usage_logs (id, store_id, request_id, model, intelligence_level, status, error_code, error_message, created_at) VALUES (?,?,?,?,?,?,?,?,NOW())')
                ->execute([souq_openai_rid('oaul'), $sid, $rid, $model, $cfg['intelligence_level'] ?? 'medium', 'failed', $res['code'] ?? 'err', $res['message'] ?? '']);
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => $res['code'] ?? 'err', 'message' => $res['message'] ?? 'Failed']);

            return true;
        }
        $json = $res['json'];
        $content = (string) ($json['choices'][0]['message']['content'] ?? '');
        $usage = is_array($json['usage'] ?? null) ? $json['usage'] : [];
        $inTok = (int) ($usage['prompt_tokens'] ?? 0);
        $outTok = (int) ($usage['completion_tokens'] ?? 0);
        $total = (int) ($usage['total_tokens'] ?? ($inTok + $outTok));
        $cost = round(($inTok / 1e6) * 0.25 + ($outTok / 1e6) * 2.0, 6);
        $pdo->prepare('INSERT INTO store_openai_usage_logs (id, store_id, request_id, model, intelligence_level, input_tokens, output_tokens, total_tokens, estimated_cost_usd, actual_cost_usd, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())')
            ->execute([souq_openai_rid('oaul'), $sid, $rid, $model, $cfg['intelligence_level'] ?? 'medium', $inTok, $outTok, $total, $cost, $cost, 'success']);
        foreach (['day', 'month'] as $ptype) {
            $pkey = souq_openai_period($ptype);
            $pdo->prepare('INSERT INTO store_openai_budget_periods (id, store_id, period_type, period_key, tokens_used, requests_used, cost_usd, created_at, updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE tokens_used=tokens_used+VALUES(tokens_used), requests_used=requests_used+1, cost_usd=cost_usd+VALUES(cost_usd), updated_at=NOW()')
                ->execute([souq_openai_rid('oabp'), $sid, $ptype, $pkey, $total, 1, $cost]);
        }
        echo json_encode(['ok' => true, 'data' => [
            'request_id' => $rid,
            'model' => $model,
            'intelligence_level' => $cfg['intelligence_level'] ?? 'medium',
            'content' => $content,
            'usage' => ['input_tokens' => $inTok, 'output_tokens' => $outTok, 'total_tokens' => $total, 'cached_tokens' => 0],
            'actual_cost_usd' => $cost,
            'estimated_cost_usd' => $cost,
        ]]);

        return true;
    }

    // Image show / update / unlock / generate
    if (preg_match('#^/master/openai/stores/([^/]+)/image$#', $uri, $m)) {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_image_cfg($pdo, $sid);
        $period = souq_openai_period('month');
        $ust = $pdo->prepare('SELECT * FROM store_openai_image_usage WHERE store_id=? AND period_key=? LIMIT 1');
        $ust->execute([$sid, $period]);
        $u = $ust->fetch(PDO::FETCH_ASSOC);
        if (!$u) {
            $pdo->prepare('INSERT INTO store_openai_image_usage (id, store_id, period_key, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())')
                ->execute([souq_openai_rid('oaiu'), $sid, $period]);
            $ust->execute([$sid, $period]);
            $u = $ust->fetch(PDO::FETCH_ASSOC) ?: [];
        }
        $serialize = static function () use ($cfg, $meta, $sid, $u) {
            $quota = (int) ($cfg['monthly_image_quota'] ?? 50);
            $used = (int) ($u['images_success'] ?? 0);

            return [
                'store_id' => $sid,
                'store_name' => $meta['name'],
                'pro_eligible' => $meta['pro_eligible'],
                'enabled' => !empty($cfg['enabled']),
                'default_model' => (string) ($cfg['default_model'] ?? 'gpt-image-2.6-flare'),
                'default_quality' => (string) ($cfg['default_quality'] ?? 'medium'),
                'monthly_image_quota' => $quota,
                'daily_quota' => null,
                'monthly_budget_usd' => (float) ($cfg['monthly_budget_usd'] ?? 25),
                'max_cost_per_image_usd' => (float) ($cfg['max_cost_per_image_usd'] ?? 1),
                'warning_threshold_pct' => (int) ($cfg['warning_threshold_pct'] ?? 80),
                'auto_stop_at_quota' => !empty($cfg['auto_stop_at_quota']),
                'payment_required_for_usage' => !empty($cfg['payment_required_for_usage']),
                'usage_unlocked' => !empty($cfg['usage_unlocked']),
                'payment_status' => (string) ($cfg['payment_status'] ?? 'unpaid'),
                'config_status' => (string) ($cfg['config_status'] ?? 'draft'),
                'usage' => [
                    'period_key' => (string) ($u['period_key'] ?? ''),
                    'images_success' => $used,
                    'images_failed' => (int) ($u['images_failed'] ?? 0),
                    'images_remaining' => max(0, $quota - $used),
                    'cost_usd' => (float) ($u['cost_usd'] ?? 0),
                    'hard_stopped' => !empty($u['hard_stopped']),
                ],
            ];
        };
        if ($method === 'GET') {
            echo json_encode(['config' => $serialize(), 'events' => [], 'api_key' => souq_openai_key_status()]);

            return true;
        }
        if ($method === 'PUT') {
            if (!empty($input['enabled']) && !$meta['pro_eligible']) {
                http_response_code(422);
                echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true]);

                return true;
            }
            $pdo->prepare('UPDATE store_openai_image_configs SET enabled=?, default_model=?, default_quality=?, monthly_image_quota=?, monthly_budget_usd=?, max_cost_per_image_usd=?, warning_threshold_pct=?, auto_stop_at_quota=?, payment_required_for_usage=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([
                    array_key_exists('enabled', $input) ? (int) !empty($input['enabled']) : (int) !empty($cfg['enabled']),
                    (string) ($input['default_model'] ?? $cfg['default_model']),
                    (string) ($input['default_quality'] ?? $cfg['default_quality']),
                    (int) ($input['monthly_image_quota'] ?? $cfg['monthly_image_quota'] ?? 50),
                    (float) ($input['monthly_budget_usd'] ?? $cfg['monthly_budget_usd'] ?? 25),
                    (float) ($input['max_cost_per_image_usd'] ?? $cfg['max_cost_per_image_usd'] ?? 1),
                    (int) ($input['warning_threshold_pct'] ?? $cfg['warning_threshold_pct'] ?? 80),
                    array_key_exists('auto_stop_at_quota', $input) ? (int) !empty($input['auto_stop_at_quota']) : (int) !empty($cfg['auto_stop_at_quota']),
                    array_key_exists('payment_required_for_usage', $input) ? (int) !empty($input['payment_required_for_usage']) : (int) !empty($cfg['payment_required_for_usage']),
                    (string) ($input['config_status'] ?? $cfg['config_status'] ?? 'draft'),
                    $sid,
                ]);
            $cfg = souq_openai_image_cfg($pdo, $sid);
            echo json_encode(['ok' => true, 'config' => $serialize()]);

            return true;
        }
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/image/unlock-payment$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        if (!$meta['pro_eligible']) {
            http_response_code(422);
            echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true]);

            return true;
        }
        $status = (($input['method'] ?? '') === 'comp') ? 'comped' : 'paid';
        $days = max(1, min(366, (int) ($input['days'] ?? 30)));
        $until = (new DateTimeImmutable('now'))->modify('+'.$days.' days')->format('Y-m-d H:i:s');
        souq_openai_image_cfg($pdo, $sid);
        $pdo->prepare('UPDATE store_openai_image_configs SET usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute([$status, $until, 'active', $sid]);
        $cfg = souq_openai_image_cfg($pdo, $sid);
        $period = souq_openai_period('month');
        $ust = $pdo->prepare('SELECT * FROM store_openai_image_usage WHERE store_id=? AND period_key=? LIMIT 1');
        $ust->execute([$sid, $period]);
        $u = $ust->fetch(PDO::FETCH_ASSOC) ?: [];
        $quota = (int) ($cfg['monthly_image_quota'] ?? 50);
        $used = (int) ($u['images_success'] ?? 0);
        echo json_encode(['ok' => true, 'config' => [
            'store_id' => $sid, 'store_name' => $meta['name'], 'pro_eligible' => true,
            'enabled' => !empty($cfg['enabled']), 'default_model' => $cfg['default_model'], 'default_quality' => $cfg['default_quality'],
            'monthly_image_quota' => $quota, 'daily_quota' => null,
            'monthly_budget_usd' => (float) ($cfg['monthly_budget_usd'] ?? 25),
            'max_cost_per_image_usd' => (float) ($cfg['max_cost_per_image_usd'] ?? 1),
            'warning_threshold_pct' => (int) ($cfg['warning_threshold_pct'] ?? 80),
            'auto_stop_at_quota' => !empty($cfg['auto_stop_at_quota']),
            'payment_required_for_usage' => !empty($cfg['payment_required_for_usage']),
            'usage_unlocked' => true, 'payment_status' => $status, 'config_status' => 'active',
            'usage' => ['period_key' => $period, 'images_success' => $used, 'images_failed' => (int) ($u['images_failed'] ?? 0), 'images_remaining' => max(0, $quota - $used), 'cost_usd' => (float) ($u['cost_usd'] ?? 0), 'hard_stopped' => !empty($u['hard_stopped'])],
        ]]);

        return true;
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/image/generate$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_image_cfg($pdo, $sid);
        $g = souq_openai_global($pdo);
        if (!empty($g['emergency_disabled']) || empty($g['enabled']) || empty($cfg['enabled'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'store_disabled', 'message' => 'Image AI disabled.']);

            return true;
        }
        if (!$meta['pro_eligible'] || !souq_openai_usage_unlocked($cfg)) {
            http_response_code(402);
            echo json_encode(['ok' => false, 'code' => 'payment_required', 'message' => 'Pro + payment required.', 'payment_required' => true]);

            return true;
        }
        $period = souq_openai_period('month');
        $ust = $pdo->prepare('SELECT * FROM store_openai_image_usage WHERE store_id=? AND period_key=? LIMIT 1 FOR UPDATE');
        $pdo->beginTransaction();
        try {
            $ust->execute([$sid, $period]);
            $u = $ust->fetch(PDO::FETCH_ASSOC);
            if (!$u) {
                $pdo->prepare('INSERT INTO store_openai_image_usage (id, store_id, period_key, created_at, updated_at) VALUES (?,?,?,NOW(),NOW())')
                    ->execute([souq_openai_rid('oaiu'), $sid, $period]);
                $ust->execute([$sid, $period]);
                $u = $ust->fetch(PDO::FETCH_ASSOC) ?: [];
            }
            $quota = (int) ($cfg['monthly_image_quota'] ?? 50);
            if (!empty($u['hard_stopped']) || (int) ($u['images_success'] ?? 0) >= $quota) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode(['ok' => false, 'code' => 'monthly_quota', 'message' => 'Monthly image quota reached.']);

                return true;
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['ok' => false, 'code' => 'db_error', 'message' => 'Usage check failed.']);

            return true;
        }
        $apiKey = souq_openai_env('OPENAI_API_KEY');
        if ($apiKey === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'key_missing', 'message' => 'OPENAI_API_KEY missing.']);

            return true;
        }
        $prompt = trim((string) ($input['prompt'] ?? ''));
        $model = (string) ($cfg['default_model'] ?? 'gpt-image-2.6-flare');
        $quality = (string) ($cfg['default_quality'] ?? 'medium');
        $res = souq_openai_curl('https://api.openai.com/v1/images/generations', $apiKey, [
            'model' => $model,
            'prompt' => mb_substr($prompt, 0, 32000),
            'quality' => $quality,
            'size' => '1024x1024',
            'n' => 1,
        ], 120);
        $rid = souq_openai_rid('oa-img');
        if (!$res['ok']) {
            $pdo->prepare('UPDATE store_openai_image_usage SET images_failed=images_failed+1, updated_at=NOW() WHERE store_id=? AND period_key=?')
                ->execute([$sid, $period]);
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => $res['code'] ?? 'err', 'message' => $res['message'] ?? 'Failed']);

            return true;
        }
        $b64 = (string) ($res['json']['data'][0]['b64_json'] ?? '');
        $cost = 0.042;
        $pdo->prepare('UPDATE store_openai_image_usage SET images_success=images_success+1, cost_usd=cost_usd+?, updated_at=NOW() WHERE store_id=? AND period_key=?')
            ->execute([$cost, $sid, $period]);
        $pdo->prepare('INSERT INTO store_openai_image_events (id, store_id, request_id, model, quality, status, actual_cost_usd, created_at) VALUES (?,?,?,?,?,?,?,NOW())')
            ->execute([souq_openai_rid('oaie'), $sid, $rid, $model, $quality, 'success', $cost]);
        $dataUrl = $b64 !== '' ? ('data:image/png;base64,'.$b64) : '';
        echo json_encode(['ok' => true, 'data' => [
            'request_id' => $rid,
            'url' => $dataUrl,
            'model' => $model,
            'quality' => $quality,
            'actual_cost_usd' => $cost,
        ]]);

        return true;
    }

    // Automation
    if (preg_match('#^/master/openai/stores/([^/]+)/automation$#', $uri, $m)) {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_auto_cfg($pdo, $sid);
        $dayKey = souq_openai_period('day');
        $monthKey = souq_openai_period('month');
        $getU = static function (PDO $pdo, string $sid, string $type, string $key): array {
            $st = $pdo->prepare('SELECT * FROM store_openai_automation_usage WHERE store_id=? AND period_type=? AND period_key=? LIMIT 1');
            $st->execute([$sid, $type, $key]);
            $u = $st->fetch(PDO::FETCH_ASSOC);
            if ($u) {
                return $u;
            }
            $pdo->prepare('INSERT INTO store_openai_automation_usage (id, store_id, period_type, period_key, created_at, updated_at) VALUES (?,?,?,?,NOW(),NOW())')
                ->execute([souq_openai_rid('oaau'), $sid, $type, $key]);
            $st->execute([$sid, $type, $key]);

            return $st->fetch(PDO::FETCH_ASSOC) ?: [];
        };
        $day = $getU($pdo, $sid, 'day', $dayKey);
        $month = $getU($pdo, $sid, 'month', $monthKey);
        $pack = static function () use ($cfg, $meta, $sid, $day, $month) {
            return [
                'store_id' => $sid,
                'store_name' => $meta['name'],
                'pro_eligible' => $meta['pro_eligible'],
                'enabled' => !empty($cfg['enabled']),
                'intelligence_level' => (string) ($cfg['intelligence_level'] ?? 'medium'),
                'text_model' => $cfg['text_model'] ?? null,
                'monthly_question_quota' => (int) ($cfg['monthly_question_quota'] ?? 100),
                'daily_question_quota' => (int) ($cfg['daily_question_quota'] ?? 20),
                'max_output_tokens' => (int) ($cfg['max_output_tokens'] ?? 1024),
                'own_store_data_only' => true,
                'block_cross_store' => true,
                'block_sql_and_secrets' => true,
                'payment_required_for_usage' => !empty($cfg['payment_required_for_usage']),
                'usage_unlocked' => !empty($cfg['usage_unlocked']),
                'payment_status' => (string) ($cfg['payment_status'] ?? 'unpaid'),
                'config_status' => (string) ($cfg['config_status'] ?? 'draft'),
                'usage' => [
                    'day' => ['period_key' => $day['period_key'] ?? '', 'questions_used' => (int) ($day['questions_used'] ?? 0), 'questions_limit' => (int) ($cfg['daily_question_quota'] ?? 20), 'hard_stopped' => !empty($day['hard_stopped'])],
                    'month' => ['period_key' => $month['period_key'] ?? '', 'questions_used' => (int) ($month['questions_used'] ?? 0), 'questions_limit' => (int) ($cfg['monthly_question_quota'] ?? 100), 'tokens_used' => (int) ($month['tokens_used'] ?? 0), 'cost_usd' => (float) ($month['cost_usd'] ?? 0), 'hard_stopped' => !empty($month['hard_stopped'])],
                ],
                'policy' => ['scope' => 'own_store_only', 'organization_model' => 'master_sets_limits_payment_per_store'],
            ];
        };
        if ($method === 'GET') {
            echo json_encode(['config' => $pack(), 'api_key' => souq_openai_key_status()]);

            return true;
        }
        if ($method === 'PUT') {
            if (!empty($input['enabled']) && !$meta['pro_eligible']) {
                http_response_code(422);
                echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true]);

                return true;
            }
            $pdo->prepare('UPDATE store_openai_automation_configs SET enabled=?, intelligence_level=?, text_model=?, monthly_question_quota=?, daily_question_quota=?, max_output_tokens=?, payment_required_for_usage=?, config_status=?, updated_at=NOW() WHERE store_id=?')
                ->execute([
                    array_key_exists('enabled', $input) ? (int) !empty($input['enabled']) : (int) !empty($cfg['enabled']),
                    (string) ($input['intelligence_level'] ?? $cfg['intelligence_level'] ?? 'medium'),
                    $input['text_model'] ?? $cfg['text_model'],
                    (int) ($input['monthly_question_quota'] ?? $cfg['monthly_question_quota'] ?? 100),
                    (int) ($input['daily_question_quota'] ?? $cfg['daily_question_quota'] ?? 20),
                    (int) ($input['max_output_tokens'] ?? $cfg['max_output_tokens'] ?? 1024),
                    array_key_exists('payment_required_for_usage', $input) ? (int) !empty($input['payment_required_for_usage']) : (int) !empty($cfg['payment_required_for_usage']),
                    (string) ($input['config_status'] ?? $cfg['config_status'] ?? 'draft'),
                    $sid,
                ]);
            $cfg = souq_openai_auto_cfg($pdo, $sid);
            echo json_encode(['ok' => true, 'config' => $pack()]);

            return true;
        }
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/automation/unlock-payment$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        if (!$meta['pro_eligible']) {
            http_response_code(422);
            echo json_encode(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true]);

            return true;
        }
        $status = (($input['method'] ?? '') === 'comp') ? 'comped' : 'paid';
        $days = max(1, min(366, (int) ($input['days'] ?? 30)));
        $until = (new DateTimeImmutable('now'))->modify('+'.$days.' days')->format('Y-m-d H:i:s');
        souq_openai_auto_cfg($pdo, $sid);
        $pdo->prepare('UPDATE store_openai_automation_configs SET usage_unlocked=1, payment_status=?, usage_unlocked_until=?, config_status=?, updated_at=NOW() WHERE store_id=?')
            ->execute([$status, $until, 'active', $sid]);
        echo json_encode(['ok' => true, 'config' => array_merge(souq_openai_auto_cfg($pdo, $sid), [
            'store_id' => $sid, 'store_name' => $meta['name'], 'pro_eligible' => true,
            'own_store_data_only' => true, 'block_cross_store' => true, 'block_sql_and_secrets' => true,
            'usage' => [], 'policy' => ['scope' => 'own_store_only'],
        ])]);

        return true;
    }

    if (preg_match('#^/master/openai/stores/([^/]+)/automation/ask$#', $uri, $m) && $method === 'POST') {
        $sid = rawurldecode($m[1]);
        $meta = souq_openai_store_plan($pdo, $sid);
        $cfg = souq_openai_auto_cfg($pdo, $sid);
        $g = souq_openai_global($pdo);
        $q = trim((string) ($input['question'] ?? ''));
        if (!empty($g['emergency_disabled']) || empty($g['enabled']) || empty($cfg['enabled'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'store_disabled', 'message' => 'Automation disabled.']);

            return true;
        }
        if (!$meta['pro_eligible'] || !souq_openai_usage_unlocked($cfg)) {
            http_response_code(402);
            echo json_encode(['ok' => false, 'code' => 'payment_required', 'message' => 'Pro + payment required.', 'payment_required' => true]);

            return true;
        }
        if ($q === '' || preg_match('/\b(select\s+.+\s+from|drop\s+table|api[_-]?key|password|secret)\b/i', $q)) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'blocked_unsafe', 'message' => 'Question blocked.']);

            return true;
        }
        $apiKey = souq_openai_env('OPENAI_API_KEY');
        if ($apiKey === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => 'key_missing', 'message' => 'OPENAI_API_KEY missing.']);

            return true;
        }
        $pc = 0;
        $oc = 0;
        try {
            $st = $pdo->prepare('SELECT COUNT(*) FROM products WHERE store_id=?');
            $st->execute([$sid]);
            $pc = (int) $st->fetchColumn();
            $st = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE store_id=?');
            $st->execute([$sid]);
            $oc = (int) $st->fetchColumn();
        } catch (Throwable $e) {
        }
        $system = "Store ID: {$sid}\nStore: {$meta['name']}\nProducts: {$pc}\nOrders: {$oc}\nRULES: Answer only about this store. No other stores. No secrets/SQL.";
        $model = (string) ($cfg['text_model'] ?: souq_openai_env('OPENAI_TEXT_MODEL', 'gpt-5.4-mini'));
        $res = souq_openai_curl('https://api.openai.com/v1/chat/completions', $apiKey, [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $q],
            ],
            'max_completion_tokens' => max(64, (int) ($cfg['max_output_tokens'] ?? 1024)),
        ], 90);
        if (!$res['ok']) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'code' => $res['code'] ?? 'err', 'message' => $res['message'] ?? 'Failed']);

            return true;
        }
        $content = (string) ($res['json']['choices'][0]['message']['content'] ?? '');
        $usage = is_array($res['json']['usage'] ?? null) ? $res['json']['usage'] : [];
        $total = (int) ($usage['total_tokens'] ?? 0);
        $cost = round($total / 1e6 * 1.0, 6);
        foreach (['day' => souq_openai_period('day'), 'month' => souq_openai_period('month')] as $ptype => $pkey) {
            $pdo->prepare('INSERT INTO store_openai_automation_usage (id, store_id, period_type, period_key, questions_used, tokens_used, cost_usd, created_at, updated_at) VALUES (?,?,?,?,1,?,?,NOW(),NOW()) ON DUPLICATE KEY UPDATE questions_used=questions_used+1, tokens_used=tokens_used+VALUES(tokens_used), cost_usd=cost_usd+VALUES(cost_usd), updated_at=NOW()')
                ->execute([souq_openai_rid('oaau'), $sid, $ptype, $pkey, $total, $cost]);
        }
        echo json_encode(['ok' => true, 'data' => [
            'content' => $content,
            'usage' => ['total_tokens' => $total],
            'actual_cost_usd' => $cost,
        ]]);

        return true;
    }

    if ($uri === '/master/openai/pricing' && $method === 'PUT') {
        echo json_encode(['ok' => true, 'pricing' => []]);

        return true;
    }

    return false;
}
