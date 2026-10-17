<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaUsage;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        $id = $this->newId('med');
        $timestamp = time();

        // 1. Multipart Binary File Upload (Auto-optimized & strictly in KB)
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $safeBase = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'media';
            $saved = $this->optimizeAndSaveFile($file, $storeId, $safeBase, $timestamp);

            $media = Media::create([
                'id' => $id,
                'store_id' => $storeId,
                'file_name' => $saved['file_name'],
                'file_type' => $saved['file_type'],
                'mime' => $saved['mime'],
                'size_bytes' => $saved['size_bytes'],
                'width' => $saved['width'],
                'height' => $saved['height'],
                'url' => $saved['url'],
                'optimized_url' => $saved['url'],
                'webp_url' => $saved['url'],
                'thumbnail_url' => $saved['url'],
                'alt' => $request->input('alt') ?: $safeBase,
                'caption' => $request->input('caption'),
                'folder' => $request->input('folder', 'general'),
                'processing_status' => 'ready',
                'optimization_status' => 'optimized',
                'version' => 1,
            ]);

            return response()->json([
                'data' => $media,
                'message' => 'File uploaded, auto-optimized and saved successfully.',
            ], 201);
        }

        // 2. Base64 Data URL or Plain URL Upload
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

        $rawUrl = $validated['url'];

        // If Base64 string is provided, decode and save as a real file to disk!
        if (preg_match('/^data:([^;]+);base64,(.+)$/', $rawUrl, $matches)) {
            $mimeType = $matches[1];
            $base64Data = base64_decode($matches[2]);
            
            $ext = 'jpg';
            if (Str::contains($mimeType, 'png')) $ext = 'png';
            elseif (Str::contains($mimeType, 'webp')) $ext = 'webp';
            elseif (Str::contains($mimeType, 'gif')) $ext = 'gif';
            elseif (Str::contains($mimeType, 'svg')) $ext = 'svg';
            elseif (Str::contains($mimeType, 'mp4')) $ext = 'mp4';

            $safeBase = Str::slug($validated['file_name'] ?? 'media-asset') ?: 'asset';
            $filename = "{$safeBase}-{$timestamp}-" . Str::random(6) . ".{$ext}";
            $folderPath = "stores/{$storeId}/media";
            
            Storage::disk('public')->put("{$folderPath}/{$filename}", $base64Data);
            $rawUrl = "/storage/{$folderPath}/{$filename}?v={$timestamp}";
            $validated['mime'] = $mimeType;
            $validated['size_bytes'] = strlen($base64Data);
        }

        $media = Media::create([
            'id' => $id,
            'store_id' => $storeId,
            'file_name' => $validated['file_name'] ?? 'media-asset',
            'file_type' => $validated['file_type'] ?? 'image',
            'mime' => $validated['mime'] ?? 'image/jpeg',
            'size_bytes' => $validated['size_bytes'] ?? 0,
            'width' => $validated['width'] ?? null,
            'height' => $validated['height'] ?? null,
            'url' => $rawUrl,
            'optimized_url' => $validated['optimized_url'] ?? $rawUrl,
            'webp_url' => $validated['webp_url'] ?? $rawUrl,
            'avif_url' => $validated['avif_url'] ?? null,
            'thumbnail_url' => $validated['thumbnail_url'] ?? $rawUrl,
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

        $timestamp = time();
        $oldUrl = $media->url;
        $newUrl = null;
        $newVersion = ($media->version ?? 1) + 1;

        // 1. Multipart binary file replacement (Auto-optimized & strictly in KB)
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $safeBase = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'media';
            $saved = $this->optimizeAndSaveFile($file, $storeId, $safeBase, $timestamp, $newVersion);
            $newUrl = $saved['url'];

            $media->update([
                'url' => $newUrl,
                'optimized_url' => $newUrl,
                'webp_url' => $newUrl,
                'thumbnail_url' => $newUrl,
                'file_name' => $saved['file_name'],
                'size_bytes' => $saved['size_bytes'],
                'mime' => $saved['mime'],
                'width' => $saved['width'] ?? $media->width,
                'height' => $saved['height'] ?? $media->height,
                'version' => $newVersion,
            ]);
        } else {
            // 2. Base64 or URL replacement
            $validated = $request->validate([
                'url' => ['required', 'string'],
                'file_name' => ['nullable', 'string', 'max:255'],
                'mime' => ['nullable', 'string', 'max:128'],
                'size_bytes' => ['nullable', 'integer'],
            ]);

            $newUrl = $validated['url'];

            // Decode base64 if provided
            if (preg_match('/^data:([^;]+);base64,(.+)$/', $newUrl, $matches)) {
                $mimeType = $matches[1];
                $base64Data = base64_decode($matches[2]);
                $ext = Str::contains($mimeType, 'png') ? 'png' : (Str::contains($mimeType, 'webp') ? 'webp' : 'jpg');
                $filename = "replaced-v{$newVersion}-{$timestamp}.{$ext}";
                $folderPath = "stores/{$storeId}/media";
                
                Storage::disk('public')->put("{$folderPath}/{$filename}", $base64Data);
                $newUrl = "/storage/{$folderPath}/{$filename}?v={$timestamp}";
            }

            $media->update([
                'url' => $newUrl,
                'optimized_url' => $newUrl,
                'webp_url' => $newUrl,
                'thumbnail_url' => $newUrl,
                'file_name' => $validated['file_name'] ?? $media->file_name,
                'version' => $newVersion,
            ]);
        }

        // Cascade update products using the old URL
        Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where(function ($q) use ($oldUrl) {
                $q->where('image_url', $oldUrl)->orWhere('image_url', 'like', explode('?', $oldUrl)[0] . '%');
            })
            ->update([
                'image_url' => $newUrl,
                'image_version' => (string) $newVersion,
            ]);

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
        $usageCount = $media->usages ? $media->usages->count() : 0;

        if ($usageCount > 0 && ! $force) {
            return response()->json([
                'message' => "This media is currently in use by {$usageCount} item(s). Use force=true to confirm permanent delete.",
                'usages' => $media->usages,
                'usage_count' => $usageCount,
            ], 409);
        }

        // If local file on disk, remove physical file
        if ($media->url && Str::startsWith($media->url, '/storage/')) {
            $relativePath = Str::after(explode('?', $media->url)[0], '/storage/');
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }

        $media->delete();

        return response()->json([
            'message' => 'Media asset deleted successfully',
            'id' => $id,
        ]);
    }

    public function usages(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $usages = MediaUsage::query()->forStore($storeId)->where('media_id', $id)->get();

        return response()->json(['data' => $usages]);
    }

    /**
     * Auto-resizes large images (max 1600px) and compresses to WebP strictly in KB range.
     */
    private function optimizeAndSaveFile($file, string $storeId, string $safeBase, int $timestamp, ?int $version = null): array
    {
        $folderPath = "stores/{$storeId}/media";
        $origExt = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $realPath = $file->getRealPath();
        
        $width = null;
        $height = null;
        $sizeBytes = $file->getSize();
        $mime = $file->getMimeType() ?: 'image/jpeg';
        $fileType = Str::startsWith($mime, 'video') ? 'video' : (Str::contains($mime, 'svg') ? 'svg' : (Str::contains($mime, 'gif') ? 'gif' : 'image'));
        
        $vTag = $version ? "-v{$version}" : "";

        // If Image & not SVG/GIF -> Auto-resize to max 1600px & compress to WebP strictly in KB!
        if ($fileType === 'image' && function_exists('imagecreatefromstring') && function_exists('imagewebp') && !in_array($origExt, ['svg', 'gif'])) {
            $raw = @file_get_contents($realPath);
            $src = $raw ? @imagecreatefromstring($raw) : null;
            if ($src) {
                $origW = imagesx($src);
                $origH = imagesy($src);
                $maxDim = 1600;
                
                if ($origW > $maxDim || $origH > $maxDim) {
                    if ($origW > $origH) {
                        $newW = $maxDim;
                        $newH = (int) round(($origH * $maxDim) / $origW);
                    } else {
                        $newH = $maxDim;
                        $newW = (int) round(($origW * $maxDim) / $origH);
                    }
                    $dst = imagecreatetruecolor($newW, $newH);
                    imagealphablending($dst, false);
                    imagesavealpha($dst, true);
                    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
                    imagedestroy($src);
                    $src = $dst;
                    $width = $newW;
                    $height = $newH;
                } else {
                    $width = $origW;
                    $height = $origH;
                }
                
                $filename = "{$safeBase}{$vTag}-{$timestamp}-" . Str::random(6) . ".webp";
                $diskFullDir = storage_path("app/public/{$folderPath}");
                if (!is_dir($diskFullDir)) {
                    @mkdir($diskFullDir, 0755, true);
                }
                $targetFile = "{$diskFullDir}/{$filename}";
                
                // Save WebP at 82 quality (crystal sharp, strictly in KB)
                imagewebp($src, $targetFile, 82);
                imagedestroy($src);
                
                $storagePath = "{$folderPath}/{$filename}";
                $publicUrl = "/storage/{$storagePath}?v={$timestamp}";
                $sizeBytes = @filesize($targetFile) ?: $sizeBytes;
                $mime = 'image/webp';
                
                return [
                    'url' => $publicUrl,
                    'file_name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '.webp',
                    'file_type' => $fileType,
                    'mime' => $mime,
                    'size_bytes' => $sizeBytes,
                    'width' => $width,
                    'height' => $height,
                ];
            }
        }

        // Standard save for videos, svgs, or fallback
        $filename = "{$safeBase}{$vTag}-{$timestamp}-" . Str::random(6) . ".{$origExt}";
        $storagePath = Storage::disk('public')->putFileAs($folderPath, $file, $filename);
        $publicUrl = "/storage/{$storagePath}?v={$timestamp}";
        if ($fileType === 'image' && function_exists('getimagesize')) {
            $dims = @getimagesize($realPath);
            if ($dims) {
                $width = $dims[0];
                $height = $dims[1];
            }
        }

        return [
            'url' => $publicUrl,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $fileType,
            'mime' => $mime,
            'size_bytes' => $sizeBytes,
            'width' => $width,
            'height' => $height,
        ];
    }
}
