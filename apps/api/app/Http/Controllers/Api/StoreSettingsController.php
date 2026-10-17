<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreSettingsController extends Controller
{
    use ResolvesStoreId;

    /**
     * Get store settings.
     */
    public function show(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $storeSetting?->settings ?? [],
            'store_id' => $id,
        ]);
    }

    /**
     * Update store settings.
     */
    public function update(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $id]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $id;
        }

        $current = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $storeSetting->settings = array_merge($current, $data['settings']);
        $storeSetting->save();

        return response()->json([
            'success' => true,
            'data' => $storeSetting->settings,
            'message' => 'Store settings updated successfully.',
            'store_id' => $id,
        ]);
    }
}
