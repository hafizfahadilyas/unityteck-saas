<?php
/**
 * Lite Hostinger session + missing SaaS routes (Clerk exchange, store-settings, dashboard-home).
 * Per store_id isolation. No fake commerce metrics.
 */
declare(strict_types=1);

function souq_lite_b64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return (string)base64_decode(strtr($data, '-_', '+/'));
}

/** @return array<string, mixed>|null */
function souq_lite_jwt_payload(string $jwt): ?array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    $json = souq_lite_b64url_decode($parts[1]);
    $payload = json_decode($json, true);
    return is_array($payload) ? $payload : null;
}

function souq_lite_find_store_by_owner(PDO $pdo, string $email): ?array
{
    $email = strtolower(trim($email));
    if ($email === '') {
        return null;
    }
    // SELECT * — Laravel MySQL has no stores.data JSON blob.
    $st = $pdo->query('SELECT * FROM stores');
    while ($row = $st->fetch()) {
        $data = function_exists('souq_store_payload')
            ? souq_store_payload($row)
            : (json_decode((string)($row['data'] ?? '{}'), true) ?: []);
        if (!is_array($data)) {
            $data = [];
        }
        $owners = [
            strtolower(trim((string)($data['email'] ?? ''))),
            strtolower(trim((string)($data['ownerEmail'] ?? ''))),
            strtolower(trim((string)($data['owner_email'] ?? ''))),
            strtolower(trim((string)($data['loginEmail'] ?? ''))),
            strtolower(trim((string)($row['email'] ?? ''))),
        ];
        $id = (string)$row['id'];
        $alias = match ($id) {
            'store-coffee' => ['mieraf.sa8@gmail.com', 'rayan@specialtycoffee.sa'],
            'store-1' => ['giftshop2030m@gmail.com', 'p4pakistan098@gmail.com'],
            'store-bleco' => ['support@tanjeedmakkah.com', 'admin@bleco.sa', 'alsaeedi@tanjeedmakkah.com'],
            default => [],
        };
        // After Master Change Login Email → exclusive registered email(s) only.
        $exclusive = !empty($data['login_email_exclusive']);
        $allowed = $exclusive
            ? $owners
            : array_merge($owners, $alias);
        $allowed = array_values(array_unique(array_filter(
            $allowed,
            static fn ($e) => is_string($e) && $e !== '' && str_contains($e, '@')
        )));
        if ($allowed !== [] && in_array($email, $allowed, true)) {
            // Attach normalized payload so callers can read login_email_active without data column.
            $row['_payload'] = $data;
            return $row;
        }
    }
    return null;
}

function souq_lite_is_master_email(string $email): bool
{
    $email = strtolower(trim($email));
    $masters = [
        'master@unityteck.com',
        'admin@unityteck.com',
        'admin@giftshop-sa.com',
    ];
    return in_array($email, $masters, true);
}

function souq_lite_otp_path(): string
{
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir . '/auth_otps.json';
}

/** @return array<string, array{hash:string,expires:int,portal:string,purpose:string}> */
function souq_lite_otp_read(): array
{
    $path = souq_lite_otp_path();
    if (!is_file($path)) {
        return [];
    }
    $raw = json_decode((string)@file_get_contents($path), true);
    return is_array($raw) ? $raw : [];
}

/** @param array<string, mixed> $map */
function souq_lite_otp_write(array $map): void
{
    @file_put_contents(souq_lite_otp_path(), json_encode($map, JSON_UNESCAPED_UNICODE));
}

/**
 * Send OTP via Hostinger/Resend/Brevo SMTP when configured; otherwise PHP mail(); else logged.
 * Only SMTP 250 after AUTH counts as delivery=email. PHP mail() often returns true on
 * Hostinger without inbox delivery — never treat it as real email (keeps on-screen OTP).
 * @param array<string, string> $env
 * @return array{delivery:string,ok:bool}
 */
