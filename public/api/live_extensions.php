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
        __DIR__ . '/.env',
        dirname(__DIR__) . '/.env',
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__, 2) . '/apps/api/.env',
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
            if ($k === '') {
                continue;
            }
            // Later files fill missing keys only — first readable file wins per key
            if (!array_key_exists($k, $vars)) {
                $vars[$k] = trim($v, " \t\"'");
            }
        }
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

        CREATE TABLE IF NOT EXISTS store_ai_brand_profiles (
            id TEXT PRIMARY KEY,
            store_id TEXT NOT NULL UNIQUE,
            palette_hex TEXT,
            persona TEXT DEFAULT 'modern',
            brand_lock_default INTEGER DEFAULT 1,
            logo_overlay_enabled INTEGER DEFAULT 0,
            logo_overlay_position TEXT DEFAULT 'bottom_end',
            logo_url TEXT,
            style_reference_urls TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_ai_brand_store ON store_ai_brand_profiles(store_id);
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
        'models' => souq_ai_model_catalog(),
        'default_model' => souq_ai_resolve_model(null, $env),
        'image_sizes' => ['1K', '2K', '4K'],
        'aspects' => ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'],
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

function souq_ai_image_models(): array
{
    return [
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image',
    ];
}

function souq_ai_model_catalog(): array
{
    return [
        ['id' => 'gemini-2.5-flash-image', 'label_en' => 'Flash Image (fast)', 'label_ar' => 'فلاش صورة (سريع)', 'tier' => 'standard'],
        ['id' => 'gemini-3.1-flash-lite-image', 'label_en' => 'Flash Lite (fastest)', 'label_ar' => 'فلاش لايت (الأسرع)', 'tier' => 'standard'],
        ['id' => 'gemini-3.1-flash-image', 'label_en' => 'Flash Image 3.1 (balanced)', 'label_ar' => 'فلاش صورة ٣٫١ (متوازن)', 'tier' => 'balanced'],
        ['id' => 'gemini-3-pro-image', 'label_en' => 'Pro Image (highest quality)', 'label_ar' => 'برو صورة (أعلى جودة)', 'tier' => 'pro'],
    ];
}

function souq_ai_resolve_model(?string $requested, array $env): string
{
    $requested = trim((string)$requested);
    $allowed = souq_ai_image_models();
    if ($requested !== '' && in_array($requested, $allowed, true)) {
        return $requested;
    }
    $configured = trim((string)($env['GEMINI_IMAGE_MODEL'] ?? 'gemini-2.5-flash-image'));
    if (in_array($configured, $allowed, true)) {
        return $configured;
    }
    return 'gemini-2.5-flash-image';
}

function souq_gemini_curl_json(string $url, array $payload, int $timeout = 120): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
    ]);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['raw' => $raw, 'status' => $status, 'err' => $err];
}

