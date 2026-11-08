<?php
/**
 * Live Hostinger gateway extensions: design-templates, media library, AI media, SEO write.
 * Real store_id isolation — no fake metrics.
 */
declare(strict_types=1);

function souq_load_root_env(): array
{
    static $vars = null;
    if (is_array($vars)) {
        return $vars;
    }
    $vars = [];
    $candidates = [
        dirname(__DIR__) . '/.env',
        dirname(__DIR__, 2) . '/.env',
        __DIR__ . '/.env',
    ];
    foreach ($candidates as $path) {
        if (!is_readable($path)) {
            continue;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            $vars[$k] = trim($v, " \t\"'");
        }
        break;
    }
    return $vars;
}

function souq_ensure_live_extension_tables(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL,
            file_name TEXT,
            file_type TEXT DEFAULT 'image',
            mime TEXT,
            size_bytes INTEGER DEFAULT 0,
            width INTEGER,
            height INTEGER,
            url TEXT,
            optimized_url TEXT,
            webp_url TEXT,
            thumbnail_url TEXT,
            poster_url TEXT,
            alt TEXT,
            caption TEXT,
            folder TEXT DEFAULT 'general',
            processing_status TEXT DEFAULT 'ready',
            optimization_status TEXT DEFAULT 'optimized',
            version INTEGER DEFAULT 1,
            metadata TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_media_store ON media(store_id);

        CREATE TABLE IF NOT EXISTS ai_generation_usage (
            store_id TEXT NOT NULL,
            period_key TEXT NOT NULL,
            images_used INTEGER DEFAULT 0,
            videos_used INTEGER DEFAULT 0,
            updated_at TEXT,
            PRIMARY KEY (store_id, period_key)
        );
    ");
}

function souq_store_row(PDO $pdo, string $storeId): ?array
{
    $st = $pdo->prepare('SELECT * FROM stores WHERE id = ?');
    $st->execute([$storeId]);
    $row = $st->fetch();
    return $row ?: null;
}

function souq_store_plan_code(PDO $pdo, string $storeId): string
{
    $row = souq_store_row($pdo, $storeId);
    if (!$row) {
        return 'free';
    }
    $data = json_decode((string)($row['data'] ?? '{}'), true);
    if (!is_array($data)) {
        $data = [];
    }
    $plan = strtolower((string)($data['plan'] ?? 'free'));
    $granted = !empty($data['masterGrantedPro']) || !empty($data['master_granted_pro']);
    if ($granted && in_array($plan, ['free', 'paid'], true)) {
        return 'pro';
    }
    return in_array($plan, ['free', 'paid', 'pro', 'premium', 'custom'], true) ? $plan : 'free';
}

/** @return array{images:int,videos:int} */
function souq_ai_limits(string $plan): array
{
    return match ($plan) {
        'paid' => ['images' => 25, 'videos' => 0],
        'pro' => ['images' => 60, 'videos' => 8],
        'premium' => ['images' => 200, 'videos' => 30],
        'custom' => ['images' => 500, 'videos' => 50],
        default => ['images' => 8, 'videos' => 0],
    };
}

function souq_ai_period_key(): string
{
    try {
        $tz = new DateTimeZone('Asia/Riyadh');
        return (new DateTimeImmutable('now', $tz))->format('Y-m');
    } catch (Throwable) {
        return date('Y-m');
    }
}

