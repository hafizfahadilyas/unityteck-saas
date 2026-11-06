<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MediaFolderController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $folders = MediaFolder::query()
            ->forStore($storeId)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $folders, 'store_id' => $storeId]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'slug' => ['nullable', 'string', 'max:64'],
            'parent_id' => [
                'nullable',
                'string',
                'max:64',
                Rule::exists('media_folders', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);
        $slug = $slug ?: 'folder';
        $slug = $this->uniqueSlug($storeId, $slug);

        $folder = MediaFolder::query()->create([
            'id' => $this->newId('mfld'),
            'store_id' => $storeId,
            'name' => $data['name'],
            'slug' => $slug,
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return response()->json(['data' => $folder], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $folder = MediaFolder::query()->forStore($storeId)->find($id);
        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'slug' => ['sometimes', 'string', 'max:64'],
            'parent_id' => [
                'nullable',
                'string',
                'max:64',
                Rule::exists('media_folders', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
        ]);

        if (isset($data['parent_id']) && $data['parent_id'] === $folder->id) {
            return response()->json(['message' => 'Folder cannot be its own parent.'], 422);
        }

        if (isset($data['slug']) && $data['slug'] !== $folder->slug) {
            $newSlug = $this->uniqueSlug($storeId, $data['slug'], $folder->id);
            $oldSlug = $folder->slug;
            Media::query()->forStore($storeId)->where('folder', $oldSlug)->update(['folder' => $newSlug]);
            $data['slug'] = $newSlug;
        }

        $folder->fill($data)->save();

        return response()->json(['data' => $folder->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $folder = MediaFolder::query()->forStore($storeId)->find($id);
        if (! $folder) {
            return response()->json(['message' => 'Folder not found'], 404);
        }

        $moveToGeneral = filter_var($request->query('move_assets', true), FILTER_VALIDATE_BOOLEAN);
        $assetCount = Media::query()->forStore($storeId)->where('folder', $folder->slug)->count();
        $childCount = MediaFolder::query()->forStore($storeId)->where('parent_id', $folder->id)->count();

        if ($childCount > 0) {
            return response()->json(['message' => 'Folder has subfolders. Remove or move them first.'], 422);
        }

        if ($assetCount > 0 && ! $moveToGeneral) {
            return response()->json([
                'message' => 'Folder is not empty. Pass move_assets=true to move assets to general.',
                'asset_count' => $assetCount,
            ], 409);
        }

        if ($assetCount > 0) {
            Media::query()->forStore($storeId)->where('folder', $folder->slug)->update(['folder' => 'general']);
        }

        $folder->delete();

        return response()->json([
            'message' => 'Folder deleted.',
            'id' => $id,
            'assets_moved' => $assetCount,
        ]);
    }

    protected function uniqueSlug(string $storeId, string $slug, ?string $exceptId = null): string
    {
        $base = Str::slug($slug) ?: 'folder';
        $candidate = $base;
        $i = 0;
        while ($this->slugTaken($storeId, $candidate, $exceptId)) {
            $i++;
            $candidate = $base.'-'.$i;
        }

        return $candidate;
    }

    protected function slugTaken(string $storeId, string $slug, ?string $exceptId = null): bool
    {
        $q = MediaFolder::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('slug', $slug);
        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->exists();
    }
}