function souq_gemini_parse_image(string $raw, string $model): array
{
    $json = json_decode($raw, true);
    $block = strtoupper((string)($json['promptFeedback']['blockReason'] ?? $json['candidates'][0]['finishReason'] ?? ''));
    if (in_array($block, ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY'], true)) {
        return ['ok' => false, 'code' => 'safety_blocked', 'message' => 'Prompt was blocked by safety filters. Soften the description and try again.'];
    }
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

function souq_ai_brand_personas(): array
{
    return ['minimalist', 'luxury', 'vibrant', 'eco', 'modern', 'traditional_saudi', 'playful', 'cinematic'];
}

function souq_ai_campaign_presets(): array
{
    return ['none', 'founding_day', 'ramadan', 'eid', 'national_day', 'black_friday', 'white_friday', 'back_to_school', 'mothers_day', 'seasonal_sale'];
}

function souq_ai_output_templates(): array
{
    return [
        'product_square' => '1:1',
        'instagram_post' => '4:5',
        'instagram_story' => '9:16',
        'snapchat_story' => '9:16',
        'store_banner' => '16:9',
        'web_landscape' => '4:3',
        'catalog_portrait' => '3:4',
    ];
}

function souq_ai_normalize_hex(?string $hex): ?string
{
    $h = strtoupper(trim((string)$hex));
    if ($h === '') {
        return null;
    }
    if (!str_starts_with($h, '#')) {
        $h = '#' . $h;
    }
    if (!preg_match('/^#[0-9A-F]{6}$/', $h) && !preg_match('/^#[0-9A-F]{3}$/', $h)) {
        return null;
    }
    if (strlen($h) === 4) {
        $h = '#' . $h[1] . $h[1] . $h[2] . $h[2] . $h[3] . $h[3];
    }
    return $h;
}

/** @param mixed $raw @return list<string> */
function souq_ai_normalize_palette($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $item) {
        $hex = souq_ai_normalize_hex(is_string($item) ? $item : null);
        if ($hex !== null && !in_array($hex, $out, true)) {
            $out[] = $hex;
        }
        if (count($out) >= 8) {
            break;
        }
    }
    return $out;
}

/** @param mixed $raw @return list<string> */
function souq_ai_normalize_style_refs($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $url) {
        if (!is_string($url)) {
            continue;
        }
        $u = trim($url);
        if ($u === '') {
            continue;
        }
        if (!str_starts_with($u, 'http') && !str_starts_with($u, '/') && !str_starts_with($u, 'data:')) {
            continue;
        }
        if (!in_array($u, $out, true)) {
            $out[] = $u;
        }
        if (count($out) >= 15) {
            break;
        }
    }
    return $out;
}

function souq_ai_persona_hint(string $persona): string
{
    return match ($persona) {
        'minimalist' => 'minimalist and modern style, clean negative space',
        'luxury' => 'luxury cinematic lighting, premium refined aesthetic',
        'vibrant' => 'vibrant energetic color blocking, bold commercial energy',
        'eco' => 'eco-friendly natural materials, soft organic textures',
        'traditional_saudi' => 'Saudi heritage elegance, warm hospitality mood',
        'playful' => 'playful friendly lifestyle composition',
        'cinematic' => 'cinematic shallow depth of field, dramatic premium light',
        default => 'modern clean commercial brand style',
    };
}

function souq_ai_campaign_hint(string $campaign): string
{
    return match ($campaign) {
        'founding_day' => 'Saudi Founding Day campaign mood while preserving store brand colors',
        'ramadan' => 'Ramadan campaign atmosphere while preserving store brand colors',
        'eid' => 'Eid celebration campaign mood while preserving store brand colors',
        'national_day' => 'Saudi National Day campaign mood while preserving store brand colors',
        'black_friday' => 'Black Friday promotional urgency while preserving store brand colors',
        'white_friday' => 'White Friday KSA sale campaign while preserving store brand colors',
        'back_to_school' => 'back-to-school campaign mood while preserving store brand colors',
        'mothers_day' => 'Mother\'s Day gift campaign mood while preserving store brand colors',
        'seasonal_sale' => 'seasonal sale promotional layout while preserving store brand colors',
        default => '',
    };
}

/**
 * @param array{
 *   palette_hex?: list<string>|null,
 *   persona?: string|null,
 *   brand_lock?: bool,
 *   campaign_preset?: string|null,
 *   product_injection?: bool,
 *   match_perspective?: bool,
 *   accent_color?: string|null
 * } $brand
 */