function souq_ai_quota_snapshot(PDO $pdo, string $storeId): array
{
    $plan = souq_store_plan_code($pdo, $storeId);
    $limits = souq_ai_limits($plan);
    $period = souq_ai_period_key();
    $st = $pdo->prepare('SELECT images_used, videos_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
    $st->execute([$storeId, $period]);
    $row = $st->fetch() ?: ['images_used' => 0, 'videos_used' => 0];
    $imagesUsed = (int)$row['images_used'];
    $videosUsed = (int)$row['videos_used'];
    $env = souq_load_root_env();
    $key = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    $imageReady = $key !== '' && $key !== 'MY_GEMINI_API_KEY';
    $videoReady = $imageReady && filter_var($env['GEMINI_VIDEO_ENABLED'] ?? false, FILTER_VALIDATE_BOOLEAN);

    return [
        'store_id' => $storeId,
        'period_key' => $period,
        'plan_code' => $plan,
        'images_limit' => $limits['images'],
        'images_used' => $imagesUsed,
        'images_remaining' => max(0, $limits['images'] - $imagesUsed),
        'videos_limit' => $limits['videos'],
        'videos_used' => $videosUsed,
        'videos_remaining' => max(0, $limits['videos'] - $videosUsed),
        'image_provider_ready' => $imageReady,
        'video_provider_ready' => $videoReady,
    ];
}

function souq_ai_consume(PDO $pdo, string $storeId, string $kind): array
{
    $snap = souq_ai_quota_snapshot($pdo, $storeId);
    if ($kind === 'video') {
        if ($snap['videos_remaining'] <= 0) {
            return ['ok' => false, 'code' => 'video_quota_exhausted', 'snapshot' => $snap];
        }
    } elseif ($snap['images_remaining'] <= 0) {
        return ['ok' => false, 'code' => 'image_quota_exhausted', 'snapshot' => $snap];
    }

    $period = $snap['period_key'];
    $st = $pdo->prepare('SELECT images_used, videos_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
    $st->execute([$storeId, $period]);
    $row = $st->fetch();
    $images = (int)($row['images_used'] ?? 0);
    $videos = (int)($row['videos_used'] ?? 0);
    if ($kind === 'video') {
        $videos++;
    } else {
        $images++;
    }
    if ($row) {
        $pdo->prepare('UPDATE ai_generation_usage SET images_used = ?, videos_used = ?, updated_at = ? WHERE store_id = ? AND period_key = ?')
            ->execute([$images, $videos, date('c'), $storeId, $period]);
    } else {
        $pdo->prepare('INSERT INTO ai_generation_usage (store_id, period_key, images_used, videos_used, updated_at) VALUES (?,?,?,?,?)')
            ->execute([$storeId, $period, $images, $videos, date('c')]);
    }

    return ['ok' => true, 'snapshot' => souq_ai_quota_snapshot($pdo, $storeId)];
}

function souq_ai_refund_image(PDO $pdo, string $storeId): void
{
    $period = souq_ai_period_key();
    $st = $pdo->prepare('SELECT images_used FROM ai_generation_usage WHERE store_id = ? AND period_key = ?');
    $st->execute([$storeId, $period]);
    $used = max(0, (int)($st->fetchColumn() ?: 0) - 1);
    $pdo->prepare('UPDATE ai_generation_usage SET images_used = ?, updated_at = ? WHERE store_id = ? AND period_key = ?')
        ->execute([$used, date('c'), $storeId, $period]);
}

function souq_gemini_generate_image(string $prompt): array
{
    $env = souq_load_root_env();
    $apiKey = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return ['ok' => false, 'code' => 'provider_not_connected', 'message' => 'AI image provider is not connected.'];
    }
    $model = trim((string)($env['GEMINI_IMAGE_MODEL'] ?? 'gemini-2.0-flash-preview-image-generation'));
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $body = json_encode([
        'contents' => [[
            'parts' => [[
                'text' => 'Create a high-quality Saudi e-commerce marketing visual. No watermarks. Prompt: ' . $prompt,
            ]],
        ]],
        'generationConfig' => [
            'responseModalities' => ['TEXT', 'IMAGE'],
            'temperature' => 0.8,
        ],
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 90,
    ]);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $status < 200 || $status >= 300) {
        $msg = $err !== '' ? $err : 'AI image provider returned an error.';
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded) && !empty($decoded['error']['message'])) {
            $msg = (string)$decoded['error']['message'];
        }
        return ['ok' => false, 'code' => 'provider_error', 'message' => $msg];
    }

    $json = json_decode($raw, true);
    $parts = $json['candidates'][0]['content']['parts'] ?? [];
    if (!is_array($parts)) {
        return ['ok' => false, 'code' => 'empty_result', 'message' => 'AI image provider returned no image data.'];
    }
    foreach ($parts as $part) {
        $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
        if (!is_array($inline) || empty($inline['data'])) {
            continue;
        }
        $mime = (string)($inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png');
        return [
            'ok' => true,
            'mime' => $mime !== '' ? $mime : 'image/png',
            'base64' => (string)$inline['data'],
            'model' => $model,
        ];
    }

    return ['ok' => false, 'code' => 'empty_result', 'message' => 'AI image provider returned text only — no image bytes.'];
}

