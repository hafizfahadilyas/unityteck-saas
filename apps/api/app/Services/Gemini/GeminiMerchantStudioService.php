<?php

namespace App\Services\Gemini;

use App\Models\AiGenerationHistory;
use App\Models\AiMerchantLimit;
use App\Models\AiModel;
use App\Models\AiUsageLog;
use App\Models\Media;
use App\Models\Store;
use App\Services\GeminiAiMediaService;
use App\Support\AiImageLogoOverlay;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeminiMerchantStudioService
{
    public function __construct(
        private readonly GeminiAiMediaService $geminiMedia,
        private readonly GeminiSettingsService $settingsService,
    ) {}

    /**
     * Get merchant quota snapshot & active enabled models.
     */
    public function getStoreQuota(Store $store): array
    {
        $limit = $this->settingsService->getOrCreateMerchantLimit($store);
        $config = $this->settingsService->getOrCreateConfig();

        // Count today's & this month's generated images
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $dailyUsed = AiGenerationHistory::where('store_id', $store->id)
            ->where('created_at', '>=', $todayStart)
            ->where('status', 'success')
            ->count();

        $monthlyUsed = AiGenerationHistory::where('store_id', $store->id)
            ->where('created_at', '>=', $monthStart)
            ->where('status', 'success')
            ->count();

        // Models enabled by Super Admin
        $enabledModels = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->where('is_enabled', true)
            ->orderBy('priority')
            ->get()
            ->map(fn (AiModel $m) => [
                'id' => $m->model_id,
                'name_en' => $m->name_en,
                'name_ar' => $m->name_ar,
                'tier' => $m->tier,
                'capabilities' => $m->capabilities,
                'supports_image_generation' => $m->supports_image_generation,
                'supports_image_editing' => $m->supports_image_editing,
                'is_default' => (bool) $m->is_default,
            ]);

        $isPaused = (bool) $limit->is_paused || ! (bool) $limit->ai_enabled || (bool) $config->global_maintenance_mode;

        return [
            'store_id' => $store->id,
            'ai_enabled' => (bool) $limit->ai_enabled,
            'is_paused' => $isPaused,
            'pause_reason' => $limit->pause_reason ?: ($config->global_maintenance_mode ? 'System undergoing scheduled maintenance' : null),
            'remaining_credits' => (int) $limit->remaining_credits,
            'daily_limit' => (int) $limit->daily_image_limit,
            'daily_used' => $dailyUsed,
            'daily_remaining' => max(0, (int) $limit->daily_image_limit - $dailyUsed),
            'monthly_limit' => (int) $limit->monthly_image_limit,
            'monthly_used' => $monthlyUsed,
            'monthly_remaining' => max(0, (int) $limit->monthly_image_limit - $monthlyUsed),
            'max_images_per_request' => (int) $limit->max_images_per_request,
            'models' => $enabledModels,
            'default_model' => $config->default_image_model,
            'default_aspect' => $config->default_aspect_ratio,
            'allowed_aspects' => $config->allowed_aspect_ratios ?: ['1:1', '4:5', '16:9'],
            'max_resolution' => $config->max_image_resolution,
            'features' => [
                'text_to_image' => (bool) $config->feature_text_to_image,
                'image_to_image' => (bool) $config->feature_image_to_image,
                'product_photography' => (bool) $config->feature_product_photography,
                'background_replacement' => (bool) $config->feature_background_replacement,
                'lifestyle_scenes' => (bool) $config->feature_lifestyle_scenes,
                'promotional_banners' => (bool) $config->feature_promotional_banners,
                'social_creatives' => (bool) $config->feature_social_creatives,
                'product_variations' => (bool) $config->feature_product_variations,
            ],
        ];
    }

    /**
     * Generate product image for merchant studio.
     */
    public function generate(Store $store, array $input): array
    {
        $limit = $this->settingsService->getOrCreateMerchantLimit($store);
        $config = $this->settingsService->getOrCreateConfig();

        if ($config->global_maintenance_mode) {
            return ['ok' => false, 'code' => 'maintenance', 'message' => 'Gemini AI is currently under maintenance. Please try again shortly.'];
        }

        if (! $limit->ai_enabled || $limit->is_paused) {
            return ['ok' => false, 'code' => 'ai_disabled', 'message' => $limit->pause_reason ?: 'AI access is paused for this merchant.'];
        }

        if ($limit->remaining_credits <= 0) {
            return ['ok' => false, 'code' => 'no_credits', 'message' => 'Your AI credits balance is 0. Please request a credit top-up.'];
        }

        // Daily limit check
        $dailyUsed = AiGenerationHistory::where('store_id', $store->id)
            ->where('created_at', '>=', now()->startOfDay())
            ->where('status', 'success')
            ->count();

        if ($dailyUsed >= $limit->daily_image_limit) {
            return ['ok' => false, 'code' => 'daily_limit_exceeded', 'message' => "Daily generation limit of {$limit->daily_image_limit} images reached for today."];
        }

        $prompt = trim((string) ($input['prompt'] ?? ''));
        if (mb_strlen($prompt) < 4) {
            return ['ok' => false, 'code' => 'invalid_prompt', 'message' => 'Prompt must be at least 4 characters.'];
        }

        $modelId = trim((string) ($input['model_id'] ?? $config->default_image_model));
        // Verify model is active and enabled
        $activeModel = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->where('model_id', $modelId)
            ->where('is_enabled', true)
            ->first();

        if (! $activeModel) {
            $modelId = $config->default_image_model;
        }

        $aspect = trim((string) ($input['aspect_ratio'] ?? $config->default_aspect_ratio));
        $imageSize = trim((string) ($input['image_size'] ?? '1K'));
        $style = trim((string) ($input['style'] ?? 'studio'));
        $actionType = trim((string) ($input['action_type'] ?? 'text_to_image'));

        // Handle product image injection if provided (e.g. background replacement or lifestyle)
        $productImage = null;
        if (! empty($input['product_image_base64'])) {
            $b64 = $input['product_image_base64'];
            $mime = $input['product_image_mime'] ?? 'image/jpeg';
            if (str_starts_with($b64, 'data:')) {
                if (preg_match('#^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$#', $b64, $m)) {
                    $mime = $m[1];
                    $b64 = $m[2];
                }
            }
            $productImage = [
                'mime' => $mime,
                'base64' => $b64,
            ];
        }

        // Mode-specific prompt enrichment
        $enrichedPrompt = match ($actionType) {
            'remove_bg', 'replace_bg' => "Product background replacement studio scene. Keep the exact foreground product intact, replace background with {$prompt}. Soft studio shadow underneath.",
            'lifestyle' => "Authentic commercial lifestyle product photograph. {$prompt}. Saudi lifestyle ambient lighting, natural depth of field, premium quality.",
            'banner' => "High-impact promotional marketing banner for e-commerce store. {$prompt}. Clean space for promotional text, commercial color grading.",
            'product_photography' => "Professional product studio photography on clean pedestal. {$prompt}. Softbox rim lighting, pristine commercial catalog appearance.",
            default => $prompt,
        };

        $start = microtime(true);
        $result = $this->geminiMedia->generateImage($enrichedPrompt, [
            'model' => $modelId,
            'aspect' => $aspect,
            'image_size' => $imageSize,
            'style' => $style,
            'product_image' => $productImage,
            'brand_locked' => true,
        ]);
        $durationMs = (int) round((microtime(true) - $start) * 1000);

        if (! $result['ok']) {
            // Log failure
            AiUsageLog::create([
                'id' => 'log-'.Str::lower(Str::random(12)),
                'request_id' => 'req-'.Str::random(10),
                'store_id' => $store->id,
                'merchant_id' => $limit->merchant_id,
                'provider_id' => GeminiSettingsService::PROVIDER_ID,
                'model_id' => $modelId,
                'endpoint' => '/models/'.$modelId.':generateContent',
                'response_time_ms' => $durationMs,
                'http_status' => 500,
                'status' => 'failed',
                'error_code' => $result['code'] ?? 'provider_error',
                'error_message' => $result['message'] ?? 'Image generation failed',
                'created_at' => now(),
            ]);

            return $result;
        }

        // Decode binary
        $binary = base64_decode($result['base64'], true);
        if ($binary === false || $binary === '') {
            return ['ok' => false, 'code' => 'decode_error', 'message' => 'Failed to decode generated image bytes.'];
        }

        // Deduct 1 credit
        $limit->remaining_credits = max(0, $limit->remaining_credits - 1);
        $limit->save();

        $historyId = 'aigen-'.Str::lower(Str::random(12));

        // Record credit transaction
        AiCreditTransaction::create([
            'id' => 'tx-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'merchant_id' => $limit->merchant_id,
            'provider_id' => GeminiSettingsService::PROVIDER_ID,
            'transaction_type' => 'deduction',
            'amount' => -1,
            'balance_after' => $limit->remaining_credits,
            'reason' => 'Image generation via '.$modelId,
            'reference_id' => $historyId,
            'created_at' => now(),
        ]);

        // Save image to storage disk
        $mime = $result['mime'];
        $ext = str_contains($mime, 'webp') ? 'webp' : (str_contains($mime, 'png') ? 'png' : 'jpg');
        $ts = time();
        $filename = 'ai-studio-'.$ts.'-'.Str::random(6).'.'.$ext;
        $folderPath = "stores/{$store->id}/media/ai-studio";
        Storage::disk('public')->put("{$folderPath}/{$filename}", $binary);
        $url = "/storage/{$folderPath}/{$filename}?v={$ts}";

        // Save into Media library
        $mediaRow = Media::create([
            'id' => 'med-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'file_name' => $filename,
            'file_type' => 'image',
            'mime' => $mime,
            'size_bytes' => strlen($binary),
            'url' => $url,
            'optimized_url' => $url,
            'webp_url' => $url,
            'thumbnail_url' => $url,
            'alt' => Str::limit($prompt, 80),
            'caption' => Str::limit($enrichedPrompt, 500),
            'folder' => 'ai-studio',
            'processing_status' => 'ready',
            'optimization_status' => 'optimized',
            'version' => 1,
            'metadata' => [
                'source' => 'gemini_ai_studio',
                'model' => $modelId,
                'aspect_ratio' => $aspect,
                'action_type' => $actionType,
            ],
        ]);

        // Save in ai_generation_history
        AiGenerationHistory::create([
            'id' => $historyId,
            'store_id' => $store->id,
            'merchant_id' => $limit->merchant_id,
            'provider_id' => GeminiSettingsService::PROVIDER_ID,
            'model_id' => $modelId,
            'action_type' => $actionType,
            'prompt' => $prompt,
            'revised_prompt' => $enrichedPrompt,
            'aspect_ratio' => $aspect,
            'image_size' => $imageSize,
            'style' => $style,
            'media_id' => $mediaRow->id,
            'image_url' => $url,
            'size_bytes' => strlen($binary),
            'mime_type' => $mime,
            'execution_time_ms' => $durationMs,
            'status' => 'success',
            'created_at' => now(),
        ]);

        // Record API usage log
        $pricePerImage = $activeModel?->image_generation_price_usd ?: 0.030;
        AiUsageLog::create([
            'id' => 'log-'.Str::lower(Str::random(12)),
            'request_id' => 'req-'.Str::random(10),
            'store_id' => $store->id,
            'merchant_id' => $limit->merchant_id,
            'provider_id' => GeminiSettingsService::PROVIDER_ID,
            'model_id' => $modelId,
            'endpoint' => '/models/'.$modelId.':generateContent',
            'cost_usd' => $pricePerImage,
            'response_time_ms' => $durationMs,
            'http_status' => 200,
            'status' => 'success',
            'created_at' => now(),
        ]);

        return [
            'ok' => true,
            'image' => [
                'id' => $historyId,
                'media_id' => $mediaRow->id,
                'url' => $url,
                'preview_data_url' => 'data:'.$mime.';base64,'.base64_encode($binary),
                'prompt' => $prompt,
                'model' => $modelId,
                'aspect_ratio' => $aspect,
                'action_type' => $actionType,
                'created_at' => now()->toIso8601String(),
            ],
            'quota' => $this->getStoreQuota($store),
            'message' => 'Image generated successfully with Gemini AI.',
        ];
    }
}
