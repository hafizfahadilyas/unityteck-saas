<?php

/**
 * Integration Health Center — Hostinger PHP twin (Master + bank proofs).
 * Real MySQL only. Never invent Connected / Paid / AWB.
 */

function souq_ih_rid(string $prefix): string
{
    return $prefix.'_'.strtolower(bin2hex(random_bytes(8)));
}

function souq_ih_ensure_tables(PDO $pdo): void
{
    if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
        return;
    }
    $stmts = [
        "CREATE TABLE IF NOT EXISTS `integration_health_checks` (
          `id` varchar(64) NOT NULL,
          `store_id` varchar(64) NOT NULL,
          `category` varchar(32) NOT NULL,
          `provider` varchar(64) NOT NULL,
          `connection_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `auth_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `api_health_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `sandbox_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `production_verification_status` varchar(64) NOT NULL DEFAULT 'not_tested',
          `webhook_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `last_successful_test_at` timestamp NULL DEFAULT NULL,
          `last_failed_test_at` timestamp NULL DEFAULT NULL,
          `api_response_time_ms` int unsigned DEFAULT NULL,
          `last_error_message` text,
          `integration_version` varchar(64) DEFAULT NULL,
          `supported_features` json DEFAULT NULL,
          `environment` varchar(32) DEFAULT NULL,
          `overall_status` varchar(64) NOT NULL DEFAULT 'not_configured',
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `ihc_store_cat_provider_uq` (`store_id`,`category`,`provider`),
          KEY `ihc_store_id` (`store_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `integration_health_logs` (
          `id` varchar(64) NOT NULL,
          `store_id` varchar(64) NOT NULL,
          `category` varchar(32) NOT NULL,
          `provider` varchar(64) NOT NULL,
          `test_type` varchar(64) DEFAULT NULL,
          `environment` varchar(32) DEFAULT NULL,
          `request_at` timestamp NULL DEFAULT NULL,
          `response_at` timestamp NULL DEFAULT NULL,
          `http_status` smallint unsigned DEFAULT NULL,
          `api_endpoint` varchar(512) DEFAULT NULL,
          `duration_ms` int unsigned DEFAULT NULL,
          `error_code` varchar(64) DEFAULT NULL,
          `error_message_sanitized` text,
          `transaction_id` varchar(128) DEFAULT NULL,
          `shipment_id` varchar(128) DEFAULT NULL,
          `success` tinyint(1) NOT NULL DEFAULT 0,
          `meta` json DEFAULT NULL,
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL,
          PRIMARY KEY (`id`),
          KEY `ihl_store_id` (`store_id`),
          KEY `ihl_provider` (`provider`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `integration_webhook_events` (
          `id` varchar(64) NOT NULL,
          `store_id` varchar(64) NOT NULL,
          `category` varchar(32) NOT NULL,
          `provider` varchar(64) NOT NULL,
          `event_id` varchar(191) NOT NULL,
          `event_type` varchar(128) DEFAULT NULL,
          `signature_ok` tinyint(1) DEFAULT NULL,
          `status` varchar(64) NOT NULL DEFAULT 'received',
          `transaction_id` varchar(128) DEFAULT NULL,
          `shipment_id` varchar(128) DEFAULT NULL,
          `payload_sanitized` json DEFAULT NULL,
          `processed_at` timestamp NULL DEFAULT NULL,
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `iwe_store_provider_event_uq` (`store_id`,`provider`,`event_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS `bank_transfer_proofs` (
          `id` varchar(64) NOT NULL,
          `store_id` varchar(64) NOT NULL,
          `order_id` varchar(64) DEFAULT NULL,
          `transaction_id` varchar(64) DEFAULT NULL,
          `media_path` varchar(512) NOT NULL,
          `media_url` varchar(1024) DEFAULT NULL,
          `status` varchar(32) NOT NULL DEFAULT 'pending',
          `reviewed_by` varchar(191) DEFAULT NULL,
          `notes` text,
          `reviewed_at` timestamp NULL DEFAULT NULL,
          `audit_trail` json DEFAULT NULL,
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL,
          PRIMARY KEY (`id`),
          KEY `btp_store_status` (`store_id`,`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];
    foreach ($stmts as $sql) {
        try {
            $pdo->exec($sql);
        } catch (Throwable $e) {
            // keep going — table may already exist with slight diff
        }
    }
}

function souq_ih_sanitize(?string $msg): ?string
{
    if ($msg === null || $msg === '') {
        return null;
    }
    $out = preg_replace('/\b(?:sk|pk|rk)_(?:test|live)_[A-Za-z0-9]+\b/i', '[REDACTED_KEY]', $msg) ?? $msg;
    $out = preg_replace('/Bearer\s+[A-Za-z0-9._\-]+/i', 'Bearer [REDACTED]', $out) ?? $out;

    return mb_substr($out, 0, 2000);
}

function souq_ih_log(PDO $pdo, array $row): void
{
    try {
        $st = $pdo->prepare('INSERT INTO integration_health_logs
            (id, store_id, category, provider, test_type, environment, request_at, response_at, http_status, api_endpoint, duration_ms, error_code, error_message_sanitized, transaction_id, shipment_id, success, meta, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $now = date('c');
        $st->execute([
            souq_ih_rid('ihl'),
            $row['store_id'] ?? '',
            $row['category'] ?? 'payment',
            $row['provider'] ?? '',
            $row['test_type'] ?? null,
            $row['environment'] ?? null,
            $row['request_at'] ?? $now,
            $row['response_at'] ?? $now,
            $row['http_status'] ?? null,
            $row['api_endpoint'] ?? null,
            $row['duration_ms'] ?? null,
            $row['error_code'] ?? null,
            souq_ih_sanitize($row['error_message'] ?? null),
            $row['transaction_id'] ?? null,
            $row['shipment_id'] ?? null,
            !empty($row['success']) ? 1 : 0,
            isset($row['meta']) ? json_encode($row['meta'], JSON_UNESCAPED_UNICODE) : null,
            $now,
            $now,
        ]);
    } catch (Throwable $e) {
    }
}

function souq_ih_upsert_check(PDO $pdo, string $storeId, string $category, string $provider, array $result): void
{
    $now = date('c');
    $success = !empty($result['success']);
    $overall = (string) ($result['overall_status'] ?? ($success ? 'connected' : 'requires_attention'));
    $msg = souq_ih_sanitize($result['message'] ?? null);
    $duration = $result['duration_ms'] ?? null;
    $env = $result['environment'] ?? null;
    $webhook = $result['webhook_status'] ?? null;

    try {
        $sel = $pdo->prepare('SELECT id FROM integration_health_checks WHERE store_id=? AND category=? AND provider=? LIMIT 1');
        $sel->execute([$storeId, $category, $provider]);
        $id = $sel->fetchColumn();
        if (!$id) {
            $id = souq_ih_rid('ihc');
            $ins = $pdo->prepare('INSERT INTO integration_health_checks
                (id, store_id, category, provider, connection_status, auth_status, api_health_status, sandbox_status, production_verification_status, webhook_status, last_successful_test_at, last_failed_test_at, api_response_time_ms, last_error_message, integration_version, environment, overall_status, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $ins->execute([
                $id, $storeId, $category, $provider,
                $overall, $overall, $overall,
                ($env === 'sandbox' && $success) ? 'sandbox_verified' : 'not_configured',
                'not_tested',
                $webhook ?: 'not_configured',
                $success ? $now : null,
                $success ? null : $now,
                $duration,
                $success ? null : $msg,
                '1.0.0-phase1',
                $env,
                $overall,
                $now, $now,
            ]);
        } else {
            $upd = $pdo->prepare('UPDATE integration_health_checks SET
                connection_status=?, auth_status=?, api_health_status=?,
                sandbox_status=CASE WHEN ?="sandbox" AND ?=1 THEN "sandbox_verified" ELSE sandbox_status END,
                webhook_status=COALESCE(?, webhook_status),
                last_successful_test_at=CASE WHEN ?=1 THEN ? ELSE last_successful_test_at END,
                last_failed_test_at=CASE WHEN ?=0 THEN ? ELSE last_failed_test_at END,
                api_response_time_ms=?, last_error_message=?, environment=COALESCE(?, environment),
                overall_status=?, integration_version=?, updated_at=?
                WHERE id=?');
            $upd->execute([
                $overall, $overall, $overall,
                (string) $env, $success ? 1 : 0,
                $webhook,
                $success ? 1 : 0, $now,
                $success ? 0 : 1, $now,
                $duration, $success ? null : $msg, $env,
                $overall, '1.0.0-phase1', $now, $id,
            ]);
        }
    } catch (Throwable $e) {
    }
}

/** @return list<string> */
function souq_ih_payment_providers(): array
{
    return ['moyasar', 'tamara', 'tabby', 'cod', 'bank_transfer', 'stripe', 'paypal', 'hyperpay', 'tap'];
}

/** @return list<string> */
function souq_ih_shipping_providers(): array
{
    return ['spl', 'smsa', 'aramex', 'dhl', 'fedex', 'ups', 'redbox', 'aymakan', 'jt'];
}

function souq_ih_label(string $category, string $provider): string
{
    $map = [
        'moyasar' => 'Moyasar', 'tamara' => 'Tamara', 'tabby' => 'Tabby', 'cod' => 'Cash on Delivery',
        'bank_transfer' => 'Bank Transfer', 'stripe' => 'Stripe', 'paypal' => 'PayPal',
        'hyperpay' => 'HyperPay', 'tap' => 'Tap', 'spl' => 'Saudi Post (SPL)', 'smsa' => 'SMSA',
        'aramex' => 'Aramex', 'dhl' => 'DHL Express', 'fedex' => 'FedEx', 'ups' => 'UPS',
        'redbox' => 'RedBox', 'aymakan' => 'AyMakan', 'jt' => 'J&T Express',
    ];

    return $map[$provider] ?? ucfirst($provider);
}

function souq_ih_http_get(string $url, array $headers = [], int $timeout = 8): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['ok' => $errno === 0, 'http' => $code, 'body' => is_string($body) ? $body : '', 'error' => $err];
}

function souq_ih_build_payment_row(PDO $pdo, string $storeId, string $storeName, string $provider): array
{
    $stub = in_array($provider, ['stripe', 'paypal', 'hyperpay', 'tap'], true);
    $gw = null;
    try {
        $st = $pdo->prepare('SELECT * FROM payment_gateways WHERE store_id=? AND provider=? LIMIT 1');
        $st->execute([$storeId, $provider]);
        $gw = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (Throwable $e) {
    }
    $check = null;
    try {
        $st = $pdo->prepare('SELECT * FROM integration_health_checks WHERE store_id=? AND category=? AND provider=? LIMIT 1');
        $st->execute([$storeId, 'payment', $provider]);
        $check = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (Throwable $e) {
    }

    $hasCreds = $gw && (in_array($provider, ['cod', 'bank_transfer'], true)
        || !empty($gw['secret_key']) || !empty($gw['api_key']) || !empty($gw['public_key']));

    if ($stub) {
        $overall = !$gw ? 'not_configured' : ($hasCreds ? 'incomplete_backend' : 'credentials_missing');
    } elseif (!$gw) {
        $overall = 'not_configured';
    } else {
        $overall = $check['overall_status'] ?? (($gw['status'] ?? '') === 'connected' ? 'connected' : 'not_configured');
    }

    return [
        'store_id' => $storeId,
        'store_name' => $storeName,
        'category' => 'payment',
        'provider' => $provider,
        'provider_name' => souq_ih_label('payment', $provider),
        'overall_status' => $overall,
        'connection_status' => $check['connection_status'] ?? $overall,
        'auth_status' => $check['auth_status'] ?? $overall,
        'api_health_status' => $check['api_health_status'] ?? $overall,
        'sandbox_status' => $check['sandbox_status'] ?? 'not_configured',
        'production_verification_status' => $check['production_verification_status'] ?? 'not_tested',
        'webhook_status' => $check['webhook_status'] ?? (!empty($gw['webhook_secret']) ? 'configured' : 'not_configured'),
        'last_successful_test' => $check['last_successful_test_at'] ?? null,
        'last_failed_test' => $check['last_failed_test_at'] ?? null,
        'api_response_time_ms' => isset($check['api_response_time_ms']) ? (int) $check['api_response_time_ms'] : null,
        'last_error_message' => $check['last_error_message'] ?? null,
        'integration_version' => $check['integration_version'] ?? '1.0.0-phase1',
        'is_sandbox' => (bool) (int) ($gw['is_sandbox'] ?? 1),
        'has_credentials' => (bool) $hasCreds,
        'webhook_url' => '/api/webhooks/payments/'.$provider.'?store_id='.rawurlencode($storeId),
        'supported_features' => [
            'integration_mode' => $stub ? 'stub' : (in_array($provider, ['cod', 'bank_transfer'], true) ? 'manual' : 'live_http'),
        ],
    ];
}

function souq_ih_build_shipping_row(PDO $pdo, string $storeId, string $storeName, string $provider): array
{
    $uiOnly = in_array($provider, ['redbox', 'aymakan', 'jt'], true);
    $cc = null;
    try {
        $st = $pdo->prepare('SELECT * FROM courier_connections WHERE store_id=? AND provider=? LIMIT 1');
        $st->execute([$storeId, $provider]);
        $cc = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (Throwable $e) {
    }
    $check = null;
    try {
        $st = $pdo->prepare('SELECT * FROM integration_health_checks WHERE store_id=? AND category=? AND provider=? LIMIT 1');
        $st->execute([$storeId, 'shipping', $provider]);
        $check = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    } catch (Throwable $e) {
    }

    if ($uiOnly) {
        $overall = 'incomplete_backend';
    } elseif (!$cc) {
        $overall = 'not_configured';
    } else {
        $overall = $check['overall_status'] ?? (($cc['status'] ?? '') === 'connected' ? 'connected' : 'not_configured');
    }

    return [
        'store_id' => $storeId,
        'store_name' => $storeName,
        'category' => 'shipping',
        'provider' => $provider,
        'provider_name' => souq_ih_label('shipping', $provider),
        'overall_status' => $overall,
        'connection_status' => $check['connection_status'] ?? $overall,
        'auth_status' => $check['auth_status'] ?? $overall,
        'api_health_status' => $check['api_health_status'] ?? $overall,
        'sandbox_status' => $check['sandbox_status'] ?? 'not_configured',
        'production_verification_status' => $check['production_verification_status'] ?? 'not_tested',
        'webhook_status' => $check['webhook_status'] ?? 'endpoint_ready',
        'last_successful_test' => $check['last_successful_test_at'] ?? null,
        'last_failed_test' => $check['last_failed_test_at'] ?? null,
        'api_response_time_ms' => isset($check['api_response_time_ms']) ? (int) $check['api_response_time_ms'] : null,
        'last_error_message' => $check['last_error_message'] ?? null,
        'integration_version' => $check['integration_version'] ?? '1.0.0-phase1',
        'is_sandbox' => (bool) (int) ($cc['is_sandbox'] ?? 1),
        'has_credentials' => !empty($cc['api_key']),
        'webhook_url' => '/api/webhooks/couriers/'.$provider.'?store_id='.rawurlencode($storeId),
        'supported_features' => [
            'integration_mode' => $uiOnly ? 'ui_only' : 'live_http',
            'rates' => 'local_zones_methods',
            'cancel' => false,
            'pickup' => false,
        ],
    ];
}

function souq_ih_aggregate(PDO $pdo, ?string $storeFilter = null): array
{
    $stores = [];
    try {
        if ($storeFilter) {
            $st = $pdo->prepare('SELECT id, name FROM stores WHERE id=? LIMIT 1');
            $st->execute([$storeFilter]);
            $stores = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } else {
            $stores = $pdo->query('SELECT id, name FROM stores ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
    } catch (Throwable $e) {
        $stores = [];
    }

    $rows = [];
    foreach ($stores as $s) {
        $sid = (string) $s['id'];
        $name = (string) ($s['name'] ?? $sid);
        foreach (souq_ih_payment_providers() as $p) {
            $rows[] = souq_ih_build_payment_row($pdo, $sid, $name, $p);
        }
        foreach (souq_ih_shipping_providers() as $p) {
            $rows[] = souq_ih_build_shipping_row($pdo, $sid, $name, $p);
        }
    }

    return [
        'data' => $rows,
        'meta' => [
            'total' => count($rows),
            'integration_version' => '1.0.0-phase1',
            'generated_at' => date('c'),
        ],
    ];
}

function souq_ih_run_payment_test(PDO $pdo, string $storeId, string $provider, string $testType): array
{
    $started = microtime(true);
    $provider = strtolower($provider);
    if (in_array($provider, ['stripe', 'paypal', 'hyperpay', 'tap'], true)) {
        $result = [
            'success' => false,
            'message' => "Provider {$provider} incomplete backend — never mark Connected/Paid.",
            'overall_status' => 'incomplete_backend',
        ];
        souq_ih_finish($pdo, $storeId, 'payment', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'payment', 'provider' => $provider, 'test_type' => $testType];
    }

    $st = $pdo->prepare('SELECT * FROM payment_gateways WHERE store_id=? AND provider=? LIMIT 1');
    $st->execute([$storeId, $provider]);
    $gw = $st->fetch(PDO::FETCH_ASSOC);
    if (!$gw) {
        $result = ['success' => false, 'message' => 'Not configured.', 'overall_status' => 'not_configured'];
        souq_ih_finish($pdo, $storeId, 'payment', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'payment', 'provider' => $provider, 'test_type' => $testType];
    }

    $env = !empty($gw['is_sandbox']) ? 'sandbox' : 'production';
    if ($testType === 'webhook') {
        $has = !empty($gw['webhook_secret']) || in_array($provider, ['cod', 'bank_transfer'], true);
        $result = [
            'success' => $has,
            'message' => $has ? 'Webhook secret configured / N/A for manual method.' : 'Webhook secret missing.',
            'overall_status' => $has ? 'connected' : 'requires_attention',
            'webhook_status' => $has ? (in_array($provider, ['cod', 'bank_transfer'], true) ? 'not_applicable' : 'configured') : 'credentials_missing',
            'environment' => $env,
        ];
        souq_ih_finish($pdo, $storeId, 'payment', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'payment', 'provider' => $provider, 'test_type' => $testType];
    }

    if ($testType === 'payment_session') {
        $result = [
            'success' => in_array($provider, ['cod', 'bank_transfer'], true),
            'message' => in_array($provider, ['cod', 'bank_transfer'], true)
                ? 'Manual method session OK (no card charge).'
                : 'Live payment session / charge disabled in Phase 1 health tests.',
            'overall_status' => in_array($provider, ['cod', 'bank_transfer'], true) ? 'connected' : 'not_tested',
            'environment' => $env,
            'not_tested' => !in_array($provider, ['cod', 'bank_transfer'], true),
        ];
        souq_ih_finish($pdo, $storeId, 'payment', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'payment', 'provider' => $provider, 'test_type' => $testType];
    }

    // connection / authentication — real HTTP where possible
    $key = (string) ($gw['secret_key'] ?: $gw['api_key'] ?: '');
    if (in_array($provider, ['cod', 'bank_transfer'], true)) {
        $result = [
            'success' => true,
            'message' => 'Manual payment method ready.',
            'overall_status' => 'connected',
            'environment' => $env,
        ];
    } elseif ($key === '') {
        $result = [
            'success' => false,
            'message' => 'Credentials missing.',
            'overall_status' => 'credentials_missing',
            'environment' => $env,
        ];
    } elseif ($provider === 'moyasar') {
        $resp = souq_ih_http_get('https://api.moyasar.com/v1/payments?limit=1', [
            'Authorization: Basic '.base64_encode($key.':'),
            'Accept: application/json',
        ]);
        $ok = $resp['ok'] && $resp['http'] >= 200 && $resp['http'] < 300;
        $result = [
            'success' => $ok,
            'message' => $ok ? 'Moyasar API authenticated.' : ('Moyasar auth failed HTTP '.$resp['http']),
            'overall_status' => $ok ? ($env === 'sandbox' ? 'sandbox_verified' : 'connected') : 'authentication_failed',
            'environment' => $env,
            'http_status' => $resp['http'],
            'api_endpoint' => 'https://api.moyasar.com/v1/payments',
        ];
    } elseif ($provider === 'tamara') {
        $base = !empty($gw['is_sandbox']) ? 'https://api-sandbox.tamara.co' : 'https://api.tamara.co';
        $resp = souq_ih_http_get($base.'/merchants/me', [
            'Authorization: Bearer '.$key,
            'Accept: application/json',
        ]);
        $ok = $resp['ok'] && $resp['http'] >= 200 && $resp['http'] < 300;
        $result = [
            'success' => $ok,
            'message' => $ok ? 'Tamara API authenticated.' : ('Tamara auth failed HTTP '.$resp['http']),
            'overall_status' => $ok ? ($env === 'sandbox' ? 'sandbox_verified' : 'connected') : 'authentication_failed',
            'environment' => $env,
            'http_status' => $resp['http'],
            'api_endpoint' => $base.'/merchants/me',
        ];
    } elseif ($provider === 'tabby') {
        $resp = souq_ih_http_get('https://api.tabby.ai/api/v2/merchants/profile', [
            'Authorization: Bearer '.$key,
            'Accept: application/json',
        ]);
        $ok = $resp['ok'] && $resp['http'] >= 200 && $resp['http'] < 300;
        $result = [
            'success' => $ok,
            'message' => $ok ? 'Tabby API authenticated.' : ('Tabby auth failed HTTP '.$resp['http']),
            'overall_status' => $ok ? ($env === 'sandbox' ? 'sandbox_verified' : 'connected') : 'authentication_failed',
            'environment' => $env,
            'http_status' => $resp['http'],
            'api_endpoint' => 'https://api.tabby.ai/api/v2/merchants/profile',
        ];
    } else {
        $result = [
            'success' => false,
            'message' => 'Provider probe not wired.',
            'overall_status' => 'requires_attention',
            'environment' => $env,
        ];
    }

    // Persist gateway status honestly
    try {
        $pdo->prepare('UPDATE payment_gateways SET status=?, last_tested_at=? WHERE store_id=? AND provider=?')
            ->execute([!empty($result['success']) ? 'connected' : 'error', date('c'), $storeId, $provider]);
    } catch (Throwable $e) {
    }

    souq_ih_finish($pdo, $storeId, 'payment', $provider, $testType, $started, $result);

    return $result + ['store_id' => $storeId, 'category' => 'payment', 'provider' => $provider, 'test_type' => $testType, 'api_response_time_ms' => (int) round((microtime(true) - $started) * 1000)];
}

function souq_ih_run_shipping_test(PDO $pdo, string $storeId, string $provider, string $testType): array
{
    $started = microtime(true);
    $provider = strtolower($provider);
    if (in_array($provider, ['redbox', 'aymakan', 'jt'], true)) {
        $result = [
            'success' => false,
            'message' => 'UI/method only — no carrier API.',
            'overall_status' => 'incomplete_backend',
        ];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }

    $st = $pdo->prepare('SELECT * FROM courier_connections WHERE store_id=? AND provider=? LIMIT 1');
    $st->execute([$storeId, $provider]);
    $cc = $st->fetch(PDO::FETCH_ASSOC);
    if (!$cc) {
        $result = ['success' => false, 'message' => 'Not configured.', 'overall_status' => 'not_configured'];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }

    $env = !empty($cc['is_sandbox']) ? 'sandbox' : 'production';
    if (in_array($testType, ['shipment_create'], true)) {
        $result = [
            'success' => false,
            'message' => 'Live AWB booking disabled in Phase 1 health tests.',
            'overall_status' => 'not_tested',
            'not_tested' => true,
            'environment' => $env,
        ];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }
    if ($testType === 'rates') {
        $result = [
            'success' => true,
            'message' => 'Checkout rates use local zones/methods (not live carrier quotes).',
            'overall_status' => 'partially_working',
            'environment' => $env,
        ];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }
    if ($testType === 'webhook') {
        $result = [
            'success' => true,
            'message' => 'Courier webhook endpoint ready.',
            'overall_status' => 'connected',
            'webhook_status' => 'endpoint_ready',
            'environment' => $env,
        ];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }
    if (in_array($testType, ['tracking', 'label'], true)) {
        $result = [
            'success' => false,
            'message' => 'No existing AWB/label for non-destructive test — NOT TESTED.',
            'overall_status' => 'not_tested',
            'not_tested' => true,
            'environment' => $env,
        ];
        souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

        return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType];
    }

    // connection — credential presence + honest note (full OAuth probes stay in Laravel; here verify keys exist)
    $has = !empty($cc['api_key']);
    $result = [
        'success' => false,
        'message' => $has
            ? 'Credentials present. Live carrier auth probe requires Laravel service path or provider-specific ping — mark Requires Attention until verified.'
            : 'Courier API key missing.',
        'overall_status' => $has ? 'requires_attention' : 'credentials_missing',
        'environment' => $env,
    ];
    // Try SMSA lightweight track ping
    if ($provider === 'smsa' && $has) {
        $url = 'https://track.smsaexpress.com/SecomRestWebApi/api/getTracking?passkey='.rawurlencode((string) $cc['api_key']).'&awbNo=0000000000';
        $resp = souq_ih_http_get($url);
        $body = strtolower($resp['body']);
        if ($resp['ok'] && $resp['http'] !== 401 && !str_contains($body, 'invalid pass')) {
            $result = [
                'success' => true,
                'message' => 'SMSA PassKey accepted (non-destructive track probe).',
                'overall_status' => $env === 'sandbox' ? 'sandbox_verified' : 'connected',
                'environment' => $env,
                'http_status' => $resp['http'],
                'api_endpoint' => 'smsa getTracking',
            ];
        } else {
            $result = [
                'success' => false,
                'message' => 'SMSA probe failed HTTP '.$resp['http'],
                'overall_status' => 'authentication_failed',
                'environment' => $env,
            ];
        }
    }

    try {
        $pdo->prepare('UPDATE courier_connections SET status=?, is_connected=?, last_tested_at=? WHERE store_id=? AND provider=?')
            ->execute([
                !empty($result['success']) ? 'connected' : 'error',
                !empty($result['success']) ? 1 : 0,
                date('c'),
                $storeId,
                $provider,
            ]);
    } catch (Throwable $e) {
    }

    souq_ih_finish($pdo, $storeId, 'shipping', $provider, $testType, $started, $result);

    return $result + ['store_id' => $storeId, 'category' => 'shipping', 'provider' => $provider, 'test_type' => $testType, 'api_response_time_ms' => (int) round((microtime(true) - $started) * 1000)];
}

function souq_ih_finish(PDO $pdo, string $storeId, string $category, string $provider, string $testType, float $started, array &$result): void
{
    $duration = (int) round((microtime(true) - $started) * 1000);
    $result['duration_ms'] = $duration;
    souq_ih_log($pdo, [
        'store_id' => $storeId,
        'category' => $category,
        'provider' => $provider,
        'test_type' => $testType,
        'environment' => $result['environment'] ?? null,
        'duration_ms' => $duration,
        'http_status' => $result['http_status'] ?? null,
        'api_endpoint' => $result['api_endpoint'] ?? null,
        'success' => !empty($result['success']),
        'error_message' => empty($result['success']) ? ($result['message'] ?? null) : null,
    ]);
    souq_ih_upsert_check($pdo, $storeId, $category, $provider, $result);
}

/**
 * @return bool true if handled
 */
function souq_integration_health_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // Bank transfer proofs (store + storefront)
    if (str_starts_with($uri, '/payments/bank-transfer-proofs') || $uri === '/storefront/payments/bank-transfer-proofs') {
        souq_ih_ensure_tables($pdo);

        if ($uri === '/storefront/payments/bank-transfer-proofs' && $method === 'POST') {
            $sid = trim((string) ($input['store_id'] ?? $storeId));
            $orderId = trim((string) ($input['order_id'] ?? ''));
            if ($sid === '' || $orderId === '') {
                http_response_code(422);
                echo json_encode(['message' => 'store_id and order_id required.']);

                return true;
            }
            // Multipart file may already be in $_FILES
            if (empty($_FILES['proof']['tmp_name'])) {
                http_response_code(422);
                echo json_encode(['message' => 'proof file required.']);

                return true;
            }
            $ext = strtolower(pathinfo((string) $_FILES['proof']['name'], PATHINFO_EXTENSION) ?: 'jpg');
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'pdf'], true)) {
                http_response_code(422);
                echo json_encode(['message' => 'Invalid proof file type.']);

                return true;
            }
            $dir = __DIR__.'/../stores/'.$sid.'/payment-proofs';
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            $fname = 'btp_'.bin2hex(random_bytes(6)).'.'.$ext;
            $path = $dir.'/'.$fname;
            if (!move_uploaded_file((string) $_FILES['proof']['tmp_name'], $path)) {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to store proof.']);

                return true;
            }
            $url = '/stores/'.$sid.'/payment-proofs/'.$fname;
            $id = souq_ih_rid('btp');
            $now = date('c');
            $trail = json_encode([['at' => $now, 'action' => 'uploaded', 'by' => 'customer']], JSON_UNESCAPED_UNICODE);
            $pdo->prepare('INSERT INTO bank_transfer_proofs (id, store_id, order_id, transaction_id, media_path, media_url, status, notes, audit_trail, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
                ->execute([$id, $sid, $orderId, $input['transaction_id'] ?? null, 'stores/'.$sid.'/payment-proofs/'.$fname, $url, 'pending', $input['notes'] ?? null, $trail, $now, $now]);
            http_response_code(201);
            echo json_encode([
                'data' => ['id' => $id, 'store_id' => $sid, 'order_id' => $orderId, 'media_url' => $url, 'status' => 'pending'],
                'payment_status' => 'pending',
                'message' => 'Bank transfer proof uploaded. Awaiting merchant verification.',
            ]);

            return true;
        }

        if ($uri === '/payments/bank-transfer-proofs' && $method === 'GET') {
            if ($storeId === '') {
                http_response_code(422);
                echo json_encode(['message' => 'store_id required.']);

                return true;
            }
            $st = $pdo->prepare('SELECT id, store_id, order_id, transaction_id, media_url, status, reviewed_by, notes, reviewed_at, audit_trail, created_at FROM bank_transfer_proofs WHERE store_id=? ORDER BY created_at DESC LIMIT 200');
            $st->execute([$storeId]);
            $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
            foreach ($rows as &$r) {
                if (is_string($r['audit_trail'] ?? null)) {
                    $r['audit_trail'] = json_decode($r['audit_trail'], true);
                }
            }
            echo json_encode(['data' => $rows, 'store_id' => $storeId, 'meta' => ['total' => count($rows)]]);

            return true;
        }

        if (preg_match('#^/payments/bank-transfer-proofs/([^/]+)/(approve|reject)$#', $uri, $m) && $method === 'POST') {
            if ($storeId === '') {
                http_response_code(422);
                echo json_encode(['message' => 'store_id required.']);

                return true;
            }
            $id = $m[1];
            $decision = $m[2] === 'approve' ? 'approved' : 'rejected';
            $st = $pdo->prepare('SELECT * FROM bank_transfer_proofs WHERE id=? AND store_id=? LIMIT 1');
            $st->execute([$id, $storeId]);
            $proof = $st->fetch(PDO::FETCH_ASSOC);
            if (!$proof) {
                http_response_code(404);
                echo json_encode(['message' => 'Proof not found.']);

                return true;
            }
            if (($proof['status'] ?? '') !== 'pending') {
                http_response_code(422);
                echo json_encode(['message' => 'Already reviewed.', 'data' => $proof]);

                return true;
            }
            $now = date('c');
            $trail = json_decode((string) ($proof['audit_trail'] ?? '[]'), true) ?: [];
            $trail[] = ['at' => $now, 'action' => $decision, 'by' => 'merchant', 'notes' => $input['notes'] ?? null];
            $pdo->prepare('UPDATE bank_transfer_proofs SET status=?, reviewed_by=?, reviewed_at=?, notes=COALESCE(?, notes), audit_trail=?, updated_at=? WHERE id=? AND store_id=?')
                ->execute([$decision, 'merchant', $now, $input['notes'] ?? null, json_encode($trail, JSON_UNESCAPED_UNICODE), $now, $id, $storeId]);
            if ($decision === 'approved') {
                if (!empty($proof['transaction_id'])) {
                    try {
                        $pdo->prepare('UPDATE payment_transactions SET status=? WHERE id=? AND store_id=?')->execute(['paid', $proof['transaction_id'], $storeId]);
                    } catch (Throwable $e) {
                    }
                }
                if (!empty($proof['order_id'])) {
                    try {
                        $pdo->prepare('UPDATE orders SET payment_status=? WHERE id=? AND store_id=?')->execute(['paid', $proof['order_id'], $storeId]);
                    } catch (Throwable $e) {
                    }
                }
            }
            echo json_encode([
                'data' => array_merge($proof, ['status' => $decision, 'reviewed_at' => $now]),
                'message' => $decision === 'approved' ? 'Approved — order marked paid.' : 'Rejected — order remains unpaid.',
            ]);

            return true;
        }

        return false;
    }

    if (!str_starts_with($uri, '/master/integrations/health')) {
        return false;
    }

    souq_ih_ensure_tables($pdo);

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

    if ($uri === '/master/integrations/health' && $method === 'GET') {
        $filter = trim((string) ($_GET['store_id'] ?? ''));
        echo json_encode(souq_ih_aggregate($pdo, $filter !== '' ? $filter : null));

        return true;
    }

    if ($uri === '/master/integrations/health/logs' && $method === 'GET') {
        $q = 'SELECT * FROM integration_health_logs WHERE 1=1';
        $params = [];
        if (!empty($_GET['store_id'])) {
            $q .= ' AND store_id=?';
            $params[] = $_GET['store_id'];
        }
        if (!empty($_GET['provider'])) {
            $q .= ' AND provider=?';
            $params[] = $_GET['provider'];
        }
        if (!empty($_GET['category'])) {
            $q .= ' AND category=?';
            $params[] = $_GET['category'];
        }
        $q .= ' ORDER BY created_at DESC LIMIT 100';
        $st = $pdo->prepare($q);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['data' => $rows, 'meta' => ['total' => count($rows)]]);

        return true;
    }

    if (preg_match('#^/master/integrations/health/([^/]+)$#', $uri, $m) && $method === 'GET' && $m[1] !== 'logs') {
        $sid = $m[1];
        $payload = souq_ih_aggregate($pdo, $sid);
        $payments = array_values(array_filter($payload['data'], static fn ($r) => ($r['category'] ?? '') === 'payment'));
        $shipping = array_values(array_filter($payload['data'], static fn ($r) => ($r['category'] ?? '') === 'shipping'));
        echo json_encode(['store_id' => $sid, 'payments' => $payments, 'shipping' => $shipping, 'meta' => $payload['meta']]);

        return true;
    }

    if ($uri === '/master/integrations/health/test' && $method === 'POST') {
        $sid = trim((string) ($input['store_id'] ?? ''));
        $category = strtolower(trim((string) ($input['category'] ?? '')));
        $provider = strtolower(trim((string) ($input['provider'] ?? '')));
        $testType = strtolower(trim((string) ($input['test_type'] ?? 'connection')));
        if ($sid === '' || !in_array($category, ['payment', 'shipping'], true) || $provider === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id, category, provider required.']);

            return true;
        }
        $result = $category === 'payment'
            ? souq_ih_run_payment_test($pdo, $sid, $provider, $testType)
            : souq_ih_run_shipping_test($pdo, $sid, $provider, $testType);
        http_response_code(!empty($result['success']) ? 200 : 422);
        echo json_encode($result);

        return true;
    }

    if ($uri === '/master/integrations/health/audit' && $method === 'POST') {
        $sid = trim((string) ($input['store_id'] ?? ''));
        if ($sid === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id required.']);

            return true;
        }
        $results = [];
        foreach (souq_ih_payment_providers() as $p) {
            $results[] = souq_ih_run_payment_test($pdo, $sid, $p, 'connection');
        }
        foreach (souq_ih_shipping_providers() as $p) {
            $results[] = souq_ih_run_shipping_test($pdo, $sid, $p, 'connection');
        }
        $passed = count(array_filter($results, static fn ($r) => !empty($r['success'])));
        echo json_encode([
            'store_id' => $sid,
            'results' => $results,
            'summary' => ['total' => count($results), 'passed' => $passed, 'failed' => count($results) - $passed],
            'integration_version' => '1.0.0-phase1',
        ]);

        return true;
    }

    return false;
}
