<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Store;
use App\Models\StoreAiBrandProfile;
use App\Services\GeminiAiMediaService;
use App\Support\AiImageLogoOverlay;
use App\Support\AiMediaCredits;
use App\Support\BrandConsistentPromptBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AiMediaController extends Controller
{
    use ResolvesStoreId;

    public function quota(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        return response()->json([
            'data' => array_merge(AiMediaCredits::snapshot($store), [
                'models' => GeminiAiMediaService::modelCatalog(),
                'default_model' => GeminiAiMediaService::resolveModel(null),
                'image_sizes' => GeminiAiMediaService::IMAGE_SIZES,
                'aspects' => GeminiAiMediaService::ASPECTS,
                'personas' => BrandConsistentPromptBuilder::PERSONAS,
                'campaign_presets' => BrandConsistentPromptBuilder::CAMPAIGN_PRESETS,
                'output_templates' => BrandConsistentPromptBuilder::OUTPUT_TEMPLATES,
                'logo_positions' => BrandConsistentPromptBuilder::LOGO_POSITIONS,
            ]),
        ]);
    }

    public function brandProfile(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $profile = $this->loadOrEmptyProfile($store);

        return response()->json([
            'data' => $this->serializeBrandProfile($profile, $store),
            'store_id' => $storeId,
        ]);
    }

    public function updateBrandProfile(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'palette_hex' => ['nullable', 'array', 'max:8'],
            'palette_hex.*' => ['string', 'max:16'],
            'persona' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::PERSONAS)],
            'brand_lock_default' => ['nullable', 'boolean'],
            'logo_overlay_enabled' => ['nullable', 'boolean'],
            'logo_overlay_position' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::LOGO_POSITIONS)],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'style_reference_urls' => ['nullable', 'array', 'max:15'],
            // Allow data-URLs; persistStyleReferenceUrls stores them as short /storage paths.
            'style_reference_urls.*' => ['string', 'max:6000000'],
        ]);

        $profile = StoreAiBrandProfile::query()
            ->withoutStoreScope()
            ->where('store_id', $storeId)
            ->first();

        if (! $profile) {
            $profile = new StoreAiBrandProfile([
                'id' => 'aibrand-'.Str::lower(Str::random(12)),
                'store_id' => $storeId,
            ]);
        }

        if (array_key_exists('palette_hex', $validated)) {
            $profile->palette_hex = BrandConsistentPromptBuilder::normalizePalette($validated['palette_hex']);
        }
        if (array_key_exists('persona', $validated) && $validated['persona']) {
            $profile->persona = BrandConsistentPromptBuilder::resolvePersona($validated['persona']);
        }
        if (array_key_exists('brand_lock_default', $validated)) {
            $profile->brand_lock_default = (bool) $validated['brand_lock_default'];
        }
        if (array_key_exists('logo_overlay_enabled', $validated)) {
            $profile->logo_overlay_enabled = (bool) $validated['logo_overlay_enabled'];
        }
        if (array_key_exists('logo_overlay_position', $validated) && $validated['logo_overlay_position']) {
            $profile->logo_overlay_position = BrandConsistentPromptBuilder::resolveLogoPosition($validated['logo_overlay_position']);
        }
        if (array_key_exists('logo_url', $validated)) {
            $url = trim((string) ($validated['logo_url'] ?? ''));
            $profile->logo_url = $url !== '' ? $url : null;
        }
        if (array_key_exists('style_reference_urls', $validated)) {
            $profile->style_reference_urls = $this->persistStyleReferenceUrls(
                $storeId,
                BrandConsistentPromptBuilder::normalizeStyleRefs($validated['style_reference_urls']),
            );
        }

        $profile->save();

        return response()->json([
            'data' => $this->serializeBrandProfile($profile, $store),
            'message' => 'Brand identity saved for this store.',
            'store_id' => $storeId,
        ]);
    }

    public function enhancePrompt(Request $request, GeminiAiMediaService $gemini): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'prompt' => ['required', 'string', 'min:4', 'max:2000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
            'aspect' => ['nullable', 'string', Rule::in(GeminiAiMediaService::ASPECTS)],
            'style' => ['nullable', 'string', 'max:40'],
            'brand_lock' => ['nullable', 'boolean'],
            'campaign_preset' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::CAMPAIGN_PRESETS)],
            'persona' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::PERSONAS)],
            'output_template' => ['nullable', 'string', Rule::in(array_keys(BrandConsistentPromptBuilder::OUTPUT_TEMPLATES))],
        ]);

        $snap = AiMediaCredits::snapshot($store);
        if (! $snap['image_provider_ready']) {
            return response()->json([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ], 503);
        }

        $profile = $this->loadOrEmptyProfile($store);
        $brandLock = array_key_exists('brand_lock', $validated)
            ? (bool) $validated['brand_lock']
            : (bool) ($profile->brand_lock_default ?? true);

        $aspect = GeminiAiMediaService::resolveAspect(
            BrandConsistentPromptBuilder::aspectForTemplate($validated['output_template'] ?? null)
                ?? ($validated['aspect'] ?? '1:1')
        );

        $seedPrompt = BrandConsistentPromptBuilder::build(trim($validated['prompt']), [
            'palette_hex' => $profile->palette_hex,
            'persona' => $validated['persona'] ?? $profile->persona,
            'brand_lock' => $brandLock,
            'campaign_preset' => $validated['campaign_preset'] ?? 'none',
            'accent_color' => $store->accent_color,
        ]);

        $result = $gemini->enhancePrompt(
            $seedPrompt,
            $validated['locale'] ?? 'en',
            $aspect,
            $validated['style'] ?? null,
        );

        if (! $result['ok']) {
            return response()->json([
                'message' => $result['message'],
                'code' => $result['code'],
            ], 502);
        }

        return response()->json([
            'data' => [
                'prompt' => $result['prompt'],
                'prompt_seed' => $seedPrompt,
                'brand_lock' => $brandLock,
                'model' => $result['model'],
                'store_id' => $storeId,
            ],
            'message' => 'Prompt enhanced.',
        ]);
    }

    public function generate(Request $request, GeminiAiMediaService $gemini): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'kind' => ['required', 'string', 'in:image,video'],
            'prompt' => ['required', 'string', 'min:8', 'max:2000'],
            'aspect' => ['nullable', 'string', Rule::in(GeminiAiMediaService::ASPECTS)],
            'model' => ['nullable', 'string', Rule::in(GeminiAiMediaService::IMAGE_MODELS)],
            'image_size' => ['nullable', 'string', Rule::in(GeminiAiMediaService::IMAGE_SIZES)],
            'style' => ['nullable', 'string', 'max:40'],
            'negative_prompt' => ['nullable', 'string', 'max:500'],
            'auto_enhance' => ['nullable', 'boolean'],
            'save_to_library' => ['nullable', 'boolean'],
            'title' => ['nullable', 'string', 'max:191'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
            'brand_lock' => ['nullable', 'boolean'],
            'campaign_preset' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::CAMPAIGN_PRESETS)],
            'persona' => ['nullable', 'string', Rule::in(BrandConsistentPromptBuilder::PERSONAS)],
            'output_template' => ['nullable', 'string', Rule::in(array_keys(BrandConsistentPromptBuilder::OUTPUT_TEMPLATES))],
            'logo_overlay' => ['nullable', 'boolean'],
            'match_perspective' => ['nullable', 'boolean'],
            'product_image_base64' => ['nullable', 'string', 'max:12000000'],
            'product_image_mime' => ['nullable', 'string', 'max:64'],
            'product_image_url' => ['nullable', 'string', 'max:500'],
        ]);

        $kind = $validated['kind'];
        $prompt = trim($validated['prompt']);
        $profile = $this->loadOrEmptyProfile($store);

        $aspect = GeminiAiMediaService::resolveAspect(
            BrandConsistentPromptBuilder::aspectForTemplate($validated['output_template'] ?? null)
                ?? ($validated['aspect'] ?? '1:1')
        );
        $save = array_key_exists('save_to_library', $validated)
            ? (bool) $validated['save_to_library']
            : true;
        $autoEnhance = (bool) ($validated['auto_enhance'] ?? false);
        $brandLock = array_key_exists('brand_lock', $validated)
            ? (bool) $validated['brand_lock']
            : (bool) ($profile->brand_lock_default ?? true);
        $logoOverlay = array_key_exists('logo_overlay', $validated)
            ? (bool) $validated['logo_overlay']
            : (bool) ($profile->logo_overlay_enabled ?? false);
        $campaign = BrandConsistentPromptBuilder::resolveCampaign($validated['campaign_preset'] ?? 'none');
        $persona = BrandConsistentPromptBuilder::resolvePersona($validated['persona'] ?? $profile->persona);

        $snap = AiMediaCredits::snapshot($store);

        if ($kind === 'image' && ! $snap['image_provider_ready']) {
            return response()->json([
                'message' => 'AI image provider is not connected.',
                'code' => 'provider_not_connected',
                'data' => ['quota' => $snap],
            ], 503);
        }

        if ($kind === 'video' && ! $snap['video_provider_ready']) {
            return response()->json([
                'message' => 'AI video generation is not connected yet. Waiting for provider.',
                'code' => 'video_provider_not_connected',
                'data' => ['quota' => $snap],
            ], 503);
        }

        $consume = AiMediaCredits::consume($store, $kind);
        if (! $consume['ok']) {
            return response()->json([
                'message' => $consume['message'],
                'code' => $consume['code'],
                'data' => ['quota' => $consume['snapshot']],
            ], 429);
        }

        $productImage = $this->resolveInlineImage(
            $validated['product_image_base64'] ?? null,
            $validated['product_image_mime'] ?? null,
            $validated['product_image_url'] ?? null,
        );
        $hasProduct = $productImage !== null;

        $mergedPrompt = BrandConsistentPromptBuilder::build($prompt, [
            'palette_hex' => $profile->palette_hex,
            'persona' => $persona,
            'brand_lock' => $brandLock,
            'campaign_preset' => $campaign,
            'product_injection' => $hasProduct,
            'match_perspective' => (bool) ($validated['match_perspective'] ?? true),
            'accent_color' => $store->accent_color,
        ]);

        $finalPrompt = $mergedPrompt;
        if ($kind === 'image' && $autoEnhance) {
            $enhanced = $gemini->enhancePrompt(
                $mergedPrompt,
                $validated['locale'] ?? 'en',
                $aspect,
                $validated['style'] ?? null,
            );
            if ($enhanced['ok'] && ! empty($enhanced['prompt'])) {
                $finalPrompt = $enhanced['prompt'];
            }
        }

        if ($kind === 'video') {
            $videoResult = $gemini->generateVideo($finalPrompt);
            $usage = $consume['usage'];
            $usage->videos_used = max(0, (int) $usage->videos_used - 1);
            $usage->save();

            return response()->json([
                'message' => $videoResult['message'] ?? 'AI video generation is not available yet.',
                'code' => $videoResult['code'] ?? 'video_provider_not_connected',
                'data' => ['quota' => AiMediaCredits::snapshot($store)],
            ], 503);
        }

        $styleRefImages = [];
        if ($brandLock) {
            $styleRefImages = $this->loadStyleReferenceImages(
                BrandConsistentPromptBuilder::normalizeStyleRefs($profile->style_reference_urls)
            );
        }

        $result = $gemini->generateImage($finalPrompt, [
            'model' => $validated['model'] ?? null,
            'aspect' => $aspect,
            'image_size' => $validated['image_size'] ?? '1K',
            'style' => $validated['style'] ?? null,
            'negative_prompt' => $validated['negative_prompt'] ?? null,
            'brand_locked' => $brandLock,
            'product_image' => $productImage,
            'style_reference_images' => $styleRefImages,
        ]);

        if (! $result['ok']) {
            $usage = $consume['usage'];
            $usage->images_used = max(0, (int) $usage->images_used - 1);
            $usage->save();

            return response()->json([
                'message' => $result['message'],
                'code' => $result['code'],
                'data' => ['quota' => AiMediaCredits::snapshot($store)],
            ], 502);
        }

        $mime = $result['mime'];
        $binary = base64_decode($result['base64'], true);
        if ($binary === false || $binary === '') {
            $usage = $consume['usage'];
            $usage->images_used = max(0, (int) $usage->images_used - 1);
            $usage->save();

            return response()->json([
                'message' => 'Failed to decode AI image bytes.',
                'code' => 'decode_error',
                'data' => ['quota' => AiMediaCredits::snapshot($store)],
            ], 502);
        }

        $logoApplied = false;
        if ($logoOverlay) {
            $logoUrl = trim((string) ($profile->logo_url ?: $store->logo ?: ''));
            if ($logoUrl !== '') {
                $logoBytes = AiImageLogoOverlay::fetchLogoBytes($logoUrl);
                if ($logoBytes['ok']) {
                    $overlay = AiImageLogoOverlay::apply(
                        $binary,
                        $mime,
                        $logoBytes['binary'],
                        $logoBytes['mime'],
                        (string) ($profile->logo_overlay_position ?: 'bottom_end'),
                    );
                    if ($overlay['ok']) {
                        $binary = $overlay['binary'];
                        $mime = $overlay['mime'];
                        $logoApplied = true;
                    }
                }
            }
        }

        $ext = Str::contains($mime, 'webp') ? 'webp'
            : (Str::contains($mime, 'jpeg') || Str::contains($mime, 'jpg') ? 'jpg' : 'png');

        $title = trim((string) ($validated['title'] ?? ''));
        if ($title === '') {
            $title = 'ai-'.Str::slug(Str::limit($prompt, 40, '')) ?: 'ai-creative';
        }
        $safeBase = Str::slug($title) ?: 'ai-creative';
        $timestamp = time();
        $filename = "{$safeBase}-{$timestamp}-".Str::random(6).".{$ext}";
        $folderPath = "stores/{$storeId}/media";
        Storage::disk('public')->put("{$folderPath}/{$filename}", $binary);
        $url = "/storage/{$folderPath}/{$filename}?v={$timestamp}";

        $width = null;
        $height = null;
        if (function_exists('getimagesizefromstring')) {
            $info = @getimagesizefromstring($binary);
            if (is_array($info)) {
                $width = $info[0] ?? null;
                $height = $info[1] ?? null;
            }
        }

        $encoded = base64_encode($binary);
        $mediaPayload = [
            'file_name' => $filename,
            'file_type' => 'image',
            'mime' => $mime,
            'size_bytes' => strlen($binary),
            'width' => $width,
            'height' => $height,
            'url' => $url,
            'prompt' => $finalPrompt,
            'aspect' => $aspect,
            'model' => $result['model'],
            'preview_data_url' => 'data:'.$mime.';base64,'.$encoded,
        ];

        $mediaRow = null;
        if ($save) {
            $mediaRow = Media::create([
                'id' => 'med-'.Str::lower(Str::random(12)),
                'store_id' => $storeId,
                'file_name' => $filename,
                'file_type' => 'image',
                'mime' => $mime,
                'size_bytes' => strlen($binary),
                'width' => $width,
                'height' => $height,
                'url' => $url,
                'optimized_url' => $url,
                'webp_url' => $url,
                'thumbnail_url' => $url,
                'alt' => $title,
                'caption' => Str::limit($finalPrompt, 500),
                'folder' => 'ai-generated',
                'processing_status' => 'ready',
                'optimization_status' => 'optimized',
                'version' => 1,
                'metadata' => [
                    'source' => 'ai_generator',
                    'prompt' => $finalPrompt,
                    'prompt_raw' => $prompt,
                    'prompt_merged' => $mergedPrompt,
                    'aspect' => $aspect,
                    'model' => $result['model'],
                    'image_size' => $validated['image_size'] ?? '1K',
                    'style' => $validated['style'] ?? null,
                    'kind' => 'image',
                    'auto_enhance' => $autoEnhance,
                    'brand_lock' => $brandLock,
                    'campaign_preset' => $campaign,
                    'persona' => $persona,
                    'output_template' => $validated['output_template'] ?? null,
                    'product_injection' => $hasProduct,
                    'logo_overlay' => $logoApplied,
                ],
            ]);
            $mediaPayload['id'] = $mediaRow->id;
            $mediaPayload['folder'] = 'ai-generated';
            $mediaPayload['url'] = $mediaRow->url;
        }

        return response()->json([
            'data' => [
                'kind' => 'image',
                'media' => $mediaPayload,
                'saved' => (bool) $mediaRow,
                'prompt_used' => $finalPrompt,
                'prompt_merged' => $mergedPrompt,
                'brand_lock' => $brandLock,
                'logo_overlay_applied' => $logoApplied,
                'quota' => AiMediaCredits::snapshot($store),
            ],
            'message' => 'AI image generated for this store.',
            'store_id' => $storeId,
        ], 201);
    }

    /**
     * @return StoreAiBrandProfile
     */
    private function loadOrEmptyProfile(Store $store): StoreAiBrandProfile
    {
        $existing = StoreAiBrandProfile::query()
            ->withoutStoreScope()
            ->where('store_id', $store->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        return new StoreAiBrandProfile([
            'id' => '',
            'store_id' => $store->id,
            'palette_hex' => BrandConsistentPromptBuilder::normalizePalette(
                $store->accent_color ? [$store->accent_color] : []
            ),
            'persona' => 'modern',
            'brand_lock_default' => true,
            'logo_overlay_enabled' => false,
            'logo_overlay_position' => 'bottom_end',
            'logo_url' => $store->logo ?: null,
            'style_reference_urls' => [],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBrandProfile(StoreAiBrandProfile $profile, Store $store): array
    {
        $refs = BrandConsistentPromptBuilder::normalizeStyleRefs($profile->style_reference_urls);
        $count = count($refs);

        return [
            'store_id' => $store->id,
            'palette_hex' => BrandConsistentPromptBuilder::normalizePalette($profile->palette_hex),
            'persona' => BrandConsistentPromptBuilder::resolvePersona($profile->persona),
            'brand_lock_default' => (bool) ($profile->brand_lock_default ?? true),
            'logo_overlay_enabled' => (bool) ($profile->logo_overlay_enabled ?? false),
            'logo_overlay_position' => BrandConsistentPromptBuilder::resolveLogoPosition($profile->logo_overlay_position),
            'logo_url' => $profile->logo_url ?: ($store->logo ?: null),
            'store_accent_color' => $store->accent_color,
            'style_reference_urls' => $refs,
            'style_reference_count' => $count,
            /** Honest status — not fake LoRA training. */
            'style_reference_status' => $count >= 10
                ? 'ready'
                : ($count > 0 ? 'partial' : 'waiting'),
            'style_reference_target_min' => 10,
            'style_reference_target_max' => 15,
            'persisted' => $profile->exists,
        ];
    }

    /**
     * @return array{mime: string, base64: string}|null
     */
    private function resolveInlineImage(?string $base64, ?string $mime, ?string $url): ?array
    {
        $b64 = trim((string) $base64);
        if ($b64 !== '') {
            if (str_starts_with($b64, 'data:')) {
                if (! preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $b64, $m)) {
                    return null;
                }

                return ['mime' => $m[1], 'base64' => $m[2]];
            }
            if (base64_decode($b64, true) === false) {
                return null;
            }

            return [
                'mime' => trim((string) $mime) !== '' ? trim((string) $mime) : 'image/jpeg',
                'base64' => $b64,
            ];
        }

        $u = trim((string) $url);
        if ($u === '') {
            return null;
        }

        $fetched = AiImageLogoOverlay::fetchLogoBytes($u);
        if (! $fetched['ok']) {
            return null;
        }

        return [
            'mime' => $fetched['mime'],
            'base64' => base64_encode($fetched['binary']),
        ];
    }

    /**
     * @param  list<string>  $urls
     * @return list<array{mime: string, base64: string}>
     */
    private function loadStyleReferenceImages(array $urls): array
    {
        $out = [];
        foreach (array_slice($urls, 0, 4) as $url) {
            $fetched = AiImageLogoOverlay::fetchLogoBytes($url);
            if (! $fetched['ok']) {
                continue;
            }
            // Cap each reference ~1.5MB decoded to keep Gemini payload sane.
            if (strlen($fetched['binary']) > 1_500_000) {
                continue;
            }
            $out[] = [
                'mime' => $fetched['mime'],
                'base64' => base64_encode($fetched['binary']),
            ];
        }

        return $out;
    }

    /**
     * Persist data-URL style refs to this store's media disk; keep http(s)/storage URLs as-is.
     *
     * @param  list<string>  $urls
     * @return list<string>
     */
    private function persistStyleReferenceUrls(string $storeId, array $urls): array
    {
        $out = [];
        foreach ($urls as $url) {
            if (! str_starts_with($url, 'data:')) {
                $out[] = $url;
                continue;
            }
            if (! preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $url, $m)) {
                continue;
            }
            $bin = base64_decode($m[2], true);
            if ($bin === false || $bin === '' || strlen($bin) > 4_000_000) {
                continue;
            }
            $mime = $m[1];
            $ext = str_contains($mime, 'webp') ? 'webp'
                : (str_contains($mime, 'png') ? 'png' : 'jpg');
            $ts = time();
            $filename = 'style-ref-'.$ts.'-'.Str::random(6).'.'.$ext;
            $folderPath = "stores/{$storeId}/media/style-refs";
            Storage::disk('public')->put("{$folderPath}/{$filename}", $bin);
            $out[] = "/storage/{$folderPath}/{$filename}?v={$ts}";
            if (count($out) >= 15) {
                break;
            }
        }

        return array_values(array_unique($out));
    }
}