function souq_media_row(array $row): array
{
    $v = (int)($row['version'] ?? 1);
    $url = (string)($row['url'] ?? '');
    $path = strtok($url, '?') ?: $url;
    $versioned = $path !== '' ? ($path . '?v=' . ($row['updated_at'] ? strtotime((string)$row['updated_at']) : $v)) : $url;
    return [
        'id' => $row['id'],
        'store_id' => $row['store_id'],
        'file_name' => $row['file_name'],
        'file_type' => $row['file_type'] ?? 'image',
        'mime' => $row['mime'],
        'size_bytes' => (int)($row['size_bytes'] ?? 0),
        'width' => $row['width'] !== null ? (int)$row['width'] : null,
        'height' => $row['height'] !== null ? (int)$row['height'] : null,
        'url' => $versioned,
        'optimized_url' => $versioned,
        'webp_url' => $versioned,
        'thumbnail_url' => $versioned,
        'poster_url' => $row['poster_url'] ?? null,
        'alt' => $row['alt'],
        'caption' => $row['caption'],
        'folder' => $row['folder'] ?? 'general',
        'processing_status' => $row['processing_status'] ?? 'ready',
        'optimization_status' => $row['optimization_status'] ?? 'optimized',
        'version' => $v,
        'metadata' => !empty($row['metadata']) ? (json_decode((string)$row['metadata'], true) ?: null) : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function souq_save_binary_media(PDO $pdo, string $storeId, string $binary, string $mime, string $fileName, string $folder, ?string $alt, ?string $caption, ?array $metadata): array
{
    $ext = str_contains($mime, 'webp') ? 'webp' : (str_contains($mime, 'png') ? 'png' : (str_contains($mime, 'gif') ? 'gif' : 'jpg'));
    $safe = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($fileName, PATHINFO_FILENAME)) ?: 'media';
    $filename = $safe . '-' . time() . '-' . substr(md5(uniqid('', true)), 0, 6) . '.' . $ext;
    $uploadDir = dirname(__DIR__) . '/images/uploads/' . $storeId;
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }
    $dest = $uploadDir . '/' . $filename;
    file_put_contents($dest, $binary);
    $url = '/images/uploads/' . rawurlencode($storeId) . '/' . $filename;
    $width = null;
    $height = null;
    if (function_exists('getimagesizefromstring')) {
        $info = @getimagesizefromstring($binary);
        if (is_array($info)) {
            $width = $info[0] ?? null;
            $height = $info[1] ?? null;
        }
    }
    $id = 'med-' . substr(md5(uniqid($storeId, true)), 0, 12);
    $now = date('c');
    $pdo->prepare('INSERT INTO media (id, store_id, file_name, file_type, mime, size_bytes, width, height, url, optimized_url, webp_url, thumbnail_url, alt, caption, folder, processing_status, optimization_status, version, metadata, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([
            $id, $storeId, $filename, 'image', $mime, strlen($binary), $width, $height,
            $url, $url, $url, $url, $alt ?: $safe, $caption, $folder, 'ready', 'optimized', 1,
            $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null, $now, $now,
        ]);
    $st = $pdo->prepare('SELECT * FROM media WHERE id = ? AND store_id = ?');
    $st->execute([$id, $storeId]);
    return souq_media_row($st->fetch());
}

/**
 * @return bool true if request handled
 */
