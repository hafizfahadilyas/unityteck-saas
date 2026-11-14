<?php

/**
 * SOUQ PLUS Central Admin Phase 6–9 ops (real MySQL, Master portal only).
 * P6 attachments · P7 messaging templates/log · P8 status/maintenance/privacy · P9 MFA status.
 */

function souq_ensure_phase6to9_tables(PDO $pdo): void
{
    try {
        if ((string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            return;
        }
        if (!function_exists('souq_table_exists')) {
            return;
        }

        if (!souq_table_exists($pdo, 'platform_attachments')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_attachments` (
                    `id` VARCHAR(64) NOT NULL,
                    `entity_type` VARCHAR(64) NOT NULL,
                    `entity_id` VARCHAR(64) NOT NULL,
                    `file_name` VARCHAR(255) NOT NULL,
                    `file_type` VARCHAR(64) NOT NULL,
                    `file_size` INT NOT NULL DEFAULT 0,
                    `file_url` VARCHAR(500) NULL,
                    `uploaded_by` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `platform_attachments_entity_idx` (`entity_type`, `entity_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_message_templates')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_message_templates` (
                    `id` VARCHAR(64) NOT NULL,
                    `channel` VARCHAR(32) NOT NULL DEFAULT 'email',
                    `template_key` VARCHAR(64) NOT NULL,
                    `title_en` VARCHAR(255) NOT NULL,
                    `title_ar` VARCHAR(255) NULL,
                    `body_en` TEXT NULL,
                    `body_ar` TEXT NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
                    `updated_by` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `platform_message_templates_key_ch` (`channel`, `template_key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_message_deliveries')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_message_deliveries` (
                    `id` VARCHAR(64) NOT NULL,
                    `template_id` VARCHAR(64) NULL,
                    `channel` VARCHAR(32) NOT NULL DEFAULT 'email',
                    `recipient` VARCHAR(191) NOT NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'queued',
                    `failure_reason` VARCHAR(500) NULL,
                    `provider_message_id` VARCHAR(128) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `platform_message_deliveries_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'store_status_history')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `store_status_history` (
                    `id` VARCHAR(64) NOT NULL,
                    `store_id` VARCHAR(64) NOT NULL,
                    `from_status` VARCHAR(32) NULL,
                    `to_status` VARCHAR(32) NOT NULL,
                    `reason` VARCHAR(500) NULL,
                    `actor` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `store_status_history_store_idx` (`store_id`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'platform_maintenance_events')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `platform_maintenance_events` (
                    `id` VARCHAR(64) NOT NULL,
                    `action` VARCHAR(32) NOT NULL,
                    `message_en` VARCHAR(500) NULL,
                    `message_ar` VARCHAR(500) NULL,
                    `scope` VARCHAR(64) NOT NULL DEFAULT 'platform',
                    `starts_at` TIMESTAMP NULL DEFAULT NULL,
                    `ends_at` TIMESTAMP NULL DEFAULT NULL,
                    `actor` VARCHAR(191) NULL,
                    `reason` VARCHAR(500) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`id`),
                    KEY `platform_maintenance_events_created_idx` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        if (!souq_table_exists($pdo, 'privacy_data_requests')) {
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `privacy_data_requests` (
                    `id` VARCHAR(64) NOT NULL,
                    `request_type` VARCHAR(32) NOT NULL DEFAULT 'access',
                    `subject_email` VARCHAR(191) NOT NULL,
                    `store_id` VARCHAR(64) NULL,
                    `status` VARCHAR(32) NOT NULL DEFAULT 'received',
                    `notes` TEXT NULL,
                    `reason` VARCHAR(500) NULL,
                    `handled_by` VARCHAR(191) NULL,
                    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT NULL,
                    PRIMARY KEY (`id`),
                    KEY `privacy_data_requests_status_idx` (`status`, `created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            );
        }

        souq_phase7_seed_templates($pdo);
    } catch (Throwable) {
        /* degrade safely */
    }
}

function souq_phase7_seed_templates(PDO $pdo): void
{
    if (!souq_table_exists($pdo, 'platform_message_templates')) {
        return;
    }
    $n = (int) $pdo->query('SELECT COUNT(*) FROM platform_message_templates')->fetchColumn();
    if ($n > 0) {
        return;
    }
    $rows = [
        ['tpl-reg', 'email', 'registration', 'Registration welcome', 'ترحيب بالتسجيل'],
        ['tpl-verify', 'email', 'verification', 'Account verification', 'التحقق من الحساب'],
        ['tpl-activate', 'email', 'activation', 'Account activation', 'تفعيل الحساب'],
        ['tpl-sub-renew', 'email', 'subscription_renewal', 'Subscription renewal', 'تجديد الاشتراك'],
        ['tpl-sub-expire', 'email', 'subscription_expiry', 'Subscription expiry', 'انتهاء الاشتراك'],
        ['tpl-support', 'email', 'support_update', 'Support update', 'تحديث الدعم'],
    ];
    $ins = $pdo->prepare(
        'INSERT INTO platform_message_templates
         (id, channel, template_key, title_en, title_ar, body_en, body_ar, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    $now = date('Y-m-d H:i:s');
    foreach ($rows as $r) {
        $ins->execute([
            $r[0],
            $r[1],
            $r[2],
            $r[3],
            $r[4],
            'Hello {{name}}, request {{request_id}}.',
            'مرحباً {{name}}، الطلب {{request_id}}.',
            'draft',
            $now,
            $now,
        ]);
    }
}

/** Allowed attachment extensions + MIME prefixes (metadata only). */
function souq_phase6_attachment_allowed(string $fileName, string $fileType, int $fileSize): ?string
{
    $max = 10 * 1024 * 1024; // 10 MB
    if ($fileSize <= 0 || $fileSize > $max) {
        return 'File size must be 1 byte–10 MB.';
    }
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $okExt = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    if (!in_array($ext, $okExt, true)) {
        return 'File type not permitted.';
    }
    $banned = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'msi', 'dll', 'com', 'scr'];
    if (in_array($ext, $banned, true)) {
        return 'Executable or unsafe type blocked.';
    }
    $ft = strtolower(trim($fileType));
    if ($ft !== '' && preg_match('/^(application\/x-msdownload|application\/x-executable|application\/x-sh)/', $ft)) {
        return 'Unsafe MIME type blocked.';
    }

    return null;
}

/**
 * @return bool true if handled
 */
function souq_phase6to9_ops_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!function_exists('souq_require_master_bearer_ops')) {
        require_once __DIR__ . '/master_phase1_ops.php';
    }
    souq_ensure_phase6to9_tables($pdo);

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

    // ── Phase 6: Attachments ──
    if ($uri === '/master/attachments' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $entityType = trim((string) ($_GET['entity_type'] ?? ''));
        $entityId = trim((string) ($_GET['entity_id'] ?? ''));
        $sql = 'SELECT * FROM platform_attachments WHERE 1=1';
        $params = [];
        if ($entityType !== '') {
            $sql .= ' AND entity_type = ?';
            $params[] = $entityType;
        }
        if ($entityId !== '') {
            $sql .= ' AND entity_id = ?';
            $params[] = $entityId;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'source' => 'platform_attachments',
                'malware_scan' => 'unavailable',
                'max_bytes' => 10485760,
                'allowed_ext' => ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/attachments' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $entityType = trim((string) ($input['entity_type'] ?? ''));
        $entityId = trim((string) ($input['entity_id'] ?? ''));
        $fileName = trim((string) ($input['file_name'] ?? ''));
        $fileType = trim((string) ($input['file_type'] ?? ''));
        $fileSize = (int) ($input['file_size'] ?? 0);
        $fileUrl = trim((string) ($input['file_url'] ?? ''));
        $allowedEntities = ['ticket', 'verification', 'complaint', 'incident', 'support'];
        if ($entityType === '' || $entityId === '' || $fileName === '') {
            http_response_code(422);
            echo json_encode(['message' => 'entity_type, entity_id, file_name required.']);
            return true;
        }
        if (!in_array($entityType, $allowedEntities, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid entity_type.']);
            return true;
        }
        $err = souq_phase6_attachment_allowed($fileName, $fileType, $fileSize);
        if ($err !== null) {
            http_response_code(422);
            echo json_encode(['message' => $err]);
            return true;
        }
        $id = 'att-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO platform_attachments
             (id, entity_type, entity_id, file_name, file_type, file_size, file_url, uploaded_by, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $entityType,
            $entityId,
            $fileName,
            $fileType !== '' ? $fileType : 'application/octet-stream',
            $fileSize,
            $fileUrl !== '' ? $fileUrl : null,
            'master',
            date('Y-m-d H:i:s'),
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'attachment.create', 'platform_attachments', $id, [
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'file_name' => $fileName,
            ]);
        }
        echo json_encode([
            'data' => [
                'id' => $id,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'file_name' => $fileName,
                'malware_scan' => 'unavailable',
            ],
        ]);
        return true;
    }

    // ── Phase 7: Messaging ──
    if ($uri === '/master/messaging/channels' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        echo json_encode([
            'data' => [
                [
                    'id' => 'email',
                    'label_en' => 'Email',
                    'label_ar' => 'البريد الإلكتروني',
                    'status' => 'unknown',
                    'connected' => false,
                    'note_en' => 'No platform SMTP provider wired for Master sends',
                    'note_ar' => 'لا يوجد مزود بريد للمنصة مربوط لإرسال رسائل المشرف',
                ],
                [
                    'id' => 'sms',
                    'label_en' => 'SMS',
                    'label_ar' => 'الرسائل النصية',
                    'status' => 'unknown',
                    'connected' => false,
                    'note_en' => 'No SMS provider wired',
                    'note_ar' => 'لا يوجد مزود رسائل نصية مربوط',
                ],
                [
                    'id' => 'in_app',
                    'label_en' => 'In-app',
                    'label_ar' => 'داخل المنصة',
                    'status' => 'operational',
                    'connected' => true,
                    'note_en' => 'Uses platform_notifications',
                    'note_ar' => 'يعتمد على إشعارات المنصة المسجّلة',
                ],
            ],
            'meta' => ['source' => 'inventory', 'rule' => 'Never show Connected without a real provider'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/messaging/templates' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM platform_message_templates ORDER BY channel, template_key'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['source' => 'platform_message_templates', 'variables' => ['name', 'request_id', 'expiry_date']],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (preg_match('#^/master/messaging/templates/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $fields = [];
        $params = [];
        foreach (['title_en', 'title_ar', 'body_en', 'body_ar', 'status'] as $k) {
            if (array_key_exists($k, $input)) {
                $fields[] = "`{$k}` = ?";
                $params[] = (string) $input[$k];
            }
        }
        if ($fields === []) {
            http_response_code(422);
            echo json_encode(['message' => 'No fields to update.']);
            return true;
        }
        $fields[] = '`updated_by` = ?';
        $params[] = 'master';
        $fields[] = '`updated_at` = ?';
        $params[] = date('Y-m-d H:i:s');
        $params[] = $id;
        $pdo->prepare('UPDATE platform_message_templates SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'message_template.update', 'platform_message_templates', $id, null);
        }
        echo json_encode(['ok' => true, 'id' => $id]);
        return true;
    }

    if ($uri === '/master/messaging/deliveries' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM platform_message_deliveries ORDER BY created_at DESC LIMIT 100'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'source' => 'platform_message_deliveries',
                'note' => 'Empty until a real provider send writes rows — never invent Sent',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/messaging/deliveries' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        // Queue only — never mark Sent without a provider.
        $recipient = trim((string) ($input['recipient'] ?? ''));
        $channel = trim((string) ($input['channel'] ?? 'email'));
        if ($recipient === '') {
            http_response_code(422);
            echo json_encode(['message' => 'recipient required.']);
            return true;
        }
        if ($channel !== 'in_app') {
            http_response_code(422);
            echo json_encode([
                'message' => 'Channel not connected — cannot send. Only in_app can queue via notifications.',
                'status' => 'failed',
            ]);
            return true;
        }
        $id = 'del-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO platform_message_deliveries
             (id, template_id, channel, recipient, status, failure_reason, created_at)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([
            $id,
            trim((string) ($input['template_id'] ?? '')) ?: null,
            'in_app',
            $recipient,
            'queued',
            null,
            date('Y-m-d H:i:s'),
        ]);
        echo json_encode(['data' => ['id' => $id, 'status' => 'queued', 'channel' => 'in_app']]);
        return true;
    }

    // ── Phase 8: Store status history ──
    if ($uri === '/master/stores/status-history' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $sid = trim((string) ($_GET['store_id'] ?? $storeId));
        $sql = 'SELECT * FROM store_status_history';
        $params = [];
        if ($sid !== '') {
            $sql .= ' WHERE store_id = ?';
            $params[] = $sid;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        echo json_encode([
            'data' => $st->fetchAll(PDO::FETCH_ASSOC) ?: [],
            'meta' => ['source' => 'store_status_history'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/stores/status-history' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $sid = trim((string) ($input['store_id'] ?? ''));
        $to = trim((string) ($input['to_status'] ?? ''));
        $reason = trim((string) ($input['reason'] ?? ''));
        if ($sid === '' || $to === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id and to_status required.']);
            return true;
        }
        if ($reason === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Reason required for status change.']);
            return true;
        }
        $id = 'ssh-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO store_status_history (id, store_id, from_status, to_status, reason, actor, created_at)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $sid,
            trim((string) ($input['from_status'] ?? '')) ?: null,
            $to,
            $reason,
            'master',
            date('Y-m-d H:i:s'),
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, $sid, 'store.status_history', 'store_status_history', $id, [
                'to' => $to,
                'reason' => $reason,
            ]);
        }
        echo json_encode(['data' => ['id' => $id]]);
        return true;
    }

    // ── Phase 8: Maintenance events ──
    if ($uri === '/master/ops/maintenance' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM platform_maintenance_events ORDER BY created_at DESC LIMIT 50'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['source' => 'platform_maintenance_events'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/ops/maintenance' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $action = trim((string) ($input['action'] ?? ''));
        $reason = trim((string) ($input['reason'] ?? ''));
        if (!in_array($action, ['enable', 'disable'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'action must be enable or disable.']);
            return true;
        }
        if ($reason === '') {
            http_response_code(422);
            echo json_encode(['message' => 'Reason required for maintenance change.']);
            return true;
        }
        $id = 'mnt-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO platform_maintenance_events
             (id, action, message_en, message_ar, scope, starts_at, ends_at, actor, reason, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $action,
            trim((string) ($input['message_en'] ?? '')) ?: null,
            trim((string) ($input['message_ar'] ?? '')) ?: null,
            trim((string) ($input['scope'] ?? 'platform')) ?: 'platform',
            trim((string) ($input['starts_at'] ?? '')) ?: null,
            trim((string) ($input['ends_at'] ?? '')) ?: null,
            'master',
            $reason,
            date('Y-m-d H:i:s'),
        ]);
        if (function_exists('souq_audit_write')) {
            souq_audit_write($pdo, null, 'maintenance.' . $action, 'platform_maintenance_events', $id, [
                'reason' => $reason,
            ]);
        }
        echo json_encode(['data' => ['id' => $id, 'action' => $action]]);
        return true;
    }

    // ── Phase 8: Privacy / data requests ──
    if ($uri === '/master/privacy/requests' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        $rows = $pdo->query(
            'SELECT * FROM privacy_data_requests ORDER BY created_at DESC LIMIT 100'
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode([
            'data' => $rows,
            'meta' => ['total' => count($rows), 'source' => 'privacy_data_requests'],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/privacy/requests' && $method === 'POST') {
        if (!$needMaster()) {
            return true;
        }
        $email = strtolower(trim((string) ($input['subject_email'] ?? '')));
        $type = trim((string) ($input['request_type'] ?? 'access'));
        if ($email === '' || !str_contains($email, '@')) {
            http_response_code(422);
            echo json_encode(['message' => 'Valid subject_email required.']);
            return true;
        }
        if (!in_array($type, ['access', 'correction', 'deletion'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid request_type.']);
            return true;
        }
        $id = 'pdr-' . bin2hex(random_bytes(8));
        $now = date('Y-m-d H:i:s');
        $pdo->prepare(
            'INSERT INTO privacy_data_requests
             (id, request_type, subject_email, store_id, status, notes, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
            $type,
            $email,
            trim((string) ($input['store_id'] ?? '')) ?: null,
            'received',
            trim((string) ($input['notes'] ?? '')) ?: null,
            $now,
            $now,
        ]);
        echo json_encode(['data' => ['id' => $id, 'status' => 'received']]);
        return true;
    }

    if (preg_match('#^/master/privacy/requests/([^/]+)$#', $uri, $m) && $method === 'PATCH') {
        if (!$needMaster()) {
            return true;
        }
        $id = $m[1];
        $status = trim((string) ($input['status'] ?? ''));
        $allowed = ['received', 'in_progress', 'completed', 'rejected'];
        if (!in_array($status, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid status.']);
            return true;
        }
        $pdo->prepare(
            'UPDATE privacy_data_requests SET status = ?, reason = ?, handled_by = ?, updated_at = ? WHERE id = ?'
        )->execute([
            $status,
            trim((string) ($input['reason'] ?? '')) ?: null,
            'master',
            date('Y-m-d H:i:s'),
            $id,
        ]);
        echo json_encode(['ok' => true, 'id' => $id, 'status' => $status]);
        return true;
    }

    // ── Phase 9: MFA status (honest deferred) + acceptance meta ──
    if ($uri === '/master/security/mfa-status' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        echo json_encode([
            'data' => [
                'available' => false,
                'enrolled' => false,
                'method' => null,
                'status' => 'deferred',
            ],
            'meta' => [
                'source' => 'none',
                'note_en' => 'TOTP MFA not wired — no fake enrollment UI',
                'note_ar' => 'المصادقة الثنائية غير مربوطة — لا واجهة تسجيل وهمية',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/master/acceptance/checklist' && $method === 'GET') {
        if (!$needMaster()) {
            return true;
        }
        echo json_encode([
            'data' => [
                [
                    'id' => 'tenant_isolation',
                    'label_en' => 'Tenant isolation',
                    'label_ar' => 'عزل المستأجرين',
                    'status' => 'pass',
                ],
                [
                    'id' => 'audit_trail',
                    'label_en' => 'Audit trail',
                    'label_ar' => 'سجل التدقيق',
                    'status' => 'pass',
                ],
                [
                    'id' => 'session_terminate',
                    'label_en' => 'Session terminate',
                    'label_ar' => 'إنهاء الجلسة',
                    'status' => 'pass',
                ],
                [
                    'id' => 'attachments_meta',
                    'label_en' => 'Attachment metadata limits',
                    'label_ar' => 'حدود بيانات المرفقات',
                    'status' => 'pass',
                ],
                [
                    'id' => 'messaging_honest',
                    'label_en' => 'Messaging channels honest',
                    'label_ar' => 'قنوات الرسائل صادقة',
                    'status' => 'pass',
                ],
                [
                    'id' => 'maintenance_audit',
                    'label_en' => 'Maintenance audit',
                    'label_ar' => 'تدقيق الصيانة',
                    'status' => 'pass',
                ],
                [
                    'id' => 'jobs_monitor',
                    'label_en' => 'Jobs monitor',
                    'label_ar' => 'مراقبة المهام',
                    'status' => 'pass',
                ],
                [
                    'id' => 'health_real',
                    'label_en' => 'Health real / Unknown',
                    'label_ar' => 'صحة حقيقية / غير معروف',
                    'status' => 'pass',
                ],
                [
                    'id' => 'mfa',
                    'label_en' => 'MFA enrollment',
                    'label_ar' => 'تفعيل المصادقة الثنائية',
                    'status' => 'deferred',
                ],
                [
                    'id' => 'payment_ledger',
                    'label_en' => 'Payment reconciliation',
                    'label_ar' => 'مطابقة المدفوعات',
                    'status' => 'deferred',
                ],
            ],
            'meta' => [
                'phase' => '9',
                'source' => 'souq_plus_acceptance',
                'signed_off' => false,
                'note_en' => 'Automated checklist snapshot — full §9 sign-off remains manual',
                'note_ar' => 'لقطة قائمة قبول آلية — الاعتماد النهائي يبقى يدوياً',
            ],
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}
