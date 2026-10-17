<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\StoreTheme;
use App\Models\ThemeCatalog;
use App\Support\DefaultTheme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $id = $storeId ?? $this->requireStoreId($request);
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

        return response()->json([
            'success' => true,
            'data' => $storeTheme,
            'store_id' => $id,
        ]);
    }

    /**
     * Update active theme, homepage style, and theme settings.
     */
    public function update(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'theme_id' => ['sometimes', 'string', 'max:64'],
            'homepage_style' => ['nullable', 'string', 'max:255'],
            'settings' => ['sometimes', 'array'],
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
            unset($currentRoot['by_theme']);
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

        // If new custom settings passed
        if (isset($data['settings'])) {
            $existing['by_theme'][$newThemeId] = array_merge(
                $existing['by_theme'][$newThemeId] ?? [],
                $data['settings']
            );
            $storeTheme->settings = array_merge($existing, $data['settings']);
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

        return response()->json([
            'success' => true,
            'data' => $storeTheme,
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
            $store = Store::query()->first();
        }

        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found.',
            ], 404);
        }

        $storeTheme = StoreTheme::withoutGlobalScope('store')
            ->with('theme')
            ->where('store_id', $store->id)
            ->first();

        $themeSettings = is_array($storeTheme?->settings) ? $storeTheme->settings : [];
        $builder = $themeSettings['builder'] ?? [];
        $publishedBlocks = $builder['published_blocks'] ?? $builder['draft_blocks'] ?? [];

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
            ],
        ]);
    }
}
