<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaUsage;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Media::query()->forStore($storeId)->with('usages');

        if ($type = $request->query('file_type')) {
            if ($type !== 'all') {
                $query->where('file_type', $type);
            }
        }

        if ($folder = $request->query('folder')) {
            if ($folder !== 'all') {
                $query->where('folder', $folder);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', "%{$search}%")
                  ->orWhere('alt', 'like', "%{$search}%")
                  ->orWhere('caption', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->query('sort', 'newest');
        switch ($sortBy) {
            case 'oldest':
                $query->oldest('created_at');
                break;
            case 'largest':
                $query->orderByDesc('size_bytes');
                break;
            case 'smallest':
                $query->orderBy('size_bytes');
                break;
            case 'name':
                $query->orderBy('file_name');
                break;
            case 'newest':
            default:
                $query->latest('created_at');
                break;
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 30)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'file_name' => ['nullable', 'string', 'max:255'],
            'file_type' => ['nullable', 'string', 'in:image,video,gif,svg'],
            'mime' => ['nullable', 'string', 'max:128'],
            'size_bytes' => ['nullable', 'integer'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
            'url' => ['required', 'string'],
            'optimized_url' => ['nullable', 'string'],
            'webp_url' => ['nullable', 'string'],
            'avif_url' => ['nullable', 'string'],
            'thumbnail_url' => ['nullable', 'string'],
            'poster_url' => ['nullable', 'string'],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'folder' => ['nullable', 'string', 'max:64'],
            'metadata' => ['nullable', 'array'],
        ]);

        $id = $this->newId('med');

        $media = Media::create([
            'id' => $id,
            'store_id' => $storeId,
            'file_name' => $validated['file_name'] ?? 'media-asset',
            'file_type' => $validated['file_type'] ?? 'image',
            'mime' => $validated['mime'] ?? 'image/jpeg',
            'size_bytes' => $validated['size_bytes'] ?? 0,
            'width' => $validated['width'] ?? null,
            'height' => $validated['height'] ?? null,
            'url' => $validated['url'],
            'optimized_url' => $validated['optimized_url'] ?? $validated['url'],
            'webp_url' => $validated['webp_url'] ?? $validated['url'],
            'avif_url' => $validated['avif_url'] ?? null,
            'thumbnail_url' => $validated['thumbnail_url'] ?? $validated['url'],
            'poster_url' => $validated['poster_url'] ?? null,
            'alt' => $validated['alt'] ?? null,
            'caption' => $validated['caption'] ?? null,
            'folder' => $validated['folder'] ?? 'general',
            'processing_status' => 'ready',
            'optimization_status' => 'optimized',
            'version' => 1,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json([
            'data' => $media,
            'message' => 'Media asset saved to store library',
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $media = Media::query()->forStore($storeId)->with('usages')->find($id);
        if (! $media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        return response()->json(['data' => $media]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $media = Media::query()->forStore($storeId)->find($id);
        if (! $media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        $validated = $request->validate([
            'file_name' => ['nullable', 'string', 'max:255'],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'folder' => ['nullable', 'string', 'max:64'],
        ]);

        $media->update(array_filter($validated, fn ($val) => $val !== null));

        return response()->json([
            'data' => $media,
            'message' => 'Media details updated',
        ]);
    }

    public function replace(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $media = Media::query()->forStore($storeId)->find($id);
        if (! $media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        $validated = $request->validate([
            'url' => ['required', 'string'],
            'file_name' => ['nullable', 'string', 'max:255'],
            'file_type' => ['nullable', 'string', 'in:image,video,gif,svg'],
            'mime' => ['nullable', 'string', 'max:128'],
            'size_bytes' => ['nullable', 'integer'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
            'optimized_url' => ['nullable', 'string'],
            'webp_url' => ['nullable', 'string'],
            'thumbnail_url' => ['nullable', 'string'],
            'poster_url' => ['nullable', 'string'],
        ]);

        $oldUrl = $media->url;
        $newUrl = $validated['url'];
        $newVersion = ($media->version ?? 1) + 1;

        $media->update([
            'url' => $newUrl,
            'file_name' => $validated['file_name'] ?? $media->file_name,
            'file_type' => $validated['file_type'] ?? $media->file_type,
            'mime' => $validated['mime'] ?? $media->mime,
            'size_bytes' => $validated['size_bytes'] ?? $media->size_bytes,
            'width' => $validated['width'] ?? $media->width,
            'height' => $validated['height'] ?? $media->height,
            'optimized_url' => $validated['optimized_url'] ?? $newUrl,
            'webp_url' => $validated['webp_url'] ?? $newUrl,
            'thumbnail_url' => $validated['thumbnail_url'] ?? $newUrl,
            'poster_url' => $validated['poster_url'] ?? $media->poster_url,
            'version' => $newVersion,
            'optimization_status' => 'optimized',
        ]);

        // Cascade update in products where old URL was used
        Product::query()->forStore($storeId)
            ->where('image', $oldUrl)
            ->update(['image' => $newUrl]);

        return response()->json([
            'data' => $media,
            'message' => "Media asset replaced with zero-stale cache version v{$newVersion}",
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $media = Media::query()->forStore($storeId)->with('usages')->find($id);
        if (! $media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        $force = filter_var($request->query('force', false), FILTER_VALIDATE_BOOLEAN);
        $usageCount = $media->usages->count();

        if ($usageCount > 0 && ! $force) {
            return response()->json([
                'message' => "This media is currently in use by {$usageCount} item(s). Use force=true to confirm permanent delete.",
                'usages' => $media->usages,
                'usage_count' => $usageCount,
            ], 409);
        }

        $media->delete();

        return response()->json([
            'message' => 'Media asset deleted permanently',
        ]);
    }

    public function usages(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $media = Media::query()->forStore($storeId)->with('usages')->find($id);
        if (! $media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        return response()->json([
            'data' => $media->usages,
            'count' => $media->usages->count(),
        ]);
    }
}
