<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiGenerationHistory;
use App\Models\Media;
use App\Models\Store;
use App\Services\Gemini\GeminiMerchantStudioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreAiStudioController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        private readonly GeminiMerchantStudioService $studioService,
    ) {}

    /**
     * Get merchant's AI Studio status, limits, and enabled models.
     */
    public function quota(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        return response()->json([
            'data' => $this->studioService->getStoreQuota($store),
        ]);
    }

    /**
     * Generate or edit an image in Merchant AI Studio.
     */
    public function generate(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $validated = $request->validate([
            'prompt' => ['required', 'string', 'min:3', 'max:2000'],
            'model_id' => ['nullable', 'string', 'max:80'],
            'aspect_ratio' => ['nullable', 'string', 'max:16'],
            'image_size' => ['nullable', 'string', 'in:1K,2K,4K'],
            'style' => ['nullable', 'string', 'max:32'],
            'action_type' => ['nullable', 'string', 'in:text_to_image,edit,remove_bg,replace_bg,banner,lifestyle,product_photography'],
            'product_image_base64' => ['nullable', 'string'],
            'product_image_mime' => ['nullable', 'string', 'max:32'],
        ]);

        $res = $this->studioService->generate($store, $validated);

        if (! $res['ok']) {
            $status = match ($res['code'] ?? '') {
                'ai_disabled', 'no_credits', 'daily_limit_exceeded' => 403,
                'maintenance' => 503,
                'invalid_prompt' => 422,
                default => 502,
            };

            return response()->json([
                'message' => $res['message'],
                'code' => $res['code'] ?? 'error',
            ], $status);
        }

        return response()->json($res, 201);
    }

    /**
     * Merchant generation history (strictly isolated to this store).
     */
    public function history(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $limit = min(50, max(5, (int) $request->query('limit', 20)));
        $history = AiGenerationHistory::where('store_id', $storeId)
            ->where('status', 'success')
            ->orderByDesc('created_at')
            ->paginate($limit);

        return response()->json([
            'data' => $history->items(),
            'current_page' => $history->currentPage(),
            'last_page' => $history->lastPage(),
            'total' => $history->total(),
        ]);
    }

    /**
     * Save an existing generated image to store media library.
     */
    public function saveToMedia(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'history_id' => ['required', 'string', 'exists:ai_generation_history,id'],
            'folder' => ['nullable', 'string', 'max:64'],
        ]);

        $history = AiGenerationHistory::where('id', $validated['history_id'])
            ->where('store_id', $storeId)
            ->first();

        if (! $history) {
            return response()->json(['message' => 'Generation record not found for this store.'], 404);
        }

        $folder = $validated['folder'] ?? 'ai-studio';
        $media = Media::where('id', $history->media_id)->where('store_id', $storeId)->first();

        if ($media) {
            $media->folder = $folder;
            $media->save();

            return response()->json([
                'ok' => true,
                'message' => 'Image saved to media library in folder: '.$folder,
                'media' => $media,
            ]);
        }

        return response()->json(['message' => 'Media record not found.'], 404);
    }
}
