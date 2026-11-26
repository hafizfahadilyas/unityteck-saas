<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreStudioDesign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreStudioDesignController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $editorType = $request->query('editor_type');
        $perPage = min(50, max(1, (int) $request->query('per_page', 10)));
        $page = max(1, (int) $request->query('page', 1));

        // CRITICAL: never SELECT design_json here — PPTX packs are multi‑MB and hang list/home.
        // Full layers only via show() / GET /studio-designs/{id}.
        $q = StoreStudioDesign::query()
            ->select([
                'id',
                'store_id',
                'editor_type',
                'category',
                'title',
                'width',
                'height',
                'preview_media_id',
                'source',
                'created_at',
                'updated_at',
            ])
            ->where('store_id', $storeId)
            ->orderByDesc('updated_at');

        if (is_string($editorType) && $editorType !== '') {
            $q->where('editor_type', $editorType);
        }

        $total = (clone $q)->count();
        $rows = $q->forPage($page, $perPage)->get()->map(static function (StoreStudioDesign $row) {
            $source = (string) ($row->source ?? 'studio');
            $id = (string) $row->id;
            $fromPptx = $source === 'pptx'
                || $source === 'master'
                || str_starts_with($id, 'dsd-pptx-');

            return [
                'id' => $row->id,
                'store_id' => $row->store_id,
                'editor_type' => $row->editor_type,
                'category' => $row->category,
                'title' => $row->title,
                'width' => $row->width,
                'height' => $row->height,
                'design_json' => [
                    'fromPptxPack' => $fromPptx,
                    'packKey' => null,
                    'masterDistributed' => $source === 'master',
                    'masterLibrary' => false,
                    'category' => $row->category,
                    'source' => $source,
                    'width' => $row->width,
                    'height' => $row->height,
                    'layerCount' => 0,
                    'layers' => [],
                    'needsLayersFetch' => true,
                    'previewDataUrl' => null,
                ],
                'preview_media_id' => $row->preview_media_id,
                'source' => $row->source,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'has_more' => ($page * $perPage) < $total,
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $row = StoreStudioDesign::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->first();

        if (! $row) {
            return response()->json(['message' => 'Design not found.'], 404);
        }

        return response()->json(['data' => $row]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'editor_type' => ['required', 'in:banner,logo,product_card'],
            'category' => ['nullable', 'string', 'max:32'],
            'title' => ['required', 'string', 'max:255'],
            'width' => ['required', 'integer', 'min:64', 'max:4096'],
            'height' => ['required', 'integer', 'min:64', 'max:4096'],
            'design_json' => ['required', 'array'],
            'preview_media_id' => ['nullable', 'string', 'max:64'],
            'source' => ['nullable', 'string', 'max:16'],
        ]);

        $row = StoreStudioDesign::query()->create([
            'id' => 'dsd-'.Str::random(12),
            'store_id' => $storeId,
            'editor_type' => $data['editor_type'],
            'category' => $data['category'] ?? ($data['editor_type'] === 'logo' ? 'logo' : 'banner'),
            'title' => $data['title'],
            'width' => (int) $data['width'],
            'height' => (int) $data['height'],
            'design_json' => $data['design_json'],
            'preview_media_id' => $data['preview_media_id'] ?? null,
            'source' => $data['source'] ?? 'studio',
        ]);

        return response()->json([
            'data' => $row,
            'message' => 'Design saved.',
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $row = StoreStudioDesign::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->first();

        if (! $row) {
            return response()->json(['message' => 'Design not found.'], 404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'width' => ['sometimes', 'integer', 'min:64', 'max:4096'],
            'height' => ['sometimes', 'integer', 'min:64', 'max:4096'],
            'design_json' => ['sometimes', 'array'],
            'preview_media_id' => ['nullable', 'string', 'max:64'],
        ]);

        $row->fill($data);
        $row->save();

        return response()->json([
            'data' => $row,
            'message' => 'Design updated.',
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $deleted = StoreStudioDesign::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Design not found.'], 404);
        }

        return response()->json(['message' => 'Design deleted.']);
    }
}
