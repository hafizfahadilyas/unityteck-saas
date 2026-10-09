<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SeoConfig;
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

        $data = $request->validate([
            'brand_name' => ['nullable', 'string', 'max:191'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'keywords' => ['nullable', 'string'],
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
        ]);

        $seo = SeoConfig::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $seo->exists) {
            $seo->id = $this->newId('seo');
            $seo->store_id = $storeId;
        }

        $seo->fill($data)->save();

        return response()->json(['data' => $seo->fresh()]);
    }
}