function souq_lite_send_otp_mail(string $to, string $code, array $env): array
{
    $subject = 'UnityTeck login verification code';
    $body = "Your verification code is {$code}. It expires in 5 minutes.";
    $from = trim((string)($env['MAIL_FROM_ADDRESS'] ?? 'noreply@giftshop-sa.com'));
    $fromName = trim((string)($env['MAIL_FROM_NAME'] ?? 'UnityTeck'));
    $host = trim((string)($env['MAIL_HOST'] ?? ''));
    $user = trim((string)($env['MAIL_USERNAME'] ?? ''));
    $pass = (string)($env['MAIL_PASSWORD'] ?? '');
    $port = (int)($env['MAIL_PORT'] ?? 465);
    $mailer = strtolower(trim((string)($env['MAIL_MAILER'] ?? 'smtp')));

    if ($mailer !== 'log' && $host !== '' && $user !== '' && $pass !== '' && $pass !== 'null') {
        $sent = souq_lite_smtp_send($host, $port, $user, $pass, $from, $fromName, $to, $subject, $body);
        if ($sent) {
            return ['delivery' => 'email', 'ok' => true];
        }
    }

    // Best-effort local MTA — do not claim inbox delivery (no on-screen OTP otherwise).
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/plain; charset=UTF-8',
        'From: ' . $fromName . ' <' . $from . '>',
    ];
    @mail($to, $subject, $body, implode("\r\n", $headers));

    return ['delivery' => 'logged', 'ok' => false];
}

