<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Store;
use App\Services\GeminiAiMediaService;
use App\Support\AiMediaCredits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            'data' => AiMediaCredits::snapshot($store),
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
            'aspect' => ['nullable', 'string', 'in:1:1,4:5,9:16,16:9'],
            'save_to_library' => ['nullable', 'boolean'],
            'title' => ['nullable', 'string', 'max:191'],
        ]);

        $kind = $validated['kind'];
        $prompt = trim($validated['prompt']);
        $aspect = $validated['aspect'] ?? '1:1';
        $save = array_key_exists('save_to_library', $validated)
            ? (bool) $validated['save_to_library']
            : true;

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

        $aspectHint = match ($aspect) {
            '4:5' => 'Portrait 4:5 Instagram feed.',
            '9:16' => 'Vertical 9:16 Reels / Stories.',
            '16:9' => 'Landscape 16:9 banner.',
            default => 'Square 1:1 social post.',
        };
        $fullPrompt = $prompt.' '.$aspectHint;

        if ($kind === 'video') {
            $videoResult = $gemini->generateVideo($fullPrompt);
            // Refund always for now — video pipeline is not end-to-end yet.
            $usage = $consume['usage'];
            $usage->videos_used = max(0, (int) $usage->videos_used - 1);
            $usage->save();

            return response()->json([
                'message' => $videoResult['message'] ?? 'AI video generation is not available yet.',
                'code' => $videoResult['code'] ?? 'video_provider_not_connected',
                'data' => ['quota' => AiMediaCredits::snapshot($store)],
            ], 503);
        }

        $result = $gemini->generateImage($fullPrompt);
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
        $ext = Str::contains($mime, 'webp') ? 'webp'
            : (Str::contains($mime, 'jpeg') || Str::contains($mime, 'jpg') ? 'jpg' : 'png');
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

        $mediaPayload = [
            'file_name' => $filename,
            'file_type' => 'image',
            'mime' => $mime,
            'size_bytes' => strlen($binary),
            'width' => $width,
            'height' => $height,
            'url' => $url,
            'prompt' => $prompt,
            'aspect' => $aspect,
            'model' => $result['model'],
            'preview_data_url' => 'data:'.$mime.';base64,'.$result['base64'],
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
                'caption' => Str::limit($prompt, 500),
                'folder' => 'ai-generated',
                'processing_status' => 'ready',
                'optimization_status' => 'optimized',
                'version' => 1,
                'metadata' => [
                    'source' => 'ai_generator',
                    'prompt' => $prompt,
                    'aspect' => $aspect,
                    'model' => $result['model'],
                    'kind' => 'image',
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
                'quota' => AiMediaCredits::snapshot($store),
            ],
            'message' => 'AI image generated for this store.',
            'store_id' => $storeId,
        ], 201);
    }
}
