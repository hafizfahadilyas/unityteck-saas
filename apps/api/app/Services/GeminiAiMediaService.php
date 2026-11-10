<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Real Gemini image generation only. No fake/placeholder assets.
 */
final class GeminiAiMediaService
{
    /** @var list<string> */
    public const IMAGE_MODELS = [
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-lite-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image',
    ];

    /** @var list<string> */
    public const IMAGE_SIZES = ['1K', '2K', '4K'];

    /** @var list<string> Google Nano Banana / AI Studio image aspect set */
    public const ASPECTS = [
        '1:1',
        '4:5',
        '5:4',
        '3:4',
        '4:3',
        '2:3',
        '3:2',
        '9:16',
        '16:9',
        '21:9',
    ];

    /**
     * @return list<array{id: string, label_en: string, label_ar: string, tier: string}>
     */
    public static function modelCatalog(): array
    {
        return [
            [
                'id' => 'gemini-2.5-flash-image',
                'label_en' => 'Flash Image (fast)',
                'label_ar' => 'فلاش صورة (سريع)',
                'tier' => 'standard',
            ],
            [
                'id' => 'gemini-3.1-flash-lite-image',
                'label_en' => 'Flash Lite (fastest)',
                'label_ar' => 'فلاش لايت (الأسرع)',
                'tier' => 'standard',
            ],
            [
                'id' => 'gemini-3.1-flash-image',
                'label_en' => 'Flash Image 3.1 (balanced)',
                'label_ar' => 'فلاش صورة ٣٫١ (متوازن)',
                'tier' => 'balanced',
            ],
            [
                'id' => 'gemini-3-pro-image',
                'label_en' => 'Pro Image (highest quality)',
                'label_ar' => 'برو صورة (أعلى جودة)',
                'tier' => 'pro',
            ],
        ];
    }

    public static function resolveModel(?string $requested): string
    {
        $requested = trim((string) $requested);
        if ($requested !== '' && in_array($requested, self::IMAGE_MODELS, true)) {
            return $requested;
        }

        $configured = trim((string) config('services.gemini.image_model', 'gemini-2.5-flash-image'));
        if (in_array($configured, self::IMAGE_MODELS, true)) {
            return $configured;
        }

        // Migrate retired preview ids to a working default.
        return 'gemini-2.5-flash-image';
    }

    public static function resolveAspect(?string $aspect): string
    {
        $aspect = trim((string) $aspect);
        if (in_array($aspect, self::ASPECTS, true)) {
            return $aspect;
        }

        return '1:1';
    }

    public static function resolveImageSize(?string $size, string $model): string
    {
        $size = strtoupper(trim((string) $size));
        if (! in_array($size, self::IMAGE_SIZES, true)) {
            $size = '1K';
        }
        // 4K is reserved for pro-tier models.
        if ($size === '4K' && ! str_contains($model, 'pro')) {
            return '2K';
        }

        return $size;
    }

