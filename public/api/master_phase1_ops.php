<?php

/**
 * SOUQ PLUS Phase 1 — remaining Master ops on Hostinger gateway (real MySQL).
 * Support tickets · platform notifications · services/points · sessions · login attempts.
 */

function souq_ensure_phase1_ops_tables(PDO $pdo): void
{
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (!function_exists('souq_table_exists')) {
            return;
        }
        if (!souq_table_exists($pdo, 'support_tickets')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `support_tickets` (
                    `id` VARCHAR(64) NOT NULL,
                    `subject` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `requester_name` VARCHAR(191) NULL,
                    `requester_email` VARCHAR(191) NULL,
                    `store_id` VARCHAR(64) NULL,
                    `category` VARCHAR(64) NOT NULL DEFAULT 'general',
                    `priority` VARCHAR(32) NOT NULL DEFAULT 'medium',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'open',
                    `assignee` VARCHAR(191) NULL,
                    `closure_reason` VARCHAR(500) NULL,
                    `created_by` VARCHAR(64) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `support_tickets_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'support_ticket_replies')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `support_ticket_replies` (
                    `id` VARCHAR(64) NOT NULL,
                    `ticket_id` VARCHAR(64) NOT NULL,
                    `body` TEXT NOT NULL,
                    `author` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `support_ticket_replies_ticket_idx` (`ticket_id`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'platform_notifications')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_notifications` (
                    `id` VARCHAR(64) NOT NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `description` TEXT NULL,
                    `category` VARCHAR(64) NOT NULL DEFAULT 'system',
                    `severity` VARCHAR(32) NOT NULL DEFAULT 'Informational',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'New',
                    `source` VARCHAR(64) NULL,
                    `source_ref` VARCHAR(128) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `platform_notifications_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'platform_services')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_services` (
                    `id` VARCHAR(64) NOT NULL,
                    `name` VARCHAR(191) NOT NULL,
                    `name_ar` VARCHAR(191) NULL,
                    `description` TEXT NULL,
                    `category` VARCHAR(64) NOT NULL DEFAULT 'general',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
                    `point_cost` INT NOT NULL DEFAULT 0,
                    `eligible_plans` JSON NULL,
                    `daily_limit` INT NULL,
                    `monthly_limit` INT NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'platform_point_transactions')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_point_transactions` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `service_id` VARCHAR(64) NULL,
                    `type` VARCHAR(32) NOT NULL,
                    `points` INT NOT NULL,
                    `reason` VARCHAR(500) NOT NULL,
                    `reference` VARCHAR(128) NULL,
                    `created_by` VARCHAR(64) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `platform_point_tx_store_idx` (`store_id`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'master_sessions')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `master_sessions` (
                    `id` VARCHAR(64) NOT NULL,
                    `token_hash` VARCHAR(128) NOT NULL,
                    `email` VARCHAR(191) NOT NULL,
                    `ip_address` VARCHAR(64) NULL,
                    `user_agent` VARCHAR(500) NULL,
                    `revoked_at` TIMESTAMP NULL DEFAULT NULL,
                    `last_seen_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `master_sessions_token_hash_unique` (`token_hash`),
                    KEY `master_sessions_email_idx` (`email`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
        if (!souq_table_exists($pdo, 'master_login_attempts')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `master_login_attempts` (
                    `id` VARCHAR(64) NOT NULL,
                    `email` VARCHAR(191) NOT NULL,
                    `success` TINYINT(1) NOT NULL DEFAULT 0,
                    `ip_address` VARCHAR(64) NULL,
                    `user_agent` VARCHAR(500) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `master_login_attempts_email_idx` (`email`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }
    } catch (Throwable) {
        /* degrade safely */
    }
}

function souq_master_extract_bearer(): ?string
{
    $auth = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    if ($auth === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strtolower((string) $k) === 'authorization') {
                    $auth = trim((string) $v);
                    break;
                }
            }
        }
    }
    if (!preg_match('/^Bearer\s+(\S+)/i', $auth, $m)) {
        return null;
    }
    $token = trim($m[1]);
    if ($token === '' || str_starts_with($token, 'mock-')) {
        return null;
    }

    return $token;
}

function souq_master_session_register(PDO $pdo, string $token, string $email): void
{
    souq_ensure_phase1_ops_tables($pdo);
    if (!souq_table_exists($pdo, 'master_sessions')) {
        return;
    }
    try {
        $hash = hash('sha256', $token);
        $id = 'msess-' . bin2hex(random_bytes(8));
        $ip = substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
        $ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO master_sessions (id, token_hash, email, ip_address, user_agent, last_seen_at, created_at)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([$id, $hash, strtolower(trim($email)), $ip !== '' ? $ip : null, $ua !== '' ? $ua : null, $now, $now]);
    } catch (Throwable) {
        /* ignore */
    }
}

function souq_master_login_attempt(PDO $pdo, string $email, bool $success): void
{
    souq_ensure_phase1_ops_tables($pdo);
    if (!souq_table_exists($pdo, 'master_login_attempts')) {
        return;
    }
    try {
        $id = 'mla-' . bin2hex(random_bytes(8));
        $ip = substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
        $ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);
        $pdo->prepare(
            'INSERT INTO master_login_attempts (id, email, success, ip_address, user_agent, created_at)
             VALUES (?,?,?,?,?,?)'
        )->execute([
            $id,
            strtolower(trim($email)),
            $success ? 1 : 0,
            $ip !== '' ? $ip : null,
            $ua !== '' ? $ua : null,
            date('Y-m-d H:i:s'),
        ]);
    } catch (Throwable) {
        /* ignore */
    }
}

/** Stronger bearer check: token present + not revoked (when sessions table exists). */
function souq_require_master_bearer_ops(PDO $pdo): bool
{
    $token = souq_master_extract_bearer();
    if ($token === null) {
        http_response_code(401);
        echo json_encode(['message' => 'Master SuperAdmin session required.']);
        return false;
    }
    souq_ensure_phase1_ops_tables($pdo);
    if (souq_table_exists($pdo, 'master_sessions')) {
        try {
            $hash = hash('sha256', $token);
            $st = $pdo->prepare('SELECT id, revoked_at FROM master_sessions WHERE token_hash = ? LIMIT 1');
            $st->execute([$hash]);
            $row = $st->fetch(PDO::FETCH_ASSOC);
            if ($row && !empty($row['revoked_at'])) {
                http_response_code(401);
                echo json_encode(['message' => 'Session terminated.']);
                return false;
            }
            // Legacy tokens issued before session table may not exist — allow if no row.
            if ($row) {
                $pdo->prepare('UPDATE master_sessions SET last_seen_at = ? WHERE id = ?')
                    ->execute([date('Y-m-d H:i:s'), $row['id']]);
            }
        } catch (Throwable) {
            /* allow soft fail-open only for DB errors */
        }
    }

    return true;
}

function souq_notify_platform(PDO $pdo, string $title, string $desc, string $category, string $severity, ?string $source = null, ?string $ref = null): void
{
    if (!souq_table_exists($pdo, 'platform_notifications')) {
        return;
    }
    try {
        $id = 'pn-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO platform_notifications (id, title, description, category, severity, status, source, source_ref, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $title,
            $desc,
            $category,
            $severity,
            'New',
            $source,
            $ref,
            date('Y-m-d H:i:s'),
        ]);
    } catch (Throwable) {
        /* ignore */
    }
}