function souq_ai_brand_merge_prompt(string $userPrompt, array $brand = []): string
{
    $prompt = trim($userPrompt);
    if ($prompt === '' || empty($brand['brand_lock'])) {
        return $prompt;
    }
    $parts = [$prompt];
    $persona = strtolower(trim((string)($brand['persona'] ?? 'modern')));
    if (!in_array($persona, souq_ai_brand_personas(), true)) {
        $persona = 'modern';
    }
    $parts[] = souq_ai_persona_hint($persona);
    $colors = souq_ai_normalize_palette($brand['palette_hex'] ?? null);
    $accent = souq_ai_normalize_hex($brand['accent_color'] ?? null);
    if ($accent !== null && !in_array($accent, $colors, true)) {
        array_unshift($colors, $accent);
    }
    if ($colors !== []) {
        $parts[] = 'dominant brand colors strictly: ' . implode(' and ', array_slice($colors, 0, 5));
        $parts[] = 'apply these hex colors to backgrounds, decorative elements, and lighting color grade — do not invent off-brand hues';
    }
    $campaign = strtolower(trim((string)($brand['campaign_preset'] ?? 'none')));
    $cHint = souq_ai_campaign_hint(in_array($campaign, souq_ai_campaign_presets(), true) ? $campaign : 'none');
    if ($cHint !== '') {
        $parts[] = $cHint;
    }
    if (!empty($brand['product_injection'])) {
        $parts[] = 'keep the uploaded product photorealistic and unchanged in shape/logo/label; remove or replace only the background';
        if (!empty($brand['match_perspective'])) {
            $parts[] = 'match lighting, shadows, camera angle, and scale of the original product photo for a realistic composite';
        }
    }
    $parts[] = 'high quality commercial 4K look, Saudi e-commerce ready';
    return implode(', ', $parts);
}

function souq_ai_load_brand_profile(PDO $pdo, string $storeId): array
{
    $st = $pdo->prepare('SELECT * FROM store_ai_brand_profiles WHERE store_id = ? LIMIT 1');
    $st->execute([$storeId]);
    $row = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    $store = souq_store_row($pdo, $storeId);
    $palette = [];
    $refs = [];
    if ($row) {
        $palette = souq_ai_normalize_palette(json_decode((string)($row['palette_hex'] ?? '[]'), true));
        $refs = souq_ai_normalize_style_refs(json_decode((string)($row['style_reference_urls'] ?? '[]'), true));
    } elseif (!empty($store['accent_color'])) {
        $palette = souq_ai_normalize_palette([$store['accent_color']]);
    }
    $persona = (string)($row['persona'] ?? 'modern');
    if (!in_array($persona, souq_ai_brand_personas(), true)) {
        $persona = 'modern';
    }
    $count = count($refs);
    return [
        'store_id' => $storeId,
        'palette_hex' => $palette,
        'persona' => $persona,
        'brand_lock_default' => $row ? (bool)(int)($row['brand_lock_default'] ?? 1) : true,
        'logo_overlay_enabled' => $row ? (bool)(int)($row['logo_overlay_enabled'] ?? 0) : false,
        'logo_overlay_position' => (string)($row['logo_overlay_position'] ?? 'bottom_end'),
        'logo_url' => ($row['logo_url'] ?? null) ?: ($store['logo'] ?? null),
        'store_accent_color' => $store['accent_color'] ?? null,
        'style_reference_urls' => $refs,
        'style_reference_count' => $count,
        'style_reference_status' => $count >= 10 ? 'ready' : ($count > 0 ? 'partial' : 'waiting'),
        'style_reference_target_min' => 10,
        'style_reference_target_max' => 15,
        'persisted' => (bool)$row,
    ];
}

