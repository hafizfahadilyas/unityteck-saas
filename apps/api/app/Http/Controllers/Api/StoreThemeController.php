<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\StoreTheme;
use App\Models\ThemeCatalog;
use App\Models\ThemeGlobalStyle;
use App\Models\ThemePage;
use App\Support\DefaultTheme;
use App\Support\ThemeCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class StoreThemeController extends Controller
{
    use ResolvesStoreId;

    /**
     * List all themes in catalog.
     */
    public function catalog(Request $request): JsonResponse
    {
        $themes = ThemeCatalog::query()->orderBy('is_default', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $themes,
        ]);
    }

    /**
     * Get theme settings for store.
     */
    public function show(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $this->themeStoreId($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->with('theme')
            ->where('store_id', $id)
            ->first();

        if (! $storeTheme) {
            $store = Store::query()->find($id);
            if ($store) {
                $storeTheme = DefaultTheme::assignToStore($store, true);
                $storeTheme->load('theme');
            }
        }

        if (! $storeTheme) {
            return response()->json([
                'success' => true,
                'data' => null,
                'store_id' => $id,
            ]);
        }

        $payload = $storeTheme->toArray();
        $settings = is_array($payload['settings'] ?? null) ? $payload['settings'] : [];
        $draft = is_array($settings['draft'] ?? null) ? $settings['draft'] : [];
        $payload['settings'] = $this->mergeThemeSettings($settings, $draft);

        return response()->json([
            'success' => true,
            'data' => $payload,
            'store_id' => $id,
        ]);
    }

    /**
     * Update active theme, homepage style, and theme settings.
     */
    public function update(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $this->themeStoreId($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'theme_id' => ['sometimes', 'string', 'max:64'],
            'homepage_style' => ['nullable', 'string', 'max:255'],
            'settings' => ['sometimes', 'array'],
            'publish' => ['sometimes', 'boolean'],
        ]);

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $id]);

        if (! $storeTheme->exists) {
            $storeTheme->id = $this->newId('sth');
            $storeTheme->store_id = $id;
            $storeTheme->theme_id = $data['theme_id'] ?? DefaultTheme::CATALOG_ID;
        }

        $oldThemeId = $storeTheme->theme_id;
        $newThemeId = $data['theme_id'] ?? $oldThemeId;

        $existing = is_array($storeTheme->settings) ? $storeTheme->settings : [];
        if (! isset($existing['by_theme']) || ! is_array($existing['by_theme'])) {
            $existing['by_theme'] = [];
        }

        // Preserve current settings for oldThemeId before switching
        if ($oldThemeId && ! empty($existing)) {
            $currentRoot = $existing;
            unset($currentRoot['by_theme'], $currentRoot['draft'], $currentRoot['builder']);
            if (! empty($currentRoot)) {
                $existing['by_theme'][$oldThemeId] = array_merge(
                    $existing['by_theme'][$oldThemeId] ?? [],
                    $currentRoot
                );
            }
        }

        if (array_key_exists('homepage_style', $data)) {
            $storeTheme->homepage_style = $data['homepage_style'];
        }

        if (isset($data['settings']) || $request->boolean('publish')) {
            $draft = is_array($existing['draft'] ?? null) ? $existing['draft'] : [];
            if (isset($data['settings'])) {
                $incoming = $data['settings'];
                unset($incoming['draft'], $incoming['by_theme'], $incoming['builder'], $incoming['globalStyles']);
                $draft = $this->mergeThemeSettings($draft, $incoming);
            }
            $existing['draft'] = $draft;
            if ($request->boolean('publish')) {
                $promoted = $draft;
                unset($promoted['draft'], $promoted['by_theme'], $promoted['builder']);
                $existing = $this->mergeThemeSettings($existing, $promoted);
                $existing['draft'] = $draft;
                $archive = [];
                foreach ($promoted as $key => $value) {
                    $archive[$key] = $existing[$key] ?? $value;
                }
                $existing['by_theme'][$newThemeId] = array_merge(
                    is_array($existing['by_theme'][$newThemeId] ?? null) ? $existing['by_theme'][$newThemeId] : [],
                    $archive
                );
                $existing['theme_published_at'] = now()->toIso8601String();
                Cache::forget(ThemeCache::themeKey($id));
                ThemePage::withoutGlobalScope('store')
                    ->where('store_id', $id)
                    ->pluck('slug')
                    ->each(function ($slug) use ($id) {
                        Cache::forget(ThemeCache::pageKey($id, (string) $slug));
                    });
            }
            $storeTheme->settings = $existing;
        } elseif ($newThemeId !== $oldThemeId && isset($existing['by_theme'][$newThemeId])) {
            // Theme switch: safely restore previously customized settings for the new theme
            $restored = $existing['by_theme'][$newThemeId];
            $storeTheme->settings = array_merge($existing, $restored);
        } else {
            $storeTheme->settings = $existing;
        }

        $storeTheme->theme_id = $newThemeId;
        $storeTheme->save();
        $storeTheme->load('theme');

        $payload = $storeTheme->toArray();
        $saved = is_array($payload['settings'] ?? null) ? $payload['settings'] : [];
        $savedDraft = is_array($saved['draft'] ?? null) ? $saved['draft'] : [];
        $payload['settings'] = $this->mergeThemeSettings($saved, $savedDraft);

        return response()->json([
            'success' => true,
            'data' => $payload,
            'message' => 'Theme settings updated successfully.',
            'store_id' => $id,
        ]);
    }

    /**
     * Get Visual Page Builder layout (blocks, typography, header settings).
     */
    public function getBuilderLayout(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->first();

        $themeSettings = is_array($storeTheme?->settings) ? $storeTheme->settings : [];
        $builderData = $themeSettings['builder'] ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'theme_id' => $storeTheme?->theme_id ?? DefaultTheme::CATALOG_ID,
                'homepage_style' => $storeTheme?->homepage_style,
                'blocks' => $builderData['draft_blocks'] ?? $builderData['published_blocks'] ?? [],
                'published_blocks' => $builderData['published_blocks'] ?? [],
                'seasonal_theme' => $builderData['seasonal_theme'] ?? null,
                'typography_settings' => $builderData['typography_settings'] ?? null,
                'header_settings' => $builderData['header_settings'] ?? null,
                'mobile_menu_icon' => $builderData['mobile_menu_icon'] ?? null,
                'updated_at' => $builderData['updated_at'] ?? $storeTheme?->updated_at,
            ],
            'store_id' => $id,
        ]);
    }

    /**
     * Save Visual Page Builder layout (supports draft and published modes).
     */
    public function saveBuilderLayout(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'theme_id' => ['sometimes', 'string', 'max:64'],
            'blocks' => ['required', 'array'],
            'is_published' => ['sometimes', 'boolean'],
            'seasonal_theme' => ['nullable', 'array'],
            'typography_settings' => ['nullable', 'array'],
            'header_settings' => ['nullable', 'array'],
            'mobile_menu_icon' => ['nullable'],
        ]);

        $isPublished = (bool) ($data['is_published'] ?? false);

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $id]);

        if (! $storeTheme->exists) {
            $storeTheme->id = $this->newId('sth');
            $storeTheme->store_id = $id;
            $storeTheme->theme_id = $data['theme_id'] ?? DefaultTheme::CATALOG_ID;
        }

        if (isset($data['theme_id'])) {
            $storeTheme->theme_id = $data['theme_id'];
        }

        $settings = is_array($storeTheme->settings) ? $storeTheme->settings : [];
        $builder = $settings['builder'] ?? [];

        // Save draft blocks
        $builder['draft_blocks'] = $data['blocks'];
        if (isset($data['seasonal_theme'])) {
            $builder['seasonal_theme'] = $data['seasonal_theme'];
        }
        if (isset($data['typography_settings'])) {
            $builder['typography_settings'] = $data['typography_settings'];
        }
        if (isset($data['header_settings'])) {
            $builder['header_settings'] = $data['header_settings'];
        }
        if (array_key_exists('mobile_menu_icon', $data)) {
            $builder['mobile_menu_icon'] = $data['mobile_menu_icon'];
        }
        $builder['updated_at'] = now()->toIso8601String();

        // If published, sync to published_blocks
        if ($isPublished) {
            $builder['published_blocks'] = $data['blocks'];
            $builder['published_at'] = now()->toIso8601String();
        }

        $settings['builder'] = $builder;
        $storeTheme->settings = $settings;
        $storeTheme->save();

        // Also persist in store_settings for cross-system accessibility
        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $id]);
        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $id;
        }
        $existingStoreSettings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $existingStoreSettings['builder'] = $builder;
        $storeSetting->settings = $existingStoreSettings;
        $storeSetting->save();

        return response()->json([
            'success' => true,
            'data' => [
                'theme_id' => $storeTheme->theme_id,
                'is_published' => $isPublished,
                'blocks_count' => count($data['blocks']),
                'updated_at' => $builder['updated_at'],
            ],
            'message' => $isPublished
                ? 'Page builder layout published successfully to database.'
                : 'Page builder draft saved successfully.',
            'store_id' => $id,
        ]);
    }

    /**
     * Public storefront theme & layout endpoint (no auth required).
     */
    public function storefrontTheme(Request $request): JsonResponse
    {
        $storeId = $request->query('store_id')
            ?? $request->header('X-Store-Id');

        $store = null;
        if ($storeId) {
            $store = Store::query()->where('id', $storeId)->orWhere('slug', $storeId)->first();
        } else {
            $host = $request->getHost();
            $store = Store::query()->where('domain', $host)->first();
        }

        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found.',
            ], 404);
        }

        $slug = $request->query('slug');
        if (is_string($slug) && trim($slug) !== '') {
            $slug = trim($slug);
            $cacheKey = ThemeCache::pageKey($store->id, $slug);
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                return response()->json($cached);
            }

            $page = ThemePage::withoutGlobalScope('store')
                ->where('store_id', $store->id)
                ->where('slug', $slug)
                ->where('status', 'published')
                ->first();

            if (! $page || $page->published_layout === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page not found.',
                ], 404);
            }

            $payload = [
                'success' => true,
                'store_id' => $store->id,
                'page' => [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'type' => $page->type,
                    'title_en' => $page->title_en,
                    'title_ar' => $page->title_ar,
                    'published_layout' => $page->published_layout,
                    'seo' => $page->seo,
                    'header_mode' => $page->header_mode,
                    'footer_mode' => $page->footer_mode,
                    'status' => $page->status,
                    'published_at' => $page->published_at,
                ],
                'footer' => ($page->footer_mode ?: 'global') === 'global'
                    ? $this->publishedFooter($store->id)
                    : null,
            ];
            Cache::put($cacheKey, $payload, now()->addHour());

            return response()->json($payload);
        }

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->with('theme')
            ->where('store_id', $store->id)
            ->first();

        $themeSettings = is_array($storeTheme?->settings) ? $storeTheme->settings : [];
        unset($themeSettings['draft']);
        $builder = $themeSettings['builder'] ?? [];
        unset($builder['draft_blocks']);
        $themeSettings['builder'] = $builder;
        $publishedBlocks = $builder['published_blocks'] ?? [];

        return response()->json([
            'success' => true,
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'domain' => $store->domain,
                'logo' => $store->logo,
                'accent_color' => $store->accent_color,
                'currency' => $store->currency,
                'locale' => $store->locale,
                'text_direction' => $store->text_direction,
            ],
            'theme' => [
                'theme_id' => $storeTheme?->theme_id ?? DefaultTheme::CATALOG_ID,
                'name' => $storeTheme?->theme?->name ?? 'Default Theme',
                'homepage_style' => $storeTheme?->homepage_style,
                'settings' => $themeSettings,
                'blocks' => $publishedBlocks,
                'seasonal_theme' => $builder['seasonal_theme'] ?? null,
                'typography_settings' => $builder['typography_settings'] ?? null,
                'header_settings' => $builder['header_settings'] ?? null,
                'tokens' => $this->publishedGlobalStyles($store->id),
                'paintPageBackground' => false,
            ],
        ]);
    }

    /**
     * Keep the other language when a save sends only one side of a bilingual object.
     * Lists replace. Associative maps merge.
     *
     * @param  array<string, mixed>  $base
     * @param  array<string, mixed>  $incoming
     * @return array<string, mixed>
     */
    private function mergeThemeSettings(array $base, array $incoming): array
    {
        foreach ($incoming as $key => $value) {
            if (in_array($key, ['draft', 'by_theme', 'builder'], true)) {
                continue;
            }
            $previous = $base[$key] ?? null;
            if (is_array($value) && is_array($previous) && ! array_is_list($value) && ! array_is_list($previous)) {
                $base[$key] = $this->mergeThemeSettings($previous, $value);
                continue;
            }
            $base[$key] = $value;
        }

        return $base;
    }

    private function themeStoreId(Request $request, ?string $urlStoreId): string|JsonResponse
    {
        $actor = $request->attributes->get('store_id');
        $portal = $request->attributes->get('portal');
        $url = is_string($urlStoreId) && trim($urlStoreId) !== '' ? $urlStoreId : null;

        if ($portal === 'master' && (! is_string($actor) || trim($actor) === '')) {
            if ($url === null) {
                return response()->json(['message' => 'Store id is required.'], 400);
            }

            return $this->canonicalStoreId($url);
        }

        if (! is_string($actor) || trim($actor) === '') {
            return $url !== null ? $this->canonicalStoreId($url) : $this->requireStoreId($request);
        }

        $actorId = $this->canonicalStoreId($actor);
        if ($url !== null && $this->canonicalStoreId($url) !== $actorId) {
            return response()->json(['message' => 'Access denied to this store.'], 403);
        }

        return $actorId;
    }

    public function showGlobalStyles(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $this->themeStoreId($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $row = ThemeGlobalStyle::withoutGlobalScope('store')->where('store_id', $id)->first();
        $styles = is_array($row?->styles) ? $row->styles : [];
        $draft = is_array($styles['draft'] ?? null) ? $styles['draft'] : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $this->mergeThemeSettings($styles, $draft),
            'paintPageBackground' => false,
        ]);
    }

    public function updateGlobalStyles(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $this->themeStoreId($request, $storeId);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $row = ThemeGlobalStyle::withoutGlobalScope('store')->where('store_id', $id)->first();
        $existing = is_array($row?->styles) ? $row->styles : [];
        $draft = is_array($existing['draft'] ?? null) ? $existing['draft'] : [];
        $incoming = $request->input('styles', []);
        if (is_array($incoming)) {
            unset($incoming['draft']);
            $draft = $this->mergeThemeSettings($draft, $incoming);
        }
        $existing['draft'] = $draft;

        if ($request->boolean('publish')) {
            $promoted = $draft;
            unset($promoted['draft']);
            $existing = $this->mergeThemeSettings($existing, $promoted);
            $existing['draft'] = $draft;
            Cache::forget(ThemeCache::themeKey($id));
        }

        if ($row) {
            $row->styles = $existing;
            $row->save();
        } else {
            $row = new ThemeGlobalStyle;
            $row->id = (string) Str::uuid();
            $row->store_id = $id;
            $row->styles = $existing;
            $row->save();
        }

        $saved = is_array($row->styles) ? $row->styles : [];
        $savedDraft = is_array($saved['draft'] ?? null) ? $saved['draft'] : [];

        return response()->json([
            'success' => true,
            'store_id' => $id,
            'data' => $this->mergeThemeSettings($saved, $savedDraft),
            'paintPageBackground' => false,
        ]);
    }

    /**
     * Published tokens only. Coffee must not paint colors.background onto the page.
     *
     * @return array<string, mixed>
     */
    private function publishedGlobalStyles(string $storeId): array
    {
        $row = ThemeGlobalStyle::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $styles = is_array($row?->styles) ? $row->styles : [];
        unset($styles['draft']);

        return $styles;
    }

    /**
     * Published footer only. Draft text stays off public pages.
     *
     * @return array<string, mixed>|null
     */
    private function publishedFooter(string $storeId): ?array
    {
        $storeTheme = StoreTheme::withoutGlobalScope('store')->where('store_id', $storeId)->first();
        $settings = is_array($storeTheme?->settings) ? $storeTheme->settings : [];
        unset($settings['draft']);
        $footer = $settings['footer'] ?? null;

        return is_array($footer) ? $footer : null;
    }
}