/**
 * @return bool true if handled
 */
function souq_phase1_ops_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    souq_ensure_phase1_ops_tables($pdo);
    if (function_exists('souq_ensure_phase1_tables')) {
        souq_ensure_phase1_tables($pdo);
    }
    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));

    $needMaster = static function () use ($portal, $pdo): bool {
        if ($portal !== 'master') {
            http_response_code(403);
            echo json_encode(['message' => 'Master portal required.']);
            return false;
        }
        if (!souq_require_master_bearer_ops($pdo)) {
            return false;
        }

        return true;
    };

    // ── Platform dashboard KPIs (all stores · single query — scales to 100+ tenants) ──
    if ($uri === '/master/platform-overview' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $range = strtolower(trim((string) ($_GET['range'] ?? 'month')));
        if (!in_array($range, ['today', 'yesterday', 'week', 'month', 'year', 'all'], true)) {
            $range = 'month';
        }
        $isMysql = function_exists('souq_driver_is_mysql')
            ? souq_driver_is_mysql($pdo)
            : ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql');

        $end = new DateTimeImmutable('now');
        $end = $end->setTime(23, 59, 59);
        $start = (new DateTimeImmutable('today'))->setTime(0, 0, 0);
        if ($range === 'yesterday') {
            $start = $start->modify('-1 day');
            $end = $start->setTime(23, 59, 59);
        } elseif ($range === 'week') {
            $start = $start->modify('-6 days');
        } elseif ($range === 'month') {
            $start = $start->modify('-29 days');
        } elseif ($range === 'year') {
            $start = $start->modify('-1 year');
        } elseif ($range === 'all') {
            $start = null;
        }
        $startSql = $start ? $start->format('Y-m-d H:i:s') : null;
        $endSql = $end->format('Y-m-d H:i:s');

        $scalar = static function (PDO $pdo, string $sql, array $params = []): int {
            try {
                $st = $pdo->prepare($sql);
                $st->execute($params);
                $v = $st->fetchColumn();

                return (int) ($v ?? 0);
            } catch (Throwable) {
                return 0;
            }
        };
        $floatScalar = static function (PDO $pdo, string $sql, array $params = []): float {
            try {
                $st = $pdo->prepare($sql);
                $st->execute($params);
                $v = $st->fetchColumn();

                return (float) ($v ?? 0);
            } catch (Throwable) {
                return 0.0;
            }
        };

        $ordersDateWhere = '';
        $ordersParams = [];
        if ($startSql !== null) {
            $ordersDateWhere = ' AND created_at >= ? AND created_at <= ?';
            $ordersParams = [$startSql, $endSql];
        }

        $totals = [
            'products' => $scalar($pdo, 'SELECT COUNT(*) FROM products'),
            'customers' => $scalar($pdo, 'SELECT COUNT(*) FROM customers'),
            'orders' => $scalar($pdo, 'SELECT COUNT(*) FROM orders WHERE 1=1' . $ordersDateWhere, $ordersParams),
            'pending_orders' => $scalar(
                $pdo,
                "SELECT COUNT(*) FROM orders WHERE LOWER(COALESCE(status, '')) = 'pending'" . $ordersDateWhere,
                $ordersParams
            ),
            'active_coupons' => $scalar(
                $pdo,
                $isMysql
                    ? 'SELECT COUNT(*) FROM coupons WHERE is_active = 1'
                    : 'SELECT COUNT(*) FROM coupons WHERE is_active = 1 OR is_active = \'1\''
            ),
            'revenue' => $floatScalar(
                $pdo,
                "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE LOWER(COALESCE(status, '')) != 'cancelled'" . $ordersDateWhere,
                $ordersParams
            ),
            'sales' => $floatScalar(
                $pdo,
                "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE LOWER(COALESCE(status, '')) IN ('completed', 'processing', 'paid')" . $ordersDateWhere,
                $ordersParams
            ),
            'visitors' => 0,
        ];

        try {
            $vSql = "SELECT
                COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN CONCAT(store_id, ':', session_key) END) AS sessions,
                SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS orphans
             FROM analytics_events
             WHERE event_name = 'page_view'";
            $vParams = [];
            if ($startSql !== null) {
                $vSql .= ' AND created_at >= ? AND created_at <= ?';
                $vParams = [$startSql, $endSql];
            }
            $st = $pdo->prepare($vSql);
            $st->execute($vParams);
            $vr = $st->fetch(PDO::FETCH_ASSOC) ?: [];
            $totals['visitors'] = (int) ($vr['sessions'] ?? 0) + (int) ($vr['orphans'] ?? 0);
        } catch (Throwable) {
            $totals['visitors'] = 0;
        }

        $seriesDays = $range === 'week' ? 7 : ($range === 'year' ? 12 : 7);
        if ($range === 'today' || $range === 'yesterday') {
            $seriesDays = 1;
        } elseif ($range === 'month') {
            $seriesDays = 7;
        } elseif ($range === 'all') {
            $seriesDays = 7;
        }

        $bucketExpr = $isMysql ? 'DATE(created_at)' : "DATE(created_at)";
        $seriesStart = $startSql;
        if ($seriesStart === null) {
            $seriesStart = (new DateTimeImmutable('today'))->modify('-' . ($seriesDays - 1) . ' days')->format('Y-m-d 00:00:00');
        }

        $series = ['orders' => [], 'revenue' => [], 'customers' => [], 'products' => []];
        try {
            $oSt = $pdo->prepare(
                "SELECT {$bucketExpr} AS d, COUNT(*) AS c, COALESCE(SUM(CASE WHEN LOWER(COALESCE(status, '')) != 'cancelled' THEN total_amount ELSE 0 END), 0) AS r
                 FROM orders WHERE created_at >= ? AND created_at <= ?
                 GROUP BY d ORDER BY d ASC"
            );
            $oSt->execute([$seriesStart, $endSql]);
            while ($row = $oSt->fetch(PDO::FETCH_ASSOC)) {
                $label = (string) ($row['d'] ?? '');
                $series['orders'][] = ['label' => $label, 'value' => (int) ($row['c'] ?? 0)];
                $series['revenue'][] = ['label' => $label, 'value' => round((float) ($row['r'] ?? 0), 2)];
            }
        } catch (Throwable) {
            /* empty series */
        }
        try {
            $cSt = $pdo->prepare(
                "SELECT {$bucketExpr} AS d, COUNT(*) AS c FROM customers WHERE created_at >= ? AND created_at <= ? GROUP BY d ORDER BY d ASC"
            );
            $cSt->execute([$seriesStart, $endSql]);
            while ($row = $cSt->fetch(PDO::FETCH_ASSOC)) {
                $series['customers'][] = [
                    'label' => (string) ($row['d'] ?? ''),
                    'value' => (int) ($row['c'] ?? 0),
                ];
            }
        } catch (Throwable) {
            /* empty */
        }
        try {
            $productBucket = "DATE(COALESCE(created_at, updated_at))";
            $productDateCol = 'COALESCE(created_at, updated_at)';
            $pSt = $pdo->prepare(
                "SELECT {$productBucket} AS d, COUNT(*) AS c FROM products WHERE {$productDateCol} >= ? AND {$productDateCol} <= ? GROUP BY d ORDER BY d ASC"
            );
            $pSt->execute([$seriesStart, $endSql]);
            while ($row = $pSt->fetch(PDO::FETCH_ASSOC)) {
                $series['products'][] = [
                    'label' => (string) ($row['d'] ?? ''),
                    'value' => (int) ($row['c'] ?? 0),
                ];
            }
        } catch (Throwable) {
            /* empty */
        }

        $visitsByWeekday = [];
        $visitsGrowth = null;
        try {
            $lookback = $isMysql ? "INTERVAL 7 DAY" : "-7 days";
            $prevLookback = $isMysql ? "INTERVAL 14 DAY" : "-14 days";
            $curSql = $isMysql
                ? "SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN CONCAT(store_id, ':', session_key) END)
                     + SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS v
                   FROM analytics_events WHERE event_name = 'page_view' AND created_at >= (NOW() - {$lookback})"
                : "SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN store_id || ':' || session_key END)
                     + SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS v
                   FROM analytics_events WHERE event_name = 'page_view' AND created_at >= datetime('now', '-7 days')";
            $st = $pdo->query($curSql);
            $curV = (int) ($st ? $st->fetchColumn() : 0);
            $prevSql = $isMysql
                ? "SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN CONCAT(store_id, ':', session_key) END)
                     + SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS v
                   FROM analytics_events WHERE event_name = 'page_view'
                     AND created_at >= (NOW() - {$prevLookback}) AND created_at < (NOW() - {$lookback})"
                : "SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN store_id || ':' || session_key END)
                     + SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS v
                   FROM analytics_events WHERE event_name = 'page_view'
                     AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')";
            $st2 = $pdo->query($prevSql);
            $prevV = (int) ($st2 ? $st2->fetchColumn() : 0);
            if ($prevV > 0) {
                $visitsGrowth = (int) round((($curV - $prevV) / $prevV) * 100);
            } elseif ($curV > 0) {
                $visitsGrowth = 100;
            } else {
                $visitsGrowth = 0;
            }

            $dowSql = $isMysql
                ? "SELECT DAYOFWEEK(created_at) AS dow, COUNT(*) AS c FROM analytics_events
                   WHERE event_name = 'page_view' AND created_at >= (NOW() - INTERVAL 7 DAY) GROUP BY dow"
                : "SELECT CAST(strftime('%w', created_at) AS INTEGER) AS dow, COUNT(*) AS c FROM analytics_events
                   WHERE event_name = 'page_view' AND created_at >= datetime('now', '-7 days') GROUP BY dow";
            $dq = $pdo->query($dowSql);
            $counts = [];
            $dowTotal = 0;
            if ($dq) {
                while ($r = $dq->fetch(PDO::FETCH_ASSOC)) {
                    $dow = (int) ($r['dow'] ?? 0);
                    $c = (int) ($r['c'] ?? 0);
                    $counts[$dow] = $c;
                    $dowTotal += $c;
                }
            }
            $labels = [
                1 => ['dayEn' => 'Sun', 'dayAr' => 'الأحد'],
                2 => ['dayEn' => 'Mon', 'dayAr' => 'الاثنين'],
                3 => ['dayEn' => 'Tue', 'dayAr' => 'الثلاثاء'],
                4 => ['dayEn' => 'Wed', 'dayAr' => 'الأربعاء'],
                5 => ['dayEn' => 'Thu', 'dayAr' => 'الخميس'],
                6 => ['dayEn' => 'Fri', 'dayAr' => 'الجمعة'],
                7 => ['dayEn' => 'Sat', 'dayAr' => 'السبت'],
            ];
            if (!$isMysql) {
                $labelsSqlite = [
                    0 => ['dayEn' => 'Sun', 'dayAr' => 'الأحد'],
                    1 => ['dayEn' => 'Mon', 'dayAr' => 'الاثنين'],
                    2 => ['dayEn' => 'Tue', 'dayAr' => 'الثلاثاء'],
                    3 => ['dayEn' => 'Wed', 'dayAr' => 'الأربعاء'],
                    4 => ['dayEn' => 'Thu', 'dayAr' => 'الخميس'],
                    5 => ['dayEn' => 'Fri', 'dayAr' => 'الجمعة'],
                    6 => ['dayEn' => 'Sat', 'dayAr' => 'السبت'],
                ];
                $labels = $labelsSqlite;
            }
            $order = $isMysql ? [7, 1, 2, 3, 4, 5, 6] : [6, 0, 1, 2, 3, 4, 5];
            foreach ($order as $dow) {
                $c = (int) ($counts[$dow] ?? 0);
                $pct = $dowTotal > 0 ? (int) round(($c / $dowTotal) * 100) : 0;
                $visitsByWeekday[] = [
                    'dayEn' => $labels[$dow]['dayEn'] ?? (string) $dow,
                    'dayAr' => $labels[$dow]['dayAr'] ?? (string) $dow,
                    'percentage' => $pct,
                ];
            }
        } catch (Throwable) {
            $visitsGrowth = null;
        }

        echo json_encode([
            'data' => [
                'totals' => $totals,
                'series' => $series,
                'visits_by_weekday' => $visitsByWeekday,
                'visits_growth' => $visitsGrowth,
            ],
            'meta' => [
                'range' => $range,
                'source' => 'mysql_aggregate',
                'last_refresh' => date('c'),
            ],
        ], JSON_UNESCAPED_UNICODE);

        return true;
    }

    // ── Support tickets ──
    if ($uri === '/master/support/tickets' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $status = trim((string) ($_GET['status'] ?? ''));
        $sql = 'SELECT * FROM support_tickets';
        $params = [];
        if ($status !== '') {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $open = 0;
        foreach ($rows as $r) {
            if (in_array(($r['status'] ?? ''), ['open', 'in_progress', 'new'], true)) {
                $open++;
            }
        }
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'open' => $open,
                'last_refresh' => date('c'),
                'source' => 'support_tickets',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/support/tickets' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $subject = trim((string) ($input['subject'] ?? ''));
        $description = trim((string) ($input['description'] ?? ''));
        if ($subject === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Subject is required.']);
            return true;
        }
        $id = 'tkt-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO support_tickets (id, subject, description, requester_name, requester_email, store_id, category, priority, status, assignee, created_by, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $subject,
            $description !== '' ? $description : null,
            trim((string) ($input['requester_name'] ?? '')) ?: null,
            trim((string) ($input['requester_email'] ?? '')) ?: null,
            trim((string) ($input['store_id'] ?? '')) ?: null,
            trim((string) ($input['category'] ?? 'general')) ?: 'general',
            trim((string) ($input['priority'] ?? 'medium')) ?: 'medium',
            'open',
            trim((string) ($input['assignee'] ?? '')) ?: null,
            'master',
            $now,
            $now,
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, $input['store_id'] ?? null, 'support_ticket.created', 'support_ticket', $id, ['subject' => $subject]);
        }
        souq_notify_platform($pdo, 'New support ticket', $subject, 'support', 'High', 'support', $id);
        $st = $pdo->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/support/tickets/([^/]+)$#', $uri, $m) && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $st = $pdo->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $st->execute([$id]);
        $ticket = $st->fetch(PDO::FETCH_ASSOC);
        if (!$ticket) {
            http_response_code(404);
            echo json_encode(['message' => 'Ticket not found.']);
            return true;
        }
        $rs = $pdo->prepare('SELECT * FROM support_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC');
        $rs->execute([$id]);
        echo json_encode([
            'data' => $ticket,
            'replies' => $rs->fetchAll(PDO::FETCH_ASSOC) ?: [],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/support/tickets/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $st = $pdo->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $st->execute([$id]);
        $ticket = $st->fetch(PDO::FETCH_ASSOC);
        if (!$ticket) {
            http_response_code(404);
            echo json_encode(['message' => 'Ticket not found.']);
            return true;
        }
        $status = array_key_exists('status', $input) ? trim((string) $input['status']) : (string) $ticket['status'];
        $allowed = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];
        if (!in_array($status, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid status.']);
            return true;
        }
        $closure = trim((string) ($input['closure_reason'] ?? $ticket['closure_reason'] ?? ''));
        if (in_array($status, ['closed', 'resolved'], true) && $closure === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Closure reason is required.']);
            return true;
        }
        $assignee = array_key_exists('assignee', $input) ? trim((string) $input['assignee']) : ($ticket['assignee'] ?? null);
        $priority = array_key_exists('priority', $input) ? trim((string) $input['priority']) : ($ticket['priority'] ?? 'medium');
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'UPDATE support_tickets SET status = ?, assignee = ?, priority = ?, closure_reason = ?, updated_at = ? WHERE id = ?'
        )->execute([$status, $assignee ?: null, $priority, $closure !== '' ? $closure : null, $now, $id]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, $ticket['store_id'] ?? null, 'support_ticket.updated', 'support_ticket', $id, [
                'status' => $status,
                'reason' => $closure !== '' ? $closure : null,
            ]);
        }
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/support/tickets/([^/]+)/replies$#', $uri, $m) && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $ticketId = $m[1];
        $body = trim((string) ($input['body'] ?? ''));
        if ($body === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Reply body is required.']);
            return true;
        }
        $st = $pdo->prepare('SELECT id FROM support_tickets WHERE id = ?');
        $st->execute([$ticketId]);
        if (!$st->fetchColumn()) {
            http_response_code(404);
            echo json_encode(['message' => 'Ticket not found.']);
            return true;
        }
        $id = 'trep-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO support_ticket_replies (id, ticket_id, body, author, created_at) VALUES (?,?,?,?,?)'
        )->execute([$id, $ticketId, $body, trim((string) ($input['author'] ?? 'SuperAdmin')) ?: 'SuperAdmin', date('Y-m-d H:i:s')]);
        $pdo->prepare('UPDATE support_tickets SET updated_at = ?, status = CASE WHEN status = \'closed\' THEN status ELSE \'in_progress\' END WHERE id = ?')
            ->execute([date('Y-m-d H:i:s'), $ticketId]);
        echo json_encode(['data' => ['id' => $id, 'ticket_id' => $ticketId, 'body' => $body]], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Platform notifications ──
    if ($uri === '/master/notifications' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        // Sync live signals into table (idempotent by source_ref)
        foreach (['suspended' => ['High', 'stores'], 'pending' => ['Medium', 'onboarding']] as $stName => $meta) {
            $st = $pdo->prepare('SELECT id, name FROM stores WHERE status = ? LIMIT 50');
            $st->execute([$stName]);
            while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
                $ref = $stName . '-' . $row['id'];
                $chk = $pdo->prepare('SELECT id FROM platform_notifications WHERE source_ref = ? LIMIT 1');
                $chk->execute([$ref]);
                if (!$chk->fetchColumn()) {
                    souq_notify_platform(
                        $pdo,
                        $stName === 'suspended' ? 'Store suspended' : 'Store pending review',
                        (string) ($row['name'] ?? $row['id']),
                        $meta[1],
                        $meta[0],
                        'stores',
                        $ref
                    );
                }
            }
        }
        $status = trim((string) ($_GET['status'] ?? ''));
        $sql = 'SELECT * FROM platform_notifications';
        $params = [];
        if ($status !== '') {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $q = $pdo->prepare($sql);
        $q->execute($params);
        $rows = $q->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $newCount = 0;
        foreach ($rows as $r) {
            if (($r['status'] ?? '') === 'New') {
                $newCount++;
            }
        }
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'new' => $newCount, 'source' => 'platform_notifications', 'last_refresh' => date('c')],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/notifications/mark' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $ids = $input['ids'] ?? [];
        $status = trim((string) ($input['status'] ?? 'Acknowledged'));
        if (!in_array($status, ['New', 'Acknowledged', 'In Progress', 'Resolved', 'Archived'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid status.']);
            return true;
        }
        if (!is_array($ids) || count($ids) === 0) {
            if (!empty($input['all'])) {
                $pdo->exec("UPDATE platform_notifications SET status = " . $pdo->quote($status) . ", updated_at = NOW() WHERE status = 'New'");
                echo json_encode(['ok' => true, 'updated' => 'all_new']);
                return true;
            }
            http_response_code(422);
            echo json_encode(['message' => 'ids required.']);
            return true;
        }
        $n = 0;
        foreach ($ids as $id) {
            $id = trim((string) $id);
            if ($id === '') {
                continue;
            }
            $pdo->prepare('UPDATE platform_notifications SET status = ?, updated_at = ? WHERE id = ?')
                ->execute([$status, date('Y-m-d H:i:s'), $id]);
            $n++;
        }
        echo json_encode(['ok' => true, 'updated' => $n]);
        return true;
    }

    // ── Services & points ──
    if ($uri === '/master/services' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query('SELECT * FROM platform_services ORDER BY created_at DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['data' => $rows, 'meta' => ['source' => 'platform_services', 'total' => count($rows)]], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/services' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $name = trim((string) ($input['name'] ?? ''));
        if ($name === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Service name is required.']);
            return true;
        }
        $id = 'psvc-' . bin2hex(random_bytes(6));
        $now = date('Y-m-d H:i:s');
        $plans = $input['eligible_plans'] ?? ['pro', 'premium', 'custom'];
        $pdo->prepare(
            'INSERT INTO platform_services (id, name, name_ar, description, category, status, point_cost, eligible_plans, daily_limit, monthly_limit, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $name,
            trim((string) ($input['name_ar'] ?? '')) ?: null,
            trim((string) ($input['description'] ?? '')) ?: null,
            trim((string) ($input['category'] ?? 'general')) ?: 'general',
            trim((string) ($input['status'] ?? 'active')) ?: 'active',
            max(0, (int) ($input['point_cost'] ?? 0)),
            json_encode(is_array($plans) ? $plans : [], JSON_UNESCAPED_UNICODE),
            isset($input['daily_limit']) ? (int) $input['daily_limit'] : null,
            isset($input['monthly_limit']) ? (int) $input['monthly_limit'] : null,
            $now,
            $now,
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'platform_service.created', 'platform_service', $id, ['name' => $name]);
        }
        $st = $pdo->prepare('SELECT * FROM platform_services WHERE id = ?');
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/services/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $st = $pdo->prepare('SELECT * FROM platform_services WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Service not found.']);
            return true;
        }
        $status = array_key_exists('status', $input) ? trim((string) $input['status']) : $row['status'];
        $cost = array_key_exists('point_cost', $input) ? max(0, (int) $input['point_cost']) : (int) $row['point_cost'];
        $name = array_key_exists('name', $input) ? trim((string) $input['name']) : $row['name'];
        $nameAr = array_key_exists('name_ar', $input) ? trim((string) $input['name_ar']) : ($row['name_ar'] ?? null);
        $nameAr = $nameAr === '' ? null : $nameAr;
        $category = array_key_exists('category', $input) ? trim((string) $input['category']) : ($row['category'] ?? 'general');
        $description = array_key_exists('description', $input) ? trim((string) $input['description']) : ($row['description'] ?? null);
        $description = $description === '' ? null : $description;
        $dailyLimit = array_key_exists('daily_limit', $input)
            ? ($input['daily_limit'] === null || $input['daily_limit'] === '' ? null : (int) $input['daily_limit'])
            : ($row['daily_limit'] ?? null);
        $monthlyLimit = array_key_exists('monthly_limit', $input)
            ? ($input['monthly_limit'] === null || $input['monthly_limit'] === '' ? null : (int) $input['monthly_limit'])
            : ($row['monthly_limit'] ?? null);
        $pdo->prepare(
            'UPDATE platform_services SET name = ?, name_ar = ?, description = ?, category = ?, status = ?, point_cost = ?, daily_limit = ?, monthly_limit = ?, updated_at = ? WHERE id = ?'
        )->execute([$name, $nameAr, $description, $category, $status, $cost, $dailyLimit, $monthlyLimit, date('Y-m-d H:i:s'), $id]);
        $st->execute([$id]);
        echo json_encode(['data' => $st->fetch(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/points/transactions' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query('SELECT * FROM platform_point_transactions ORDER BY created_at DESC LIMIT 100')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['data' => $rows, 'meta' => ['source' => 'platform_point_transactions', 'total' => count($rows), 'note' => 'Service usage units — not cash']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/points/adjust' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $reason = trim((string) ($input['reason'] ?? ''));
        $type = trim((string) ($input['type'] ?? 'grant'));
        $points = (int) ($input['points'] ?? 0);
        $storeIdAdj = trim((string) ($input['store_id'] ?? ''));
        if ($reason === '' || $points === 0 || !in_array($type, ['grant', 'deduction', 'reversal'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'type, non-zero points, and reason are required.']);
            return true;
        }
        if ($type === 'deduction' && $points > 0) {
            $points = -abs($points);
        } elseif ($type === 'grant') {
            $points = abs($points);
        }
        $ref = trim((string) ($input['reference'] ?? ''));
        if ($ref !== '') {
            $dup = $pdo->prepare('SELECT id FROM platform_point_transactions WHERE reference = ? LIMIT 1');
            $dup->execute([$ref]);
            if ($dup->fetchColumn()) {
                http_response_code(409);
                echo json_encode(['message' => 'Duplicate reference — idempotent reject.']);
                return true;
            }
        }
        $id = 'ppt-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO platform_point_transactions (id, store_id, service_id, type, points, reason, reference, created_by, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $storeIdAdj !== '' ? $storeIdAdj : null,
            trim((string) ($input['service_id'] ?? '')) ?: null,
            $type,
            $points,
            $reason,
            $ref !== '' ? $ref : null,
            'master',
            date('Y-m-d H:i:s'),
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, $storeIdAdj !== '' ? $storeIdAdj : null, 'platform_points.' . $type, 'platform_point_tx', $id, [
                'points' => $points,
                'reason' => $reason,
            ]);
        }
        echo json_encode(['data' => ['id' => $id, 'type' => $type, 'points' => $points]], JSON_UNESCAPED_UNICODE);
        return true;
    }

    // ── Security sessions / login attempts ──
    if ($uri === '/master/security/sessions' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = [];
        if (souq_table_exists($pdo, 'master_sessions')) {
            $rows = $pdo->query(
                'SELECT id, email, ip_address, user_agent, revoked_at, last_seen_at, created_at
                 FROM master_sessions ORDER BY created_at DESC LIMIT 50'
            )->fetchAll(PDO::FETCH_ASSOC) ?: [];
            foreach ($rows as &$r) {
                unset($r['token_hash']);
                $r['active'] = empty($r['revoked_at']);
            }
            unset($r);
        }
        echo json_encode(['data' => $rows, 'meta' => ['source' => 'master_sessions']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/security/sessions/revoke' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $sessionId = trim((string) ($input['session_id'] ?? ''));
        $all = !empty($input['all']);
        $now = date('Y-m-d H:i:s');
        if ($all) {
            $pdo->exec("UPDATE master_sessions SET revoked_at = " . $pdo->quote($now) . " WHERE revoked_at IS NULL");
            if (function_exists('souq_audit_write')) {
                souq_audit_write($pdo, null, 'master_session.revoke_all', 'master_session', null, null);
            }
            echo json_encode(['ok' => true, 'revoked' => 'all']);
            return true;
        }
        if ($sessionId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'session_id or all required.']);
            return true;
        }
        $pdo->prepare('UPDATE master_sessions SET revoked_at = ? WHERE id = ?')->execute([$now, $sessionId]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'master_session.revoke', 'master_session', $sessionId, null);
        }
        echo json_encode(['ok' => true, 'revoked' => $sessionId]);
        return true;
    }

    if ($uri === '/master/security/login-attempts' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = [];
        if (souq_table_exists($pdo, 'master_login_attempts')) {
            $rows = $pdo->query(
                'SELECT id, email, success, ip_address, created_at FROM master_login_attempts ORDER BY created_at DESC LIMIT 50'
            )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }
        echo json_encode(['data' => $rows, 'meta' => ['source' => 'master_login_attempts']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}