function souq_live_extensions_dispatch(PDO $pdo, string $uri, string $method, string $storeId, array $input): bool
{
    souq_ensure_live_extension_tables($pdo);

    if ($uri === '/design-templates/entitlements' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $plan = souq_store_plan_code($pdo, $storeId);
        $row = souq_store_row($pdo, $storeId);
        $data = $row ? (json_decode((string)($row['data'] ?? '{}'), true) ?: []) : [];
        $override = $data['canvaTemplatesPerCategory'] ?? $data['canva_templates_per_category'] ?? null;
        $limit = in_array($plan, ['pro', 'premium', 'custom'], true)
            ? null
            : ((is_numeric($override) && (int)$override > 0) ? (int)$override : 5);
        echo json_encode(['data' => [
            'store_id' => $storeId,
            'plan_code' => $plan,
            'billed_code' => strtolower((string)($data['plan'] ?? 'free')),
            'master_granted_pro' => !empty($data['masterGrantedPro']) || !empty($data['master_granted_pro']),
            'media_studio' => true,
            'canva_templates_per_category' => $limit,
            'canva_categories' => ['product', 'category', 'banner', 'social'],
            'free_default' => 5,
        ]]);
        return true;
    }

    if ($uri === '/ai-media/quota' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        echo json_encode(['data' => souq_ai_quota_snapshot($pdo, $storeId)]);
        return true;
    }

    if ($uri === '/ai-media/generate' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $kind = (($input['kind'] ?? 'image') === 'video') ? 'video' : 'image';
        $prompt = trim((string)($input['prompt'] ?? ''));
        $aspect = (string)($input['aspect'] ?? '1:1');
        if (strlen($prompt) < 8) {
            http_response_code(422);
            echo json_encode(['message' => 'Prompt must be at least 8 characters.']);
            return true;
        }
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        if ($kind === 'video') {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI video generation is not connected yet. Waiting for provider.',
                'code' => 'video_provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        if (!$snap['image_provider_ready']) {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        $consume = souq_ai_consume($pdo, $storeId, 'image');
        if (!$consume['ok']) {
            http_response_code(429);
            echo json_encode([
                'message' => 'Monthly AI image generation limit reached for this store.',
                'code' => $consume['code'],
                'data' => ['quota' => $consume['snapshot']],
            ]);
            return true;
        }
        $aspectHint = match ($aspect) {
            '4:5' => 'Portrait 4:5 Instagram feed.',
            '9:16' => 'Vertical 9:16 Reels / Stories.',
            '16:9' => 'Landscape 16:9 banner.',
            default => 'Square 1:1 social post.',
        };
        $result = souq_gemini_generate_image($prompt . ' ' . $aspectHint);
        if (!$result['ok']) {
            souq_ai_refund_image($pdo, $storeId);
            http_response_code(502);
            echo json_encode([
                'message' => $result['message'],
                'code' => $result['code'],
                'data' => ['quota' => souq_ai_quota_snapshot($pdo, $storeId)],
            ]);
            return true;
        }
        $binary = base64_decode((string)$result['base64'], true);
        if ($binary === false || $binary === '') {
            souq_ai_refund_image($pdo, $storeId);
            http_response_code(502);
            echo json_encode(['message' => 'Failed to decode AI image bytes.', 'code' => 'decode_error']);
            return true;
        }
        $title = trim((string)($input['title'] ?? '')) ?: ('ai-' . substr(md5($prompt), 0, 8));
        $media = souq_save_binary_media(
            $pdo,
            $storeId,
            $binary,
            (string)$result['mime'],
            $title,
            'ai-generated',
            $title,
            $prompt,
            ['source' => 'ai_generator', 'prompt' => $prompt, 'aspect' => $aspect, 'model' => $result['model'], 'kind' => 'image']
        );
        echo json_encode([
            'data' => [
                'kind' => 'image',
                'saved' => true,
                'quota' => souq_ai_quota_snapshot($pdo, $storeId),
                'media' => array_merge($media, [
                    'prompt' => $prompt,
                    'aspect' => $aspect,
                    'model' => $result['model'],
                    'preview_data_url' => 'data:' . $result['mime'] . ';base64,' . $result['base64'],
                ]),
            ],
            'message' => 'AI image generated for this store.',
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        http_response_code(201);
        return true;
    }

    // Media library
    if ($uri === '/media' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $q = $pdo->prepare('SELECT * FROM media WHERE store_id = ? ORDER BY datetime(created_at) DESC');
        $q->execute([$storeId]);
        $rows = array_map('souq_media_row', $q->fetchAll());
        echo json_encode([
            'data' => $rows,
            'meta' => [
                'current_page' => 1,
                'per_page' => max(1, count($rows)),
                'total' => count($rows),
                'last_page' => 1,
            ],
        ]);
        return true;
    }

    if ($uri === '/media' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        if (!empty($_FILES['file']['tmp_name'])) {
            $tmp = $_FILES['file']['tmp_name'];
            $binary = (string)file_get_contents($tmp);
            $mime = (string)($_FILES['file']['type'] ?: 'image/jpeg');
            $name = (string)($_FILES['file']['name'] ?: 'upload.jpg');
            $row = souq_save_binary_media($pdo, $storeId, $binary, $mime, $name, (string)($_POST['folder'] ?? 'general'), $_POST['alt'] ?? null, $_POST['caption'] ?? null, null);
            http_response_code(201);
            echo json_encode(['data' => $row, 'message' => 'File uploaded', 'store_id' => $storeId]);
            return true;
        }
        $rawUrl = (string)($input['url'] ?? '');
        if (preg_match('/^data:([^;]+);base64,(.+)$/', $rawUrl, $m)) {
            $binary = base64_decode($m[2], true);
            if ($binary === false) {
                http_response_code(422);
                echo json_encode(['message' => 'Invalid base64 media.']);
                return true;
            }
            $row = souq_save_binary_media(
                $pdo,
                $storeId,
                $binary,
                $m[1],
                (string)($input['file_name'] ?? 'media-asset'),
                (string)($input['folder'] ?? 'general'),
                $input['alt'] ?? null,
                $input['caption'] ?? null,
                is_array($input['metadata'] ?? null) ? $input['metadata'] : null
            );
            http_response_code(201);
            echo json_encode(['data' => $row, 'message' => 'Media asset saved', 'store_id' => $storeId]);
            return true;
        }
        if ($rawUrl !== '') {
            $id = 'med-' . substr(md5(uniqid($storeId, true)), 0, 12);
            $now = date('c');
            $pdo->prepare('INSERT INTO media (id, store_id, file_name, file_type, mime, size_bytes, width, height, url, optimized_url, webp_url, thumbnail_url, alt, caption, folder, processing_status, optimization_status, version, metadata, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
                ->execute([
                    $id, $storeId, $input['file_name'] ?? 'media-asset', $input['file_type'] ?? 'image', $input['mime'] ?? 'image/jpeg',
                    (int)($input['size_bytes'] ?? 0), $input['width'] ?? null, $input['height'] ?? null,
                    $rawUrl, $input['optimized_url'] ?? $rawUrl, $input['webp_url'] ?? $rawUrl, $input['thumbnail_url'] ?? $rawUrl,
                    $input['alt'] ?? null, $input['caption'] ?? null, $input['folder'] ?? 'general',
                    'ready', 'optimized', 1, isset($input['metadata']) ? json_encode($input['metadata']) : null, $now, $now,
                ]);
            $st = $pdo->prepare('SELECT * FROM media WHERE id = ? AND store_id = ?');
            $st->execute([$id, $storeId]);
            http_response_code(201);
            echo json_encode(['data' => souq_media_row($st->fetch()), 'message' => 'Media asset saved', 'store_id' => $storeId]);
            return true;
        }
        http_response_code(400);
        echo json_encode(['message' => 'No file or url provided.']);
        return true;
    }

    if (preg_match('#^/media/([^/]+)$#', $uri, $mm) && $method === 'DELETE') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $pdo->prepare('DELETE FROM media WHERE id = ? AND store_id = ?')->execute([$mm[1], $storeId]);
        echo json_encode(['success' => true]);
        return true;
    }

    // SEO write (real store data only)
    if ($uri === '/seo' && in_array($method, ['PATCH', 'PUT', 'POST'], true)) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $row = souq_store_row($pdo, $storeId);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['message' => 'Store not found']);
            return true;
        }
        $data = json_decode((string)($row['data'] ?? '{}'), true);
        if (!is_array($data)) {
            $data = [];
        }
        $seo = is_array($data['seo'] ?? null) ? $data['seo'] : [];
        $map = [
            'meta_title' => 'metaTitle',
            'meta_description' => 'metaDescription',
            'ga4_measurement_id' => 'ga4MeasurementId',
            'keywords' => 'keywords',
        ];
        foreach ($map as $apiKey => $seoKey) {
            if (array_key_exists($apiKey, $input)) {
                $seo[$seoKey] = $input[$apiKey];
            }
            if (array_key_exists($seoKey, $input)) {
                $seo[$seoKey] = $input[$seoKey];
            }
        }
        if (isset($input['extra']) && is_array($input['extra'])) {
            $seo = array_merge($seo, $input['extra']);
        }
        $data['seo'] = $seo;
        if (!empty($seo['ga4MeasurementId'])) {
            $data['ga4MeasurementId'] = $seo['ga4MeasurementId'];
        }
        $pdo->prepare('UPDATE stores SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $storeId]);

        $ga = strtoupper(trim((string)($seo['ga4MeasurementId'] ?? '')));
        $googleConnected = (bool)preg_match('/^G-[A-Z0-9]+$/', $ga);
        $host = function_exists('souq_request_host') ? souq_request_host() : '';
        $publicHost = '';
        if ($host && function_exists('souq_host_store') && souq_host_store($host) === $storeId) {
            $publicHost = $host;
        } elseif (!empty($row['domain'])) {
            $publicHost = strtolower((string)preg_replace('#^https?://#', '', (string)$row['domain']));
            $publicHost = explode('/', $publicHost)[0];
        }
        echo json_encode(['data' => [
            'store_id' => $storeId,
            'google_connected' => $googleConnected,
            'ga4_measurement_id' => $googleConnected ? $ga : '',
            'meta_title' => (string)($seo['metaTitle'] ?? ''),
            'meta_description' => (string)($seo['metaDescription'] ?? ''),
            'keywords' => $seo['keywords'] ?? [],
            'sitemap_url' => $publicHost !== '' ? 'https://' . $publicHost . '/sitemap.xml' : '',
            'indexed_urls_count' => null,
            'total_search_clicks' => null,
            'total_search_impressions' => null,
            'avg_ctr' => null,
            'avg_position' => null,
            'top_queries' => [],
            'extra' => new stdClass(),
        ]]);
        return true;
    }

    return false;
}
