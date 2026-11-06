<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ThemePage;
use App\Models\ThemeRevision;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Support\ThemeCache;
use App\Support\ThemeLayoutGuard;
use App\Support\ThemePageSeo;
use App\Support\ThemePageSuggest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        if ($this->builderClosed($id)) {
            return response()->json(['message' => 'Theme builder is not available for this store.'], 403);
        }
        $userId = $request->user()?->id;
        if (! is_string($userId) || $userId === '') {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $plan = $this->codePlan($id);
        $draft = is_array($page->draft_layout) ? $page->draft_layout : [];
        $guard = ThemeLayoutGuard::prepare($draft, $id, true, $plan, $this->cssAllowed($id));
        if ($guard['denied']) {
            return response()->json(['message' => $guard['message']], 403);
        }

        $page->published_layout = $this->stampMedia($guard['layout'], $id);
        $page->status = 'published';
        $page->published_at = now();
        $page->updated_by = $userId;
        $page->save();
        $this->writeRevision($page, $userId);
        ThemeCache::forgetStorePage($id, (string) $page->slug);

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'warnings' => $guard['warnings'],
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
        unset($snapshot['products'], $snapshot['categories'], $snapshot['product_seo'], $snapshot['category_seo']);
        if (array_key_exists('draft_layout', $snapshot) && is_array($snapshot['draft_layout'])) {
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

    public function suggestSeo(Request $request, string $storeId): JsonResponse
    {
        $id = $this->guardAi($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $page = $this->pageForSuggest($id, (string) $request->input('page_id', ''));
        if ($page instanceof JsonResponse) {
            return $page;
        }
        $layout = is_array($page->draft_layout) ? $page->draft_layout : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => ThemePageSuggest::seo($layout),
        ]);
    }

    public function suggestHeading(Request $request, string $storeId): JsonResponse
    {
        $id = $this->guardAi($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $page = $this->pageForSuggest($id, (string) $request->input('page_id', ''));
        if ($page instanceof JsonResponse) {
            return $page;
        }
        $layout = is_array($page->draft_layout) ? $page->draft_layout : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => ThemePageSuggest::heading($layout, (string) $request->input('widget_id', ''), (string) $request->input('locale', 'en')),
        ]);
    }

    public function suggestAlt(Request $request, string $storeId): JsonResponse
    {
        $id = $this->guardAi($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $mediaId = (string) $request->input('media_id', '');
        if ($mediaId !== '') {
            $owner = \Illuminate\Support\Facades\DB::table('media')->where('id', $mediaId)->value('store_id');
            if (! is_string($owner) || $owner !== $id) {
                return response()->json(['message' => 'Access denied to this store.'], 403);
            }
        }
        $page = $this->pageForSuggest($id, (string) $request->input('page_id', ''));
        if ($page instanceof JsonResponse) {
            return $page;
        }
        $layout = is_array($page->draft_layout) ? $page->draft_layout : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => ThemePageSuggest::alt($layout, (string) $request->input('file_name', ''), (string) $request->input('widget_id', '')),
        ]);
    }

    public function suggestTranslate(Request $request, string $storeId): JsonResponse
    {
        $id = $this->guardAi($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $page = $this->pageForSuggest($id, (string) $request->input('page_id', ''));
        if ($page instanceof JsonResponse) {
            return $page;
        }
        $layout = is_array($page->draft_layout) ? $page->draft_layout : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => ThemePageSuggest::translate(
                $layout,
                (string) $request->input('widget_id', ''),
                (string) $request->input('from', 'en'),
                $request->boolean('confirm'),
            ),
        ]);
    }

    public function applySuggestion(Request $request, string $storeId): JsonResponse
    {
        $id = $this->guardAi($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $page = $this->pageForSuggest($id, (string) $request->input('page_id', ''));
        if ($page instanceof JsonResponse) {
            return $page;
        }
        $fields = $request->input('fields', []);
        if (! is_array($fields)) {
            $fields = [];
        }
        $seo = is_array($page->seo) ? $page->seo : [];
        $page->seo = ThemePageSuggest::chosenSeo($seo, $fields);
        $layout = is_array($page->draft_layout) ? $page->draft_layout : [];
        $page->draft_layout = ThemePageSuggest::chosenHeading($layout, (string) $request->input('widget_id', ''), $fields);
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
        if ($this->builderClosed($id)) {
            return response()->json(['message' => 'Theme builder is not available for this store.'], 403);
        }
        $userId = $request->user()?->id;
        if (! is_string($userId) || $userId === '') {
            return response()->json(['message' => 'Unauthenticated.'], 401);
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
        if (array_key_exists('seo', $data)) {
            $data['seo'] = ThemePageSeo::only(is_array($data['seo']) ? $data['seo'] : null);
            ThemeCache::forgetStorePage($id, (string) $page->slug);
        }
        if (isset($data['draft_layout']) && is_array($data['draft_layout'])) {
            $plan = $this->codePlan($id);
            $guard = ThemeLayoutGuard::prepare($data['draft_layout'], $id, false, $plan, $this->cssAllowed($id));
            if ($guard['denied']) {
                return response()->json(['message' => $guard['message']], 403);
            }
            $data['draft_layout'] = $guard['layout'];
        }

        $page->fill($data);
        $page->store_id = $id;
        $page->updated_by = $userId;
        $page->save();

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $page,
        ]);
    }

    private function guardAi(Request $request, string $urlStoreId): string|JsonResponse
    {
        $id = $this->storeIdForPage($request, $urlStoreId);
        if ($id instanceof JsonResponse) {
            return $id;
        }
        $store = Store::query()->find($id);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $plan = strtolower((string) ($store->plan ?: 'free'));
        $allowed = in_array($plan, ['pro', 'premium', 'custom'], true) || (bool) $store->master_granted_pro;
        if (! $allowed) {
            return response()->json(['message' => 'This feature is not included in your plan.'], 403);
        }

        return $id;
    }

    private function pageForSuggest(string $storeId, string $pageId): ThemePage|JsonResponse
    {
        if ($pageId === '') {
            return response()->json(['message' => 'Page not found.'], 404);
        }
        $page = $this->findPage($storeId, $pageId);
        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        return $page;
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

    private function codePlan(string $storeId): string
    {
        $plan = (string) (Store::query()->where('id', $storeId)->value('plan') ?: 'free');
        $row = StoreSetting::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $settings = is_array($row?->settings) ? $row->settings : [];
        if (array_key_exists('allow_custom_html', $settings) && $settings['allow_custom_html'] === false) {
            return 'free';
        }

        return $plan;
    }

    private function cssAllowed(string $storeId): bool
    {
        $row = StoreSetting::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $settings = is_array($row?->settings) ? $row->settings : [];

        return ! (array_key_exists('allow_custom_css', $settings) && $settings['allow_custom_css'] === false);
    }

    private function builderClosed(string $storeId): bool
    {
        $row = StoreSetting::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $settings = is_array($row?->settings) ? $row->settings : [];

        return array_key_exists('theme_builder', $settings) && $settings['theme_builder'] === false;
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    private function stampMedia(array $layout, string $storeId): array
    {
        $map = [];
        $rows = DB::table('media')->where('store_id', $storeId)->get(['url', 'updated_at']);
        foreach ($rows as $row) {
            $path = parse_url((string) $row->url, PHP_URL_PATH);
            if (! is_string($path) || $path === '') {
                continue;
            }
            $stamp = strtotime((string) $row->updated_at) ?: time();
            $map[$path] = $path.'?v='.$stamp;
        }
        $stamped = $this->stampWalk($layout, $storeId, $map);

        return is_array($stamped) ? $stamped : $layout;
    }

    /**
     * @param  array<mixed>  $node
     * @param  array<string, string>  $map
     * @return array<mixed>
     */
    private function stampWalk(array $node, string $storeId, array $map): array
    {
        $imageKeys = ['image', 'src', 'url', 'og_image', 'backgroundImage'];
        if (array_is_list($node)) {
            return array_map(fn ($item) => is_array($item) ? $this->stampWalk($item, $storeId, $map) : $item, $node);
        }
        $out = [];
        foreach ($node as $key => $value) {
            if (is_array($value)) {
                $out[$key] = $this->stampWalk($value, $storeId, $map);
                continue;
            }
            if (is_string($key) && is_string($value) && in_array($key, $imageKeys, true)) {
                $path = parse_url($value, PHP_URL_PATH);
                if (is_string($path) && isset($map[$path])) {
                    $out[$key] = $map[$path];
                    continue;
                }
                if (str_contains($value, '/stores/') && ! str_contains($value, '/'.$storeId.'/')) {
                    $out[$key] = '';
                    continue;
                }
            }
            $out[$key] = $value;
        }

        return $out;
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
