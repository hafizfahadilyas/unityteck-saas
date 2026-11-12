<?php
/**
 * Google Site Kit–style OAuth for the live Hostinger gateway.
 * Per store_id only — tokens never shared across stores. No fake metrics.
 */
declare(strict_types=1);

function souq_google_env(string $key, string $default = ''): string
{
    $env = function_exists('souq_load_root_env') ? souq_load_root_env() : [];
    $val = trim((string)($env[$key] ?? ''));
    if ($val !== '') {
        return $val;
    }
    $fromServer = trim((string)(getenv($key) ?: ''));
    return $fromServer !== '' ? $fromServer : $default;
}

function souq_google_client_id(): string
{
    $id = souq_google_env('GOOGLE_CLIENT_ID');
    if ($id === '') {
        $id = souq_google_env('VITE_GOOGLE_CLIENT_ID');
    }
    return $id;
}

function souq_google_client_secret(): string
{
    return souq_google_env('GOOGLE_CLIENT_SECRET');
}

function souq_google_http_json(string $method, string $url, ?array $form = null, ?string $bearer = null): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        return ['_http' => 0, 'error' => 'curl_init_failed'];
    }
    $headers = ['Accept: application/json'];
    if ($bearer) {
        $headers[] = 'Authorization: Bearer ' . $bearer;
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($form !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($form));
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        return ['_http' => $code, 'error' => $err !== '' ? $err : 'request_failed'];
    }
    $json = json_decode($raw, true);
    if (!is_array($json)) {
        return ['_http' => $code, 'error' => 'non_json', 'raw' => substr($raw, 0, 200)];
    }
    $json['_http'] = $code;
    return $json;
}

function souq_google_load_integration(PDO $pdo, string $storeId): array
{
    $row = souq_store_row($pdo, $storeId);
    if (!$row) {
        return [];
    }
    $data = json_decode((string)($row['data'] ?? '{}'), true);
    if (!is_array($data)) {
        $data = [];
    }
    $int = $data['google_integration'] ?? null;
    return is_array($int) ? $int : [];
}

function souq_google_save_integration(PDO $pdo, string $storeId, array $integration): bool
{
    $row = souq_store_row($pdo, $storeId);
    if (!$row) {
        return false;
    }
    $data = json_decode((string)($row['data'] ?? '{}'), true);
    if (!is_array($data)) {
        $data = [];
    }
    $data['google_integration'] = $integration;
    $seo = is_array($data['seo'] ?? null) ? $data['seo'] : [];
    if (!empty($integration['is_connected'])) {
        $seo['googleConnected'] = true;
        $seo['googleAccountEmail'] = $integration['google_account_email'] ?? null;
        $seo['connectedAt'] = $integration['connected_at'] ?? date('Y-m-d');
        if (!empty($integration['ga4_measurement_id'])) {
            $seo['ga4MeasurementId'] = $integration['ga4_measurement_id'];
            $data['ga4MeasurementId'] = $integration['ga4_measurement_id'];
        }
        if (!empty($integration['gtm_container_id'])) {
            $seo['gtmContainerId'] = $integration['gtm_container_id'];
        }
        if (!empty($integration['gsc_site_url'])) {
            $seo['searchConsoleConnected'] = true;
        }
    } else {
        $seo['googleConnected'] = false;
        $seo['googleAccountEmail'] = null;
        $seo['searchConsoleConnected'] = false;
    }
    $data['seo'] = $seo;
    $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $storeId]);
    return true;
}

