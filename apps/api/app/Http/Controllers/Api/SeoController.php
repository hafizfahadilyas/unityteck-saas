<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SeoConfig;
use App\Support\SeoBilingual;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeoController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $seo = SeoConfig::query()->forStore($storeId)->first();

        return response()->json([
            'data' => $seo,
            'store_id' => $storeId,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = SeoBilingual::absorb($request->validate([
            'brand_name' => ['nullable', 'string', 'max:191'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_title_en' => ['nullable', 'string', 'max:255'],
            'meta_title_ar' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'meta_description_en' => ['nullable', 'string'],
            'meta_description_ar' => ['nullable', 'string'],
            'keywords' => ['nullable', 'string'],
            'keywords_en' => ['nullable', 'string'],
            'keywords_ar' => ['nullable', 'string'],
            'canonical_url' => ['nullable', 'string', 'max:255'],
            'search_console_tag' => ['nullable', 'string', 'max:191'],
            'ga4_measurement_id' => ['nullable', 'string', 'max:64'],
            'gtm_container_id' => ['nullable', 'string', 'max:64'],
            'sitemap_enabled' => ['sometimes', 'boolean'],
            'robots_txt' => ['nullable', 'string'],
            'google_connected' => ['sometimes', 'boolean'],
            'google_account_email' => ['nullable', 'email', 'max:191'],
            'google_connected_at' => ['nullable', 'date'],
            'search_console_connected' => ['sometimes', 'boolean'],
            'indexing_api_enabled' => ['sometimes', 'boolean'],
            'sitemap_url' => ['nullable', 'string', 'max:255'],
            'extra' => ['nullable', 'array'],
        ]));

        $seo = SeoConfig::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $seo->exists) {
            $seo->id = $this->newId('seo');
            $seo->store_id = $storeId;
        }

        if (isset($data['extra']) && is_array($data['extra'])) {
            $data['extra'] = array_merge(is_array($seo->extra) ? $seo->extra : [], $data['extra']);
        }

        $seo->fill($data)->save();

        return response()->json(['data' => $seo->fresh()]);
    }
}
