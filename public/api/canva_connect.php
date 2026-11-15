<?php
/**
 * Official Canva Connect (REST) — Master Admin testing only.
 * Hostinger gateway. Separate from Design Studio / KSA templates.
 * Tokens stored under platform_settings.settings.canvaConnect (master only).
 */
declare(strict_types=1);

function souq_canva_env(string $key, string $default = ''): string
{
    $env = function_exists('souq_load_root_env') ? souq_load_root_env() : [];
    $val = trim((string) ($env[$key] ?? ''));
    if ($val !== '') {
        return $val;
    }
    $fromServer = trim((string) (getenv($key) ?: ''));

    return $fromServer !== '' ? $fromServer : $default;
}

function souq_canva_scopes(): array
{
    return [
        'design:content:read',
        'design:content:write',
        'design:meta:read',
    ];
}

function souq_canva_configured(): bool
{
    return souq_canva_env('CANVA_CLIENT_ID') !== '' && souq_canva_env('CANVA_CLIENT_SECRET') !== '';
}

function souq_canva_http(
    string $method,
    string $url,
    ?array $jsonBody = null,
    ?array $formBody = null,
    ?string $bearer = null,
    ?string $basicUserPass = null,
): array {
    $ch = curl_init($url);
    if ($ch === false) {
        return ['_http' => 0, 'error' => 'curl_init_failed'];
    }
    $headers = ['Accept: application/json'];
    if ($bearer) {
        $headers[] = 'Authorization: Bearer ' . $bearer;
    }
    if ($basicUserPass !== null) {
        $headers[] = 'Authorization: Basic ' . base64_encode($basicUserPass);
    }
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($jsonBody !== null) {
        $payload = json_encode($jsonBody, JSON_UNESCAPED_UNICODE);
        $headers[] = 'Content-Type: application/json';
        $opts[CURLOPT_HTTPHEADER] = $headers;
        $opts[CURLOPT_POSTFIELDS] = $payload;
    } elseif ($formBody !== null) {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        $opts[CURLOPT_HTTPHEADER] = $headers;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($formBody);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        return ['_http' => $code, 'error' => $err !== '' ? $err : 'request_failed'];
    }
    $json = json_decode($raw, true);
    if (!is_array($json)) {
        return ['_http' => $code, 'error' => 'non_json', 'raw' => substr((string) $raw, 0, 240)];
    }
    $json['_http'] = $code;

    return $json;
}

function souq_canva_pkce_dir(): string
{
    $dir = __DIR__ . '/_canva_pkce';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    return $dir;
}

function souq_canva_pkce_put(string $state, array $payload): void
{
    $safe = preg_replace('/[^a-zA-Z0-9_-]/', '', $state) ?: 'x';
    $file = souq_canva_pkce_dir() . '/' . $safe . '.json';
    @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE));
}

function souq_canva_pkce_pull(string $state): ?array
{
    $safe = preg_replace('/[^a-zA-Z0-9_-]/', '', $state) ?: 'x';
    $file = souq_canva_pkce_dir() . '/' . $safe . '.json';
    if (!is_file($file)) {
        return null;
    }
    $raw = @file_get_contents($file);
    @unlink($file);
    $json = is_string($raw) ? json_decode($raw, true) : null;

    return is_array($json) ? $json : null;
}

function souq_canva_load_conn(PDO $pdo): array
{
    if (!function_exists('souq_platform_settings_merged')) {
        return [];
    }
    $merged = souq_platform_settings_merged($pdo);
    $conn = $merged['canvaConnect'] ?? null;

    return is_array($conn) ? $conn : [];
}

function souq_canva_save_conn(PDO $pdo, array $conn): void
{
    if (!function_exists('souq_ensure_phase1_tables')) {
        return;
    }
    souq_ensure_phase1_tables($pdo);
    if (!function_exists('souq_table_exists') || !souq_table_exists($pdo, 'platform_settings')) {
        return;
    }
    $merged = function_exists('souq_platform_settings_merged')
        ? souq_platform_settings_merged($pdo)
        : [];
    $merged['canvaConnect'] = $conn;
    $now = date('c');
    $json = json_encode($merged, JSON_UNESCAPED_UNICODE);
    $exists = $pdo->query("SELECT id FROM platform_settings WHERE id = 'platform' LIMIT 1")->fetchColumn();
    if ($exists) {
        $pdo->prepare('UPDATE platform_settings SET settings = ?, updated_at = ? WHERE id = ?')
            ->execute([$json, $now, 'platform']);
    } else {
        $pdo->prepare('INSERT INTO platform_settings (id, settings, created_at, updated_at) VALUES (?, ?, ?, ?)')
            ->execute(['platform', $json, $now, $now]);
    }
}