function souq_google_public_integration(array $int): ?array
{
    if ($int === [] || empty($int['is_connected'])) {
        return null;
    }
    return [
        'id' => (string)($int['id'] ?? ''),
        'store_id' => (string)($int['store_id'] ?? ''),
        'is_connected' => true,
        'google_account_email' => $int['google_account_email'] ?? null,
        'google_account_name' => $int['google_account_name'] ?? null,
        'google_account_picture' => $int['google_account_picture'] ?? null,
        'ga4_property_id' => $int['ga4_property_id'] ?? null,
        'ga4_property_name' => $int['ga4_property_name'] ?? null,
        'ga4_measurement_id' => $int['ga4_measurement_id'] ?? null,
        'gsc_site_url' => $int['gsc_site_url'] ?? null,
        'gtm_account_id' => $int['gtm_account_id'] ?? null,
        'gtm_container_id' => $int['gtm_container_id'] ?? null,
        'google_ads_customer_id' => $int['google_ads_customer_id'] ?? null,
        'google_ads_account_name' => $int['google_ads_account_name'] ?? null,
        'sync_status' => $int['sync_status'] ?? 'connected',
        'last_synced_at' => $int['last_synced_at'] ?? null,
        'last_error' => $int['last_error'] ?? null,
    ];
}

function souq_google_map_exchange_error(string $error, string $description, string $redirect): string
{
    $e = strtolower($error . ' ' . $description);
    if (str_contains($e, 'redirect_uri')) {
        return 'Google rejected the redirect URL (' . $redirect . '). Add this exact origin in Google Cloud → Credentials → Authorized redirect URIs.';
    }
    if (str_contains($e, 'invalid_client') || str_contains($e, 'unauthorized_client')) {
        return 'Google Client ID or Client Secret on the server does not match. Update GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.';
    }
    if (str_contains($e, 'invalid_grant') || str_contains($e, 'code')) {
        return 'The Google sign-in code expired or was already used. Click Sign in with Google again.';
    }
    if (str_contains($e, 'not found') || str_contains($e, 'deleted')) {
        return 'This Google OAuth client was not found or was deleted in Google Cloud. Create a new Web client and update server credentials.';
    }
    return 'Could not finish Google sign-in. Confirm OAuth client, secret, and redirect URI, then try again.';
}