/** @param array{model?:string,aspect?:string,image_size?:string,style?:string,negative_prompt?:string,brand_locked?:bool,product_image?:array{mime:string,base64:string}|null,style_reference_images?:list<array{mime:string,base64:string}>|null} $options */
function souq_gemini_generate_image(string $prompt, array $options = []): array
{
    $env = souq_load_root_env();
    $apiKey = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return ['ok' => false, 'code' => 'provider_not_connected', 'message' => 'AI image provider is not connected.'];
    }

    $model = souq_ai_resolve_model($options['model'] ?? null, $env);
    $aspect = (string)($options['aspect'] ?? '1:1');
    if (!in_array($aspect, ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'], true)) {
        $aspect = '1:1';
    }
    $imageSize = strtoupper(trim((string)($options['image_size'] ?? '1K')));
    if (!in_array($imageSize, ['1K', '2K', '4K'], true)) {
        $imageSize = '1K';
    }
    if ($imageSize === '4K' && !str_contains($model, 'pro')) {
        $imageSize = '2K';
    }
    $style = trim((string)($options['style'] ?? ''));
    $negative = trim((string)($options['negative_prompt'] ?? ''));
    $brandLocked = !empty($options['brand_locked']);
    $styleHint = match ($style) {
        'studio' => 'Professional product studio photography, softbox lighting, clean background.',
        'lifestyle' => 'Lifestyle commercial photography, natural light, authentic Saudi market feel.',
        'flat' => 'Clean flat illustration, bold shapes, modern e-commerce graphic.',
        'cinematic' => 'Cinematic lighting, shallow depth of field, premium campaign look.',
        'minimal' => 'Minimalist composition, generous negative space, elegant branding aesthetic.',
        default => 'High-quality commercial marketing visual.',
    };

    $text = 'Create a high-quality Saudi e-commerce marketing visual. No watermarks, no logos of other brands, suitable for store social posts. '
        . $styleHint . ' Composition aspect ' . $aspect . '. ';
    if ($brandLocked) {
        $text .= 'Brand Lock is ON: strictly honor the brand colors, persona, and style cues in the prompt; do not invent off-brand palettes. ';
    }
    $text .= 'Prompt: ' . trim($prompt);
    if ($negative !== '') {
        $text .= ' Avoid: ' . $negative . '.';
    }

    $parts = [];
    $product = $options['product_image'] ?? null;
    if (is_array($product) && !empty($product['base64'])) {
        $parts[] = [
            'inline_data' => [
                'mime_type' => (string)($product['mime'] ?? 'image/png'),
                'data' => (string)$product['base64'],
            ],
        ];
        $text .= ' The first attached image is the REAL product photo: cut out / place this exact product into a brand-consistent professional scene; preserve product identity, labels, and proportions.';
    }
    $styleRefs = $options['style_reference_images'] ?? null;
    if (is_array($styleRefs)) {
        $added = 0;
        foreach ($styleRefs as $ref) {
            if (!is_array($ref) || empty($ref['base64']) || $added >= 4) {
                continue;
            }
            $parts[] = [
                'inline_data' => [
                    'mime_type' => (string)($ref['mime'] ?? 'image/jpeg'),
                    'data' => (string)$ref['base64'],
                ],
            ];
            $added++;
        }
        if ($added > 0) {
            $text .= ' Additional attached images are this store\'s style references — match their visual soul, materials, and aesthetic (not copy their products).';
        }
    }
    $parts[] = ['text' => $text];
    $temperature = $brandLocked ? 0.55 : 0.85;
    $textOnlyParts = array_values(array_filter($parts, static fn ($p) => is_array($p) && isset($p['text'])));

    $configs = [
        [
            'responseModalities' => ['TEXT', 'IMAGE'],
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect, 'imageSize' => $imageSize],
        ],
        [
            'responseModalities' => ['IMAGE'],
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ],
        [
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ],
        [
            'temperature' => $temperature,
        ],
    ];

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $lastFail = ['ok' => false, 'code' => 'provider_error', 'message' => 'AI image provider returned an error.'];
    $usedModel = $model;
    $usedParts = $parts;

    $tryOnce = static function (string $tryUrl, string $tryModel, array $tryParts, array $genConfig) use (&$lastFail): ?array {
        $payload = [
            'contents' => [['parts' => $tryParts]],
            'generationConfig' => $genConfig,
        ];
        $res = souq_gemini_curl_json($tryUrl, $payload, 120);
        if ($res['raw'] !== false && $res['status'] >= 200 && $res['status'] < 300) {
            $parsed = souq_gemini_parse_image((string)$res['raw'], $tryModel);
            if (!empty($parsed['ok'])) {
                return $parsed;
            }
            // 200 but no image bytes — keep message, try next config/model.
            if (($parsed['code'] ?? '') === 'safety_blocked') {
                $lastFail = $parsed;
                return ['__terminal' => true] + $parsed;
            }
            $lastFail = $parsed;
            return null;
        }

        $msg = $res['err'] !== '' ? $res['err'] : 'AI image provider returned an error.';
        $decoded = json_decode((string)$res['raw'], true);
        if (is_array($decoded) && !empty($decoded['error']['message'])) {
            $msg = (string)$decoded['error']['message'];
        }
        if (stripos($msg, 'not found') !== false || stripos($msg, 'is not supported') !== false) {
            $msg = 'Selected AI image model is unavailable. Try Flash Lite or Flash Image and retry.';
        }
        $code = 'provider_error';
        if (
            $res['status'] === 429
            || stripos($msg, 'quota') !== false
            || stripos($msg, 'rate limit') !== false
            || stripos($msg, 'RESOURCE_EXHAUSTED') !== false
            || stripos($msg, 'limit: 0') !== false
            || stripos($msg, 'billing') !== false
        ) {
            $code = 'provider_quota_exceeded';
            $msg = 'Google AI free quota is exhausted for now. Wait for reset or enable billing in Google AI Studio, then retry.';
        }
        $lastFail = ['ok' => false, 'code' => $code, 'message' => mb_substr($msg, 0, 280)];
        if ($code === 'provider_quota_exceeded') {
            return ['__terminal' => true] + $lastFail;
        }
        return null;
    };

    foreach ($configs as $genConfig) {
        $hit = $tryOnce($url, $usedModel, $usedParts, $genConfig);
        if (is_array($hit) && !empty($hit['__terminal'])) {
            unset($hit['__terminal']);
            return $hit;
        }
        if (is_array($hit) && !empty($hit['ok'])) {
            return $hit;
        }
    }

    // Drop product/style attachments — oversized multimodal payloads often 400.
    if (count($textOnlyParts) > 0 && count($textOnlyParts) < count($parts)) {
        $usedParts = $textOnlyParts;
        foreach ($configs as $genConfig) {
            // Prefer lean configs after stripping images.
            if (isset($genConfig['imageConfig']['imageSize'])) {
                continue;
            }
            $hit = $tryOnce($url, $usedModel, $usedParts, $genConfig);
            if (is_array($hit) && !empty($hit['__terminal'])) {
                unset($hit['__terminal']);
                return $hit;
            }
            if (is_array($hit) && !empty($hit['ok'])) {
                return $hit;
            }
        }
    }

    $fallbacks = array_values(array_filter(
        ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image'],
        static fn (string $id): bool => $id !== $model
    ));
    foreach ($fallbacks as $fallbackModel) {
        $fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($fallbackModel)
            . ':generateContent?key='
            . rawurlencode($apiKey);
        $lean = [
            'temperature' => $temperature,
            'imageConfig' => ['aspectRatio' => $aspect],
        ];
        $hit = $tryOnce($fallbackUrl, $fallbackModel, $usedParts, $lean);
        if (is_array($hit) && !empty($hit['__terminal'])) {
            unset($hit['__terminal']);
            return $hit;
        }
        if (is_array($hit) && !empty($hit['ok'])) {
            return $hit;
        }
    }

    return $lastFail;
}