function souq_lite_smtp_send(
    string $host,
    int $port,
    string $user,
    string $pass,
    string $from,
    string $fromName,
    string $to,
    string $subject,
    string $body
): bool {
    $errno = 0;
    $errstr = '';
    $fp = $port === 465
        ? @fsockopen('ssl://' . $host, $port, $errno, $errstr, 12)
        : @fsockopen($host, $port, $errno, $errstr, 12);
    if (!$fp) {
        return false;
    }
    stream_set_timeout($fp, 12);
    $read = static function () use ($fp): string {
        $data = '';
        while ($line = fgets($fp, 512)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $write = static function (string $cmd) use ($fp): void {
        fwrite($fp, $cmd . "\r\n");
    };
    $read();
    $write('EHLO unityteck.local');
    $read();
    if ($port === 587) {
        $write('STARTTLS');
        $tls = $read();
        if (!str_starts_with($tls, '220')) {
            fclose($fp);
            return false;
        }
        $crypto = stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$crypto) {
            fclose($fp);
            return false;
        }
        $write('EHLO unityteck.local');
        $read();
    }
    $write('AUTH LOGIN');
    $read();
    $write(base64_encode($user));
    $read();
    $write(base64_encode($pass));
    $auth = $read();
    if (!str_starts_with($auth, '235')) {
        fclose($fp);
        return false;
    }
    $write('MAIL FROM:<' . $from . '>');
    $mailFrom = $read();
    if (!str_starts_with($mailFrom, '250')) {
        fclose($fp);
        return false;
    }
    $write('RCPT TO:<' . $to . '>');
    $rcpt = $read();
    if (!str_starts_with($rcpt, '250') && !str_starts_with($rcpt, '251')) {
        fclose($fp);
        return false;
    }
    $write('DATA');
    $dataReady = $read();
    if (!str_starts_with($dataReady, '354')) {
        fclose($fp);
        return false;
    }
    $payload = 'From: ' . $fromName . ' <' . $from . ">\r\n"
        . 'To: <' . $to . ">\r\n"
        . 'Subject: ' . $subject . "\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
        . $body . "\r\n.";
    $write($payload);
    $dataResp = $read();
    $write('QUIT');
    fclose($fp);
    return str_starts_with($dataResp, '250');
}

/**
 * @return bool true if handled
 */
function souq_session_lite_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // POST /auth/otp/request — Laravel-compatible free email OTP (Hostinger/Resend/Brevo SMTP)
    if ($uri === '/auth/otp/request' && $method === 'POST') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $portal = strtolower(trim((string)($input['portal'] ?? 'store')));
        $purpose = strtolower(trim((string)($input['purpose'] ?? 'login')));
        if ($email === '' || !str_contains($email, '@') || !in_array($portal, ['master', 'store'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'email and portal are required.']);
            return true;
        }
        if (!in_array($purpose, ['login', 'reset'], true)) {
            $purpose = 'login';
        }

        if ($portal === 'master' && !souq_lite_is_master_email($email)) {
            echo json_encode([
                'ok' => true,
                'message' => 'If that email exists, a code was sent.',
                'delivery' => 'stubbed',
                'expires_in' => 300,
            ]);
            return true;
        }
        if ($portal === 'store') {
            $row = souq_lite_find_store_by_owner($pdo, $email);
            if (!$row) {
                echo json_encode([
                    'ok' => true,
                    'message' => 'If that email exists, a code was sent.',
                    'delivery' => 'stubbed',
                    'expires_in' => 300,
                ]);
                return true;
            }
        }

        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $key = $portal . ':' . $purpose . ':' . $email;
        $map = souq_lite_otp_read();
        $map[$key] = [
            'hash' => password_hash($code, PASSWORD_DEFAULT),
            'expires' => time() + 300,
            'portal' => $portal,
            'purpose' => $purpose,
        ];
        souq_lite_otp_write($map);

        $env = function_exists('souq_load_root_env') ? souq_load_root_env() : [];
        if (!is_array($env)) {
            $env = [];
        }
        $mail = souq_lite_send_otp_mail($email, $code, $env);
        $alwaysReveal = filter_var((string)($env['AUTH_STUB_REVEAL'] ?? ''), FILTER_VALIDATE_BOOLEAN)
            || filter_var((string)($env['OTP_ALWAYS_REVEAL'] ?? '1'), FILTER_VALIDATE_BOOLEAN);
        $public = [
            'ok' => true,
            'message' => $mail['delivery'] === 'email'
                ? ($alwaysReveal
                    ? 'Verification code sent — also shown on screen.'
                    : 'Verification code sent to your email.')
                : 'SMTP not configured for real inbox — use on-screen / returned code.',
            'delivery' => $mail['delivery'],
            'expires_in' => 300,
        ];
        // Merchant login: reveal unless real SMTP succeeded AND reveal flags are off.
        if ($mail['delivery'] !== 'email' || $alwaysReveal) {
            $public['dev_code'] = $code;
        }
        echo json_encode($public);
        return true;
    }

    // POST /auth/otp/verify — mint lite Sanctum-compatible session token
    if ($uri === '/auth/otp/verify' && $method === 'POST') {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $portal = strtolower(trim((string)($input['portal'] ?? 'store')));
        $purpose = strtolower(trim((string)($input['purpose'] ?? 'login')));
        $code = trim((string)($input['code'] ?? ''));
        if ($email === '' || $code === '' || !in_array($portal, ['master', 'store'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'email, portal, and code are required.']);
            return true;
        }

        $key = $portal . ':' . $purpose . ':' . $email;
        $map = souq_lite_otp_read();
        $rowOtp = $map[$key] ?? null;
        if (!is_array($rowOtp) || (int)($rowOtp['expires'] ?? 0) < time() || !password_verify($code, (string)($rowOtp['hash'] ?? ''))) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid or expired code.', 'errors' => ['code' => ['Invalid or expired code.']]]);
            return true;
        }
        unset($map[$key]);
        souq_lite_otp_write($map);

        if ($purpose !== 'login') {
            echo json_encode(['ok' => true, 'verified' => true, 'message' => 'Code verified.']);
            return true;
        }

        if ($portal === 'master') {
            if (!souq_lite_is_master_email($email)) {
                http_response_code(422);
                echo json_encode(['message' => 'No matching account for this portal.']);
                return true;
            }
            $token = 'lite|' . bin2hex(random_bytes(24));
            echo json_encode([
                'token' => $token,
                'portal' => 'master',
                'user' => [
                    'id' => 'master-' . substr(md5($email), 0, 10),
                    'name' => 'Souq Platform SuperAdmin',
                    'email' => $email,
                    'role' => 'super_admin',
                    'role_label' => 'Super Admin',
                    'role_level' => 100,
                ],
                'abilities' => ['*'],
                'store_id' => null,
                'store_name' => null,
                'ok' => true,
                'verified' => true,
                'message' => 'Code verified.',
            ]);
            return true;
        }

        $row = souq_lite_find_store_by_owner($pdo, $email);
        if (!$row) {
            http_response_code(403);
            echo json_encode(['message' => 'No store membership for this account.']);
            return true;
        }
        $storeData = is_array($row['_payload'] ?? null)
            ? $row['_payload']
            : (function_exists('souq_store_payload')
                ? souq_store_payload($row)
                : (json_decode((string)($row['data'] ?? '{}'), true) ?: []));
        if (!is_array($storeData)) {
            $storeData = [];
        }
        $loginActive = true;
        if (array_key_exists('login_email_active', $row) && $row['login_email_active'] !== null) {
            $loginActive = (bool)$row['login_email_active'];
        } elseif (array_key_exists('login_email_active', $storeData)) {
            $loginActive = (bool)$storeData['login_email_active'];
        }
        if ($loginActive === false) {
            http_response_code(422);
            echo json_encode([
                'message' => 'This store login email is inactive. Contact platform support.',
                'errors' => ['email' => ['This store login email is inactive.']],
            ]);
            return true;
        }

        $token = 'lite|' . bin2hex(random_bytes(24));
        $name = (string)($row['name'] ?? 'Store Admin');
        $storeAbilities = [
            'products.read', 'products.write',
            'orders.read', 'orders.write',
            'customers.read', 'customers.write',
            'coupons.read', 'coupons.write',
            'shipping.read', 'shipping.write',
            'seo.read', 'seo.write',
            'themes.read', 'themes.write',
            'settings.read', 'settings.write',
            'team.read', 'team.write',
            'analytics.read',
            'stores.read',
        ];
        echo json_encode([
            'token' => $token,
            'portal' => 'store',
            'user' => [
                'id' => 'usr-' . substr(md5($email . $row['id']), 0, 10),
                'name' => $name,
                'email' => $email,
                'role' => 'admin',
                'role_label' => 'Store Owner',
                'role_level' => 90,
            ],
            'abilities' => $storeAbilities,
            'store_id' => (string)$row['id'],
            'store_name' => $name,
            'ok' => true,
            'verified' => true,
            'message' => 'Code verified.',
        ]);
        return true;
    }

    // POST /auth/clerk/exchange
    if ($uri === '/auth/clerk/exchange' && $method === 'POST') {
        try {
        $email = strtolower(trim((string)($input['email'] ?? '')));
        $portal = strtolower(trim((string)($input['portal'] ?? 'store')));
        $clerkToken = trim((string)($input['clerk_token'] ?? ''));
        $reqStore = trim((string)($input['store_id'] ?? $storeId));

        if ($email === '' || $clerkToken === '' || !in_array($portal, ['master', 'store'], true)) {
            http_response_code(422);
            echo json_encode(['message' => 'email, portal, and clerk_token are required.']);
            return true;
        }

        $payload = souq_lite_jwt_payload($clerkToken);
        if ($payload === null) {
            http_response_code(422);
            echo json_encode(['message' => 'Invalid verification session. Complete email OTP again.']);
            return true;
        }
        $exp = (int)($payload['exp'] ?? 0);
        if ($exp > 0 && $exp < time()) {
            http_response_code(422);
            echo json_encode(['message' => 'Verification session expired. Sign in again.']);
            return true;
        }
        $claimEmail = strtolower(trim((string)(
            $payload['email']
            ?? ($payload['primary_email_address'] ?? '')
            ?? ''
        )));
        // Clerk session JWTs often put email under nested claims
        if ($claimEmail === '' && isset($payload['email_address'])) {
            $claimEmail = strtolower(trim((string)$payload['email_address']));
        }
        if ($claimEmail !== '' && $claimEmail !== $email) {
            http_response_code(422);
            echo json_encode(['message' => 'Clerk session email does not match.']);
            return true;
        }

        if ($portal === 'master') {
            if (!souq_lite_is_master_email($email)) {
                http_response_code(422);
                echo json_encode(['message' => 'No matching account for this portal.']);
                return true;
            }
            $token = 'lite|' . bin2hex(random_bytes(24));
            echo json_encode([
                'token' => $token,
                'portal' => 'master',
                'user' => [
                    'id' => 'master-' . substr(md5($email), 0, 10),
                    'name' => 'Souq Platform SuperAdmin',
                    'email' => $email,
                    'role' => 'super_admin',
                    'role_label' => 'Super Admin',
                    'role_level' => 100,
                ],
                'abilities' => ['*'],
                'store_id' => null,
                'store_name' => null,
            ]);
            return true;
        }

        $row = null;
        if ($reqStore !== '') {
            // Resolve by registered login email first, then confirm store_id match (no cross-tenant).
            $byEmail = souq_lite_find_store_by_owner($pdo, $email);
            if ($byEmail && (string)$byEmail['id'] === $reqStore) {
                $row = $byEmail;
            }
        }
        if (!$row) {
            $row = souq_lite_find_store_by_owner($pdo, $email);
        }
        if (!$row) {
            http_response_code(403);
            echo json_encode(['message' => 'No store membership for this account.']);
            return true;
        }

        $storeData = is_array($row['_payload'] ?? null)
            ? $row['_payload']
            : (function_exists('souq_store_payload')
                ? souq_store_payload($row)
                : (json_decode((string)($row['data'] ?? '{}'), true) ?: []));
        if (!is_array($storeData)) {
            $storeData = [];
        }
        // Master SuperAdmin Active/Inactive — MySQL column or SQLite JSON blob.
        $loginActive = true;
        if (array_key_exists('login_email_active', $row) && $row['login_email_active'] !== null) {
            $loginActive = (bool) $row['login_email_active'];
        } elseif (array_key_exists('login_email_active', $storeData)) {
            $loginActive = (bool) $storeData['login_email_active'];
        }
        if ($loginActive === false) {
            http_response_code(422);
            echo json_encode([
                'message' => 'This store login email is inactive. Contact platform support.',
                'errors' => ['email' => ['This store login email is inactive.']],
            ]);
            return true;
        }

        $token = 'lite|' . bin2hex(random_bytes(24));
        $name = (string)($row['name'] ?? 'Store Admin');
        // Store owner = full store admin (products/categories write, etc.)
        $storeAbilities = [
            'products.read', 'products.write',
            'orders.read', 'orders.write',
            'customers.read', 'customers.write',
            'coupons.read', 'coupons.write',
            'shipping.read', 'shipping.write',
            'seo.read', 'seo.write',
            'themes.read', 'themes.write',
            'settings.read', 'settings.write',
            'team.read', 'team.write',
            'analytics.read',
            'stores.read',
        ];
        echo json_encode([
            'token' => $token,
            'portal' => 'store',
            'user' => [
                'id' => 'usr-' . substr(md5($email . $row['id']), 0, 10),
                'name' => $name,
                'email' => $email,
                'role' => 'admin',
                'role_label' => 'Store Owner',
                'role_level' => 90,
            ],
            'abilities' => $storeAbilities,
            'store_id' => (string)$row['id'],
            'store_name' => $name,
        ]);
        return true;
        } catch (Throwable $exchangeErr) {
            http_response_code(500);
            echo json_encode([
                'message' => 'Session exchange failed. Please try again shortly.',
                'error' => $exchangeErr->getMessage(),
            ]);
            return true;
        }
    }

    // PATCH /stores/{id} — Master login email + Active/Inactive
    if (preg_match('#^/stores/([^/]+)$#', $uri, $m) && in_array($method, ['PATCH', 'PUT', 'POST'], true)) {
        $sid = (string)$m[1];
        $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$sid]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Store not found.']);
            return true;
        }
        $data = function_exists('souq_store_payload')
            ? souq_store_payload($row)
            : (json_decode((string)($row['data'] ?? '{}'), true) ?: []);
        if (!is_array($data)) {
            $data = [];
        }
        $name = (string)$row['name'];
        $slug = (string)$row['slug'];
        $domain = (string)$row['domain'];
        $emailCol = strtolower(trim((string)($row['email'] ?? ($data['email'] ?? ''))));
        $loginActive = array_key_exists('login_email_active', $row) && $row['login_email_active'] !== null
            ? (bool)$row['login_email_active']
            : (array_key_exists('login_email_active', $data) ? (bool)$data['login_email_active'] : true);

        if (isset($input['name']) && is_string($input['name']) && trim($input['name']) !== '') {
            $name = trim($input['name']);
            $data['name'] = $name;
        }
        if (isset($input['slug']) && is_string($input['slug']) && trim($input['slug']) !== '') {
            $slug = trim($input['slug']);
            $data['slug'] = $slug;
        }
        if (array_key_exists('domain', $input)) {
            $domain = trim((string)$input['domain']);
            $data['domain'] = $domain;
        }
        $nextEmail = null;
        if (isset($input['email']) && is_string($input['email'])) {
            $nextEmail = strtolower(trim($input['email']));
        } elseif (isset($input['owner_email']) && is_string($input['owner_email'])) {
            $nextEmail = strtolower(trim($input['owner_email']));
        }
        if ($nextEmail !== null && $nextEmail !== '' && str_contains($nextEmail, '@')) {
            $emailCol = $nextEmail;
            $data['email'] = $nextEmail;
            $data['ownerEmail'] = $nextEmail;
            $data['owner_email'] = $nextEmail;
            $data['loginEmail'] = $nextEmail;
            // Master Change Login Email: lock store to this email only (drop seed aliases).
            $data['login_email_exclusive'] = true;
        }
        if (array_key_exists('login_email_active', $input)) {
            $parsed = filter_var($input['login_email_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            $loginActive = $parsed === null ? (bool)$input['login_email_active'] : $parsed;
            $data['login_email_active'] = $loginActive;
        }
        foreach (['plan', 'status', 'phone', 'owner_name', 'city', 'country', 'category', 'logo', 'accent_color'] as $k) {
            if (array_key_exists($k, $input)) {
                $data[$k] = $input[$k];
            }
        }

        $isMysql = function_exists('souq_driver_is_mysql') && souq_driver_is_mysql($pdo);
        $hasDataCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'data');
        if ($isMysql || !$hasDataCol) {
            if (function_exists('souq_ensure_mysql_store_login_column')) {
                souq_ensure_mysql_store_login_column($pdo);
            }
            $sets = ['name = ?', 'slug = ?', 'domain = ?', 'email = ?', 'updated_at = CURRENT_TIMESTAMP'];
            $params = [$name, $slug, $domain, $emailCol !== '' ? $emailCol : null];
            if (function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'login_email_active')) {
                $sets[] = 'login_email_active = ?';
                $params[] = $loginActive ? 1 : 0;
            }
            foreach (['plan', 'status', 'phone', 'owner_name', 'city', 'country', 'category', 'logo', 'accent_color'] as $k) {
                if (array_key_exists($k, $input) && function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', $k)) {
                    $sets[] = '`' . $k . '` = ?';
                    $params[] = $input[$k];
                }
            }
            $params[] = $sid;
            $pdo->prepare('UPDATE stores SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        } else {
            $pdo->prepare('UPDATE stores SET name = ?, slug = ?, domain = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                ->execute([$name, $slug, $domain, json_encode($data, JSON_UNESCAPED_UNICODE), $sid]);
        }

        $out = $data;
        $out['id'] = $sid;
        $out['name'] = $name;
        $out['slug'] = $slug;
        $out['domain'] = $domain;
        $out['email'] = $emailCol !== '' ? $emailCol : ($data['email'] ?? ($data['ownerEmail'] ?? null));
        $out['owner_email'] = $out['email'];
        $out['ownerEmail'] = $out['email'];
        $out['login_email_active'] = $loginActive;
        echo json_encode(['data' => $out]);
        return true;
    }

    // GET|PUT /stores/{id}/store-settings
    if (preg_match('#^/stores/([^/]+)/store-settings$#', $uri, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'POST'], true)) {
        $sid = (string)$m[1];
        $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
        $st->execute([$sid]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Store not found.']);
            return true;
        }
        $data = function_exists('souq_store_payload')
            ? souq_store_payload($row)
            : (json_decode((string)($row['data'] ?? '{}'), true) ?: []);
        if (!is_array($data)) {
            $data = [];
        }
        $hasDataCol = function_exists('souq_table_has_column') && souq_table_has_column($pdo, 'stores', 'data');
        if ($method === 'GET') {
            $settings = is_array($data['settings'] ?? null) ? $data['settings'] : [];
            // Merge common identity fields merchants expect
            if (!isset($settings['branding']) && isset($data['branding'])) {
                $settings['branding'] = $data['branding'];
            }
            if (!isset($settings['branding'])) {
                $settings['branding'] = [
                    'name' => (string)($row['name'] ?? ''),
                    'logo' => (string)($row['logo'] ?? ''),
                    'accent_color' => (string)($row['accent_color'] ?? ''),
                    'email' => (string)($row['email'] ?? ''),
                    'phone' => (string)($row['phone'] ?? ''),
                ];
            }
            echo json_encode(['success' => true, 'data' => $settings, 'store_id' => $sid]);
            return true;
        }
        $incoming = $input['settings'] ?? $input;
        if (!is_array($incoming)) {
            $incoming = [];
        }
        $prev = is_array($data['settings'] ?? null) ? $data['settings'] : [];
        $data['settings'] = array_replace_recursive($prev, $incoming);
        if ($hasDataCol) {
            $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $sid]);
        } else {
            // MySQL: persist identity fields that map to real columns; keep settings in response only.
            $logo = $data['settings']['branding']['logo'] ?? ($data['logo'] ?? null);
            $accent = $data['settings']['branding']['accent_color'] ?? ($data['accent_color'] ?? null);
            $phone = $data['settings']['branding']['phone'] ?? ($data['phone'] ?? null);
            $sets = ['updated_at = CURRENT_TIMESTAMP'];
            $params = [];
            if ($logo !== null) {
                $sets[] = 'logo = ?';
                $params[] = $logo;
            }
            if ($accent !== null) {
                $sets[] = 'accent_color = ?';
                $params[] = $accent;
            }
            if ($phone !== null) {
                $sets[] = 'phone = ?';
                $params[] = $phone;
            }
            $params[] = $sid;
            $pdo->prepare('UPDATE stores SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        }
        echo json_encode(['success' => true, 'data' => $data['settings'], 'store_id' => $sid]);
        return true;
    }

    // GET /analytics/dashboard-home — storefront events only (never seeded store_metrics)
    if ($uri === '/analytics/dashboard-home' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(400);
            echo json_encode(['message' => 'X-Store-Id header is required for store-scoped routes.']);
            return true;
        }
        $visitors = 0;
        $trafficSources = [];
        try {
            $st = $pdo->prepare(
                "SELECT COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) AS sessions,
                        SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS orphans
                 FROM analytics_events
                 WHERE store_id = ? AND event_name = 'page_view'"
            );
            $st->execute([$storeId]);
            $row = $st->fetch() ?: [];
            $visitors = (int)($row['sessions'] ?? 0) + (int)($row['orphans'] ?? 0);
        } catch (Throwable) {
            $visitors = 0;
        }

        $weekday = [
            ['dayEn' => 'Sat', 'dayAr' => 'السبت', 'percentage' => 0],
            ['dayEn' => 'Sun', 'dayAr' => 'الأحد', 'percentage' => 0],
            ['dayEn' => 'Mon', 'dayAr' => 'الاثنين', 'percentage' => 0],
            ['dayEn' => 'Tue', 'dayAr' => 'الثلاثاء', 'percentage' => 0],
            ['dayEn' => 'Wed', 'dayAr' => 'الأربعاء', 'percentage' => 0],
            ['dayEn' => 'Thu', 'dayAr' => 'الخميس', 'percentage' => 0],
            ['dayEn' => 'Fri', 'dayAr' => 'الجمعة', 'percentage' => 0],
        ];
        try {
            $q = $pdo->prepare(
                "SELECT CAST(strftime('%w', created_at) AS INTEGER) AS dow, COUNT(*) AS c
                 FROM analytics_events
                 WHERE store_id = ? AND event_name = 'page_view' AND created_at >= datetime('now', '-7 days')
                 GROUP BY dow"
            );
            $q->execute([$storeId]);
            $counts = [];
            $total = 0;
            while ($r = $q->fetch()) {
                $dow = (int)$r['dow']; // 0=Sun .. 6=Sat
                $c = (int)$r['c'];
                $counts[$dow] = $c;
                $total += $c;
            }
            // Map to Sat-first UI order
            $order = [6, 0, 1, 2, 3, 4, 5];
            foreach ($order as $i => $dow) {
                $c = (int)($counts[$dow] ?? 0);
                $weekday[$i]['percentage'] = $total > 0 ? (int)round(($c / $total) * 100) : 0;
                if ($c > 0 && $c === max($counts ?: [0])) {
                    $weekday[$i]['highlighted'] = true;
                }
            }
        } catch (Throwable) {
            // leave zeros
        }

        try {
            // Same unit as Total Visits: distinct sessions + orphan hits (never invent min 1%)
            $srcQ = $pdo->prepare(
                "SELECT COALESCE(NULLIF(TRIM(source), ''), 'Direct') AS src,
                        COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) AS sessions,
                        SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) AS orphans
                 FROM analytics_events
                 WHERE store_id = ? AND event_name = 'page_view'
                 GROUP BY src"
            );
            $srcQ->execute([$storeId]);
            $srcRows = [];
            $srcTotal = 0;
            while ($r = $srcQ->fetch()) {
                $visits = (int)($r['sessions'] ?? 0) + (int)($r['orphans'] ?? 0);
                if ($visits <= 0) {
                    continue;
                }
                $srcRows[] = ['src' => (string)$r['src'], 'visits' => $visits];
                $srcTotal += $visits;
            }
            // Largest-remainder so percentages always sum to 100 (no 100%+1% fake look)
            $floors = [];
            $fracs = [];
            foreach ($srcRows as $i => $r) {
                $exact = $srcTotal > 0 ? (($r['visits'] / $srcTotal) * 100.0) : 0.0;
                $floor = (int)floor($exact);
                $floors[$i] = $floor;
                $fracs[$i] = $exact - $floor;
            }
            $remaining = 100 - array_sum($floors);
            if ($srcTotal > 0 && $remaining > 0) {
                arsort($fracs);
                foreach (array_keys($fracs) as $i) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $floors[$i]++;
                    $remaining--;
                }
            }
            foreach ($srcRows as $i => $r) {
                $pct = (int)($floors[$i] ?? 0);
                if ($pct <= 0) {
                    continue;
                }
                $isDirect = strtolower($r['src']) === 'direct';
                $trafficSources[] = [
                    'id' => 'src_' . preg_replace('/[^a-z0-9]+/i', '_', strtolower($r['src'])),
                    'name' => $r['src'],
                    'name_ar' => $isDirect ? 'مباشر' : $r['src'],
                    'percentage' => $pct,
                    'color' => $isDirect ? '#0d9488' : '#64748b',
                    'icon_type' => $isDirect ? 'direct' : 'other',
                    'visits' => $r['visits'],
                ];
            }
            usort($trafficSources, static function ($a, $b) {
                return ($b['visits'] <=> $a['visits']) ?: ($b['percentage'] <=> $a['percentage']);
            });
        } catch (Throwable) {
            $trafficSources = [];
        }

        echo json_encode([
            'store_id' => $storeId,
            'visitors_count' => $visitors,
            'visits_growth' => null,
            'visits_by_weekday' => $weekday,
            'traffic_sources' => $trafficSources,
        ]);
        return true;
    }

    // Hostinger gateway stubs — Laravel has these; empty is correct until wired (never fake rows).
    if ($uri === '/customer-activities' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        echo json_encode(['data' => [], 'meta' => ['total' => 0, 'page' => 1, 'per_page' => 40]]);
        return true;
    }
    if ($uri === '/delivery-drivers' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.', 'data' => []]);
            return true;
        }
        echo json_encode(['data' => []]);
        return true;
    }

    return false;
}
