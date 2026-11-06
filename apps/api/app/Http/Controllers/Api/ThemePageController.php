<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ThemePage;
use App\Models\ThemeRevision;
use App\Models\Store;
use App\Support\ThemeCache;
use App\Support\ThemeLayoutGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemePageController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request, string $storeId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $pages = ThemePage::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->orderBy('slug')
            ->get();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $pages,
        ]);
    }

    public function store(Request $request, string $storeId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $this->validated($request);
        unset($data['store_id']);
        $slug = (string) ($data['slug'] ?? '');
        $taken = ThemePage::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->where('slug', $slug)
            ->exists();
        if ($taken) {
            return response()->json(['message' => 'Slug already used for this store.'], 422);
        }
        if (($data['type'] ?? '') === 'custom') {
            $data['header_mode'] = 'global';
            $data['footer_mode'] = 'global';
            $data['draft_layout'] = ['sections' => []];
            $data['published_layout'] = null;
            $data['status'] = 'draft';
        }
        $page = ThemePage::withoutGlobalScope('store')->create([
            ...$data,
            'id' => $this->newId('tpage'),
            'store_id' => $id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page,
        ], 201);
    }

    public function show(Request $request, string $storeId, string $pageKey): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = $this->findPage($id, $pageKey);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page,
        ]);
    }

    public function destroy(Request $request, string $storeId, string $pageId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = $this->findPage($id, $pageId);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $slug = (string) $page->slug;
        $page->delete();
        ThemeCache::forgetStorePage($id, $slug);

        return response()->json([
            'success' => true,
            'store_id' => $id,
        ]);
    }

    public function publish(Request $request, string $storeId, string $pageId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = $this->findPage($id, $pageId);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $page->published_layout = $page->draft_layout;
        $page->status = 'published';
        $page->published_at = now();
        $page->updated_by = $request->user()?->id;
        $page->save();
        $this->writeRevision($page, $request->user()?->id);
        ThemeCache::forgetStorePage($id, (string) $page->slug);

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page->fresh(),
        ]);
    }

    public function revisions(Request $request, string $storeId, string $pageId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = $this->findPage($id, $pageId);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $rows = ThemeRevision::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->where('page_id', $page->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $rows,
        ]);
    }

    public function storeRevision(Request $request, string $storeId, string $pageId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = $this->findPage($id, $pageId);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $revision = $this->writeRevision($page, $request->user()?->id);

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $revision,
        ], 201);
    }

    public function restore(Request $request, string $storeId, string $revisionId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $revision = ThemeRevision::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->where('id', $revisionId)
            ->first();

        if (! $revision || ! is_string($revision->page_id)) {
            return response()->json(['message' => 'Revision not found.'], 404);
        }

        $page = ThemePage::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->where('id', $revision->page_id)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        $snapshot = is_array($revision->snapshot) ? $revision->snapshot : [];
        if (array_key_exists('draft_layout', $snapshot)) {
            $page->draft_layout = $snapshot['draft_layout'];
        }
        $page->updated_by = $request->user()?->id;
        $page->save();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page->fresh(),
        ]);
    }

    public function update(Request $request, string $storeId, string $pageId): JsonResponse
    {
        $id = $this->storeIdForPage($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $page = ThemePage::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->where('id', $pageId)
            ->first();

        if (! $page) {
            return response()->json([
                'message' => 'Page not found.',
            ], 404);
        }

        $clientStamp = $request->input('updated_at');
        if (is_string($clientStamp) && $clientStamp !== '' && $page->updated_at) {
            $clientTime = strtotime($clientStamp);
            $serverTime = $page->updated_at->getTimestamp();
            if ($clientTime !== false && abs($clientTime - $serverTime) > 1) {
                return response()->json([
                    'message' => 'Page was updated elsewhere. Reload or overwrite.',
                    'updated_at' => $page->updated_at->toIso8601String(),
                ], 409);
            }
        }

        $data = $this->validated($request, partial: true);
        unset($data['updated_at']);
        if (isset($data['draft_layout']) && is_array($data['draft_layout'])) {
            $plan = (string) (Store::query()->where('id', $id)->value('plan') ?: 'free');
            $guard = ThemeLayoutGuard::prepare($data['draft_layout'], $id, false, $plan);
            if ($guard['denied']) {
                return response()->json(['message' => $guard['message']], 403);
            }
            $data['draft_layout'] = $guard['layout'];
        }

        $page->fill($data);
        $page->store_id = $id;
        $page->updated_by = $request->user()?->id;
        $page->save();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page,
        ]);
    }

    /**
     * Membership store comes from middleware. The URL store must match.
     * Body store_id is never read.
     */
    private function storeIdForPage(Request $request, string $urlStoreId): string|JsonResponse
    {
        $actor = $request->attributes->get('store_id');
        $portal = $request->attributes->get('portal');

        if ($portal === 'master' && (! is_string($actor) || trim($actor) === '')) {
            $target = $this->canonicalStoreId($urlStoreId);
            if ($target === '') {
                return response()->json([
                    'message' => 'Store id is required.',
                ], 400);
            }

            return $target;
        }

        if (! is_string($actor) || trim($actor) === '') {
            return response()->json([
                'message' => 'X-Store-Id header is required for store-scoped routes.',
            ], 400);
        }

        $actorId = $this->canonicalStoreId($actor);
        $urlId = $this->canonicalStoreId($urlStoreId);
        if ($actorId !== $urlId) {
            return response()->json([
                'message' => 'Access denied to this store.',
            ], 403);
        }

        return $actorId;
    }

    private function findPage(string $storeId, string $pageKey): ?ThemePage
    {
        return ThemePage::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where(function ($query) use ($pageKey) {
                $query->where('id', $pageKey)->orWhere('slug', $pageKey);
            })
            ->first();
    }

    private function writeRevision(ThemePage $page, ?string $userId): ThemeRevision
    {
        return ThemeRevision::withoutGlobalScope('store')->create([
            'id' => $this->newId('trev'),
            'store_id' => $page->store_id,
            'page_id' => $page->id,
            'snapshot' => [
                'slug' => $page->slug,
                'draft_layout' => $page->draft_layout,
                'published_layout' => $page->published_layout,
                'seo' => $page->seo,
                'status' => $page->status,
            ],
            'created_by' => $userId,
        ]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'slug' => [$required, 'string', 'max:191'],
            'type' => [$required, 'string', 'in:home,shop,product,cart,checkout,thankyou,faq,reviews,about,contact,custom,404'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'draft_layout' => ['nullable', 'array'],
            'updated_at' => ['nullable', 'string'],
            'published_layout' => ['nullable', 'array'],
            'seo' => ['nullable', 'array'],
            'header_mode' => ['nullable', 'string', 'in:global,custom'],
            'footer_mode' => ['nullable', 'string', 'in:global,custom'],
            'status' => ['nullable', 'string', 'in:draft,published'],
        ]);
    }
}
