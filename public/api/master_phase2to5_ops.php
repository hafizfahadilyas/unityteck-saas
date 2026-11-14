<?php

/**
 * SOUQ PLUS Central Admin Phase 2–5 ops (real MySQL, Master portal only).
 * P2 roles/admins · P3 verification · P4 CS CMS · P5 jobs/policies/errors.
 * MFA + payment ledger stay deferred (honest empty / unavailable).
 */

function souq_ensure_phase2to5_tables(PDO $pdo): void
{
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (!function_exists('souq_table_exists')) {
            return;
        }

        if (!souq_table_exists($pdo, 'platform_admin_users')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_admin_users` (
                    `id` VARCHAR(64) NOT NULL,
                    `email` VARCHAR(191) NOT NULL,
                    `name` VARCHAR(191) NOT NULL,
                    `role` VARCHAR(64) NOT NULL DEFAULT 'read_only_auditor',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
                    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `platform_admin_users_email_unique` (`email`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_role_permissions')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_role_permissions` (
                    `role` VARCHAR(64) NOT NULL,
                    `permission` VARCHAR(64) NOT NULL,
                    `allowed` TINYINT(1) NOT NULL DEFAULT 0,
                    PRIMARY KEY (`role`, `permission`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'account_verification_queue')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `account_verification_queue` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `merchant_email` VARCHAR(191) NULL,
                    `merchant_name` VARCHAR(191) NULL,
                    `doc_type` VARCHAR(64) NOT NULL DEFAULT 'commercial_register',
                    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
                    `notes` TEXT NULL,
                    `reason` VARCHAR(500) NULL,
                    `reviewed_by` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `account_verification_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        foreach ([
            'support_complaints' => 'complaint',
            'support_surveys' => 'survey',
            'support_announcements' => 'announcement',
            'support_incidents' => 'incident',
        ] as $table => $kind) {
            if (!souq_table_exists($pdo, $table)) {
                $pdo->exec(
                    "CREATE TABLE IF NOT EXISTS `{$table}` (
                        `id` VARCHAR(64) NOT NULL,
                        `title` VARCHAR(255) NOT NULL,
                        `body` TEXT NULL,
                        `store_id` VARCHAR(64) NULL,
                        `status` VARCHAR(32) NOT NULL DEFAULT 'open',
                        `priority` VARCHAR(32) NOT NULL DEFAULT 'medium',
                        `created_by` VARCHAR(64) NULL,
                        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `updated_at` TIMESTAMP NULL DEFAULT NULL,
                        PRIMARY KEY (`id`),
                        KEY `{$table}_status_idx` (`status`, `created_at`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );
            }
        }

        if (!souq_table_exists($pdo, 'help_center_articles')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `help_center_articles` (
                    `id` VARCHAR(64) NOT NULL,
                    `title_en` VARCHAR(255) NOT NULL,
                    `title_ar` VARCHAR(255) NULL,
                    `body_en` TEXT NULL,
                    `body_ar` TEXT NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
                    `created_by` VARCHAR(64) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `help_center_articles_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_policies')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_policies` (
                    `id` VARCHAR(64) NOT NULL,
                    `policy_key` VARCHAR(64) NOT NULL,
                    `title_en` VARCHAR(255) NOT NULL,
                    `title_ar` VARCHAR(255) NULL,
                    `body_en` TEXT NULL,
                    `body_ar` TEXT NULL,
                    `updated_by` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `platform_policies_key_unique` (`policy_key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_job_runs')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_job_runs` (
                    `id` VARCHAR(64) NOT NULL,
                    `job_name` VARCHAR(128) NOT NULL,
                    `last_run_at` TIMESTAMP NULL DEFAULT NULL,
                    `next_run_at` TIMESTAMP NULL DEFAULT NULL,
                    `result` VARCHAR(32) NOT NULL DEFAULT 'unknown',
                    `duration_ms` INT NULL,
                    `retry_count` INT NOT NULL DEFAULT 0,
                    `failure_reason` VARCHAR(500) NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `platform_job_runs_name_unique` (`job_name`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_error_logs')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_error_logs` (
                    `id` VARCHAR(64) NOT NULL,
                    `module` VARCHAR(64) NOT NULL DEFAULT 'system',
                    `severity` VARCHAR(32) NOT NULL DEFAULT 'error',
                    `message` VARCHAR(500) NOT NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'open',
                    `ref` VARCHAR(128) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `platform_error_logs_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        souq_phase2_seed_roles_and_admins($pdo);
        souq_phase5_seed_jobs_and_policies($pdo);
    } catch (Throwable) {
        /* degrade safely */
    }
}

function souq_phase2_seed_roles_and_admins(PDO $pdo): void
{
    if (!souq_table_exists($pdo, 'platform_role_permissions')) {
        return;
    }
    $count = (int) $pdo->query('SELECT COUNT(*) FROM platform_role_permissions')->fetchColumn();
    if ($count === 0) {
        $roles = [
            'super_admin',
            'operations_manager',
            'support_agent',
            'finance_officer',
            'technical_administrator',
            'read_only_auditor',
        ];
        $perms = ['view', 'create', 'edit', 'approve', 'suspend', 'export', 'manage_settings'];
        $ins = $pdo->prepare(
            'INSERT INTO platform_role_permissions (role, permission, allowed) VALUES (?,?,?)'
        );
        foreach ($roles as $role) {
            foreach ($perms as $perm) {
                $allowed = 0;
                if ($role === 'super_admin') {
                    $allowed = 1;
                } elseif ($role === 'read_only_auditor') {
                    $allowed = $perm === 'view' ? 1 : 0;
                } elseif ($role === 'support_agent') {
                    $allowed = in_array($perm, ['view', 'create', 'edit'], true) ? 1 : 0;
                } elseif ($role === 'operations_manager') {
                    $allowed = in_array($perm, ['view', 'create', 'edit', 'approve', 'suspend', 'export'], true) ? 1 : 0;
                } elseif ($role === 'finance_officer') {
                    $allowed = in_array($perm, ['view', 'export'], true) ? 1 : 0;
                } elseif ($role === 'technical_administrator') {
                    $allowed = in_array($perm, ['view', 'edit', 'manage_settings'], true) ? 1 : 0;
                }
                $ins->execute([$role, $perm, $allowed]);
            }
        }
    }

    if (!souq_table_exists($pdo, 'platform_admin_users')) {
        return;
    }
    $admins = (int) $pdo->query('SELECT COUNT(*) FROM platform_admin_users')->fetchColumn();
    if ($admins === 0) {
        $email = 'master@unityteck.com';
        $id = 'padm-' . substr(md5($email), 0, 12);
        $pdo->prepare(
            'INSERT INTO platform_admin_users (id, email, name, role, status, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $email,
            'Souq Platform SuperAdmin',
            'super_admin',
            'active',
            date('Y-m-d H:i:s'),
            date('Y-m-d H:i:s'),
        ]);
    }
}

function souq_phase5_seed_jobs_and_policies(PDO $pdo): void
{
    if (souq_table_exists($pdo, 'platform_job_runs')) {
        $n = (int) $pdo->query('SELECT COUNT(*) FROM platform_job_runs')->fetchColumn();
        if ($n === 0) {
            $jobs = [
                ['job-social-publish', 'social:publish-due', 'unknown'],
                ['job-sub-renewal', 'subscription:renewal-check', 'unknown'],
                ['job-notifications', 'platform:notifications-dispatch', 'unknown'],
                ['job-backup', 'platform:backup-schedule', 'unknown'],
            ];
            $ins = $pdo->prepare(
                'INSERT INTO platform_job_runs (id, job_name, result, retry_count, updated_at) VALUES (?,?,?,?,?)'
            );
            $now = date('Y-m-d H:i:s');
            foreach ($jobs as $j) {
                $ins->execute([$j[0], $j[1], $j[2], 0, $now]);
            }
        }
    }

    if (souq_table_exists($pdo, 'platform_policies')) {
        $n = (int) $pdo->query('SELECT COUNT(*) FROM platform_policies')->fetchColumn();
        if ($n === 0) {
            $rows = [
                ['pol-terms', 'terms', 'Terms of Service', 'شروط الخدمة', '', ''],
                ['pol-privacy', 'privacy', 'Privacy Policy', 'سياسة الخصوصية', '', ''],
            ];
            $ins = $pdo->prepare(
                'INSERT INTO platform_policies (id, policy_key, title_en, title_ar, body_en, body_ar, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?,?)'
            );
            $now = date('Y-m-d H:i:s');
            foreach ($rows as $r) {
                $ins->execute([$r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $now, $now]);
            }
        }
    }
}

/**
 * @return bool true if handled
 */
function souq_phase2to5_ops_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!function_exists('souq_require_master_bearer_ops')) {
        require_once __DIR__ . '/master_phase1_ops.php';
    }
    souq_ensure_phase2to5_tables($pdo);

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

    // ── Phase 2: Admins ──
    if ($uri === '/master/security/admins' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT id, email, name, role, status, last_login_at, created_at, updated_at
             FROM platform_admin_users ORDER BY created_at DESC LIMIT 100'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'source' => 'platform_admin_users',
                'mfa' => 'deferred',
                'note' => 'MFA not wired — no fake enrollment',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/security/admins' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $name = trim((string) ($input['name'] ?? ''));
        $role = trim((string) ($input['role'] ?? 'read_only_auditor'));
        if ($email === '' || !str_contains($email, '@') || $name === '') {
            http_response_code(422);
            echo json_encode(['message' => 'name and valid email required.']);
            return true;
        }
        $allowedRoles = [
            'super_admin',
            'operations_manager',
            'support_agent',
            'finance_officer',
            'technical_administrator',
            'read_only_auditor',
        ];
        if (!in_array($role, $allowedRoles, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid role.']);
            return true;
        }
        $id = 'padm-' . bin2hex(random_bytes(6));
        $now = date('Y-m-d H:i:s');
        try {
            $pdo->prepare(
                'INSERT INTO platform_admin_users (id, email, name, role, status, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?)'
            )->execute([$id, $email, $name, $role, 'active', $now, $now]);
        } catch (Throwable $e) {
            http_response_code(422);
            echo json_encode(['message' => 'Could not create admin (duplicate email?).']);
            return true;
        }
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'master_admin.create', 'platform_admin_users', $id, [
                'email' => $email,
                'role' => $role,
            ]);
        }
        echo json_encode(['data' => ['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role, 'status' => 'active']]);
        return true;
    }

    if (preg_match('#^/master/security/admins/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $fields = [];
        $params = [];
        foreach (['name', 'role', 'status'] as $k) {
            if (array_key_exists($k, $input)) {
                $fields[] = "`{$k}` = ?";
                $params[] = trim((string) $input[$k]);
            }
        }
        if ($fields === []) {
            http_response_code(422);
            echo json_encode(['message' => 'No fields to update.']);
            return true;
        }
        $fields[] = '`updated_at` = ?';
        $params[] = date('Y-m-d H:i:s');
        $params[] = $id;
        $pdo->prepare('UPDATE platform_admin_users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'master_admin.update', 'platform_admin_users', $id, $input);
        }
        $row = $pdo->prepare('SELECT * FROM platform_admin_users WHERE id = ?');
        $row->execute([$id]);
        echo json_encode(['data' => $row->fetch(PDO::FETCH_ASSOC) ?: ['id' => $id]]);
        return true;
    }

    // ── Phase 2: Role matrix ──
    if ($uri === '/master/security/roles' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT role, permission, allowed FROM platform_role_permissions ORDER BY role, permission'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $matrix = [];
        foreach ($rows as $r) {
            $role = (string) $r['role'];
            if (!isset($matrix[$role])) {
                $matrix[$role] = [];
            }
            $matrix[$role][(string) $r['permission']] = (int) $r['allowed'] === 1;
        }
        echo json_encode([
            'data' => $matrix,
            'meta' => [
                'roles' => array_keys($matrix),
                'permissions' => ['view', 'create', 'edit', 'approve', 'suspend', 'export', 'manage_settings'],
                'source' => 'platform_role_permissions',
                'mfa' => 'deferred',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/security/roles/([^/]+)/permissions$#', $uri, $m) && $method === 'PUT') {
        if (!$needMaster()) {
            return true;
        }
        $role = $m[1];
        $perms = $input['permissions'] ?? null;
        if (!is_array($perms)) {
            http_response_code(422);
            echo json_encode(['message' => 'permissions object required.']);
            return true;
        }
        if ($role === 'super_admin') {
            http_response_code(422);
            echo json_encode(['message' => 'super_admin permissions are locked.']);
            return true;
        }
        $upd = $pdo->prepare(
            'INSERT INTO platform_role_permissions (role, permission, allowed) VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)'
        );
        foreach ($perms as $perm => $allowed) {
            $upd->execute([$role, (string) $perm, $allowed ? 1 : 0]);
        }
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'master_role.permissions', 'platform_role_permissions', $role, $perms);
        }
        echo json_encode(['ok' => true, 'role' => $role]);
        return true;
    }

    // ── Phase 3: Verification queue ──
    if ($uri === '/master/accounts/verification' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $status = trim((string) ($_GET['status'] ?? ''));
        $sql = 'SELECT * FROM account_verification_queue';
        $params = [];
        if ($status !== '') {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'source' => 'account_verification_queue'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/accounts/verification' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $id = 'ver-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO account_verification_queue
             (id, store_id, merchant_email, merchant_name, doc_type, status, notes, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            trim((string) ($input['store_id'] ?? '')) ?: null,
            strtolower(trim((string) ($input['merchant_email'] ?? ''))) ?: null,
            trim((string) ($input['merchant_name'] ?? '')) ?: null,
            trim((string) ($input['doc_type'] ?? 'commercial_register')) ?: 'commercial_register',
            'pending',
            trim((string) ($input['notes'] ?? '')) ?: null,
            $now,
            $now,
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, $input['store_id'] ?? null, 'verification.create', 'account_verification_queue', $id, null);
        }
        echo json_encode(['data' => ['id' => $id, 'status' => 'pending']]);
        return true;
    }

    if (preg_match('#^/master/accounts/verification/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $status = trim((string) ($input['status'] ?? ''));
        $reason = trim((string) ($input['reason'] ?? ''));
        $allowed = ['pending', 'under_review', 'approved', 'rejected', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid status.']);
            return true;
        }
        if (in_array($status, ['rejected', 'cancelled'], true) && $reason === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Reason required for reject/cancel.']);
            return true;
        }
        $pdo->prepare(
            'UPDATE account_verification_queue SET status = ?, reason = ?, reviewed_by = ?, updated_at = ? WHERE id = ?'
        )->execute([$status, $reason !== '' ? $reason : null, 'master', date('Y-m-d H:i:s'), $id]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'verification.' . $status, 'account_verification_queue', $id, [
                'reason' => $reason,
            ]);
        }
        echo json_encode(['ok' => true, 'id' => $id, 'status' => $status]);
        return true;
    }

    // ── Phase 4: CS CMS generic list/create/patch ──
    $csMap = [
        'complaints' => 'support_complaints',
        'surveys' => 'support_surveys',
        'announcements' => 'support_announcements',
        'incidents' => 'support_incidents',
    ];
    foreach ($csMap as $slug => $table) {
        if ($uri === "/master/support/{$slug}" && $method === 'GET') {
            if (!$needMaster()) {
                return true;
            }
            $rows = $pdo->query(
                "SELECT * FROM `{$table}` ORDER BY created_at DESC LIMIT 100"
            )->fetchAll(PDO::FETCH_ASSOC) ?: [];
            echo json_encode([
                'data' => $rows,
                'meta' => ['total' => count($rows), 'source' => $table],
            ], JSON_UNESCAPED_UNICODE);
            return true;
        }
        if ($uri === "/master/support/{$slug}" && $method === 'POST') {
            if (!$needMaster()) {
                return true;
            }
            $title = trim((string) ($input['title'] ?? ''));
            if ($title === '') {
                http_response_code(422);
                echo json_encode(['message' => 'Title is required.']);
                return true;
            }
            $id = substr($slug, 0, 3) . '-' . bin2hex(random_bytes(8));
            $now = date('Y-m-d H:i:s');
            $pdo->prepare(
                "INSERT INTO `{$table}` (id, title, body, store_id, status, priority, created_by, created_at, updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?)"
            )->execute([
                $id,
                $title,
                trim((string) ($input['body'] ?? '')) ?: null,
                trim((string) ($input['store_id'] ?? '')) ?: null,
                trim((string) ($input['status'] ?? 'open')) ?: 'open',
                trim((string) ($input['priority'] ?? 'medium')) ?: 'medium',
                'master',
                $now,
                $now,
            ]);
            echo json_encode(['data' => ['id' => $id, 'title' => $title]]);
            return true;
        }
        if (preg_match('#^/master/support/' . preg_quote($slug, '#') . '/([^/]+)$#', $uri, $mm) && $method === 'PATCH') {
            if (!$needMaster()) {
                return true;
            }
            $id = $mm[1];
            $status = trim((string) ($input['status'] ?? ''));
            if ($status === '') {
                http_response_code(422);
                echo json_encode(['message' => 'status required.']);
                return true;
            }
            $pdo->prepare(
                "UPDATE `{$table}` SET status = ?, updated_at = ? WHERE id = ?"
            )->execute([$status, date('Y-m-d H:i:s'), $id]);
            echo json_encode(['ok' => true, 'id' => $id, 'status' => $status]);
            return true;
        }
    }

    if ($uri === '/master/support/help' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM help_center_articles ORDER BY created_at DESC LIMIT 100'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'source' => 'help_center_articles'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/support/help' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $titleEn = trim((string) ($input['title_en'] ?? $input['title'] ?? ''));
        $titleAr = trim((string) ($input['title_ar'] ?? ''));
        if ($titleEn === '' && $titleAr === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Title required.']);
            return true;
        }
        $id = 'help-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO help_center_articles
             (id, title_en, title_ar, body_en, body_ar, status, created_by, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $titleEn !== '' ? $titleEn : $titleAr,
            $titleAr !== '' ? $titleAr : null,
            trim((string) ($input['body_en'] ?? $input['body'] ?? '')) ?: null,
            trim((string) ($input['body_ar'] ?? '')) ?: null,
            trim((string) ($input['status'] ?? 'draft')) ?: 'draft',
            'master',
            $now,
            $now,
        ]);
        echo json_encode(['data' => ['id' => $id]]);
        return true;
    }

    // ── Phase 5: Policies / jobs / errors / payments unavailable ──
    if ($uri === '/master/settings/policies' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query('SELECT * FROM platform_policies ORDER BY policy_key')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['data' => $rows, 'meta' => ['source' => 'platform_policies']], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/settings/policies' && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $key = trim((string) ($input['policy_key'] ?? ''));
        if ($key === '') {
            http_response_code(422);
            echo json_encode(['message' => 'policy_key required.']);
            return true;
        }
        $pdo->prepare(
            'UPDATE platform_policies SET title_en = COALESCE(?, title_en), title_ar = COALESCE(?, title_ar),
             body_en = COALESCE(?, body_en), body_ar = COALESCE(?, body_ar), updated_by = ?, updated_at = ?
             WHERE policy_key = ?'
        )->execute([
            array_key_exists('title_en', $input) ? trim((string) $input['title_en']) : null,
            array_key_exists('title_ar', $input) ? trim((string) $input['title_ar']) : null,
            array_key_exists('body_en', $input) ? (string) $input['body_en'] : null,
            array_key_exists('body_ar', $input) ? (string) $input['body_ar'] : null,
            'master',
            date('Y-m-d H:i:s'),
            $key,
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'platform_policy.update', 'platform_policies', $key, null);
        }
        echo json_encode(['ok' => true, 'policy_key' => $key]);
        return true;
    }

    if ($uri === '/master/ops/jobs' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query('SELECT * FROM platform_job_runs ORDER BY job_name')->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'source' => 'platform_job_runs',
                'note' => 'result=unknown until a real scheduler writes a run row',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/ops/errors' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM platform_error_logs ORDER BY created_at DESC LIMIT 100'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'source' => 'platform_error_logs'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/payments/ledger' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        echo json_encode([
            'data' => [],
            'meta' => [
                'available' => false,
                'source' => 'none',
                'reason' => 'No trusted payment gateway ledger connected',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}