function souq_canva_public_status(PDO $pdo): array
{
    $conn = souq_canva_load_conn($pdo);
    $configured = souq_canva_configured();
    $token = trim((string) ($conn['access_token'] ?? ''));
    $connected = !empty($conn['is_connected']) && $token !== '';

    return [
        'configured' => $configured,
        'connected' => $connected,
        'table_ready' => true,
        'display_name' => $conn['display_name'] ?? null,
        'token_expires_at' => $conn['token_expires_at'] ?? null,
        'scopes' => souq_canva_scopes(),
        'granted_scopes' => $conn['granted_scopes'] ?? null,
        'last_error' => $conn['last_error'] ?? null,
        'client_id_set' => souq_canva_env('CANVA_CLIENT_ID') !== '',
        'redirect_uri' => souq_canva_env('CANVA_REDIRECT_URI') ?: null,
    ];
}

function souq_canva_valid_token(PDO $pdo): ?string
{
    $conn = souq_canva_load_conn($pdo);
    $token = trim((string) ($conn['access_token'] ?? ''));
    if ($token === '' || empty($conn['is_connected'])) {
        return null;
    }
    $exp = trim((string) ($conn['token_expires_at'] ?? ''));
    if ($exp !== '' && strtotime($exp) !== false && strtotime($exp) < time()) {
        $refresh = trim((string) ($conn['refresh_token'] ?? ''));
        if ($refresh === '') {
            $conn['is_connected'] = false;
            $conn['last_error'] = 'token_expired';
            souq_canva_save_conn($pdo, $conn);

            return null;
        }
        $basic = souq_canva_env('CANVA_CLIENT_ID') . ':' . souq_canva_env('CANVA_CLIENT_SECRET');
        $res = souq_canva_http('POST', 'https://api.canva.com/rest/v1/oauth/token', null, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refresh,
        ], null, $basic);
        if ((int) ($res['_http'] ?? 0) < 200 || (int) ($res['_http'] ?? 0) >= 300 || empty($res['access_token'])) {
            $conn['is_connected'] = false;
            $conn['last_error'] = (string) ($res['message'] ?? 'refresh_failed');
            souq_canva_save_conn($pdo, $conn);

            return null;
        }
        $conn['access_token'] = (string) $res['access_token'];
        if (!empty($res['refresh_token'])) {
            $conn['refresh_token'] = (string) $res['refresh_token'];
        }
        $expiresIn = (int) ($res['expires_in'] ?? 14400);
        $conn['token_expires_at'] = date('c', time() + max(60, $expiresIn - 60));
        $conn['last_error'] = null;
        souq_canva_save_conn($pdo, $conn);

        return $conn['access_token'];
    }

    return $token;
}

function souq_canva_require_master(): bool
{
    $portal = strtolower(trim((string) ($_SERVER['HTTP_X_PORTAL'] ?? '')));
    if ($portal !== 'master') {
        http_response_code(403);
        echo json_encode(['message' => 'Master SuperAdmin required.']);

        return false;
    }
    if (function_exists('souq_require_master_bearer') && !souq_require_master_bearer()) {
        return false;
    }

    return true;
}

/**
 * @return bool true if handled
 */