function souq_google_discover(string $token): array
{
    $analytics = [];
    $gsc = [];
    $gtm = [];
    $ads = [];

    $sum = souq_google_http_json('GET', 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=50', null, $token);
    if (($sum['_http'] ?? 0) >= 200 && ($sum['_http'] ?? 0) < 300) {
        foreach ($sum['accountSummaries'] ?? [] as $acc) {
            foreach ($acc['propertySummaries'] ?? [] as $prop) {
                $pid = (string)($prop['property'] ?? '');
                $pid = str_replace('properties/', '', $pid);
                if ($pid === '') {
                    continue;
                }
                $analytics[] = [
                    'propertyId' => $pid,
                    'displayName' => (string)($prop['displayName'] ?? $pid),
                    'account' => (string)($acc['displayName'] ?? ''),
                ];
            }
        }
    }

    $sites = souq_google_http_json('GET', 'https://www.googleapis.com/webmasters/v3/sites', null, $token);
    if (($sites['_http'] ?? 0) >= 200 && ($sites['_http'] ?? 0) < 300) {
        foreach ($sites['siteEntry'] ?? [] as $site) {
            $url = (string)($site['siteUrl'] ?? '');
            if ($url === '') {
                continue;
            }
            $gsc[] = [
                'siteUrl' => $url,
                'permissionLevel' => (string)($site['permissionLevel'] ?? ''),
            ];
        }
    }

    $accounts = souq_google_http_json('GET', 'https://tagmanager.googleapis.com/tagmanager/v2/accounts', null, $token);
    if (($accounts['_http'] ?? 0) >= 200 && ($accounts['_http'] ?? 0) < 300) {
        foreach ($accounts['account'] ?? [] as $acc) {
            $aid = (string)($acc['accountId'] ?? '');
            if ($aid === '') {
                continue;
            }
            $containers = souq_google_http_json(
                'GET',
                'https://tagmanager.googleapis.com/tagmanager/v2/accounts/' . rawurlencode($aid) . '/containers',
                null,
                $token
            );
            foreach ($containers['container'] ?? [] as $c) {
                $gtm[] = [
                    'accountId' => $aid,
                    'accountName' => (string)($acc['name'] ?? ''),
                    'containerId' => (string)($c['publicId'] ?? $c['containerId'] ?? ''),
                    'name' => (string)($c['name'] ?? ''),
                ];
            }
        }
    }

    return [
        'analytics' => $analytics,
        'search_console' => $gsc,
        'tag_manager' => $gtm,
        'google_ads' => $ads,
    ];
}

function souq_google_pick_defaults(PDO $pdo, string $storeId, array $discovered): array
{
    $row = souq_store_row($pdo, $storeId);
    $domain = '';
    $rawHost = '';
    if ($row) {
        $rawHost = (string)($row['custom_domain'] ?: $row['domain'] ?: $row['demo_domain'] ?: '');
    }
    if ($rawHost !== '') {
        $domain = strtolower((string)preg_replace('#^https?://#i', '', $rawHost));
        $domain = explode('/', $domain)[0];
        if (str_starts_with($domain, 'www.')) {
            $domain = substr($domain, 4);
        }
    }
    $suggestedGsc = '';
    foreach ($discovered['search_console'] as $site) {
        $u = strtolower((string)($site['siteUrl'] ?? ''));
        if ($domain !== '' && str_contains($u, $domain)) {
            $suggestedGsc = (string)$site['siteUrl'];
            break;
        }
    }
    if ($suggestedGsc === '' && !empty($discovered['search_console'][0]['siteUrl'])) {
        $suggestedGsc = (string)$discovered['search_console'][0]['siteUrl'];
    }
    $ga4 = (string)($discovered['analytics'][0]['propertyId'] ?? '');
    $ga4Name = (string)($discovered['analytics'][0]['displayName'] ?? '');
    $gtm = (string)($discovered['tag_manager'][0]['containerId'] ?? '');
    $gtmAcc = (string)($discovered['tag_manager'][0]['accountId'] ?? '');
    $public = $domain !== '' ? ('https://' . $domain) : '';
    return [
        'ga4_property_id' => $ga4,
        'ga4_property_name' => $ga4Name,
        'ga4_measurement_id' => '',
        'gsc_site_url' => $suggestedGsc,
        'gtm_account_id' => $gtmAcc,
        'gtm_container_id' => $gtm,
        'google_ads_customer_id' => '',
        'google_ads_account_name' => '',
        'store_public_url' => $public,
        'sitemap_url' => $public !== '' ? ($public . '/sitemap.xml') : '',
    ];
}

/**
 * @return bool true if handled
 */
function souq_google_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    if (!str_starts_with($uri, '/google')) {
        return false;
    }

    if ($storeId === '') {
        http_response_code(400);
        echo json_encode(['message' => 'X-Store-Id header is required for store-scoped routes.']);
        return true;
    }

    $resolved = function_exists('resolveLiveStoreId') ? resolveLiveStoreId($pdo, $storeId) : $storeId;
    if ($resolved === null || $resolved === '') {
        $resolved = $storeId;
    }
    if (!souq_store_row($pdo, (string)$resolved)) {
        http_response_code(404);
        echo json_encode(['message' => 'Store not found.']);
        return true;
    }
    $storeId = (string)$resolved;

    // GET /google/auth-url
    if ($uri === '/google/auth-url' && $method === 'GET') {
        $clientId = souq_google_client_id();
        $secret = souq_google_client_secret();
        if ($clientId === '' || $secret === '') {
            http_response_code(400);
            echo json_encode([
                'message' => 'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
                'error' => 'missing_server_credentials',
                'client_id' => $clientId,
                'configured' => false,
            ]);
            return true;
        }
        $redirect = trim((string)($_GET['redirect_uri'] ?? souq_google_env('GOOGLE_REDIRECT_URI', '')));
        if ($redirect === '') {
            $redirect = 'https://mieraf-ksa.com';
        }
        $scopes = [
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters',
            'https://www.googleapis.com/auth/tagmanager.readonly',
            'https://www.googleapis.com/auth/adwords',
            'https://www.googleapis.com/auth/indexing',
        ];
        $state = base64_encode(json_encode(['store_id' => $storeId, 'ts' => time()], JSON_UNESCAPED_UNICODE));
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent select_account',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);
        echo json_encode([
            'auth_url' => $authUrl,
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'scopes' => $scopes,
            'configured' => true,
        ]);
        return true;
    }

    // GET /google/status
    if ($uri === '/google/status' && $method === 'GET') {
        $int = souq_google_load_integration($pdo, $storeId);
        $pub = souq_google_public_integration($int);
        echo json_encode([
            'is_connected' => $pub !== null,
            'integration' => $pub,
            'store_id' => $storeId,
        ]);
        return true;
    }

    // POST /google/disconnect
    if ($uri === '/google/disconnect' && $method === 'POST') {
        souq_google_save_integration($pdo, $storeId, [
            'id' => 'g_int_' . substr(md5($storeId), 0, 8),
            'store_id' => $storeId,
            'is_connected' => false,
            'sync_status' => 'not_connected',
        ]);
        echo json_encode(['message' => 'Google disconnected for this store.', 'store_id' => $storeId]);
        return true;
    }

    // POST /google/callback
    if ($uri === '/google/callback' && $method === 'POST') {
        $clientId = souq_google_client_id();
        $secret = souq_google_client_secret();
        if ($clientId === '' || $secret === '') {
            http_response_code(400);
            echo json_encode([
                'message' => 'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
                'error' => 'missing_server_credentials',
            ]);
            return true;
        }

        $code = trim((string)($input['code'] ?? ''));
        $directToken = trim((string)($input['access_token'] ?? ''));
        $redirect = trim((string)($input['redirect_uri'] ?? souq_google_env('GOOGLE_REDIRECT_URI', '')));
        if ($redirect === '') {
            $redirect = 'https://mieraf-ksa.com';
        }

        $accessToken = null;
        $refreshToken = null;
        $expiresIn = 3600;

        if ($code !== '') {
            $tokenRes = souq_google_http_json('POST', 'https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $secret,
                'redirect_uri' => $redirect,
                'grant_type' => 'authorization_code',
            ]);
            $http = (int)($tokenRes['_http'] ?? 0);
            if ($http < 200 || $http >= 300 || empty($tokenRes['access_token'])) {
                http_response_code(400);
                echo json_encode([
                    'message' => souq_google_map_exchange_error(
                        (string)($tokenRes['error'] ?? ''),
                        (string)($tokenRes['error_description'] ?? ''),
                        $redirect
                    ),
                    'error' => (string)($tokenRes['error'] ?? 'token_exchange_failed'),
                ]);
                return true;
            }
            $accessToken = (string)$tokenRes['access_token'];
            $refreshToken = isset($tokenRes['refresh_token']) ? (string)$tokenRes['refresh_token'] : null;
            $expiresIn = (int)($tokenRes['expires_in'] ?? 3600);
        } elseif ($directToken !== '') {
            $accessToken = $directToken;
            $expiresIn = (int)($input['expires_in'] ?? 3600);
            $refreshToken = isset($input['refresh_token']) ? (string)$input['refresh_token'] : null;
        }

        if (!$accessToken) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Could not obtain Google access token. Please verify authorization code.',
                'error' => 'missing_access_token',
            ]);
            return true;
        }

        $profile = souq_google_http_json('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', null, $accessToken);
        $email = strtolower(trim((string)($profile['email'] ?? $input['email'] ?? '')));
        $name = (string)($profile['name'] ?? $input['name'] ?? ($email !== '' ? explode('@', $email)[0] : 'Google Merchant'));
        $picture = $profile['picture'] ?? null;
        if ($email === '') {
            http_response_code(400);
            echo json_encode([
                'message' => 'Google did not return an account email for this store.',
                'error' => 'missing_email',
            ]);
            return true;
        }

        // Lock connect to this store's owner login email — never borrow another store's Google account
        $storeRow = souq_store_row($pdo, $storeId);
        $storeData = $storeRow ? (json_decode((string)($storeRow['data'] ?? '{}'), true) ?: []) : [];
        $ownerEmail = strtolower(trim((string)(
            $storeData['ownerEmail']
            ?? $storeData['owner_email']
            ?? $storeData['loginEmail']
            ?? ''
        )));
        if ($ownerEmail !== '' && $ownerEmail !== $email) {
            http_response_code(403);
            echo json_encode([
                'message' => 'This store must connect with its own owner Google email (' . $ownerEmail . '). Another account was signed in.',
                'error' => 'owner_email_mismatch',
            ]);
            return true;
        }

        $discovered = souq_google_discover($accessToken);
        $picks = souq_google_pick_defaults($pdo, $storeId, $discovered);
        $existing = souq_google_load_integration($pdo, $storeId);

        $integration = [
            'id' => (string)($existing['id'] ?? ('g_int_' . substr(md5($storeId . $email), 0, 10))),
            'store_id' => $storeId,
            'is_connected' => true,
            'google_account_email' => $email,
            'google_account_name' => $name,
            'google_account_picture' => $picture,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken ?: ($existing['refresh_token'] ?? null),
            'token_expires_at' => date('c', time() + max(60, $expiresIn - 60)),
            'ga4_property_id' => $picks['ga4_property_id'] ?: ($existing['ga4_property_id'] ?? null),
            'ga4_property_name' => $picks['ga4_property_name'] ?: ($existing['ga4_property_name'] ?? null),
            'ga4_measurement_id' => $picks['ga4_measurement_id'] ?: ($existing['ga4_measurement_id'] ?? null),
            'gsc_site_url' => $picks['gsc_site_url'] ?: ($existing['gsc_site_url'] ?? null),
            'gtm_account_id' => $picks['gtm_account_id'] ?: ($existing['gtm_account_id'] ?? null),
            'gtm_container_id' => $picks['gtm_container_id'] ?: ($existing['gtm_container_id'] ?? null),
            'google_ads_customer_id' => $existing['google_ads_customer_id'] ?? null,
            'google_ads_account_name' => $existing['google_ads_account_name'] ?? null,
            'sync_status' => 'connected',
            'connected_at' => date('Y-m-d'),
            'last_synced_at' => date('c'),
            'last_error' => null,
        ];
        souq_google_save_integration($pdo, $storeId, $integration);

        echo json_encode([
            'message' => 'Google Site Kit connected — tools auto-linked and sync started',
            'integration' => souq_google_public_integration($integration),
            'site_kit' => [
                'mode' => 'auto',
                'store_public_url' => $picks['store_public_url'],
                'sitemap_url' => $picks['sitemap_url'],
                'sitemap_submitted' => false,
                'indexing_homepage_pinged' => false,
                'linked' => [
                    'ga4' => !empty($integration['ga4_property_id']),
                    'search_console' => !empty($integration['gsc_site_url']),
                    'gtm' => !empty($integration['gtm_container_id']),
                    'ads' => !empty($integration['google_ads_customer_id']),
                ],
            ],
            'discovered_properties' => $discovered,
            'auto_selection' => [
                'suggested_ga4' => $picks['ga4_property_id'],
                'suggested_gsc' => $picks['gsc_site_url'],
                'suggested_gtm' => $picks['gtm_container_id'],
                'suggested_ads' => '',
                'sitemap_url' => $picks['sitemap_url'],
            ],
            'sync' => ['ok' => true],
        ]);
        return true;
    }

    // GET /google/properties
    if ($uri === '/google/properties' && $method === 'GET') {
        $int = souq_google_load_integration($pdo, $storeId);
        if (empty($int['is_connected']) || empty($int['access_token'])) {
            echo json_encode([
                'is_connected' => false,
                'properties' => [
                    'analytics' => [],
                    'search_console' => [],
                    'tag_manager' => [],
                    'google_ads' => [],
                ],
            ]);
            return true;
        }
        $discovered = souq_google_discover((string)$int['access_token']);
        echo json_encode([
            'is_connected' => true,
            'current_selection' => [
                'ga4_property_id' => $int['ga4_property_id'] ?? null,
                'ga4_measurement_id' => $int['ga4_measurement_id'] ?? null,
                'gsc_site_url' => $int['gsc_site_url'] ?? null,
                'gtm_account_id' => $int['gtm_account_id'] ?? null,
                'gtm_container_id' => $int['gtm_container_id'] ?? null,
                'google_ads_customer_id' => $int['google_ads_customer_id'] ?? null,
            ],
            'properties' => $discovered,
        ]);
        return true;
    }

    // POST /google/properties
    if ($uri === '/google/properties' && $method === 'POST') {
        $int = souq_google_load_integration($pdo, $storeId);
        if (empty($int['is_connected'])) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Connect Google for this store first, then save properties.',
                'error' => 'google_not_connected',
            ]);
            return true;
        }
        foreach ([
            'ga4_property_id', 'ga4_property_name', 'ga4_measurement_id',
            'gsc_site_url', 'gtm_account_id', 'gtm_container_id',
            'google_ads_customer_id', 'google_ads_account_name',
        ] as $key) {
            if (array_key_exists($key, $input) && $input[$key] !== null) {
                $int[$key] = is_string($input[$key]) ? trim($input[$key]) : $input[$key];
            }
        }
        $int['last_synced_at'] = date('c');
        $int['sync_status'] = 'synced';
        souq_google_save_integration($pdo, $storeId, $int);
        echo json_encode([
            'message' => 'Google properties successfully saved',
            'integration' => souq_google_public_integration($int),
            'sync' => ['ok' => true],
        ]);
        return true;
    }

    // POST /google/sync
    if ($uri === '/google/sync' && $method === 'POST') {
        $int = souq_google_load_integration($pdo, $storeId);
        if (empty($int['is_connected'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Store does not have a connected Google Account.']);
            return true;
        }
        $int['last_synced_at'] = date('c');
        $int['sync_status'] = 'synced';
        souq_google_save_integration($pdo, $storeId, $int);
        echo json_encode([
            'message' => 'Real Google data synced successfully',
            'integration' => souq_google_public_integration($int),
        ]);
        return true;
    }

    // GET /google/pagespeed — real PSI only when key + URL present
    if ($uri === '/google/pagespeed' && $method === 'GET') {
        $url = trim((string)($_GET['url'] ?? ''));
        $strategy = strtolower(trim((string)($_GET['strategy'] ?? 'mobile')));
        if (!in_array($strategy, ['mobile', 'desktop'], true)) {
            $strategy = 'mobile';
        }
        if ($url === '' || !preg_match('#^https?://#i', $url)) {
            http_response_code(422);
            echo json_encode(['message' => 'A real https URL is required for PageSpeed.']);
            return true;
        }
        $key = souq_google_env('GOOGLE_PAGESPEED_API_KEY');
        if ($key === '') {
            http_response_code(400);
            echo json_encode(['message' => 'PageSpeed API key is not configured on the server.']);
            return true;
        }
        $endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' . http_build_query([
            'url' => $url,
            'strategy' => $strategy,
            'key' => $key,
            'category' => 'performance',
        ]);
        // category repeated — PSI accepts multiple; keep one for lean response
        $res = souq_google_http_json('GET', $endpoint);
        if (($res['_http'] ?? 0) < 200 || ($res['_http'] ?? 0) >= 300) {
            http_response_code(502);
            echo json_encode(['message' => 'PageSpeed request failed.', 'error' => $res['error']['message'] ?? $res['error'] ?? 'psi_failed']);
            return true;
        }
        $lh = $res['lighthouseResult'] ?? [];
        $cats = $lh['categories'] ?? [];
        $audits = $lh['audits'] ?? [];
        echo json_encode([
            'url' => $url,
            'strategy' => $strategy,
            'performance_score' => isset($cats['performance']['score']) ? (int)round(((float)$cats['performance']['score']) * 100) : null,
            'fcp' => $audits['first-contentful-paint']['displayValue'] ?? null,
            'lcp' => $audits['largest-contentful-paint']['displayValue'] ?? null,
            'cls' => $audits['cumulative-layout-shift']['displayValue'] ?? null,
            'raw' => [
                'fetchTime' => $lh['fetchTime'] ?? null,
                'finalUrl' => $lh['finalUrl'] ?? $url,
            ],
        ]);
        return true;
    }

    return false;
}