function souq_gemini_enhance_prompt(string $rawPrompt, string $locale = 'en', string $aspect = '1:1', ?string $style = null): array
{
    $env = souq_load_root_env();
    $apiKey = trim((string)($env['GEMINI_API_KEY'] ?? ''));
    if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
        return ['ok' => false, 'code' => 'provider_not_connected', 'message' => 'AI image provider is not connected.'];
    }
    $model = trim((string)($env['GEMINI_TEXT_MODEL'] ?? 'gemini-2.5-flash')) ?: 'gemini-2.5-flash';
    $wantAr = str_starts_with(strtolower($locale), 'ar');
    $instruction = $wantAr
        ? 'حسّن الوصف التالي ليصبح موجهاً تفصيلياً لتوليد صورة تسويقية لمتجر إلكتروني سعودي. أعد الموجه فقط بدون شرح، وباللغة العربية الفصحى الواضحة، مع تفاصيل الإضاءة والتكوين والخلفية والأسلوب.'
        : 'Rewrite the following into ONE detailed English image-generation prompt for a Saudi e-commerce marketing visual. Return ONLY the prompt text, no quotes or explanation. Include lighting, composition, background, camera angle, and style.';
    $instruction .= ' Target aspect ratio ' . $aspect . '.';
    if ($style) {
        $instruction .= ' Preferred style key: ' . $style . '.';
    }
    $instruction .= "\n\nMerchant note:\n" . trim($rawPrompt);

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
    $res = souq_gemini_curl_json($url, [
        'contents' => [['parts' => [['text' => $instruction]]]],
        'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 512],
    ], 45);

    if ($res['raw'] === false || $res['status'] < 200 || $res['status'] >= 300) {
        $msg = $res['err'] !== '' ? $res['err'] : 'AI prompt enhance returned an error.';
        $decoded = json_decode((string)$res['raw'], true);
        if (is_array($decoded) && !empty($decoded['error']['message'])) {
            $msg = (string)$decoded['error']['message'];
        }
        return ['ok' => false, 'code' => 'provider_error', 'message' => mb_substr($msg, 0, 280)];
    }
    $json = json_decode((string)$res['raw'], true);
    $text = '';
    foreach (($json['candidates'][0]['content']['parts'] ?? []) as $part) {
        if (!empty($part['text'])) {
            $text .= (string)$part['text'];
        }
    }
    $text = trim(preg_replace('/^["“]|["”]$/u', '', trim($text)) ?? '');
    if (mb_strlen($text) < 12) {
        return ['ok' => false, 'code' => 'empty_result', 'message' => 'AI prompt enhance returned empty text.'];
    }
    return ['ok' => true, 'prompt' => mb_substr($text, 0, 2000), 'model' => $model];
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

    if (!function_exists('souq_session_lite_dispatch')) {
        require_once __DIR__ . '/session_lite.php';
    }
    if (souq_session_lite_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

    if (!function_exists('souq_google_dispatch')) {
        require_once __DIR__ . '/google_oauth.php';
    }
    if (souq_google_dispatch($pdo, $uri, $method, $storeId, $input)) {
        return true;
    }

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
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        $snap['models'] = souq_ai_model_catalog();
        $snap['personas'] = souq_ai_brand_personas();
        $snap['campaign_presets'] = souq_ai_campaign_presets();
        $snap['output_templates'] = souq_ai_output_templates();
        echo json_encode(['data' => $snap]);
        return true;
    }

    if ($uri === '/ai-media/brand-profile' && $method === 'GET') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        echo json_encode([
            'data' => souq_ai_load_brand_profile($pdo, $storeId),
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/brand-profile' && ($method === 'PUT' || $method === 'POST')) {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $palette = souq_ai_normalize_palette($input['palette_hex'] ?? []);
        $persona = strtolower(trim((string)($input['persona'] ?? 'modern')));
        if (!in_array($persona, souq_ai_brand_personas(), true)) {
            $persona = 'modern';
        }
        $refs = souq_ai_normalize_style_refs($input['style_reference_urls'] ?? []);
        $pos = (string)($input['logo_overlay_position'] ?? 'bottom_end');
        if (!in_array($pos, ['top_start', 'top_end', 'bottom_start', 'bottom_end'], true)) {
            $pos = 'bottom_end';
        }
        $logoUrl = trim((string)($input['logo_url'] ?? ''));
        $now = date('c');
        $existing = $pdo->prepare('SELECT id FROM store_ai_brand_profiles WHERE store_id = ? LIMIT 1');
        $existing->execute([$storeId]);
        $id = (string)($existing->fetchColumn() ?: '');
        if ($id === '') {
            $id = 'aibrand-' . bin2hex(random_bytes(6));
            $ins = $pdo->prepare('INSERT INTO store_ai_brand_profiles (id, store_id, palette_hex, persona, brand_lock_default, logo_overlay_enabled, logo_overlay_position, logo_url, style_reference_urls, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
            $ins->execute([
                $id,
                $storeId,
                json_encode($palette, JSON_UNESCAPED_UNICODE),
                $persona,
                !empty($input['brand_lock_default']) || !array_key_exists('brand_lock_default', $input) ? 1 : 0,
                !empty($input['logo_overlay_enabled']) ? 1 : 0,
                $pos,
                $logoUrl !== '' ? $logoUrl : null,
                json_encode($refs, JSON_UNESCAPED_UNICODE),
                $now,
                $now,
            ]);
        } else {
            $upd = $pdo->prepare('UPDATE store_ai_brand_profiles SET palette_hex=?, persona=?, brand_lock_default=?, logo_overlay_enabled=?, logo_overlay_position=?, logo_url=?, style_reference_urls=?, updated_at=? WHERE store_id=?');
            $upd->execute([
                json_encode($palette, JSON_UNESCAPED_UNICODE),
                $persona,
                array_key_exists('brand_lock_default', $input) ? (!empty($input['brand_lock_default']) ? 1 : 0) : 1,
                !empty($input['logo_overlay_enabled']) ? 1 : 0,
                $pos,
                $logoUrl !== '' ? $logoUrl : null,
                json_encode($refs, JSON_UNESCAPED_UNICODE),
                $now,
                $storeId,
            ]);
        }
        echo json_encode([
            'data' => souq_ai_load_brand_profile($pdo, $storeId),
            'message' => 'Brand identity saved for this store.',
            'store_id' => $storeId,
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/ai-media/enhance-prompt' && $method === 'POST') {
        if ($storeId === '') {
            http_response_code(422);
            echo json_encode(['message' => 'store_id is required.']);
            return true;
        }
        $prompt = trim((string)($input['prompt'] ?? ''));
        if (mb_strlen($prompt) < 4) {
            http_response_code(422);
            echo json_encode(['message' => 'Prompt must be at least 4 characters.', 'code' => 'validation']);
            return true;
        }
        $snap = souq_ai_quota_snapshot($pdo, $storeId);
        if (!$snap['image_provider_ready']) {
            http_response_code(503);
            echo json_encode([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ]);
            return true;
        }
        $profile = souq_ai_load_brand_profile($pdo, $storeId);
        $brandLock = array_key_exists('brand_lock', $input)
            ? !empty($input['brand_lock'])
            : (bool)$profile['brand_lock_default'];
        $templates = souq_ai_output_templates();
        $tpl = (string)($input['output_template'] ?? '');
        $aspect = (string)($templates[$tpl] ?? ($input['aspect'] ?? '1:1'));
        $seed = souq_ai_brand_merge_prompt($prompt, [
            'palette_hex' => $profile['palette_hex'],
            'persona' => (string)($input['persona'] ?? $profile['persona']),
            'brand_lock' => $brandLock,
            'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
            'accent_color' => $profile['store_accent_color'] ?? null,
        ]);
        $result = souq_gemini_enhance_prompt(
            $seed,
            (string)($input['locale'] ?? 'en'),
            $aspect,
            isset($input['style']) ? (string)$input['style'] : null,
        );
        if (!$result['ok']) {
            http_response_code(502);
            echo json_encode(['message' => $result['message'], 'code' => $result['code']]);
            return true;
        }
        echo json_encode([
            'data' => [
                'prompt' => $result['prompt'],
                'prompt_seed' => $seed,
                'brand_lock' => $brandLock,
                'model' => $result['model'],
                'store_id' => $storeId,
            ],
            'message' => 'Prompt enhanced.',
        ], JSON_UNESCAPED_UNICODE);
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
        $templates = souq_ai_output_templates();
        $tpl = (string)($input['output_template'] ?? '');
        $aspect = (string)($templates[$tpl] ?? ($input['aspect'] ?? '1:1'));
        if (!in_array($aspect, ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'], true)) {
            $aspect = '1:1';
        }
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

        $profile = souq_ai_load_brand_profile($pdo, $storeId);
        $brandLock = array_key_exists('brand_lock', $input)
            ? !empty($input['brand_lock'])
            : (bool)$profile['brand_lock_default'];
        $productB64 = trim((string)($input['product_image_base64'] ?? ''));
        $productImage = null;
        if ($productB64 !== '') {
            if (str_starts_with($productB64, 'data:') && preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $productB64, $m)) {
                $productImage = ['mime' => $m[1], 'base64' => $m[2]];
            } else {
                $productImage = [
                    'mime' => (string)($input['product_image_mime'] ?? 'image/jpeg'),
                    'base64' => $productB64,
                ];
            }
        }

        $mergedPrompt = souq_ai_brand_merge_prompt($prompt, [
            'palette_hex' => $profile['palette_hex'],
            'persona' => (string)($input['persona'] ?? $profile['persona']),
            'brand_lock' => $brandLock,
            'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
            'product_injection' => $productImage !== null,
            'match_perspective' => !array_key_exists('match_perspective', $input) || !empty($input['match_perspective']),
            'accent_color' => $profile['store_accent_color'] ?? null,
        ]);

        $finalPrompt = $mergedPrompt;
        $autoEnhance = !empty($input['auto_enhance']);
        if ($autoEnhance) {
            $enhanced = souq_gemini_enhance_prompt(
                $mergedPrompt,
                (string)($input['locale'] ?? 'en'),
                $aspect,
                isset($input['style']) ? (string)$input['style'] : null,
            );
            if (!empty($enhanced['ok']) && !empty($enhanced['prompt'])) {
                $finalPrompt = (string)$enhanced['prompt'];
            }
        }

        $result = souq_gemini_generate_image($finalPrompt, [
            'model' => isset($input['model']) ? (string)$input['model'] : null,
            'aspect' => $aspect,
            'image_size' => (string)($input['image_size'] ?? '1K'),
            'style' => isset($input['style']) ? (string)$input['style'] : null,
            'negative_prompt' => isset($input['negative_prompt']) ? (string)$input['negative_prompt'] : null,
            'brand_locked' => $brandLock,
            'product_image' => $productImage,
        ]);
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
            $finalPrompt,
            [
                'source' => 'ai_generator',
                'prompt' => $finalPrompt,
                'prompt_raw' => $prompt,
                'prompt_merged' => $mergedPrompt,
                'aspect' => $aspect,
                'model' => $result['model'],
                'image_size' => (string)($input['image_size'] ?? '1K'),
                'style' => $input['style'] ?? null,
                'kind' => 'image',
                'auto_enhance' => $autoEnhance,
                'brand_lock' => $brandLock,
                'campaign_preset' => (string)($input['campaign_preset'] ?? 'none'),
                'product_injection' => $productImage !== null,
            ]
        );
        echo json_encode([
            'data' => [
                'kind' => 'image',
                'saved' => true,
                'prompt_used' => $finalPrompt,
                'prompt_merged' => $mergedPrompt,
                'brand_lock' => $brandLock,
                'logo_overlay_applied' => false,
                'quota' => souq_ai_quota_snapshot($pdo, $storeId),
                'media' => array_merge($media, [
                    'prompt' => $finalPrompt,
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
        $gaOk = (bool)preg_match('/^G-[A-Z0-9]+$/', $ga);
        $gInt = is_array($data['google_integration'] ?? null) ? $data['google_integration'] : [];
        $googleConnected = !empty($gInt['is_connected']) && !empty($gInt['google_account_email']);
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
            'google_account_email' => $googleConnected ? (string)($gInt['google_account_email'] ?? '') : '',
            'ga4_measurement_id' => $gaOk ? $ga : '',
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