function souq_canva_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!str_starts_with($uri, '/master/canva-connect')) {
        return false;
    }

    if (!souq_canva_require_master()) {
        return true;
    }

    // GET /master/canva-connect/status
    if ($uri === '/master/canva-connect/status' && $method === 'GET') {
        echo json_encode(['data' => souq_canva_public_status($pdo)]);

        return true;
    }

    // GET /master/canva-connect/auth-url
    if ($uri === '/master/canva-connect/auth-url' && $method === 'GET') {
        if (!souq_canva_configured()) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET on the API .env.',
                'error' => 'not_configured',
                'configured' => false,
            ]);

            return true;
        }
        $redirect = trim((string) ($_GET['redirect_uri'] ?? souq_canva_env('CANVA_REDIRECT_URI', '')));
        if ($redirect === '') {
            http_response_code(400);
            echo json_encode([
                'message' => 'Set CANVA_REDIRECT_URI or pass redirect_uri.',
                'error' => 'canva_redirect_missing',
            ]);

            return true;
        }
        $verifier = rtrim(strtr(base64_encode(random_bytes(64)), '+/', '-_'), '=');
        if (strlen($verifier) < 43) {
            $verifier .= rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        }
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $state = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        souq_canva_pkce_put($state, [
            'verifier' => $verifier,
            'redirect_uri' => $redirect,
            'ts' => time(),
        ]);
        $query = http_build_query([
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
            'scope' => implode(' ', souq_canva_scopes()),
            'response_type' => 'code',
            'client_id' => souq_canva_env('CANVA_CLIENT_ID'),
            'state' => $state,
            'redirect_uri' => $redirect,
        ], '', '&', PHP_QUERY_RFC3986);
        echo json_encode([
            'auth_url' => 'https://www.canva.com/api/oauth/authorize?' . $query,
            'state' => $state,
            'redirect_uri' => $redirect,
            'scopes' => souq_canva_scopes(),
            'configured' => true,
        ]);

        return true;
    }

    // POST /master/canva-connect/callback
    if ($uri === '/master/canva-connect/callback' && $method === 'POST') {
        $code = trim((string) ($input['code'] ?? ''));
        $state = trim((string) ($input['state'] ?? ''));
        $redirect = trim((string) ($input['redirect_uri'] ?? ''));
        if ($code === '' || $state === '') {
            http_response_code(422);
            echo json_encode(['message' => 'code and state required.', 'error' => 'validation']);

            return true;
        }
        $pkce = souq_canva_pkce_pull($state);
        if (!$pkce || empty($pkce['verifier'])) {
            http_response_code(400);
            echo json_encode(['message' => 'OAuth state expired or invalid.', 'error' => 'invalid_state']);

            return true;
        }
        if ($redirect === '') {
            $redirect = (string) ($pkce['redirect_uri'] ?? souq_canva_env('CANVA_REDIRECT_URI', ''));
        }
        $basic = souq_canva_env('CANVA_CLIENT_ID') . ':' . souq_canva_env('CANVA_CLIENT_SECRET');
        $res = souq_canva_http('POST', 'https://api.canva.com/rest/v1/oauth/token', null, [
            'grant_type' => 'authorization_code',
            'code_verifier' => (string) $pkce['verifier'],
            'code' => $code,
            'redirect_uri' => $redirect,
        ], null, $basic);
        if ((int) ($res['_http'] ?? 0) < 200 || (int) ($res['_http'] ?? 0) >= 300 || empty($res['access_token'])) {
            http_response_code(400);
            echo json_encode([
                'message' => (string) ($res['message'] ?? 'Canva token exchange failed.'),
                'error' => 'token_exchange_failed',
            ]);

            return true;
        }
        $expiresIn = (int) ($res['expires_in'] ?? 14400);
        souq_canva_save_conn($pdo, [
            'is_connected' => true,
            'display_name' => 'Canva Connect',
            'access_token' => (string) $res['access_token'],
            'refresh_token' => (string) ($res['refresh_token'] ?? ''),
            'token_expires_at' => date('c', time() + max(60, $expiresIn - 60)),
            'granted_scopes' => (string) ($res['scope'] ?? implode(' ', souq_canva_scopes())),
            'last_error' => null,
            'connected_at' => date('c'),
        ]);
        echo json_encode(['ok' => true, 'data' => souq_canva_public_status($pdo)]);

        return true;
    }

    // POST /master/canva-connect/disconnect
    if ($uri === '/master/canva-connect/disconnect' && $method === 'POST') {
        souq_canva_save_conn($pdo, [
            'is_connected' => false,
            'display_name' => null,
            'access_token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
            'granted_scopes' => null,
            'last_error' => null,
        ]);
        echo json_encode(['ok' => true, 'data' => souq_canva_public_status($pdo)]);

        return true;
    }

    // GET /master/canva-connect/designs
    if ($uri === '/master/canva-connect/designs' && $method === 'GET') {
        $token = souq_canva_valid_token($pdo);
        if ($token === null) {
            http_response_code(409);
            echo json_encode(['message' => 'Canva is not connected.', 'error' => 'not_connected']);

            return true;
        }
        $limit = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
        $res = souq_canva_http(
            'GET',
            'https://api.canva.com/rest/v1/designs?limit=' . $limit,
            null,
            null,
            $token,
        );
        if ((int) ($res['_http'] ?? 0) < 200 || (int) ($res['_http'] ?? 0) >= 300) {
            http_response_code(400);
            echo json_encode([
                'message' => (string) ($res['message'] ?? 'List designs failed.'),
                'error' => (string) ($res['code'] ?? 'list_failed'),
            ]);

            return true;
        }
        $items = $res['items'] ?? ($res['designs'] ?? []);
        echo json_encode([
            'data' => is_array($items) ? array_values($items) : [],
            'continuation' => $res['continuation'] ?? null,
        ]);

        return true;
    }

    // POST /master/canva-connect/designs
    if ($uri === '/master/canva-connect/designs' && $method === 'POST') {
        $token = souq_canva_valid_token($pdo);
        if ($token === null) {
            http_response_code(409);
            echo json_encode(['message' => 'Canva is not connected.', 'error' => 'not_connected']);

            return true;
        }
        $title = trim((string) ($input['title'] ?? 'Souq Master Test'));
        if ($title === '') {
            $title = 'Souq Master Test';
        }
        $preset = trim((string) ($input['preset'] ?? ''));
        if ($preset !== '') {
            $body = [
                'design_type' => ['type' => 'preset', 'name' => $preset],
                'title' => $title,
            ];
        } else {
            $width = max(40, min(8000, (int) ($input['width'] ?? 1080)));
            $height = max(40, min(8000, (int) ($input['height'] ?? 1080)));
            if ($width * $height > 25000000) {
                $height = (int) floor(25000000 / $width);
            }
            $body = [
                'design_type' => ['type' => 'custom', 'width' => $width, 'height' => $height],
                'title' => $title,
            ];
        }
        $res = souq_canva_http('POST', 'https://api.canva.com/rest/v1/designs', $body, null, $token);
        if ((int) ($res['_http'] ?? 0) < 200 || (int) ($res['_http'] ?? 0) >= 300) {
            $conn = souq_canva_load_conn($pdo);
            $conn['last_error'] = (string) ($res['message'] ?? 'create_failed');
            souq_canva_save_conn($pdo, $conn);
            http_response_code(400);
            echo json_encode([
                'message' => (string) ($res['message'] ?? 'Create design failed.'),
                'error' => (string) ($res['code'] ?? 'create_failed'),
            ]);

            return true;
        }
        $design = $res['design'] ?? $res;
        echo json_encode(['data' => $design]);

        return true;
    }

    // POST /master/canva-connect/designs/{id}/export
    if (preg_match('#^/master/canva-connect/designs/([^/]+)/export$#', $uri, $m) && $method === 'POST') {
        $token = souq_canva_valid_token($pdo);
        if ($token === null) {
            http_response_code(409);
            echo json_encode(['message' => 'Canva is not connected.', 'error' => 'not_connected']);

            return true;
        }
        $designId = rawurldecode((string) $m[1]);
        $start = souq_canva_http('POST', 'https://api.canva.com/rest/v1/exports', [
            'design_id' => $designId,
            'format' => ['type' => 'png'],
        ], null, $token);
        if ((int) ($start['_http'] ?? 0) < 200 || (int) ($start['_http'] ?? 0) >= 300) {
            http_response_code(400);
            echo json_encode([
                'message' => (string) ($start['message'] ?? 'Export start failed.'),
                'error' => (string) ($start['code'] ?? 'export_start_failed'),
            ]);

            return true;
        }
        $exportId = (string) (($start['job']['id'] ?? '') ?: '');
        if ($exportId === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Export job id missing.', 'error' => 'missing_export_id']);

            return true;
        }
        $job = $start['job'] ?? [];
        for ($i = 0; $i < 20; $i++) {
            usleep(500000);
            $poll = souq_canva_http(
                'GET',
                'https://api.canva.com/rest/v1/exports/' . rawurlencode($exportId),
                null,
                null,
                $token,
            );
            $job = $poll['job'] ?? [];
            $status = (string) ($job['status'] ?? '');
            if ($status === 'success') {
                $urls = $job['urls'] ?? [];
                echo json_encode([
                    'data' => [
                        'urls' => is_array($urls) ? array_values(array_filter($urls, 'is_string')) : [],
                        'job' => $job,
                    ],
                ]);

                return true;
            }
            if ($status === 'failed') {
                http_response_code(400);
                echo json_encode([
                    'message' => (string) ($job['error']['message'] ?? 'Export failed.'),
                    'error' => 'export_failed',
                    'job' => $job,
                ]);

                return true;
            }
        }
        http_response_code(400);
        echo json_encode(['message' => 'Export still running — try again shortly.', 'error' => 'export_timeout']);

        return true;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Canva Connect route not found: ' . $uri]);

    return true;
}