    /**
     * @param  array{
     *   model?: string|null,
     *   aspect?: string|null,
     *   image_size?: string|null,
     *   style?: string|null,
     *   negative_prompt?: string|null,
     *   brand_locked?: bool,
     *   product_image?: array{mime: string, base64: string}|null,
     *   style_reference_images?: list<array{mime: string, base64: string}>|null
     * }  $options
     * @return array{ok: true, mime: string, base64: string, model: string}|array{ok: false, code: string, message: string}
     */
    public function generateImage(string $prompt, array $options = []): array
    {
        $apiKey = trim((string) config('services.gemini.api_key', ''));
        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'ok' => false,
                'code' => 'provider_not_connected',
                'message' => 'AI image provider is not connected. Set GEMINI_API_KEY on the API server.',
            ];
        }

        $model = self::resolveModel($options['model'] ?? null);
        $aspect = self::resolveAspect($options['aspect'] ?? null);
        $imageSize = self::resolveImageSize($options['image_size'] ?? null, $model);
        $style = trim((string) ($options['style'] ?? ''));
        $negative = trim((string) ($options['negative_prompt'] ?? ''));
        $brandLocked = (bool) ($options['brand_locked'] ?? false);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            .rawurlencode($model)
            .':generateContent?key='.rawurlencode($apiKey);

        $styleHint = match ($style) {
            'studio' => 'Professional product studio photography, softbox lighting, clean background.',
            'lifestyle' => 'Lifestyle commercial photography, natural light, authentic Saudi market feel.',
            'flat' => 'Clean flat illustration, bold shapes, modern e-commerce graphic.',
            'cinematic' => 'Cinematic lighting, shallow depth of field, premium campaign look.',
            'minimal' => 'Minimalist composition, generous negative space, elegant branding aesthetic.',
            default => 'High-quality commercial marketing visual.',
        };

        $safePrompt = trim($prompt);
        $text = 'Create a high-quality Saudi e-commerce marketing visual. '
            .'No watermarks, no logos of other brands, suitable for store social posts. '
            .$styleHint.' '
            .'Composition aspect '.$aspect.'. ';
        if ($brandLocked) {
            $text .= 'Brand Lock is ON: strictly honor the brand colors, persona, and style cues in the prompt; do not invent off-brand palettes. ';
        }
        $text .= 'Prompt: '.$safePrompt;
        if ($negative !== '') {
            $text .= ' Avoid: '.$negative.'.';
        }

        /** @var list<array<string, mixed>> $parts */
        $parts = [];

        $product = $options['product_image'] ?? null;
        if (is_array($product) && ! empty($product['base64'])) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => (string) ($product['mime'] ?? 'image/png'),
                    'data' => (string) $product['base64'],
                ],
            ];
            $text .= ' The first attached image is the REAL product photo: cut out / place this exact product into a brand-consistent professional scene; preserve product identity, labels, and proportions.';
        }

        $styleRefs = $options['style_reference_images'] ?? null;
        if (is_array($styleRefs)) {
            $added = 0;
            foreach ($styleRefs as $ref) {
                if (! is_array($ref) || empty($ref['base64']) || $added >= 4) {
                    continue;
                }
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => (string) ($ref['mime'] ?? 'image/jpeg'),
                        'data' => (string) $ref['base64'],
                    ],
                ];
                $added++;
            }
            if ($added > 0) {
                $text .= ' Additional attached images are this store\'s style references — match their visual soul, materials, and aesthetic (not copy their products).';
            }
        }

        $parts[] = ['text' => $text];

        $imageConfig = [
            'aspectRatio' => $aspect,
        ];
        // Newer Nano Banana models honor imageSize (1K/2K/4K).
        if (in_array($imageSize, self::IMAGE_SIZES, true)) {
            $imageConfig['imageSize'] = $imageSize;
        }

        $temperature = $brandLocked ? 0.55 : 0.85;

        // Progressive payloads: some keys / models / free-tier keys reject
        // responseModalities or imageSize; strip and retry before failing.
        $attempts = [
            [
                'generationConfig' => [
                    'responseModalities' => ['TEXT', 'IMAGE'],
                    'temperature' => $temperature,
                    'imageConfig' => $imageConfig,
                ],
            ],
            [
                'generationConfig' => [
                    'responseModalities' => ['IMAGE'],
                    'temperature' => $temperature,
                    'imageConfig' => ['aspectRatio' => $aspect],
                ],
            ],
            [
                'generationConfig' => [
                    'temperature' => $temperature,
                    'imageConfig' => ['aspectRatio' => $aspect],
                ],
            ],
            [
                'generationConfig' => [
                    'temperature' => $temperature,
                ],
            ],
        ];

        $attempt = [
            'ok' => false,
            'code' => 'provider_error',
            'message' => 'AI image provider returned an error.',
        ];

        foreach ($attempts as $cfg) {
            $body = [
                'contents' => [
                    ['parts' => $parts],
                ],
                'generationConfig' => $cfg['generationConfig'],
            ];
            $attempt = $this->postGenerate($url, $body, $model);
            if ($attempt['ok']) {
                return $attempt;
            }
            // Quota / safety are terminal — do not keep retrying the same key.
            if (in_array($attempt['code'] ?? '', ['provider_quota_exceeded', 'safety_blocked'], true)) {
                return $attempt;
            }
        }

        // Drop attached reference/product images once — huge payloads often 400.
        $textOnlyParts = [];
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $textOnlyParts[] = $part;
            }
        }
        if (count($textOnlyParts) > 0 && count($textOnlyParts) < count($parts)) {
            $body = [
                'contents' => [['parts' => $textOnlyParts]],
                'generationConfig' => [
                    'temperature' => $temperature,
                    'imageConfig' => ['aspectRatio' => $aspect],
                ],
            ];
            $stripped = $this->postGenerate($url, $body, $model);
            if ($stripped['ok']) {
                return $stripped;
            }
            if (in_array($stripped['code'] ?? '', ['provider_quota_exceeded', 'safety_blocked'], true)) {
                return $stripped;
            }
            $attempt = $stripped;
        }

        // Fallback chain when the selected model is unavailable for this API key.
        $fallbacks = array_values(array_filter(
            ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image'],
            static fn (string $id): bool => $id !== $model
        ));
        foreach ($fallbacks as $fallbackModel) {
            $fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'
                .rawurlencode($fallbackModel)
                .':generateContent?key='.rawurlencode($apiKey);
            $body = [
                'contents' => [['parts' => $textOnlyParts !== [] ? $textOnlyParts : $parts]],
                'generationConfig' => [
                    'temperature' => $temperature,
                    'imageConfig' => ['aspectRatio' => $aspect],
                ],
            ];
            $fallback = $this->postGenerate($fallbackUrl, $body, $fallbackModel);
            if ($fallback['ok']) {
                return $fallback;
            }
            if (in_array($fallback['code'] ?? '', ['provider_quota_exceeded', 'safety_blocked'], true)) {
                return $fallback;
            }
            $attempt = $fallback;
        }

        return $attempt;
    }

    /**
     * Expand a short / multilingual merchant note into a detailed image prompt.
     *
     * @return array{ok: true, prompt: string, model: string}|array{ok: false, code: string, message: string}
     */
    public function enhancePrompt(string $rawPrompt, string $locale = 'en', ?string $aspect = null, ?string $style = null): array
    {
        $apiKey = trim((string) config('services.gemini.api_key', ''));
        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'ok' => false,
                'code' => 'provider_not_connected',
                'message' => 'AI image provider is not connected. Set GEMINI_API_KEY on the API server.',
            ];
        }

        $model = trim((string) config('services.gemini.text_model', 'gemini-2.5-flash'));
        if ($model === '') {
            $model = 'gemini-2.5-flash';
        }

        $aspect = self::resolveAspect($aspect);
        $style = trim((string) $style);
        $wantAr = str_starts_with(strtolower($locale), 'ar');

        $instruction = $wantAr
            ? 'حسّن الوصف التالي ليصبح موجهاً تفصيلياً لتوليد صورة تسويقية لمتجر إلكتروني سعودي. أعد الموجه فقط بدون شرح، وباللغة العربية الفصحى الواضحة، مع تفاصيل الإضاءة والتكوين والخلفية والأسلوب.'
            : 'Rewrite the following into ONE detailed English image-generation prompt for a Saudi e-commerce marketing visual. Return ONLY the prompt text, no quotes or explanation. Include lighting, composition, background, camera angle, and style.';

        $instruction .= ' Target aspect ratio '.$aspect.'.';
        if ($style !== '') {
            $instruction .= ' Preferred style key: '.$style.'.';
        }
        $instruction .= "\n\nMerchant note:\n".trim($rawPrompt);

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            .rawurlencode($model)
            .':generateContent?key='.rawurlencode($apiKey);

        try {
            $response = Http::timeout(45)
                ->acceptJson()
                ->asJson()
                ->post($url, [
                    'contents' => [
                        ['parts' => [['text' => $instruction]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 512,
                    ],
                ]);

            if (! $response->successful()) {
                $err = $response->json('error.message') ?: $response->body();

                return [
                    'ok' => false,
                    'code' => 'provider_error',
                    'message' => is_string($err) && $err !== ''
                        ? $err
                        : 'AI prompt enhance returned an error.',
                ];
            }

            $parts = $response->json('candidates.0.content.parts') ?? [];
            $text = '';
            if (is_array($parts)) {
                foreach ($parts as $part) {
                    if (! empty($part['text'])) {
                        $text .= (string) $part['text'];
                    }
                }
            }
            $text = trim(preg_replace('/^["“]|["”]$/u', '', trim($text)) ?? '');
            if (mb_strlen($text) < 12) {
                return [
                    'ok' => false,
                    'code' => 'empty_result',
                    'message' => 'AI prompt enhance returned empty text.',
                ];
            }

            return [
                'ok' => true,
                'prompt' => mb_substr($text, 0, 2000),
                'model' => $model,
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'code' => 'provider_error',
                'message' => 'AI prompt enhance failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Video stays honest: only when explicitly enabled + provisioned.
     *
     * @return array{ok: false, code: string, message: string}
     */
    public function generateVideo(string $prompt): array
    {
        unset($prompt);

        if (! (bool) config('services.gemini.video_enabled', false)) {
            return [
                'ok' => false,
                'code' => 'video_provider_not_connected',
                'message' => 'AI video generation is not connected for this platform yet. Waiting for provider.',
            ];
        }

        $apiKey = trim((string) config('services.gemini.api_key', ''));
        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'ok' => false,
                'code' => 'provider_not_connected',
                'message' => 'AI video provider is not connected. Set GEMINI_API_KEY on the API server.',
            ];
        }

        // Veo long-running jobs need async polling + storage — keep locked until wired end-to-end.
        return [
            'ok' => false,
            'code' => 'video_provider_not_connected',
            'message' => 'AI video generation pipeline is not fully wired yet. Waiting for provider.',
        ];
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array{ok: true, mime: string, base64: string, model: string}|array{ok: false, code: string, message: string}
     */
    private function postGenerate(string $url, array $body, string $model): array
    {
        try {
            $response = Http::timeout(120)
                ->acceptJson()
                ->asJson()
                ->post($url, $body);

            if (! $response->successful()) {
                $err = $response->json('error.message') ?: $response->body();
                $msg = is_string($err) && $err !== ''
                    ? $err
                    : 'AI image provider returned an error.';

                // Soften common model-not-found / quota noise for merchants.
                if (stripos($msg, 'not found') !== false || stripos($msg, 'is not supported') !== false) {
                    $msg = 'Selected AI image model is unavailable. Try Flash Lite or Flash Image and retry.';
                }
                $code = 'provider_error';
                if (
                    stripos($msg, 'quota') !== false
                    || stripos($msg, 'rate limit') !== false
                    || stripos($msg, 'RESOURCE_EXHAUSTED') !== false
                    || stripos($msg, 'limit: 0') !== false
                    || stripos($msg, 'billing') !== false
                    || $response->status() === 429
                ) {
                    $code = 'provider_quota_exceeded';
                    $msg = 'Google AI free quota is exhausted for now. Wait for reset or enable billing in Google AI Studio, then retry.';
                } elseif (
                    stripos($msg, 'response modalities') !== false
                    || stripos($msg, 'responseModalities') !== false
                    || stripos($msg, 'Unknown name') !== false
                ) {
                    $msg = 'AI image request format was rejected by the provider. Retrying with a simpler payload.';
                }

                return [
                    'ok' => false,
                    'code' => $code,
                    'message' => mb_substr($msg, 0, 280),
                ];
            }

            $blockReason = $response->json('promptFeedback.blockReason')
                ?: $response->json('candidates.0.finishReason');
            if (is_string($blockReason) && in_array(strtoupper($blockReason), ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY'], true)) {
                return [
                    'ok' => false,
                    'code' => 'safety_blocked',
                    'message' => 'Prompt was blocked by safety filters. Soften the description and try again.',
                ];
            }

            $parts = $response->json('candidates.0.content.parts') ?? [];
            if (! is_array($parts)) {
                return [
                    'ok' => false,
                    'code' => 'empty_result',
                    'message' => 'AI image provider returned no image data.',
                ];
            }

            foreach ($parts as $part) {
                $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
                if (! is_array($inline)) {
                    continue;
                }
                $mime = (string) ($inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png');
                $data = (string) ($inline['data'] ?? '');
                if ($data === '') {
                    continue;
                }

                return [
                    'ok' => true,
                    'mime' => $mime !== '' ? $mime : 'image/png',
                    'base64' => $data,
                    'model' => $model,
                ];
            }

            return [
                'ok' => false,
                'code' => 'empty_result',
                'message' => 'AI image provider returned text only — no image bytes.',
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'code' => 'provider_error',
                'message' => 'AI image request failed: '.$e->getMessage(),
            ];
        }
    }
}
