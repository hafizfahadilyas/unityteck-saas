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
    $st = $pdo->query('SELECT id, name, slug, domain, data FROM stores');
    while ($row = $st->fetch()) {
        $data = json_decode((string)($row['data'] ?? '{}'), true);
        if (!is_array($data)) {
            $data = [];
        }
        $owners = [
            strtolower(trim((string)($data['ownerEmail'] ?? ''))),
            strtolower(trim((string)($data['owner_email'] ?? ''))),
            strtolower(trim((string)($data['loginEmail'] ?? ''))),
        ];
        if (in_array($email, $owners, true)) {
            return $row;
        }
        // Known platform aliases (coffee / flowers / cars)
        $id = (string)$row['id'];
        $alias = match ($id) {
            'store-coffee' => ['mieraf.sa8@gmail.com'],
            'store-1' => ['giftshop2030m@gmail.com', 'p4pakistan098@gmail.com'],
            'store-bleco' => ['support@tanjeedmakkah.com', 'admin@bleco.sa', 'alsaeedi@tanjeedmakkah.com'],
            default => [],
        };
        if (in_array($email, $alias, true)) {
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

/**
 * @return bool true if handled
 */
function souq_session_lite_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    // POST /auth/clerk/exchange
    if ($uri === '/auth/clerk/exchange' && $method === 'POST') {
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
                    'name' => 'Unityteck Master SuperAdmin',
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
            $st = $pdo->prepare('SELECT id, name, slug, domain, data FROM stores WHERE id = ?');
            $st->execute([$reqStore]);
            $cand = $st->fetch();
            if ($cand) {
                $data = json_decode((string)($cand['data'] ?? '{}'), true) ?: [];
                $owners = [
                    strtolower(trim((string)($data['ownerEmail'] ?? ''))),
                    strtolower(trim((string)($data['owner_email'] ?? ''))),
                    strtolower(trim((string)($data['loginEmail'] ?? ''))),
                ];
                $aliasOk = match ((string)$cand['id']) {
                    'store-coffee' => in_array($email, ['mieraf.sa8@gmail.com'], true),
                    'store-1' => in_array($email, ['giftshop2030m@gmail.com', 'p4pakistan098@gmail.com'], true),
                    'store-bleco' => in_array($email, ['support@tanjeedmakkah.com', 'admin@bleco.sa', 'alsaeedi@tanjeedmakkah.com'], true),
                    default => false,
                };
                if (in_array($email, $owners, true) || $aliasOk) {
                    $row = $cand;
                }
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

        $token = 'lite|' . bin2hex(random_bytes(24));
        $name = (string)($row['name'] ?? 'Store Admin');
        echo json_encode([
            'token' => $token,
            'portal' => 'store',
            'user' => [
                'id' => 'usr-' . substr(md5($email . $row['id']), 0, 10),
                'name' => $name,
                'email' => $email,
                'role' => 'store_owner',
                'role_label' => 'Store Owner',
                'role_level' => 50,
            ],
            'abilities' => ['store:*'],
            'store_id' => (string)$row['id'],
            'store_name' => $name,
        ]);
        return true;
    }

    // GET|PUT /stores/{id}/store-settings
    if (preg_match('#^/stores/([^/]+)/store-settings$#', $uri, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'POST'], true)) {
        $sid = (string)$m[1];
        $st = $pdo->prepare('SELECT id, data FROM stores WHERE id = ?');
        $st->execute([$sid]);
        $row = $st->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Store not found.']);
            return true;
        }
        $data = json_decode((string)($row['data'] ?? '{}'), true);
        if (!is_array($data)) {
            $data = [];
        }
        if ($method === 'GET') {
            $settings = is_array($data['settings'] ?? null) ? $data['settings'] : [];
            // Merge common identity fields merchants expect
            if (!isset($settings['branding']) && isset($data['branding'])) {
                $settings['branding'] = $data['branding'];
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
        $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $sid]);
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

    return false;
}
